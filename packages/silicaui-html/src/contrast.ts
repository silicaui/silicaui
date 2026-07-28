/**
 * Contrast-derived foreground ink.
 *
 * A named color needs a legible `-content` on top of it. The CSS-only
 * derivation @wizeworks/silicaui ships as a last resort (`autoContent`) compares
 * the color's OKLCH *lightness* against a threshold, because CSS cannot compute
 * a contrast ratio. Lightness and contrast part company across a wide band: the
 * crossover — where black overtakes white — sits anywhere from `l ≈ 0.54` to
 * `l ≈ 0.59` depending on chroma and hue, so no single threshold is right for
 * every color, and mid-tone brand colors live exactly in that band.
 *
 * JavaScript CAN measure it. This module does, so every token a build step
 * emits carries the ink that actually wins, and the CSS threshold is left to
 * cover only colors @wizeworks/silicaui never saw (one injected into a live
 * document by a host at runtime).
 *
 * Framework-neutral and dependency-free, next to the `Theme` type it serves:
 * the theme editor, the canvas, a publish pipeline, and a host's own compiler
 * all need the same answer, and two implementations would drift.
 */

/** A color in OKLCH: `l` in 0..1, `c` in 0..~0.4, `h` in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** OKLCH → linear sRGB → gamma-encoded sRGB, each channel 0..1 (gamut-clipped). */
export function oklchToSrgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  // OKLab → LMS' → LMS
  const lp = l + 0.3963377774 * a + 0.2158037573 * b;
  const mp = l - 0.1055613458 * a - 0.0638541728 * b;
  const sp = l - 0.0894841775 * a - 1.291485548 * b;
  const L = lp * lp * lp;
  const M = mp * mp * mp;
  const S = sp * sp * sp;

  // LMS → linear sRGB
  const lr = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const lg = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const lb = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  const encode = (x: number): number =>
    clamp01(x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055);
  return [encode(lr), encode(lg), encode(lb)];
}

/** Gamma-encoded sRGB (0..1 per channel) → OKLCH. */
export function srgbToOklch([r, g, b]: [number, number, number]): Oklch {
  const lin = (x: number): number => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);

  const L = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const M = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const S = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

  const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
  const a = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
  const bb = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;

  const c = Math.sqrt(a * a + bb * bb);
  const h = c < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

const HEX_RE = /^#([0-9a-f]{3,8})$/i;
const OKLCH_RE = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/.*)?\)$/i;
const RGB_RE = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/].*)?\)$/i;

/** A number that may carry a `%`, normalized against `full` (100% → full). */
const scalar = (raw: string, full: number): number =>
  raw.endsWith("%") ? (parseFloat(raw) / 100) * full : parseFloat(raw);

/**
 * Parse a CSS color into OKLCH. Handles the formats a theme token realistically
 * carries: `oklch()` (what @wizeworks/silicaui authors), hex (what a color
 * picker emits), and `rgb()`/`rgba()`.
 *
 * Returns `undefined` for anything else — a `color-mix()`, a `var()`, a named
 * color, a gradient. That is deliberate: an unparseable color must NOT get a
 * guessed foreground. Callers leave the token alone and let the CSS fallback
 * cover it, which is the honest outcome.
 *
 * IMPORTANT for `oklch()` input: `l` is read straight off the authored value,
 * never round-tripped through sRGB first. `oklch(68% 0.1 232)` comes back as
 * exactly 0.68; a round trip returns 0.6798, which is enough to flip a
 * comparison sitting on a threshold and swap the ink.
 */
export function parseColor(css: string): Oklch | undefined {
  const value = css.trim();

  const oklch = OKLCH_RE.exec(value);
  if (oklch) {
    return {
      l: scalar(oklch[1]!, 1),
      c: scalar(oklch[2]!, 0.4),
      h: parseFloat(oklch[3]!),
    };
  }

  const hex = HEX_RE.exec(value);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length === 3 || digits.length === 4) {
      digits = digits
        .split("")
        .map((d) => d + d)
        .join("");
    }
    if (digits.length !== 6 && digits.length !== 8) return undefined;
    const int = parseInt(digits.slice(0, 6), 16);
    return srgbToOklch([((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]);
  }

  const rgb = RGB_RE.exec(value);
  if (rgb) {
    return srgbToOklch([
      clamp01(scalar(rgb[1]!, 255) / 255),
      clamp01(scalar(rgb[2]!, 255) / 255),
      clamp01(scalar(rgb[3]!, 255) / 255),
    ]);
  }

  return undefined;
}

