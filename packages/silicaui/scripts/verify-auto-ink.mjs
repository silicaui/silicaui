/**
 * The color engine's two silent failures, pinned.
 *
 * 1. A declared color with no `-content` gets its ink from a CSS lightness rule
 *    that cannot compare contrast. For ~2.3% of the color space it picks the
 *    failing ink while a passing one sits unused — 4.28:1 on the site's own
 *    N-color demo button, where white gives 4.91:1 (issues/032).
 * 2. A role whose TEXT form vanishes into its own surface. Its ink on a filled
 *    button is fine; `text-<role>` and `link-<role>` are not (issues/036).
 *
 * WHAT THIS FILE IS REALLY GUARDING is the arithmetic. Every number below was
 * first read out of Chromium with `getImageData` and only then written down
 * here, and the two agreed to 0.00 on contrast and 0 on every channel across 16
 * colors, and to 0.03 on the derived text ink across 7 palettes. A formula that
 * drifts from what the browser paints is worse than no formula, because it
 * warns about pages that are fine and stays quiet on pages that are not.
 *
 * The last two checks are the calibration, and they are the reason this is
 * shippable: SILENCE on all 20 shipped presets in both modes, and on a
 * well-chosen custom palette. A check that cries on the product's own themes is
 * wrong about the check, not about the themes — a first version of the
 * surface test did exactly that and was rewritten.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "tailwindcss";
import { contrast, inkOf, inkVerdict, readColor } from "../src/lib/measure-ink.js";
import { findInkProblems, findInkTextProblems, warnInkProblems } from "../src/lib/warn-auto-ink.js";
import {
  THEME_PRESETS,
  contrastRatio,
  parseColor as parseColorHtml,
  resolveThemeTokens,
} from "@wizeworks/silicaui-html";

let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) {
    failures++;
    if (detail) console.log(`      ${detail}`);
  }
}

// ── 1. the arithmetic, against numbers read out of a real browser ───────────
// Chromium, via getImageData on a 1×1 canvas. Re-measure before changing one.
const MEASURED = [
  // color                      black  white
  ["oklch(58% 0.24 320)", 4.28, 4.91], // `brand` — the issues/032 color
  ["oklch(0.62 0.14 38)", 5.44, 3.86],
  ["oklch(0.58 0.11 262)", 4.85, 4.33],
  ["oklch(0.72 0.13 38)", 8.07, 2.6],
  ["oklch(0.94 0.012 85)", 17.65, 1.19],
  ["oklch(0.31 0.035 48)", 1.58, 13.3],
  ["oklch(0.5 0.3 30)", 4.07, 5.15], // out of sRGB gamut on purpose
  ["#7c3aed", 3.69, 5.7],
  ["rgb(124, 58, 237)", 3.69, 5.7],
  ["oklch(0 0 0)", 1, 21],
  ["oklch(1 0 0)", 21, 1],
];
let worst = 0;
for (const [value, black, white] of MEASURED) {
  const c = readColor(value);
  if (!c) {
    check(`readColor("${value}")`, false, "returned null");
    continue;
  }
  const b = +contrast(c.rgb, [0, 0, 0]).toFixed(2);
  const w = +contrast(c.rgb, [255, 255, 255]).toFixed(2);
  worst = Math.max(worst, Math.abs(b - black), Math.abs(w - white));
}
check(`contrast agrees with the browser on ${MEASURED.length} colors`, worst === 0, `worst disagreement ${worst}`);

// A value whose color is NOT knowable here must return null, never a guess:
// warning about a color nobody can check teaches people to ignore the channel.
for (const bad of ["var(--color-x)", "color-mix(in oklab, red, blue)", "not a color", "", "oklch(from var(--x) l c h)"]) {
  check(`unknowable value is skipped: ${JSON.stringify(bad)}`, readColor(bad) === null);
}

// ── 2. the verdict, on the color that caused all this ───────────────────────
const brand = inkVerdict("oklch(58% 0.24 320)");
check("brand: the rule picks black", brand.ink === "black", JSON.stringify(brand));
check("brand: that pick fails AA", brand.passesAA === false, `${brand.picked}`);
check("brand: white is better, so it is avoidable", brand.avoidable === true && brand.alternative > brand.picked);

// THE THEOREM the messages depend on: black and white contrast multiply to
// exactly 21 against any color, so the better of the two is never below
// sqrt(21) = 4.5826 — above AA. Every failing pick is therefore one declared
// token away from passing, which is why every message can end by naming it, and
// why there is no "this color has no legible ink" branch to write.
let worstProduct = 0;
let lowestBest = Infinity;
let sweep = 0;
for (let l = 0; l <= 1.0001; l += 0.02) {
  for (let c = 0; c <= 0.4; c += 0.04) {
    for (let h = 0; h < 360; h += 20) {
      const read = readColor(`oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h})`);
      if (!read) continue;
      const b = contrast(read.rgb, [0, 0, 0]);
      const w = contrast(read.rgb, [255, 255, 255]);
      worstProduct = Math.max(worstProduct, Math.abs(b * w - 21));
      lowestBest = Math.min(lowestBest, Math.max(b, w));
      sweep++;
    }
  }
}
check(`black x white contrast is 21 across ${sweep} colors`, worstProduct < 1e-9, `worst deviation ${worstProduct}`);
check("so every color has a pure ink clearing AA", lowestBest > 4.5, `lowest best-of-two ${lowestBest.toFixed(4)}`);

// ── 2b. and against the OTHER implementation in this repo ──────────────────
// `@wizeworks/silicaui-html/src/contrast.ts` measures the same thing for the
// node-tree path. The two cannot share code — that package peer-depends on this
// one, so importing it at runtime would invert the layering and give the CSS
// floor its first dependency — so the risk is that they drift apart and start
// giving a consumer two different answers about the same color. Pin them here,
// where a dev dependency is free.
// `contrastRatio` takes parsed OKLCH, not strings — a first version of this
// check passed it strings, got NaN for every case and reported a disagreement
// that did not exist. NaN compared against anything is false, so the probe
// failed loudly rather than passing quietly, which is the only reason it was
// caught in a minute rather than shipped as a "known difference".
let worstCross = 0;
let crossPairs = 0;
const BLACK_HTML = parseColorHtml("#000000");
const WHITE_HTML = parseColorHtml("#ffffff");
for (const [value] of MEASURED) {
  const read = readColor(value);
  const parsed = parseColorHtml(value);
  if (!read || !parsed) continue;
  for (const [ink, theirInk] of [
    [[0, 0, 0], BLACK_HTML],
    [[255, 255, 255], WHITE_HTML],
  ]) {
    const theirs = contrastRatio(parsed, theirInk);
    if (!Number.isFinite(theirs)) continue;
    worstCross = Math.max(worstCross, Math.abs(contrast(read.rgb, ink) - theirs));
    crossPairs++;
  }
}
check(
  `contrast agrees with silicaui-html's own implementation on ${crossPairs} pairs`,
  crossPairs >= 2 * MEASURED.length - 2 && worstCross < 0.01,
  `pairs ${crossPairs}, worst ${worstCross}`,
);

// ── 3. the text-ink derivation, against the browser again ──────────────────
// [role, --color-base-content, --color-base-100, ratio the browser painted]
const TEXT = [
  ["oklch(0.62 0.14 38)", "oklch(0.26 0.03 48)", "oklch(0.975 0.006 85)", 7.76],
  ["oklch(0.66 0.09 172)", "oklch(0.26 0.03 48)", "oklch(0.975 0.006 85)", 6.33],
  ["oklch(0.72 0.14 72)", "oklch(0.26 0.03 48)", "oklch(0.975 0.006 85)", 6.01],
  ["oklch(0.72 0.13 38)", "oklch(0.93 0.01 85)", "oklch(0.19 0.012 48)", 9.72],
  ["oklch(0.58 0.11 262)", "oklch(0.15 0.02 262)", "oklch(0.6 0.02 262)", 2.77],
  ["oklch(58% 0.24 320)", "oklch(21% 0.012 255)", "oklch(98% 0.003 250)", 8.89],
];
let worstText = 0;
for (const [role, baseInk, surface, expected] of TEXT) {
  const painted = inkOf(role, baseInk);
  const got = +contrast(painted.rgb, readColor(surface).rgb).toFixed(2);
  worstText = Math.max(worstText, Math.abs(got - expected));
}
check(
  `text-ink derivation agrees with the browser on ${TEXT.length} palettes`,
  worstText <= 0.05,
  `worst disagreement ${worstText.toFixed(2)}`,
);

// ── 4. the theme plugin substitutes the measured ink, and only then ─────────
const here = resolve(import.meta.dirname, "..");
const themePlugin = here.split("\\").join("/") + "/src/theme-plugin.js";
const dir = mkdtempSync(join(tmpdir(), "silica-ink-"));

async function compileTheme(body) {
  const src = `@plugin "${themePlugin}" {\n${body}\n}\n`;
  const entry = join(dir, "in.css");
  writeFileSync(entry, src);
  const compiled = await compile(src, {
    base: dir,
    loadStylesheet: async (id, base) => {
      const p = resolve(base, id);
      return { base: dirname(p), content: readFileSync(p, "utf8") };
    },
    loadModule: async (id, base) => {
      const p = id.startsWith(".") ? resolve(base, id) : id;
      const abs = p.startsWith("/") || /^[A-Za-z]:/.test(p);
      const mod = await import(abs ? pathToFileURL(p).href : p);
      return { base, module: mod.default ?? mod };
    },
  });
  return compiled.build([]);
}

const avoidable = await compileTheme(`  name: probe;\n  --color-brand: oklch(58% 0.24 320);`);
check(
  "an avoidable color gets the MEASURED ink, not the CSS rule",
  /--color-brand-content:\s*oklch\(100% 0 0\)/.test(avoidable),
  avoidable.match(/--color-brand-content:[^;]*/)?.[0],
);

