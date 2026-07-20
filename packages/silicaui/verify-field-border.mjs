/**
 * Probe: the soft-resting-border lever on field-tier controls.
 *
 * Each color class sets TWO levers — `--*-accent` (focus ring + focused
 * border) and `--*-border` (a softened tint for the resting border) — so
 * rest → focus is a visible state change instead of a no-op.
 *
 * The subtle part, and the reason this probe exists: validation statuses in
 * field.js drive the accent alone and must reset `--*-border` to `initial`.
 * Without that reset a decorative color class (`.input-primary`), which sets
 * the border lever on the element itself, would survive the status rule and
 * leave an invalid field wearing a primary border. Regressing that is silent
 * and easy — nothing throws, the red just quietly stops being red.
 *
 * Run: node verify-field-border.mjs
 */
import { input } from "./src/components/input.js";
import { select } from "./src/components/select.js";
import { textarea } from "./src/components/textarea.js";
import { pinInput } from "./src/components/pin-input.js";
import { checkbox } from "./src/components/checkbox.js";
import { radio } from "./src/components/radio.js";
import { field } from "./src/components/field.js";

const COLORS = ["primary", "secondary", "error"];
let failed = 0;

function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ---- Each field-tier control wires both levers -----------------------------
const CONTROLS = [
  ["input", input(COLORS), ".input", (c) => `.input-${c}`],
  ["select", select(COLORS), ".select", (c) => `.select-${c}`],
  ["textarea", textarea(COLORS), ".textarea", (c) => `.textarea-${c}`],
  ["pin-input", pinInput(COLORS), ".pin-input-cell", (c) => `.pin-input-cell-${c}`],
  ["checkbox", checkbox(COLORS), ".checkbox", (c) => `.checkbox-${c}`],
  ["radio", radio(COLORS), ".radio", (c) => `.radio-${c}`],
];

for (const [name, css, baseSel, colorSel] of CONTROLS) {
  console.log(`\n${name}`);
  const lever = `--${name === "pin-input" ? "pin-input" : name}-border`;
  const accent = `--${name === "pin-input" ? "pin-input" : name}-accent`;

  // The base rule must read the border lever FIRST, falling back to the accent
  // and only then to the neutral border.
  const border = css[baseSel]?.borderColor ?? "";
  check(
    `${baseSel} border reads ${lever} → ${accent} → base-300`,
    border.includes(`var(${lever},`) &&
      border.includes(`var(${accent},`) &&
      border.includes("--color-base-300"),
    border,
  );

  for (const c of COLORS) {
    const rule = css[colorSel(c)] ?? {};
    check(`${colorSel(c)} sets ${accent} solid`, rule[accent] === `var(--color-${c})`);
    check(
      `${colorSel(c)} sets ${lever} as a tint of --color-${c}`,
      typeof rule[lever] === "string" &&
        rule[lever].startsWith("color-mix(in oklab, var(--color-" + c + ")") &&
        rule[lever].includes("var(--field-border-tint,") &&
        rule[lever].includes("var(--color-base-100)"),
      rule[lever],
    );
  }
}

// ---- Validation status must beat a decorative color class -----------------
console.log("\nfield — status overrides");
const f = field("");
const statusRules = Object.entries(f).filter(([sel]) =>
  /\[data-status=|\[data-invalid\]/.test(sel),
);
check("status rules exist", statusRules.length >= 4, `found ${statusRules.length}`);

for (const [sel, rule] of statusRules) {
  const status = sel.match(/data-status="(\w+)"/)?.[1] ?? "error";
  for (const part of ["input", "select", "textarea"]) {
    check(
      `${status}: --${part}-accent solid`,
      rule[`--${part}-accent`] === `var(--color-${status})`,
    );
    // The load-bearing reset — see the header comment.
    check(
      `${status}: --${part}-border reset to initial`,
      rule[`--${part}-border`] === "initial",
      rule[`--${part}-border`],
    );
  }
}

console.log(
  failed === 0 ? "\nAll field-border checks passed." : `\n${failed} check(s) FAILED.`,
);
process.exit(failed === 0 ? 0 : 1);
