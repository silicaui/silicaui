/**
 * The CANVAS ATTRIBUTE-NAME contract — every attribute `sanitizeElement` can let
 * through renders on the React canvas under the name React actually wants.
 *
 * What this exists to catch, because nothing else could: a console-only defect
 * that no type, no lint rule and no e2e assertion sees. `node.attrs` carries real
 * HTML names (`autoplay`, `stroke-width`, `for`) because that is what `toHtml`
 * must emit; React wants `autoPlay`, `strokeWidth`, `htmlFor` and logs "Invalid
 * DOM property `autoplay`. Did you mean `autoPlay`?" for every mismatch. The
 * element still renders, so the builder LOOKS fine — the only symptom is a
 * console full of red in every host app embedding the canvas.
 *
 * It shipped exactly that way: `element.ts` allowed `<video autoplay playsinline>`
 * while `react-attrs.ts` translated neither, so opening any site with a hero
 * video logged two errors per Video node. The bug is a DRIFT bug — two lists
 * that have to agree and no reason for anyone editing one to look at the other —
 * so checking one instance would have been worthless. This checks the whole
 * allow-set, against React's own table, so the NEXT attribute added to element.ts
 * fails here instead of in a host's console.
 *
 * React's expectation is read out of the installed react-dom development bundle
 * (`possibleStandardNames`, the very table its warning is generated from) rather
 * than restated here — a copy would be one more list to drift.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { GLOBAL_ATTRS, RAW_ELEMENTS } from "@wizeworks/silicaui-html";
import { reactAttrName } from "./src/site/react/react-attrs";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

/**
 * React's `possibleStandardNames`, lifted from the dev bundle. It is an internal
 * object literal, not an export, so this brace-matches the one place it is
 * assigned. Absent (a React that renamed or dropped it) is a HARD failure, not a
 * silent skip: a probe that quietly checks nothing is worse than no probe.
 */
function reactStandardNames(): Map<string, string> {
  const require_ = createRequire(import.meta.url);
  // Resolved off the package manifest, not the file: react-dom's `exports` map
  // does not publish `./cjs/*`, so asking for the bundle directly throws.
  const pkg = require_.resolve("react-dom/package.json");
  const path = join(dirname(pkg), "cjs", "react-dom-client.development.js");
  const src = readFileSync(path, "utf8");
  const assign = src.indexOf("possibleStandardNames =");
  if (assign < 0) throw new Error("react-dom: `possibleStandardNames` not found in the dev bundle");
  const start = src.indexOf("{", assign);
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("react-dom: `possibleStandardNames` object never closed");
  const out = new Map<string, string>();
  for (const m of src.slice(start, end + 1).matchAll(/(?:"([^"]+)"|([A-Za-z_$][\w$]*)):\s*"([^"]+)"/g)) {
    out.set((m[1] ?? m[2]!).toLowerCase(), m[3]!);
  }
  if (out.size < 100) throw new Error(`react-dom: parsed only ${out.size} standard names — the shape changed`);
  return out;
}

/** Every attribute name `sanitizeElement` can emit: the global set plus each
 *  tag's own extras. (`aria-*`/`data-*` pass by prefix and are checked below.) */
function allowedAttrNames(): string[] {
  const names = new Set<string>(GLOBAL_ATTRS);
  for (const meta of RAW_ELEMENTS.values()) for (const a of meta.attrs ?? []) names.add(a);
  return [...names].sort();
}

const standard = reactStandardNames();
const allowed = allowedAttrNames();

console.log(`react-dom standard names: ${standard.size}; element.ts allow-set: ${allowed.length}`);

console.log("\nevery allowed attribute renders under the name React wants");
const wrong: string[] = [];
for (const name of allowed) {
  // React warns when the name it is HANDED differs from the standard spelling of
  // that name; a name it has never heard of is passed through untouched and is
  // fine (that is how `data-*` and the SVG-only names it omits work).
  const expected = standard.get(name.toLowerCase()) ?? reactAttrName(name);
  if (reactAttrName(name) !== expected) wrong.push(`${name} → ${reactAttrName(name)} (React wants ${expected})`);
}
check(`all ${allowed.length} allowed names`, wrong.length === 0, wrong.join("; "));

console.log("\nthe two attributes that shipped broken");
check("video autoplay", reactAttrName("autoplay") === "autoPlay", reactAttrName("autoplay"));
check("video playsinline", reactAttrName("playsinline") === "playsInline", reactAttrName("playsinline"));

console.log("\nhyphenated SVG presentation attributes camelize by rule");
for (const [html, react] of [
  ["stroke-width", "strokeWidth"],
  ["stroke-dasharray", "strokeDasharray"],
  ["clip-path", "clipPath"],
  ["stop-color", "stopColor"],
  ["dominant-baseline", "dominantBaseline"],
  ["letter-spacing", "letterSpacing"],
]) {
  check(`${html} → ${react}`, reactAttrName(html!) === react, reactAttrName(html!));
}

console.log("\ndata-*/aria-* stay hyphenated (React wants them verbatim)");
for (const name of ["data-sui-id", "data-sui-behavior-params", "aria-label", "aria-current"]) {
  check(name, reactAttrName(name) === name, reactAttrName(name));
}

console.log("\nnames React already agrees with are untouched");
for (const name of ["role", "hidden", "poster", "preload", "viewBox", "preserveAspectRatio", "gradientUnits"]) {
  check(name, reactAttrName(name) === name, reactAttrName(name));
}

console.log(failures === 0 ? "\nOK" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
