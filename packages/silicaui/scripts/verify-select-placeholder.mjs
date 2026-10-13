/**
 * Probe: a listbox Select's placeholder sits where its value would.
 *
 * The trigger lays out value, placeholder and chevron with `space-between`.
 * While nothing is chosen, Base UI still renders the value span (empty, marked
 * `[data-placeholder]`), so three flex items were spread across the trigger and
 * the placeholder landed in the middle: "Choose a report" floating centered in
 * an otherwise empty box. The empty value must leave the row while the
 * placeholder shows.
 *
 * Run: node scripts/verify-select-placeholder.mjs
 */
import { selectMenu } from "../src/components/select-menu.js";

const css = selectMenu();
let failed = 0;

function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const hidesEmptyValue = Object.entries(css).some(
  ([selector, rules]) =>
    selector.includes(".select-placeholder") &&
    selector.includes(".select-value[data-placeholder]") &&
    rules.display === "none",
);
check(
  "the empty value leaves the row while a placeholder shows",
  hidesEmptyValue,
  "the placeholder is pushed to the middle of the trigger",
);

const trigger = css[".select-trigger"] ?? {};
check(
  "the trigger still spreads value and chevron to the two ends",
  trigger.justifyContent === "space-between",
);

if (failed > 0) {
  console.log(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nA Select's placeholder sits at the start, where its value would.");
