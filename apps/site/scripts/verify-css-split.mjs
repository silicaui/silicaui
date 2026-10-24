/**
 * Probe over the built export: how much CSS blocks first paint, and does that CSS still
 * cover every class the page's markup uses? Run after `split-css.mjs`.
 *   node scripts/verify-css-split.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { classesIn, classesInHtml } from "./css-split-lib.mjs";

const OUT = new URL("../out/", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const BUDGET = Number(process.env.CSS_BLOCKING_BUDGET ?? 230_000);
const KEY = ["/", "/docs/components/metadata-list/", "/docs/components/tabs/", "/docs/components/stat/", "/docs/components/button/"];

const pages = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n.startsWith("_") ? [] : pages(p);
    return n === "index.html" ? [p] : [];
  });

const fullCss = (() => {
  const dir = join(OUT, "_next/static/css");
  return readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8")).join("");
})();
const fullClasses = classesIn(fullCss);

function blocking(html) {
  const hrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)].map((m) => m[1]);
  return hrefs.map((h) => readFileSync(join(OUT, h), "utf8")).join("");
}

function inspect(path) {
  const html = readFileSync(path, "utf8");
  const css = blocking(html);
  const have = classesIn(css);
  const missing = [...classesInHtml(html)].filter((c) => fullClasses.has(c) && !have.has(c));
  return { raw: css.length, gz: gzipSync(css).length, missing };
}

let failures = 0;
console.log("Render-blocking CSS per page");
for (const path of pages(OUT)) {
  const url = "/" + path.slice(OUT.length).split("\\").join("/").replace(/index.html$/, "");
  const r = inspect(path);
  const bad = r.raw > BUDGET || r.missing.length > 0;
  if (bad) failures++;
  if (bad || KEY.includes(url)) console.log(`  ${bad ? "✗" : "✓"} ${url.padEnd(38)} ${String(r.raw).padStart(7)} B  gzip ${String(r.gz).padStart(6)} B${r.missing.length ? `  missing: ${r.missing.slice(0, 6)}` : ""}`);
}
console.log(failures ? `${failures} pages over ${BUDGET} B or missing classes` : `all pages under ${BUDGET} B and fully covered`);
process.exit(failures ? 1 : 0);
