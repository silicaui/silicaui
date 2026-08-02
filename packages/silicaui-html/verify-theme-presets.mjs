// Preset catalog integrity — the checks that keep twenty shipped themes honest.
//
//   node verify-theme-presets.mjs
//
// `verify-contrast.mjs` proves every ROLE color carries a legible foreground.
// This covers the three things that sit outside a role:
//
//   1. Body text on the surface ramp. It is the pairing every visitor reads on
//      every page, and it is the one no role check touches: `base-content` is
//      not a role, so `rolesOf` never returns it and `contrastWarnings` never
//      measures it. A theme can pass every role check with unreadable prose.
//   2. Dark completeness. Three of the original four presets restated only part
//      of their palette in dark and let the rest fall through to light values —
//      `ocean` never restated a brand role at all. `defineTheme` now makes that
//      a type error; this asserts it at runtime too, because `Theme` is a plain
//      interface and nothing stops a hand-built one from reaching the array.
//   3. Font rows. `FACE` in themes.ts hardcodes the stack + weights the theme
//      editor's Google-catalog option produces, because that catalog lives
//      DOWNSTREAM in the builder and the schema package must not import it.
//      Hardcoding is only safe if something checks it — this is that something.
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build`.
import { readFileSync } from "node:fs";
import { AA_NORMAL, THEME_PRESETS, SEMANTIC_ROLES, contrastRatio, parseColor, resolveThemeTokens } from "./dist/index.js";

let failures = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

// ── 1. the catalog itself ────────────────────────────────────────────────────
console.log("\nCatalog:");
const names = THEME_PRESETS.map((t) => t.name);
check("twenty presets ship", THEME_PRESETS.length === 20, `${THEME_PRESETS.length}`);
check("every name is unique", new Set(names).size === names.length, names.join(", "));
check(
  "every name is a safe [data-theme] value",
  names.every((n) => /^[a-z][a-z0-9-]*$/.test(n)),
);

// ── 2. every preset states a COMPLETE palette in BOTH modes ──────────────────
console.log("\nCompleteness — no role falls through from light to dark:");
const SURFACES = ["base-100", "base-200", "base-300", "base-content"];
for (const preset of THEME_PRESETS) {
  const missing = [];
  for (const key of [...SURFACES, ...SEMANTIC_ROLES]) {
    if (!preset.tokens[`--color-${key}`]) missing.push(`light ${key}`);
    if (!preset.dark?.[`--color-${key}`]) missing.push(`dark ${key}`);
  }
  check(preset.name, missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "12 light + 12 dark");
}

// ── 3. body text is readable on every surface in the ramp ────────────────────
console.log("\nBody text on the surface ramp clears WCAG AA:");
for (const preset of THEME_PRESETS) {
  for (const mode of ["light", "dark"]) {
    const bag = mode === "dark" ? { ...preset.tokens, ...preset.dark } : preset.tokens;
    const ink = parseColor(bag["--color-base-content"] ?? "");
    const worst = [];
    let lowest = Infinity;
    for (const surface of ["base-100", "base-200", "base-300"]) {
      const bg = parseColor(bag[`--color-${surface}`] ?? "");
      if (!ink || !bg) {
        worst.push(`${surface} unmeasurable`);
        continue;
      }
      const ratio = contrastRatio(bg, ink);
      lowest = Math.min(lowest, ratio);
      if (ratio < AA_NORMAL) worst.push(`${surface} ${ratio.toFixed(2)}:1`);
    }
    check(
      `${preset.name} / ${mode}`,
      worst.length === 0,
      worst.length ? `below AA: ${worst.join(", ")}` : `worst ${lowest.toFixed(2)}:1`,
    );
  }
}

// ── 4. the surface ramp is actually a ramp ───────────────────────────────────
// base-200 and base-300 step AWAY from the page, in the direction the mode
// implies: darker in light mode, darker still in dark mode (silicaui's dark ramp
// recedes rather than lifts). A ramp that doubles back gives cards and page the
// same value, and the layering silently disappears.
console.log("\nThe surface ramp steps in one direction:");
const lightnessOf = (css) => parseColor(css ?? "")?.l;
for (const preset of THEME_PRESETS) {
  for (const mode of ["light", "dark"]) {
    const bag = mode === "dark" ? { ...preset.tokens, ...preset.dark } : preset.tokens;
    const [l1, l2, l3] = ["base-100", "base-200", "base-300"].map((s) => lightnessOf(bag[`--color-${s}`]));
    check(
      `${preset.name} / ${mode}`,
      l1 > l2 && l2 > l3,
      `${(l1 * 100).toFixed(1)}% → ${(l2 * 100).toFixed(1)}% → ${(l3 * 100).toFixed(1)}%`,
    );
  }
}

// ── 5. every font row matches the real Google catalog ────────────────────────
console.log("\nType — each FACE row matches the builder's baked Google catalog:");
const CATALOG_PATH = "../silicaui-builder/src/site/react/google-fonts-catalog.ts";
const catalog = new Map();
{
  const src = readFileSync(new URL(CATALOG_PATH, import.meta.url), "utf8");
  const RE = /\{ family: "([^"]+)", category: "([^"]+)", weights: \[([^\]]*)\], italic: (?:true|false) \}/g;
  for (const m of src.matchAll(RE)) {
    catalog.set(m[1], { category: m[2], weights: m[3].split(",").map((s) => Number(s.trim())) });
  }
  check("the catalog parsed", catalog.size > 100, `${catalog.size} families`);
}

// Mirrors ThemeEditor's own two helpers — if either changes there, a preset's
// stored stack stops matching the option it is supposed to BE, and the editor
// shows the theme's face as "Custom (…)" instead of highlighting the pick.
const genericFallback = (category) => {
  const c = category.toLowerCase();
  if (c.includes("mono")) return "monospace";
  if (c.includes("handwriting") || c.includes("script")) return "cursive";
  if (c.includes("serif") && !c.includes("sans")) return "serif";
  return "sans-serif";
};
const pickWeights = (available) => {
  const desired = [400, 600, 700].filter((w) => available.includes(w));
  return desired.length ? desired : available.slice(0, 3);
};

for (const preset of THEME_PRESETS) {
  for (const [slot, cssVar] of [
    ["sans", "--font-sans"],
    ["head", "--font-head"],
  ]) {
    const pick = preset.fonts?.[slot];
    const stack = preset.tokens[cssVar];
    if (!pick && !stack) continue; // inherits silicaui's default stack — fine.
    if (!pick || !stack) {
      check(`${preset.name}.${slot}`, false, "one of `fonts` / token is set without the other");
      continue;
    }
    const entry = catalog.get(pick.family);
    if (!entry) {
      check(`${preset.name}.${slot}`, false, `"${pick.family}" is not in the Google catalog`);
      continue;
    }
    const wantStack = `"${pick.family}", ${genericFallback(entry.category)}`;
    const wantWeights = pickWeights(entry.weights);
    const problems = [];
    if (stack !== wantStack) problems.push(`stack is \`${stack}\`, editor writes \`${wantStack}\``);
    if (pick.weights.join() !== wantWeights.join())
      problems.push(`weights [${pick.weights}] vs catalog [${wantWeights}]`);
    if (pick.source !== "google") problems.push(`source is "${pick.source}"`);
    check(`${preset.name}.${slot}`, problems.length === 0, problems.join("; ") || `${pick.family}`);
  }
}

