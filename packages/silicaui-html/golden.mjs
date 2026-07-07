// Golden byte-identical snapshot for the HTML projection. Locks the EXACT markup
// every component atom + element + metadata lowering produces, across the plain /
// prefixed / ids render variants, plus the three real blocks.
//
//   node golden.mjs           → verify current output matches the committed fixture
//   node golden.mjs --write   → (re)capture the fixture (only after an INTENDED change)
//
// Run against built output: `pnpm --filter silicaui-html build && node golden.mjs`.
// This exists to prove the ComponentDef/expand refactor is behavior-preserving:
// capture on the old code, refactor, rebuild, verify — zero diff.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toHtml } from "./dist/index.js";
import { faqAccordion, featureGrid, heroSplitCta } from "./dist/blocks/index.js";

const FIXTURE = fileURLToPath(new URL("./golden.fixture.txt", import.meta.url));

// Raw node builders — bypass the kit so we can plant ids + every metadata marker
// and every atom-specific prop precisely, including the pathological edges.
const c = (component, extra = {}) => ({ kind: "component", component, ...extra });
const e = (tag, extra = {}) => {
  const { text, ...rest } = extra;
  const node = { kind: "element", tag, ...rest };
  if (text != null && node.children == null) node.children = [text];
  return node;
};

// A synthetic tree exercising every atom, every render branch, and every edge.
const synthetic = e("section", {
  class: "wrap card",
  attrs: { "data-role": "root", hidden: false, tabindex: 0, "aria-live": true },
  children: [
    // ── Button: button (default type + label fallback), button (explicit type +
    //    children), anchor (href + label), + metadata (id/action) ──
    c("Button", { class: "btn btn-primary", props: { label: "Save & go >" } }),
    c("Button", { class: "btn", props: { type: "submit" }, children: [e("span", { text: "Submit" })] }),
    c("Button", { class: "btn btn-ghost", props: { href: "/pricing", label: "Pricing" } }),
    c("Button", {
      id: "b1",
      class: "btn",
      props: { label: "Buy" },
      data: { kind: "action", ref: "checkout", href: "/buy" },
    }),
    // ── Image: full, bare defaults, ratio-only-no-class, portrait ──
    c("Image", { class: "rounded-box w-full", props: { src: "/a.png", alt: "A photo", ratio: "wide" } }),
    c("Image", { props: {} }),
    c("Image", { props: { ratio: "square" } }),
    c("Image", { class: "shadow", props: { src: "/p.png", alt: 'Quote "x" & <b>', ratio: "portrait" } }),
    // ── Heading: explicit, default, clamp-high, clamp-low, children vs text ──
    c("Heading", { class: "text-4xl", props: { level: 1, text: "Title" } }),
    c("Heading", { props: { text: "Default level" } }),
    c("Heading", { props: { level: 9, text: "Clamped high" } }),
    c("Heading", { props: { level: 0, text: "Clamped low" } }),
    c("Heading", { props: { level: 3 }, children: [e("em", { text: "Rich" })] }),
    // ── Simple element atoms: text fallback, children, empty ──
    c("Text", { class: "prose", props: { text: "A paragraph & more <tags>" } }),
    c("Text", { children: [c("Badge", { class: "badge", props: { text: "New" } })] }),
    c("Text", {}),
    c("Badge", { class: "badge badge-accent", props: { text: "Hot" } }),
    c("Card", { class: "card", children: [c("Heading", { props: { text: "In card" } })] }),
    c("Section", { class: "py-8", props: { text: "Sec" } }),
    c("Container", { class: "container", props: { text: "Cont" } }),
    c("Grid", { class: "grid grid-cols-2", children: [c("Stack", { class: "stack", props: { text: "S" } })] }),
    // ── Icon: name, no name, with class ──
    c("Icon", { props: { name: "sparkles" } }),
    c("Icon", {}),
    c("Icon", { class: "size-6 text-primary", props: { name: "check" } }),
    // ── Divider: with class, bare ──
    c("Divider", { class: "divider" }),
    c("Divider", {}),
    // ── Form controls: Input (type + attrs + bool), default; Textarea (rows +
    //    empty-children edge, then text value w/ esc); Select (options object +
    //    string mix, empty, child-override); Checkbox/Radio/Toggle (checked/value/
    //    disabled); Field + Form containers ──
    c("Input", { class: "input", props: { type: "email", name: "email", placeholder: "you@x.com", required: true } }),
    c("Input", { props: {} }),
    c("Textarea", { class: "textarea", props: { placeholder: "Bio", rows: 4 }, children: [] }),
    c("Textarea", { props: { text: "Preset & <val>" } }),
    c("Select", { class: "select", props: { name: "n", options: [{ value: "a", label: "A" }, { value: "b", label: "B & C" }, "plain"] } }),
    c("Select", { props: { options: [] } }),
    c("Select", { class: "select", children: [e("option", { attrs: { value: "x" }, text: "X" })] }),
    c("Checkbox", { class: "checkbox", props: { name: "agree", checked: true } }),
    c("Radio", { class: "radio", props: { name: "r", value: "1" } }),
    c("Toggle", { class: "toggle", props: { name: "t", disabled: true } }),
    c("Field", { class: "field", children: [e("label", { class: "field-label", text: "Name" }), c("Input", { class: "input", props: {} })] }),
    c("Form", { class: "flex", children: [c("Button", { class: "btn", props: { label: "Go", type: "submit" } })] }),
    // ── Metadata lowering across every DataBinding + behavior + part ──
    e("div", { id: "n1", class: "menu", data: { kind: "value", ref: "user.name" } }),
    e("ul", { id: "n2", data: { kind: "collection", ref: "items" }, children: [e("li", { text: "x" })] }),
    e("a", { class: "link", data: { kind: "action", ref: "open", href: "/o" }, text: "Open" }),
    c("Card", {
      id: "car",
      class: "carousel",
      behavior: { type: "carousel", params: { loop: true, per: 2 } },
      children: [c("Card", { class: "slide", part: "slide", props: { text: "1" } })],
    }),
    // ── Text-vs-children fallback edge: empty children array + text prop ──
    c("Text", { class: "edge", children: [], props: { text: "fallback wins" } }),
  ],
});

