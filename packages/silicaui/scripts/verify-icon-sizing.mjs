/**
 * Every icon slot must size its own `<svg>`.
 *
 *   node verify-icon-sizing.mjs
 *
 * WHY THIS IS A PROBE AND NOT A CODE REVIEW ITEM. An unsized inline `<svg>`
 * has no intrinsic size, so browsers fall back to differing defaults — it can
 * render correctly in Playwright's Chromium and collapse or balloon in the
 * user's browser. That makes it invisible to every automated check we have,
 * including screenshots. It has already happened here more than once, and
 * `swap` and `stat` both shipped without sizing despite the house rule.
 *
 * `stat-figure` is the sharpest case: the figure defines an implicit grid
 * column, so an unsized glyph moves the whole component's layout.
 *
 * The rule: if a selector is an icon slot, it declares `width` + `height` for
 * its `svg` descendant. Add new icon slots to SLOTS below.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** module → selectors that are icon slots and must size their svg. */
const SLOTS = {
  "button.js": [".btn"],
  "swap.js": [".swap"],
  "stat.js": [".stat-figure"],
  "input-group.js": [".input-group-start", ".input-group-end", ".input-group-btn"],
  "alert.js": [".alert-close"],
  "avatar.js": [".avatar"],
  "label.js": [".label"],
};

const failures = [];
let checked = 0;

for (const [file, selectors] of Object.entries(SLOTS)) {
  const mod = await import(`file://${join(pkgRoot, "src", "components", file)}`);
  const fn = Object.values(mod).find((v) => typeof v === "function");
  if (!fn) {
    failures.push(`${file}: no exported factory function found`);
    continue;
  }
  // Colored modules are `(colors, prefix)`, colorless are `(prefix)`. Arity is
  // the reliable discriminator — passing a colors array to a colorless factory
  // silently reads it AS the prefix and yields plausible-looking garbage keys
  // rather than throwing.
  const css = fn.length === 2 ? fn(["primary", "error"], "") : fn("");

  for (const selector of selectors) {
    checked++;
    const rule = css[selector];
    if (!rule) {
      failures.push(`${file}: expected selector \`${selector}\` not found`);
      continue;
    }
    // Accept `& svg`, `& > svg`, `& :is(svg,img)`, etc. — any nested key that
    // targets svg and declares both dimensions.
    const svgRule = Object.entries(rule).find(
      ([k, v]) => /svg/.test(k) && v && typeof v === "object",
    );
    if (!svgRule) {
      failures.push(
        `${file} \`${selector}\`: icon slot declares no svg sizing rule — an ` +
          `unsized <svg> renders differently per browser and can pass CI while ` +
          `breaking in a real one.`,
      );
      continue;
    }
    const [key, decl] = svgRule;
    const missing = ["width", "height"].filter((d) => !decl[d]);
    if (missing.length) {
      failures.push(
        `${file} \`${selector}\` → \`${key}\`: missing ${missing.join(" and ")} ` +
          `— an icon slot must declare both, or the <svg> still has no ` +
          `intrinsic size in one axis.`,
      );
    }
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} icon-sizing check(s) failed:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ icon sizing: ${checked} icon slots all size their svg`);
