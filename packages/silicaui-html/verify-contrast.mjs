// Contrast probe — every foreground @wizeworks/silicaui-html derives must be
// legible on the color it sits on.
//
//   node verify-contrast.mjs
//
// This exists because the defect it guards was invisible: the CSS-only
// derivation picked white by LIGHTNESS threshold, which looks principled and
// was wrong for seven role colors across the four shipped presets — each one a
// button label failing WCAG AA while the rejected ink would have passed. A
// threshold cannot be eyeballed into correctness; it has to be measured.
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build`.
import {
  AA_NORMAL,
  THEME_PRESETS,
  contrastRatio,
  contrastWarnings,
  deriveContent,
  parseColor,
  resolveThemeTokens,
  rolesOf,
} from "./dist/index.js";

let failures = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

// ── 1. every shipped preset, both modes, every role clears AA ────────────────
console.log("\nShipped presets — derived ink clears WCAG AA:");
for (const preset of THEME_PRESETS) {
  for (const mode of ["light", "dark"]) {
    const tokens = resolveThemeTokens(preset, mode);
    const worst = [];
    for (const role of rolesOf(preset)) {
      const color = parseColor(tokens[`--color-${role}`] ?? "");
      const ink = parseColor(tokens[`--color-${role}-content`] ?? "");
      if (!color || !ink) {
        failures++;
        console.error(`  ✗ ${preset.name}/${mode}: ${role} has no measurable pair`);
        continue;
      }
      const ratio = contrastRatio(color, ink);
      if (ratio < AA_NORMAL) worst.push(`${role} ${ratio.toFixed(2)}:1`);
    }
    check(
      `${preset.name} / ${mode}`,
      worst.length === 0,
      worst.length ? `below AA: ${worst.join(", ")}` : `${rolesOf(preset).length} roles`,
    );
  }
}

// ── 2. the specific rows that regressed, pinned by value ─────────────────────
// The seven that the 0.68 lightness threshold got wrong. Pinned as literals so a
// future palette edit that reintroduces the failure is caught here by name.
console.log("\nThe rows the lightness threshold got wrong — now dark ink:");
const REGRESSED = [
  ["quartz accent", "oklch(64% 0.13 211)"],
  ["ocean primary", "oklch(58% 0.15 235)"],
  ["ocean secondary", "oklch(66% 0.13 200)"],
  ["shared error", "oklch(63% 0.24 25)"],
  ["grape secondary", "oklch(64% 0.2 340)"],
  ["sunset primary", "oklch(64% 0.2 45)"],
  ["sunset secondary", "oklch(60% 0.22 15)"],
];
for (const [label, color] of REGRESSED) {
  const d = deriveContent(color);
  check(`${label}`, d?.ink === "dark" && d.passesAA, d ? `${d.ink} ink at ${d.ratio}:1` : "unparseable");
}

// ── 3. and the ones it got RIGHT stay right (no over-correction) ─────────────
console.log("\nLight ink still wins where it should:");
for (const [label, color] of [
  ["quartz primary", "oklch(42% 0.055 252)"],
  ["quartz neutral", "oklch(26% 0.014 255)"],
  ["grape primary", "oklch(56% 0.24 300)"],
  ["quartz error", "oklch(58% 0.17 25)"],
]) {
  const d = deriveContent(color);
  check(`${label}`, d?.ink === "light" && d.passesAA, d ? `${d.ink} ink at ${d.ratio}:1` : "unparseable");
}

// ── 4. parser honesty ────────────────────────────────────────────────────────
console.log("\nParser:");
check("oklch l is read from the AUTHORED value, not a round trip", parseColor("oklch(68% 0.1 232)").l === 0.68, "0.68 exactly, not 0.6798");
check("hex parses", Math.abs(parseColor("#7c3aed").l - 0.5413) < 0.001, `l=${parseColor("#7c3aed").l.toFixed(4)}`);
check("shorthand hex parses", parseColor("#fff") !== undefined && parseColor("#fff").l > 0.99);
check("rgb() parses", parseColor("rgb(124, 58, 237)") !== undefined);
check("an unmeasurable color returns undefined, never a guess", parseColor("color-mix(in oklch, red, blue)") === undefined);
check("...and deriveContent declines it too", deriveContent("var(--brand)") === undefined);

// ── 5. the resolver's contract ───────────────────────────────────────────────
console.log("\nresolveThemeTokens:");
const authored = {
  name: "authored",
  mode: "light",
  tokens: { "--color-primary": "oklch(64% 0.2 45)", "--color-primary-content": "oklch(50% 0 0)" },
};
check(
  "an AUTHORED -content is never overwritten",
  resolveThemeTokens(authored)["--color-primary-content"] === "oklch(50% 0 0)",
);
check(
  "...and contrastWarnings reports it as the failure it is",
  contrastWarnings(authored).some((w) => w.role === "primary"),
  JSON.stringify(contrastWarnings(authored)),
);
const unmeasurable = { name: "x", mode: "light", tokens: { "--color-brand": "color-mix(in oklch, red, blue)" } };
check(
  "an unmeasurable color is left for the CSS fallback, not guessed",
  resolveThemeTokens(unmeasurable)["--color-brand-content"] === undefined,
);
const custom = { name: "x", mode: "light", tokens: { "--color-brand": "#7c3aed" } };
check(
  "a custom color invented by the author is derived like any other",
  typeof resolveThemeTokens(custom)["--color-brand-content"] === "string",
  resolveThemeTokens(custom)["--color-brand-content"],
);
const darkDelta = {
  name: "x",
  mode: "light",
  tokens: { "--color-primary": "oklch(42% 0.055 252)" },
  dark: { "--color-primary": "oklch(72% 0.06 252)" },
};
check(
  "the dark delta gets its OWN derivation, not the light one",
  resolveThemeTokens(darkDelta, "light")["--color-primary-content"] !==
    resolveThemeTokens(darkDelta, "dark")["--color-primary-content"],
);

if (failures > 0) {
  console.error(`\n✗ contrast: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\n✅ contrast: every derived foreground clears WCAG AA");
