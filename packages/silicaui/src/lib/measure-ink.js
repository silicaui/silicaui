/**
 * Measure which ink `autoContent` will actually produce, and whether it is the
 * legible one.
 *
 * WHY THIS EXISTS.
 * `auto-content.js` states its own contract in the first line of its comment:
 * it is "the LAST RESORT, for a color nothing had a chance to measure", and
 * anything the build CAN see — "a preset, a theme in the builder, a declared
 * plugin color" — "should get a MEASURED foreground … and never reach this
 * fallback."
 *
 * A declared plugin color reaches it anyway, through BOTH documented ways of
 * declaring one:
 *
 *   @theme { --color-brand: oklch(58% 0.24 320); }        ← Tailwind hands the
 *   @plugin "@wizeworks/silicaui" { colors: …, brand; }     plugin the VALUE
 *
 *   @plugin "@wizeworks/silicaui/theme" { name: x;         ← the value IS the
 *     --color-brand: oklch(58% 0.24 320); }                  option
 *
 * In both cases the value is in the plugin's hand at build time and the plugin
 * emits a CSS lightness rule anyway, because CSS cannot compute a contrast
 * ratio. That rule is right for ~97.7% of the color space. In the rest it picks
 * the failing ink while a passing one sits unused — measured at 4.30:1 on the
 * site's own N-color demo button, where white would have given 4.88:1
 * (docs/personas/issues/032, found by P02, handed to P06).
 *
 * WHY IT WARNS RATHER THAN SUBSTITUTES.
 * The threshold is not a bug to be tuned away: a 51,480-sample sweep of the
 * l/c/h space puts 0.57 at the optimum for a lightness-only rule and rejects a
 * chroma-aware variant outright. No constant fixes this, so the honest repair is
 * for the fallback NOT TO BE REACHED — which means the author declares the
 * token. Substituting a literal here would also freeze the ink against a color
 * the builder injects at runtime. So: say it, with both measurements and the
 * exact line that fixes it, the same shape `warn-unregistered-colors.js` already
 * uses for the sibling papercut.
 *
 * WHY THE MATH IS HERE AND NOT IMPORTED.
 * `@wizeworks/silicaui-html` has a fuller derivation in `src/contrast.ts`
 * (`deriveContent`, `contrastWarnings`) that searches a whole candidate ladder.
 * It cannot be imported: that package PEER-DEPENDS on this one, so reaching for
 * it would invert the layering and give the CSS floor its first dependency.
 * This file is deliberately NOT a second copy of that search — it answers a
 * narrower question, "is the CSS rule's own pick the better of the only two inks
 * that rule can emit", which is pure black and pure white and nothing else.
 */

/** sRGB relative luminance, WCAG 2.x. */
function luminance([r, g, b]) {
  const s = [r, g, b].map((v) => {
    const u = v / 255;
    return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

/** WCAG contrast ratio between two opaque sRGB colors. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** OKLCH → linear sRGB → gamma sRGB, clamped to the gamut. */
function oklchToRgb(l, c, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = l - 0.0894841775 * a - 1.291485548 * bb;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  const lin = [
    +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];

  return lin.map((v) => {
    const clamped = Math.min(1, Math.max(0, v));
    const g = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, g * 255)));
  });
}

/** sRGB → OKLab, the inverse of the transform above. */
function rgbToOklab([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const u = v / 255;
    return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
  });
  const L = Math.cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
  const M = Math.cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
  const S = Math.cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
  return [
    0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S,
  ];
}

/**
 * The INK form of a role color, computed the way `lib/ink.js` emits it:
 *
 *   oklch(from color-mix(in oklab, <role> 50%, var(--color-base-content))
 *         l calc(c * 2) h)
 *
 * — mix halfway toward the surface's own ink, then restore the chroma the mix
 * cost. This is the value components actually paint when they put a role color
 * on the PAGE rather than behind a label, so it is the value to measure when
 * asking whether `text-<role>` and `link-<role>` can be read.
 *
 * Returns `null` if either color is unreadable.
 */
export function inkOf(roleValue, baseContentValue) {
  const role = readColor(roleValue);
  const base = readColor(baseContentValue);
  if (!role || !base) return null;

  const a = rgbToOklab(role.rgb);
  const b = rgbToOklab(base.rgb);
  const mixed = [0, 1, 2].map((i) => (a[i] + b[i]) / 2);

  const l = mixed[0];
  const c = Math.hypot(mixed[1], mixed[2]) * 2; // `calc(c * 2)`
  const h = (Math.atan2(mixed[2], mixed[1]) * 180) / Math.PI;
  return { rgb: oklchToRgb(l, c, h), l };
}

const NUM = "[-+]?[0-9]*\\.?[0-9]+";
const OKLCH = new RegExp(`^oklch\\(\\s*(${NUM})(%?)\\s+(${NUM})\\s+(${NUM})`, "i");
const RGB = new RegExp(`^rgba?\\(\\s*(${NUM})[\\s,]+(${NUM})[\\s,]+(${NUM})`, "i");