function renderCorpus() {
  const parts = [];
  const push = (label, html) => parts.push(`### ${label}\n${html}`);
  for (const [name, blk] of [["hero", heroSplitCta], ["faq", faqAccordion], ["feat", featureGrid]]) {
    push(`block:${name}:plain`, toHtml(blk));
    push(`block:${name}:prefix`, toHtml(blk, { prefix: "st-" }));
    push(`block:${name}:ids`, toHtml(blk, { ids: true }));
  }
  push("synthetic:plain", toHtml(synthetic));
  push("synthetic:prefix", toHtml(synthetic, { prefix: "st-" }));
  push("synthetic:ids", toHtml(synthetic, { ids: true }));
  return parts.join("\n\n");
}

const out = renderCorpus();

if (process.argv.includes("--write")) {
  writeFileSync(FIXTURE, out, "utf8");
  console.log(`✓ wrote golden fixture (${out.length} bytes) → golden.fixture.txt`);
  process.exit(0);
}

let expected;
try {
  expected = readFileSync(FIXTURE, "utf8");
} catch {
  console.error("✗ no golden.fixture.txt — run `node golden.mjs --write` first");
  process.exit(1);
}

if (out === expected) {
  console.log("✅ golden: HTML projection is byte-identical to the fixture");
  process.exit(0);
}

// Minimal first-diff report.
const a = expected;
const b = out;
let i = 0;
while (i < a.length && i < b.length && a[i] === b[i]) i++;
const ctx = 80;
console.error("❌ golden: output DIFFERS from fixture");
console.error(`first diff at byte ${i} (expected ${a.length} bytes, got ${b.length})`);
console.error("expected: …" + JSON.stringify(a.slice(Math.max(0, i - ctx), i + ctx)));
console.error("actual:   …" + JSON.stringify(b.slice(Math.max(0, i - ctx), i + ctx)));
process.exit(1);
