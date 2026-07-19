/**
 * Probe: the global z-scale and the shared field-affordance geometry.
 *
 * Both exist because the same class of bug kept happening — a value chosen
 * locally, in one component, that only misbehaves next to a DIFFERENT component
 * (a picker popup opening under a modal; a Select's caret sitting at a different
 * inset than the Combobox stacked below it). A per-component unit test can't
 * catch that by construction, so the invariants are asserted across components
 * here.
 *
 *   node scripts/verify-layering.mjs
 */
import { select } from "../src/components/select.js";
import { selectMenu } from "../src/components/select-menu.js";
import { combobox } from "../src/components/combobox.js";
import { multiSelect } from "../src/components/multi-select.js";
import { dialog } from "../src/components/dialog.js";
import { drawer } from "../src/components/drawer.js";
import { dropdown } from "../src/components/dropdown.js";
import { popover } from "../src/components/popover.js";
import { tooltip } from "../src/components/tooltip.js";
import { toast } from "../src/components/toast.js";
import { lightbox } from "../src/components/lightbox.js";
import { calendar } from "../src/components/calendar.js";
import { commandPalette } from "../src/components/command-palette.js";
import { navigationMenu } from "../src/components/navigation-menu.js";
import { previewCard } from "../src/components/preview-card.js";
import { INSET, BOX, HIT, INK } from "../src/lib/field-affordance.js";

let failures = 0;
const ok = (cond, msg) => {
  if (!cond) { failures++; console.error(`  ✗ ${msg}`); }
  else console.log(`  ✓ ${msg}`);
};

/** Resolve a `var(--x, N)` / `calc(var(--x, N) + 1)` z-index to its default. */
function z(value) {
  const m = String(value).match(/var\(--z-[a-z]+,\s*(\d+)\)/);
  if (!m) return Number.NaN;
  const plus = String(value).match(/\+\s*(\d+)\)/);
  return Number(m[1]) + (plus ? Number(plus[1]) : 0);
}

/** Every zIndex declared anywhere in a rule object, recursively. */
function zIndexes(rules) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (k === "zIndex") out.push(v);
      else walk(v);
    }
  };
  walk(rules);
  return out;
}

/** The single highest global layer a component claims. */
function topLayer(rules, name) {
  const vals = zIndexes(rules).map(z).filter((n) => !Number.isNaN(n));
  if (!vals.length) throw new Error(`${name}: no tokenized z-index found`);
  return Math.max(...vals);
}

console.log("\nz-scale — a transient surface outranks what it opens from");

const COLORS = ["primary", "neutral"];
const layer = {
  drawer: topLayer(drawer(), "drawer"),
  dialog: topLayer(dialog(), "dialog"),
  commandPalette: topLayer(commandPalette(), "command-palette"),
  lightbox: topLayer(lightbox(), "lightbox"),
  dropdown: topLayer(dropdown(), "dropdown"),
  popover: topLayer(popover(), "popover"),
  selectMenu: topLayer(selectMenu(), "select-menu"),
  navigationMenu: topLayer(navigationMenu(), "navigation-menu"),
  previewCard: topLayer(previewCard(), "preview-card"),
  calendar: topLayer(calendar(COLORS), "calendar"),
  tooltip: topLayer(tooltip(), "tooltip"),
  toast: topLayer(toast(COLORS), "toast"),
};

// No raw literals left in the global range — that's how the drift started.
for (const [name, rules] of Object.entries({
  drawer: drawer(), dialog: dialog(), dropdown: dropdown(), popover: popover(),
  selectMenu: selectMenu(), tooltip: tooltip(), toast: toast(COLORS),
  lightbox: lightbox(), calendar: calendar(COLORS),
  commandPalette: commandPalette(), navigationMenu: navigationMenu(),
  previewCard: previewCard(),
})) {
  const raw = zIndexes(rules).filter((v) => /^\d+$/.test(String(v)) && Number(v) >= 10);
  ok(raw.length === 0, `${name}: no untokenized global z-index (found ${raw.join(", ") || "none"})`);
}

// The bug sparx hit: a picker inside a modal must win.
const POPOVERS = ["dropdown", "popover", "selectMenu", "navigationMenu", "previewCard", "calendar"];
for (const p of POPOVERS) {
  ok(layer[p] > layer.dialog, `${p} (${layer[p]}) sits above dialog (${layer.dialog})`);
  ok(layer[p] > layer.lightbox, `${p} (${layer[p]}) sits above lightbox (${layer.lightbox})`);
  ok(layer[p] > layer.commandPalette, `${p} (${layer[p]}) sits above command-palette (${layer.commandPalette})`);
}
ok(layer.dialog > layer.drawer, `dialog (${layer.dialog}) sits above drawer (${layer.drawer})`);
ok(layer.tooltip > layer.dropdown, `tooltip (${layer.tooltip}) sits above popovers (${layer.dropdown})`);
ok(layer.toast === Math.max(...Object.values(layer)), `toast (${layer.toast}) outranks everything`);

console.log("\nfield affordances — one mark, one ink, one trailing inset");

const S = select(COLORS);
const SM = selectMenu();
const CB = combobox();
const MS = multiSelect(COLORS);

// The native caret is edge-anchored off INSET; the flex chevron pads to INSET;
// the icon-buttons center their HIT box on the same glyph box.
const caretPos = S[".select"].backgroundPosition;
ok(caretPos.includes(INSET), `native select caret positioned off INSET (${INSET})`);
ok(S[".select"].backgroundImage.includes(INK), "native select caret uses the shared affordance ink");
ok(
  !/transparent 50%|currentColor 50%/.test(S[".select"].backgroundImage),
  "native select draws a STROKED chevron, not the old solid wedge",
);
ok(SM[".select-trigger"].paddingInlineEnd === INSET, `listbox trigger pads to INSET (${INSET})`);
ok(SM[".select-icon"].color === INK, "listbox chevron uses the shared affordance ink");
ok(SM[".select-icon"]["& svg"].width === BOX, `listbox chevron is BOX-sized (${BOX})`);

for (const [name, rules, prefix] of [["combobox", CB, "combobox"], ["multi-select", MS, "multi-select"]]) {
  const trigger = rules[`.${prefix}-trigger`];
  const clear = rules[`.${prefix}-clear`];
  ok(trigger.color === INK, `${name} open button uses the shared affordance ink`);
  ok(trigger.width === HIT && trigger.height === HIT, `${name} open button is HIT-sized (${HIT})`);
  ok(trigger["& svg"].width === BOX, `${name} chevron is BOX-sized (${BOX})`);
  // Slot 0 centers on the glyph box; slot 1 steps exactly one hit-width inward.
  ok(
    trigger.insetInlineEnd.includes("0 *") || trigger.insetInlineEnd.includes(`0 * ${HIT}`),
    `${name} open button occupies slot 0`,
  );
  ok(clear.insetInlineEnd.includes(`1 * ${HIT}`), `${name} clear button occupies slot 1`);
  ok(clear.width === HIT, `${name} clear button is HIT-sized`);
}

// No component may re-derive the geometry locally — that's how it drifted before.
for (const [name, rules] of [["select-menu", SM], ["combobox", CB], ["multi-select", MS]]) {
  const stale = JSON.stringify(rules).match(/"(0\.4rem|1\.9rem|3\.25rem)"/g);
  ok(!stale, `${name}: no hand-tuned affordance offsets left (${stale?.join(", ") || "none"})`);
}

console.log(
  failures ? `\n${failures} check(s) FAILED\n` : `\nall checks passed\n`,
);
process.exit(failures ? 1 : 0);
