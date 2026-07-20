/**
 * A component that ships ANY size ships the WHOLE `xs`–`xl` scale.
 *
 *   node verify-size-scale.mjs
 *
 * WHY THIS IS A PROBE. Nothing errors when a size is missing — `size="xs"` on a
 * component that only defines `-sm`/`-lg` just renders at the default. It looks
 * like the prop was ignored, and the only way to find out which sizes a given
 * component actually supports is to read its CSS.
 *
 * That is a per-component lookup a developer (or an agent) has to repeat for
 * every component they touch, and it is exactly the kind of arbitrary
 * inconsistency a design system exists to eliminate: ten of twenty-nine sized
 * modules shipped a partial scale, so `<Button size="xs">` worked while
 * `<Toolbar size="xs">` did not.
 *
 * `-md` is required explicitly rather than left implicit in the base rule.
 * React wrappers can omit it (base == md), but the class-first layers — vanilla
 * markup and silicaui-html — author `class="foo foo-md"` by hand, and that has
 * to resolve.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(pkgRoot, "src", "components");
const SCALE = ["xs", "sm", "md", "lg", "xl"];

/**
 * Modules that size by attribute rather than by class. Same requirement, the
 * selector shape just differs — `Toolbar` cascades its size to its own parts
 * through a custom property, which a class would do no better.
 */
const ATTR_SIZED = new Set(["toolbar.js"]);

const failures = [];
let sized = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const mod = await import(`file://${join(componentsDir, file)}`);
  const fn = Object.values(mod).find((v) => typeof v === "function");
  if (!fn) continue;
  // Colored factories are `(colors, prefix)`, colorless `(prefix)`. Arity is the
  // reliable discriminator (see verify-icon-sizing.mjs for why try/catch is not).
  let css;
  try {
    css = fn.length === 2 ? fn(["primary", "error"], "") : fn("");
  } catch {
    continue;
  }

  // Flatten one level: sizes live either in top-level keys (`.foo-sm`, and
  // descendant forms like `.foo-sm .foo-track`) or, for attribute-sized
  // modules, in nested `&[data-size="sm"]` keys.
  const keys = [];
  for (const [k, v] of Object.entries(css)) {
    keys.push(k);
    if (v && typeof v === "object") keys.push(...Object.keys(v));
  }
  const blob = keys.join("\n");

  const present = new Set();
  for (const s of SCALE) {
    const re = ATTR_SIZED.has(file)
      ? new RegExp(`\\[data-size="${s}"\\]`)
      : new RegExp(`^\\.[a-z-]+-${s}(\\s|$)`, "m");
    if (re.test(blob)) present.add(s);
  }

  if (present.size === 0) continue; // not a sized component
  sized++;
  const missing = SCALE.filter((s) => !present.has(s));
  if (missing.length) {
    failures.push(
      `${file}: ships ${[...present].join("/")} but NOT ${missing.join("/")} — ` +
        `a component that supports any size must support the whole xs–xl scale`,
    );
  }
}

for (const f of failures) console.log(`  ✗ ${f}`);
console.log(`  checked ${sized} sized component module(s)`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} module(s) ship a partial size scale\n`
    : "\n✅ every sized component ships the full xs–xl scale\n",
);
process.exit(failures.length ? 1 : 0);
