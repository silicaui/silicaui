// CSP regression probe: the static HTML projection must contain ZERO inline
// styling — no `style="…"` attributes, no `<style>` elements — so published
// output runs under `style-src` without 'unsafe-inline'. Continuous values must
// be bucketed to literal utility classes (see Progress / RadialProgress in
// component.ts for the canonical technique). Policy: docs/csp-compatibility.md.
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build && node verify-csp.mjs`.
import { toHtml, listComponents } from "./dist/index.js";
import { listBlocks } from "./dist/blocks/index.js";

let failures = 0;
const check = (label, html) => {
  const styleAttr = html.match(/style="/);
  const styleTag = html.match(/<style\b/i);
  if (styleAttr || styleTag) {
    failures++;
    const kind = styleAttr ? 'style="…" attribute' : "<style> element";
    const at = html.indexOf(styleAttr ? 'style="' : "<style");
    console.error(`  ✗ ${label}: inline ${kind}`);
    console.error(`    …${html.slice(Math.max(0, at - 60), at + 80)}…`);
  }
};

// Every registered ComponentDef, rendered bare — enough to trigger each macro's
// default expansion (the golden corpus covers prop-driven branches; a macro that
// only emits inline style under specific props should add a case below).
for (const def of listComponents()) {
  check(`component:${def.name}`, toHtml({ kind: "component", component: def.name }));
}

// Prop-driven branches known to tempt inline styles — continuous values and the
// one historical offender (Embed's macro-built iframe, fixed 2026-07-18).
const CASES = [
  ["Progress@70", { kind: "component", component: "Progress", props: { value: 70 } }],
  ["RadialProgress@37", { kind: "component", component: "RadialProgress", props: { value: 37 } }],
  ["Embed@youtube", { kind: "component", component: "Embed", props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } }],
  ["Video", { kind: "component", component: "Video", props: { src: "/v.mp4", poster: "/p.png", controls: true } }],
];
for (const [label, node] of CASES) check(`case:${label}`, toHtml(node));

// Every registered block — the whole marketing library.
for (const blk of listBlocks()) check(`block:${blk.key}`, toHtml(blk));

if (failures) {
  console.error(`\n❌ csp: ${failures} inline-style occurrence(s) in static output`);
  process.exit(1);
}
console.log("✅ csp: no style attributes or <style> elements in any component/block output");
