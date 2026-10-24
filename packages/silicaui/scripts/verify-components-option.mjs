/**
 * `components:` is opt-in: absent, the plugin emits exactly what it always did.
 * Present, it emits the listed components in the SAME order, and `chunkmarkers`
 * only adds marker rules. Runs the real plugin through the real Tailwind compiler.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "tailwindcss";
import { COMPONENTS } from "../src/components/registry.js";

const here = resolve(import.meta.dirname, "..").split("\\").join("/");
const COLORS = "primary, secondary, accent, neutral, info, success, warning, error, brand";
let failures = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  if (!ok) { failures++; if (detail) console.log(`      ${detail}`); }
};

async function build(opts = "") {
  const source = `@plugin "${here}/src/index.js" { colors: ${COLORS}; ${opts} }`;
  const loadModule = async (id, base) => {
    const abs = id.startsWith(".") ? resolve(base, id) : id;
    const mod = await import(pathToFileURL(abs).href);
    return { module: mod.default ?? mod, base };
  };
  return (await compile(source, { base: here, loadModule })).build([]);
}

const all = COMPONENTS.map(([name]) => name);
const full = await build();
console.log("components option");
check("every registry name is unique", new Set(all).size === all.length);
check("listing every component equals the default output", (await build(`components: ${all.join(", ")};`)) === full);

const some = await build("components: button, card;");
check("a subset is far smaller than the full build", some.length < full.length / 5, `${some.length} vs ${full.length}`);
check("a subset keeps the listed components", some.includes(".btn") && some.includes(".card"));
check("a subset drops the others", !some.includes(".accordion") && !some.includes(".dialog"));
check("a subset keeps base tokens", some.includes("[data-theme") || some.includes("--color-base-100"));

const marked = await build("chunkmarkers: true;");
const stripped = marked
  .replace(/\.sui-chunk-[\w-]+\s*\{[^}]*\}/g, "")
  .replace(/@layer base\s*\{\s*\}/g, "");
check("markers appear once per component", (marked.match(/\.sui-chunk-/g) ?? []).length === all.length + 1);
check("markers are the only difference", stripped.replace(/\s+/g, "") === full.replace(/\s+/g, ""));
process.exit(failures ? 1 : 0);