/** WCAG 2.x relative luminance of a gamma-encoded sRGB triple. */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (x: number): number => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio (1..21) between two OKLCH colors. */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(oklchToSrgb(a));
  const lb = relativeLuminance(oklchToSrgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG AA for normal-size body text. The bar every derived pair must clear. */
export const AA_NORMAL = 4.5;

/**
 * Ink candidates per side, in PREFERENCE order: the house tint first, the pure
 * extreme as the escalation.
 *
 * The tint (`oklch(98% 0.004 250)` and friends) is the style `colors.js`
 * already uses — it keeps a palette from looking assembled from parts. But it
 * is not free: pulling white down to 98% and black up to 15% costs a few tenths
 * of a ratio, and at the margin that is the difference between 4.66:1 and
 * 4.38:1. Two shipped preset colors sit exactly there.
 *
 * So the tint is a preference, never a cost paid in legibility: if the tinted
 * candidate misses AA and the pure extreme clears it, the extreme wins.
 */
function inkCandidates(color: Oklch): { light: Oklch[]; dark: Oklch[] } {
  const hue = color.h;
  return {
    light: [{ l: 0.98, c: Math.min(color.c, 0.01), h: hue }, { l: 1, c: 0, h: 0 }],
    dark: [{ l: 0.15, c: Math.min(color.c, 0.02), h: hue }, { l: 0, c: 0, h: 0 }],
  };
}

/** The first candidate clearing AA, else the highest-contrast one available. */
function bestOf(color: Oklch, candidates: Oklch[]): { ink: Oklch; ratio: number } {
  let best = { ink: candidates[0]!, ratio: 0 };
  for (const ink of candidates) {
    const ratio = contrastRatio(color, ink);
    if (ratio >= AA_NORMAL) return { ink, ratio };
    if (ratio > best.ratio) best = { ink, ratio };
  }
  return best;
}

const fmt = (o: Oklch): string =>
  `oklch(${+(o.l * 100).toFixed(2)}% ${+o.c.toFixed(4)} ${+o.h.toFixed(2)})`;

export interface DerivedContent {
  /** The winning ink as a CSS `oklch()` string, ready to use as a token value. */
  value: string;
  /** Its measured contrast against the color it sits on. */
  ratio: number;
  /** Whether that measurement clears WCAG AA for body text. */
  passesAA: boolean;
  /** Which candidate won — useful for a theme editor explaining its choice. */
  ink: "light" | "dark";
}

/**
 * The legible foreground for `color`, chosen by MEASURED contrast.
 *
 * Returns `undefined` when the color can't be parsed — the caller must then
 * leave the token unset so the CSS fallback covers it, rather than emit a
 * guess.
 *
 * `passesAA` can be false even for the winner: a very mid-tone, high-chroma
 * color has no legible black-or-white ink at all. That is a fact about the
 * color, not a failure of the derivation, and surfacing it lets a theme editor
 * warn the author instead of silently shipping 4.2:1.
 */
export function deriveContent(color: string | Oklch): DerivedContent | undefined {
  const parsed = typeof color === "string" ? parseColor(color) : color;
  if (!parsed) return undefined;

  const candidates = inkCandidates(parsed);
  const light = bestOf(parsed, candidates.light);
  const dark = bestOf(parsed, candidates.dark);

  // Pick the SIDE on its best achievable contrast, then take that side's most
  // preferred candidate that clears AA (which `bestOf` already resolved).
  const useLight = light.ratio >= dark.ratio;
  const winner = useLight ? light : dark;

  return {
    value: fmt(winner.ink),
    ratio: +winner.ratio.toFixed(2),
    passesAA: winner.ratio >= AA_NORMAL,
    ink: useLight ? "light" : "dark",
  };
}
