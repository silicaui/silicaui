/**
 * Probe: a closing overlay lets clicks through.
 *
 * Base UI keeps a backdrop and popup mounted for their exit transition, marked
 * `[data-ending-style]`. They are transparent by then but still cover the page,
 * so a click in that window lands on a backdrop that is already leaving and is
 * swallowed. In a console that meant: Escape the search, click the search box
 * again at once, and nothing opened while everything typed next was lost.
 *
 * Every backdrop and popup of a modal surface must drop pointer events while it
 * is ending.
 *
 * Run: node scripts/verify-closing-overlays.mjs
 */
import { dialog } from "../src/components/dialog.js";
import { drawer } from "../src/components/drawer.js";
import { commandPalette } from "../src/components/command-palette.js";
import { lightbox } from "../src/components/lightbox.js";

const SURFACES = { dialog, drawer, commandPalette, lightbox };
let failed = 0;

function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function letsClicksThroughWhileEnding(rules) {
  return Object.entries(rules).some(
    ([key, value]) =>
      key.includes("[data-ending-style]") &&
      !key.includes("data-side") &&
      value &&
      typeof value === "object" &&
      value.pointerEvents === "none"
  );
}

for (const [name, build] of Object.entries(SURFACES)) {
  const css = build();
  const layers = Object.keys(css).filter((sel) =>
    /-(backdrop|popup)$/.test(sel)
  );
  check(
    `${name}: has a backdrop and a popup`,
    layers.length === 2,
    layers.join(", ")
  );
  for (const sel of layers) {
    check(
      `${sel} drops pointer events while it is ending`,
      letsClicksThroughWhileEnding(css[sel]),
      "a click during the exit transition lands on a layer that is leaving"
    );
  }
}

if (failed > 0) {
  console.log(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nEvery closing backdrop and popup lets clicks through.");
