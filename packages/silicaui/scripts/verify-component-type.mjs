/**
 * No component renders words under 16px by default, and every size ladder is
 * the SAME ladder.
 *
 *   node verify-component-type.mjs
 *
 * WHY THIS IS A PROBE. A font size is a literal in a component module and
 * nothing errors when it is small: `.btn` at `0.875rem` is an ordinary line, and
 * it meant that the default size of the system's most-used control sat under
 * RULE #3's 16px body floor. Sixteen components hardcoded their own ladders and
 * there were nine different ones among them, so `md` meant 14px in a button,
 * 13px in a toggle-group and 12px in a badge. Nobody chose that; it accumulated.
 * (docs/personas/issues/110)
 *
 * TWO RULES, and the second is the one that keeps the first true:
 *
 *   1. Any rule that is NOT a size variant must be at least 16px. That is the
 *      default a consumer gets without asking for anything.
 *   2. Any rule that IS a size variant must match `COMPONENT_TYPE` exactly.
 *      Without this, `md` drifts back one component at a time and rule 1 still
 *      passes, because a component can always be the exception nobody notices.
 *
 * EXEMPT BY REVIEW, NEVER BY PATTERN. Three components are off the ladder on
 * purpose and are named here with the reason. Anything else that wants off has
 * to be added here, which is the point.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENT_TYPE, TYPE_FLOOR_REM } from "../src/component-type.js";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(pkgRoot, "src", "components");
const STEPS = ["xs", "sm", "md", "lg", "xl"];

/** Ladders that are deliberately their own, with why. */
const OFF_LADDER = new Map([
  ["prose", "long-form body copy, whose own ramp starts at the floor and goes up"],
  ["pin-input", "one glyph per cell — the cell is a target, so its type is sized to the box"],
  ["wordmark", "a brand mark, not running text; its steps are mark heights"],
]);

/** Rules that hold no words, so the floor does not apply. Reviewed, not guessed. */
const NOT_TEXT = new Set([]);

const px = (rem) => Math.round(Number(rem) * 16);
const failures = [];
let checkedLadders = 0, checkedRules = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const name = file.replace(/\.js$/, "");
  const lines = readFileSync(join(componentsDir, file), "utf8").split("\n");
  let selector = "(base)";

  lines.forEach((line, i) => {
    const sel =
      line.match(/^\s*\[(.+)\]:\s*\{/) || line.match(/^\s*['"](&[^'"]*)['"]:\s*\{/);
    if (sel) selector = sel[1].replace(/sel\(/g, "").replace(/[`"']/g, "").replace(/\)/g, "");
    const fs = line.match(/fontSize:\s*"([\d.]+)rem"/);
    if (!fs) return;

    const rem = Number(fs[1]);
    const step = STEPS.find((s) => new RegExp(`-${s}$|-${s}\\b`).test(selector));
    const key = `${name}|${selector}`;

    if (step) {
      if (OFF_LADDER.has(name)) return;
      checkedLadders++;
      const want = COMPONENT_TYPE[step];
      if (fs[1] !== want.replace("rem", "")) {
        failures.push(
          `${file}:${i + 1} \`${selector}\` is ${px(rem)}px — the shared ladder puts ${step} at ` +
            `${px(want.replace("rem", ""))}px. Use COMPONENT_TYPE, or add ${name} to OFF_LADDER ` +
            `in this script with a reason.`,
        );
      }
      return;
    }

    if (NOT_TEXT.has(key)) return;
    checkedRules++;
    if (rem < TYPE_FLOOR_REM) {
      failures.push(
        `${file}:${i + 1} \`${selector}\` renders text at ${px(rem)}px by DEFAULT — under ` +
          `RULE #3's ${px(TYPE_FLOOR_REM)}px body floor. Raise it, or add "${key}" to NOT_TEXT ` +
          `in this script if it genuinely holds no words.`,
      );
    }
  });
}

for (const f of failures) console.error(`  ✗ ${f}`);
console.log(`  ${checkedRules} default rule(s) and ${checkedLadders} ladder step(s) checked`);
console.log(`  ${OFF_LADDER.size} component(s) off the ladder by review: ${[...OFF_LADDER.keys()].join(", ")}`);
if (failures.length) {
  console.error(`\n❌ ${failures.length} problem(s). See docs/personas/issues/110.`);
  process.exit(1);
}
console.log("✅ every default clears 16px, and every size ladder is the same ladder");
