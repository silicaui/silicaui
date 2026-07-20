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
 * Run: node scripts/verify-field-border.mjs
 */
import { input } from "../src/components/input.js";
import { select } from "../src/components/select.js";
import { textarea } from "../src/components/textarea.js";
import { pinInput } from "../src/components/pin-input.js";
import { checkbox } from "../src/components/checkbox.js";
import { radio } from "../src/components/radio.js";
import { multiSelect } from "../src/components/multi-select.js";
import { tagInput } from "../src/components/tag-input.js";
import { segmentField } from "../src/components/segment-field.js";
import { field } from "../src/components/field.js";

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
// `stem` is the custom-property stem, which does NOT always track the class
// name — `.tag-input` drives `--tag-*`, `.pin-input-cell` drives `--pin-input-*`
// — so it is stated per control rather than derived.
const CONTROLS = [
  { name: "input", stem: "input", css: input(COLORS), base: ".input", color: (c) => `.input-${c}` },
  { name: "select", stem: "select", css: select(COLORS), base: ".select", color: (c) => `.select-${c}` },
  { name: "textarea", stem: "textarea", css: textarea(COLORS), base: ".textarea", color: (c) => `.textarea-${c}` },
  { name: "pin-input", stem: "pin-input", css: pinInput(COLORS), base: ".pin-input-cell", color: (c) => `.pin-input-cell-${c}` },
  { name: "checkbox", stem: "checkbox", css: checkbox(COLORS), base: ".checkbox", color: (c) => `.checkbox-${c}` },
  { name: "radio", stem: "radio", css: radio(COLORS), base: ".radio", color: (c) => `.radio-${c}` },
  { name: "multi-select", stem: "multi-select", css: multiSelect(COLORS), base: ".multi-select", color: (c) => `.multi-select-${c}` },
  { name: "tag-input", stem: "tag", css: tagInput(COLORS), base: ".tag-input", color: (c) => `.tag-input-${c}` },
  { name: "segment-field", stem: "segment-field", css: segmentField(COLORS), base: ".segment-field", color: (c) => `.segment-field-${c}` },
];

for (const { name, stem, css, base: baseSel, color: colorSel } of CONTROLS) {
  console.log(`\n${name}`);
  const lever = `--${stem}-border`;
  const accent = `--${stem}-accent`;

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