// ── 6. a preset that states type or shape states it ONCE, in `tokens` ────────
// Shape and type are mode-independent. Repeating them in `dark` would be dead
// weight that the next editor has to keep in sync by hand.
console.log("\nShape + type live only in the light bag:");
const MODE_INDEPENDENT = /^--(font-|radius-|border$|depth$|size-)/;
for (const preset of THEME_PRESETS) {
  const strays = Object.keys(preset.dark ?? {}).filter((k) => MODE_INDEPENDENT.test(k));
  check(preset.name, strays.length === 0, strays.length ? `in dark: ${strays.join(", ")}` : "clean");
}

// ── 7. a light ink never survives into dark over a re-pointed role ──────────
// The normal shape of a hand-written theme is: author `--color-primary-content`
// once in `tokens`, then override only `--color-primary` in `dark` — because the
// ink usually needs no thought. `resolveThemeTokens` used to carry that light ink
// straight through the merge, see a truthy value, and skip derivation, so every
// filled surface in dark mode painted white-on-pale at roughly 1.7:1.
//
// The presets themselves never tripped it (`defineTheme` emits no `-content` at
// all, so every role derives cleanly in both modes) — which is exactly why it
// went unnoticed: the bug only bites a CONSUMER's theme, and the builder harness
// ships one. So this is checked against a synthetic theme in that shape rather
// than against THEME_PRESETS.
console.log("\nA re-pointed dark role re-derives its ink:");
{
  const consumerShaped = {
    name: "consumer-shaped",
    mode: "light",
    tokens: {
      "--color-base-100": "oklch(98% 0.003 250)",
      "--color-base-content": "oklch(21% 0.012 255)",
      "--color-primary": "oklch(42% 0.055 252)",
      "--color-primary-content": "oklch(98% 0.004 250)", // authored for LIGHT
      "--color-neutral": "oklch(26% 0.014 255)",
      "--color-neutral-content": "oklch(95% 0.004 250)", // authored, never re-pointed
    },
    dark: {
      "--color-base-100": "oklch(16% 0.01 255)",
      "--color-base-content": "oklch(93% 0.006 250)",
      "--color-primary": "oklch(72% 0.06 252)", // re-pointed, ink NOT restated
    },
  };
  const light = resolveThemeTokens(consumerShaped, "light");
  const dark = resolveThemeTokens(consumerShaped, "dark");

  check(
    "light keeps the authored ink",
    light["--color-primary-content"] === "oklch(98% 0.004 250)",
    light["--color-primary-content"],
  );
  const ratio = contrastRatio(parseColor(dark["--color-primary"]), parseColor(dark["--color-primary-content"]));
  check(
    "dark re-derives the ink for the re-pointed role",
    dark["--color-primary-content"] !== light["--color-primary-content"] && ratio >= AA_NORMAL,
    `${dark["--color-primary-content"]} on ${dark["--color-primary"]} = ${ratio.toFixed(2)}:1`,
  );
  // The other half of the contract: an authored ink whose role did NOT move is
  // the author's measured decision and must be left exactly alone.
  check(
    "an untouched role keeps its authored ink in dark",
    dark["--color-neutral-content"] === "oklch(95% 0.004 250)",
    dark["--color-neutral-content"],
  );
}

if (failures > 0) {
  console.error(`\n✗ theme presets: ${failures} check(s) failed`);
  process.exit(1);
}
console.log(`\n✅ theme presets: ${THEME_PRESETS.length} themes, complete and legible in both modes`);