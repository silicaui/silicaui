/**
 * `@plugin "@wizeworks/silicaui/theme"` — the CSS-only way to declare a theme.
 *
 * Tailwind hands a COMMA-SEPARATED option value to a plugin as an ARRAY. The
 * main plugin's `parseColors`/`parsePrefix` both know that and open with
 * `Array.isArray(option)`. `theme-plugin.js` did not, so the array fell straight
 * through `unquote` and reached `addBase`, which emits ONE DECLARATION PER
 * ELEMENT under the same property name — and the last fragment won:
 *
 *     --font-head: "Cormorant Garamond", serif;
 *  →  --font-head: Cormorant Garamond;
 *     --font-head: serif;                        ← wins
 *
 * A theme's type faces were therefore impossible to set through the documented
 * CSS path, and it failed SILENTLY: you get the generic `serif`, which looks
 * like a font rather than like a bug. Multi-layer shadows split the same way.
 * Found by P02 (a Django developer with no bundler) — docs/personas/issues/031.
 *
 * This runs the REAL plugin through the REAL Tailwind compiler rather than
 * asserting on the option parser, because the bug was in the hand-off between
 * the two and a unit test of either half would have stayed green.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "tailwindcss";

let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) {
    failures++;
    if (detail) console.log(`      ${detail}`);
  }
}

const here = resolve(import.meta.dirname, "..");
const dir = mkdtempSync(join(tmpdir(), "silica-theme-"));

// No `@import "tailwindcss"` on purpose: this probe is about what the THEME
// plugin emits, and importing the framework would need a `loadStylesheet`
// resolver for output nobody here looks at.
const source = `
@plugin "${here.replace(/\\/g, "/")}/src/theme-plugin.js" {
  name: probe;
  color-scheme: light;
  --font-head: "Cormorant Garamond", serif;
  --font-sans: "IBM Plex Sans", ui-sans-serif, sans-serif;
  --shadow-probe: 0 1px 2px black, 0 4px 8px black;
  --color-primary: "#7c3aed";
  --color-accent: oklch(50% 0.08 75);
}
`;

const entry = join(dir, "in.css");
writeFileSync(entry, source);

let css;
try {
  const compiled = await compile(source, {
    base: dir,
    // On Windows an absolute path is not a valid ESM specifier — `g:\…` reads
    // as a URL scheme. pathToFileURL is the difference between this probe
    // running here and only running in CI.
    loadModule: async (id, base) => {
      const abs = id.startsWith(".") ? resolve(base, id) : id;
      const mod = await import(pathToFileURL(abs).href);
      return { module: mod.default ?? mod, base };
    },
  });
  css = compiled.build([]);
} catch (err) {
  console.log("  ✗ the probe stylesheet did not compile");
  console.log(`      ${err.message}`);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}
rmSync(dir, { recursive: true, force: true });

const block = (() => {
  const i = css.indexOf('[data-theme="probe"]');
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i) + 1);
})();

check("the declared theme is emitted at all", block.length > 0, "no [data-theme=\"probe\"] rule in the output");

// The whole point: ONE declaration per property, with every comma-separated
// part still in it. `countOf` catches the split even when the value looks right.
const countOf = (prop) => (block.match(new RegExp(`${prop}\\s*:`, "g")) ?? []).length;
const valueOf = (prop) => {
  const m = block.match(new RegExp(`${prop}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

check(
  "a font stack stays ONE declaration",
  countOf("--font-head") === 1,
  `--font-head appeared ${countOf("--font-head")} times — the array was not joined`,
);
check(
  "a font stack keeps its family AND its fallback",
  /Cormorant Garamond/.test(valueOf("--font-head") ?? "") && /serif/.test(valueOf("--font-head") ?? ""),
  `--font-head = ${valueOf("--font-head")}`,
);
check(
  "a three-part font stack survives too",
  countOf("--font-sans") === 1 && (valueOf("--font-sans") ?? "").split(",").length === 3,
  `--font-sans = ${valueOf("--font-sans")}`,
);
check(
  "a multi-layer shadow is not split",
  countOf("--shadow-probe") === 1 && (valueOf("--shadow-probe") ?? "").split(",").length === 2,
  `--shadow-probe = ${valueOf("--shadow-probe")}`,
);

// The old `unquote` stripped each end independently, which is why a quoted
// family inside a stack came out malformed. A WHOLLY quoted scalar must still
// unwrap — that case is why stripping exists.
check(
  "a wholly-quoted scalar still unwraps",
  valueOf("--color-primary") === "#7c3aed",
  `--color-primary = ${valueOf("--color-primary")}`,
);
check(
  "an unquoted value is untouched",
  valueOf("--color-accent") === "oklch(50% 0.08 75)",
  `--color-accent = ${valueOf("--color-accent")}`,
);
check(
  "a colour with no -content gets one derived",
  /--color-accent-content\s*:/.test(block),
  "no auto-derived ink for --color-accent",
);

if (failures) {
  console.log(`\n❌ theme-plugin: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\n✅ theme-plugin: a CSS-declared theme keeps its comma-separated values");
