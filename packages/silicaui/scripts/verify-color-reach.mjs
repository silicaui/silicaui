/**
 * Every colored component's variants are reachable for an N-th color.
 *
 *   node verify-color-reach.mjs
 *
 * WHY THIS IS A PROBE. Silica's core promise is that a color you invent cascades
 * through everything. Each component used to implement that with its own private
 * `for (const name of colors)` loop, and only Button's had ever been factored
 * out — so the builder's runtime cascade, which can only call generators that are
 * exported, regenerated `btn-brand` and nothing else. A color invented in the
 * theme editor painted buttons and silently skipped Badge, Alert, Input, Tabs,
 * and 30 others. Nothing failed; the classes just weren't in any stylesheet.
 *
 * Types couldn't catch it (the loops were all individually correct) and neither
 * could a snapshot of build-time CSS (build time was fine — only the runtime path
 * was short). The invariant that actually matters is STRUCTURAL: if a factory
 * accepts `colors`, its mapping must live in the shared table, because that table
 * is the only thing both callers can see.
 *
 * Checks, for every module in src/components:
 *   1. A factory taking `colors` is registered in COLOR_VARIANTS.
 *   2. Its registered selector really appears in the factory's own output — so a
 *      wrong table entry (`.tag-<c>` vs `.tag-input-<c>`) fails loudly instead of
 *      emitting dead CSS.
 *   3. Nothing is registered that no longer exists.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COLOR_VARIANTS, colorVariantRules } from "../src/color-variants.js";

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, "..", "src", "components");

const COLORS = ["primary", "brand"];
const failures = [];
const seen = new Set();

/**
 * Does this factory take a `colors` list?
 *
 * Read off the source, NOT `Function.length` — every factory is declared
 * `(colors, prefix = "")` or `(prefix = "")`, and `length` stops counting at the
 * first defaulted parameter, so the colored ones report 1 and the colorless 0.
 * Matching the parameter name says what we actually mean.
 */
const takesColors = (fn) => /^[^(]*\(\s*colors\b/.test(fn.toString());

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const mod = await import(`file://${join(componentsDir, file)}`);

  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn !== "function") continue;
    if (!takesColors(fn)) continue;
    // The re-exported single-component helpers aren't factories themselves.
    if (name.endsWith("ColorVars")) continue;

    if (!(name in COLOR_VARIANTS)) {
      failures.push(
        `${file}: "${name}" takes \`colors\` but is not registered in COLOR_VARIANTS — ` +
          `add an entry to src/color-variants.js, or the builder's runtime cascade ` +
          `will not paint this component for a user-invented color`,
      );
      continue;
    }
    seen.add(name);

    let keys;
    try {
      keys = Object.keys(fn(COLORS, ""));
    } catch (err) {
      failures.push(`${file}: "${name}" threw when generating — ${err.message}`);
      continue;
    }
    // Anchor the table's selector to something it does NOT control: the base
    // class the component paints. Strip the color off `.tag-input-brand` and
    // `.tag-input` must be a rule the component really ships. A typo'd entry
    // (`.tag-brand`) strips to `.tag`, which nothing defines, so it fails —
    // whereas comparing the table to output now GENERATED from the table would
    // always agree with itself and prove nothing.
    for (const sel of Object.keys(colorVariantRules(name, ["brand"], ""))) {
      const root = sel.replace(/\[data-type="brand"\]$/, "").replace(/-brand$/, "");
      if (root === sel) {
        failures.push(`${file}: "${name}" selector ${sel} does not embed the color name`);
      } else if (!keys.includes(root)) {
        failures.push(
          `${file}: "${name}" is registered as ${sel}, but the component ships no ${root} ` +
            `rule to attach it to — the COLOR_VARIANTS selector is wrong, so these ` +
            `variants would be dead CSS`,
        );
      }
    }
  }
}

for (const key of Object.keys(COLOR_VARIANTS)) {
  if (!seen.has(key)) {
    failures.push(`COLOR_VARIANTS has "${key}" but no component factory by that name was found`);
  }
}

for (const f of failures) console.log(`  ✗ ${f}`);
console.log(`  checked ${seen.size} colored component(s) against the shared color-variant table`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} color-reach problem(s)\n`
    : "\n✅ every colored component is reachable for an N-th color\n",
);
process.exit(failures.length ? 1 : 0);