const fine = await compileTheme(`  name: probe;\n  --color-clay: oklch(0.62 0.14 38);`);
check(
  "a color the rule gets right keeps the CSS rule, byte for byte",
  /--color-clay-content:\s*oklch\(from var\(--color-clay\) clamp/.test(fine),
  fine.match(/--color-clay-content:[^;]*/)?.[0],
);

const authored = await compileTheme(
  `  name: probe;\n  --color-brand: oklch(58% 0.24 320);\n  --color-brand-content: oklch(42% 0.02 320);`,
);
check(
  "an authored ink is never overwritten, even a failing one",
  /--color-brand-content:\s*oklch\(42% 0\.02 320\)/.test(authored),
  authored.match(/--color-brand-content:[^;]*/)?.[0],
);

const unreadable = await compileTheme(`  name: probe;\n  --color-x: var(--something-else);`);
check(
  "a color the plugin cannot read falls back to the CSS rule",
  /--color-x-content:\s*oklch\(from var\(--color-x\) clamp/.test(unreadable),
  unreadable.match(/--color-x-content:[^;]*/)?.[0],
);

const malformed = await compileTheme(`  name: probe;
  --color-broken: oklch(nonsense);`);
check(
  "a malformed color still emits its classes — the reason it must be named",
  /\.btn-broken/.test(malformed) || /--color-broken:/.test(malformed),
  "neither the class nor the token was emitted, so the warning describes nothing",
);

// The split that keeps the channel worth reading: a typo is named, a value that
// is simply not knowable yet is not.
const said = [];
warnInkProblems(findInkProblems({ typo: "oklch(nonsense)", hexTypo: "#gg0011" }), " in a test", (m) => said.push(m));
check("a typo in a known format is named", said.length === 2, JSON.stringify(said));
const quiet = [];
warnInkProblems(
  findInkProblems({ later: "var(--x)", mixed: "color-mix(in oklab, red, blue)", lab: "lab(50% 20 30)" }),
  " in a test",
  (m) => quiet.push(m),
);
check("a value that is valid CSS but not knowable here stays silent", quiet.length === 0, JSON.stringify(quiet));

// ── 5. calibration: silence on everything that is actually fine ────────────
let noisyPresets = 0;
for (const preset of THEME_PRESETS) {
  for (const mode of ["light", "dark"]) {
    const tokens = resolveThemeTokens(preset, mode);
    const colors = {};
    for (const [k, v] of Object.entries(tokens)) {
      const m = /^--color-(.+)$/.exec(k);
      if (m && !m[1].endsWith("-content") && !m[1].startsWith("base-")) colors[m[1]] = v;
    }
    const withoutInk = Object.fromEntries(
      Object.entries(colors).filter(([n]) => !tokens[`--color-${n}-content`]),
    );
    if (
      findInkProblems(withoutInk).length ||
      findInkTextProblems(colors, tokens["--color-base-100"], tokens["--color-base-content"]).length
    ) {
      noisyPresets++;
      console.log(`      noisy: ${preset.name} · ${mode}`);
    }
  }
}
check(
  `silent on all ${THEME_PRESETS.length} shipped presets in both modes`,
  noisyPresets === 0,
  `${noisyPresets} would print something`,
);

// A real, well-chosen custom palette — the one from the P06 run. Only `bone`
// speaks, and truthfully: a 0.94-lightness role IS unreadable as text on a
// 0.975 surface, which is exactly what its author says it is for.
const CLAY = {
  terracotta: "oklch(0.62 0.14 38)",
  ironwood: "oklch(0.31 0.035 48)",
  verdigris: "oklch(0.66 0.09 172)",
  primary: "oklch(0.62 0.14 38)",
  accent: "oklch(0.72 0.11 62)",
  warning: "oklch(0.72 0.14 72)",
  error: "oklch(0.56 0.18 25)",
  success: "oklch(0.58 0.11 148)",
};
check(
  "silent on a well-chosen custom palette",
  findInkProblems(CLAY).length === 0 &&
    findInkTextProblems(CLAY, "oklch(0.975 0.006 85)", "oklch(0.26 0.03 48)").length === 0,
  JSON.stringify([findInkProblems(CLAY), findInkTextProblems(CLAY, "oklch(0.975 0.006 85)", "oklch(0.26 0.03 48)")]),
);

// …and it does speak on the pathological one, or it is decoration.
const SIGNAL = { primary: "oklch(0.58 0.11 262)", secondary: "oklch(0.59 0.06 200)" };
const signalText = findInkTextProblems(SIGNAL, "oklch(0.6 0.02 262)", "oklch(0.15 0.02 262)");
check(
  "names every role of a palette whose colors sit on their own surface",
  signalText.length === 2 && signalText.every((f) => f.ratio < 3),
  JSON.stringify(signalText),
);

console.log(
  failures === 0
    ? "\n✅ auto ink: the rule's picks are measured, and the checks are quiet on everything that is fine"
    : `\n❌ auto ink: ${failures} check(s) failed`,
);
process.exit(failures === 0 ? 0 : 1);