/**
 * A color string → `{ rgb, l }`, or `null` when it cannot be read.
 *
 * `null` is a real answer and the caller must treat it as "say nothing": a
 * guess here would produce a warning about a color nobody can check, which is
 * worse than silence. Formats a consumer actually writes are covered — oklch,
 * hex, rgb. A `var()`, a `color-mix()` or anything else returns null on purpose,
 * because its value is not knowable at this point in the stylesheet.
 */
export function readColor(value) {
  if (typeof value !== "string") return null;
  const v = value.trim().replace(/^["']|["']$/g, "");

  const ok = v.match(OKLCH);
  if (ok) {
    const l = ok[2] === "%" ? Number(ok[1]) / 100 : Number(ok[1]);
    const c = Number(ok[3]);
    const h = Number(ok[4]);
    if (![l, c, h].every(Number.isFinite)) return null;
    return { rgb: oklchToRgb(l, c, h), l };
  }

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const d = hex[1];
    const full = d.length === 3 ? d.split("").map((x) => x + x).join("") : d;
    const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return { rgb, l: lightnessOf(rgb) };
  }

  const rgbm = v.match(RGB);
  if (rgbm) {
    const rgb = [1, 2, 3].map((i) => Math.round(Number(rgbm[i])));
    if (!rgb.every((x) => Number.isFinite(x) && x >= 0 && x <= 255)) return null;
    return { rgb, l: lightnessOf(rgb) };
  }

  return null;
}

/**
 * Formats this file claims to understand — so a failure to read one of THESE is
 * a malformed value, not an unsupported one.
 *
 * The distinction matters because both come back as `null` from `readColor` and
 * they deserve opposite treatment. `var(--x)` and `color-mix(…)` are perfectly
 * good CSS whose value is simply not knowable at this point in the stylesheet:
 * say nothing. `oklch(nonsense)` is a typo that compiles, emits every class, and
 * paints an invalid color the browser drops on the floor — measured, that is
 * exactly what happens today, with no error and no warning anywhere.
 *
 * `lab()`, `lch()`, `hsl()` and `color()` are deliberately NOT here. They are
 * valid CSS this file does not parse, and calling one of them malformed would be
 * a false accusation.
 */
const KNOWN_FORMAT = /^(?:#|oklch\(|rgba?\()/i;

/** Does this value claim to be a format `readColor` can read? */
export function looksLikeKnownFormat(value) {
  return typeof value === "string" && KNOWN_FORMAT.test(value.trim().replace(/^["']|["']$/g, ""));
}

/** sRGB → OKLab L, which is the `l` the CSS rule compares to the threshold. */
function lightnessOf([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const u = v / 255;
    return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
  });
  const L = 0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2];
  const M = 0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2];
  const S = 0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2];
  const l_ = Math.cbrt(L);
  const m_ = Math.cbrt(M);
  const s_ = Math.cbrt(S);
  return 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
}

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];

/** WCAG AA for body text. Large text is 3, and a role color paints both. */
export const AA = 4.5;

/**
 * What the CSS rule will pick for this color, what the other ink would give,
 * and whether the pick is the wrong one.
 *
 * Returns `null` when the color cannot be read — never a guess.
 *
 * @param {string} value      the color as authored
 * @param {number} threshold  `--silica-content-threshold`; 0.57 is the default
 */
export function inkVerdict(value, threshold = 0.57) {
  const read = readColor(value);
  if (!read) return null;

  const black = contrast(read.rgb, BLACK);
  const white = contrast(read.rgb, WHITE);

  // The emitted rule is `clamp(0, (threshold - l) * 1000, 1)`: lightness at or
  // above the threshold gives 0 (black), below it gives 1 (white).
  const picksBlack = read.l >= threshold;
  const picked = picksBlack ? black : white;
  const other = picksBlack ? white : black;

  return {
    l: +read.l.toFixed(4),
    ink: picksBlack ? "black" : "white",
    picked: +picked.toFixed(2),
    alternative: +other.toFixed(2),
    otherInk: picksBlack ? "white" : "black",
    passesAA: picked >= AA,
    /**
     * The pick is below AA, and there is always a better ink when it is.
     *
     * NOT a third case: every failure here is avoidable, and that is a theorem
     * rather than an observation. For any color with relative luminance L,
     *
     *   contrast(L, black) × contrast(L, white)
     *     = (L + 0.05)/0.05 × 1.05/(L + 0.05)
     *     = 21,   for every L.
     *
     * so the better of the two is never below √21 = 4.5826 — above AA's 4.5.
     * A first version of this file carried a `hopeless` branch for "no ink can
     * sit on this color"; it was unreachable, and a 72,720-sample sweep of the
     * l/c/h space confirms it (lowest best-of-two: 4.5829, product 21 ± 4e-15).
     *
     * That is the useful half of the finding: a color whose derived ink fails is
     * ALWAYS one declared token away from passing, so naming the line is always
     * a complete fix.
     */
    avoidable: picked < AA,
  };
}

/** The line that fixes it, ready to paste. */
export function fixLine(name, verdict) {
  const ink = verdict.otherInk === "white" ? "oklch(100% 0 0)" : "oklch(0% 0 0)";
  return `--color-${name}-content: ${ink};`;
}
