// Runnable proof of resolveTree (§3, the Q3/Q19 keystone). Run against the
// built output: `pnpm --filter @wizeworks/silicaui-html build && node verify-resolve.mjs`.
import { el, atom, toHtml, resolveTree } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

// ── absent host: zero-cost identity ────────────────────────────────────────
{
  const tree = el("div", "card", { text: "static" });
  const out = resolveTree(tree, {});
  check("absent host returns the tree unchanged (identity)", out === tree);
}

// ── value bind: fills text, strips the marker ──────────────────────────────
{
  const node = el("h1", "text-4xl");
  node.data = { kind: "value", ref: "site.title" };
  const host = { resolveBinding: (ref) => ({ value: `Resolved: ${ref}` }) };
  const out = resolveTree(node, host);
  check("value bind fills text content", out.children?.[0] === "Resolved: site.title");
  check("value bind strips the data marker", out.data === undefined);
  check("toHtml on the resolved tree carries no data-sui-bind", !toHtml(out).includes("data-sui-bind"));
}

// ── value bind, no resolver supplied: placeholder renders unchanged ────────
{
  const node = el("h1", "text-4xl", { text: "Placeholder headline" });
  node.data = { kind: "value", ref: "site.title" };
  const out = resolveTree(node, { resolveCollection: () => [] }); // resolveBinding absent
  check("no resolveBinding: placeholder text unchanged", out.children?.[0] === "Placeholder headline");
  check("no resolveBinding: marker survives for a downstream runtime", out.data?.kind === "value");
}

// ── value bind, visible:false: node dropped from output ────────────────────
{
  const parent = el("div", "wrap", { children: [el("span", "note", { text: "shown when present" })] });
  parent.children[0].data = { kind: "value", ref: "maybe.absent" };
  const host = { resolveBinding: () => ({ value: undefined, visible: false }) };
  const out = resolveTree(parent, host);
  check("visible:false drops the node from resolved output", out.children.length === 0);
}

// ── collection: repeats children once per item, threads item+index ─────────
{
  const row = el("li", "item", { text: "placeholder" });
  row.data = { kind: "value", ref: "item.title" };
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products" };
  const host = {
    resolveCollection: (ref) => (ref === "products" ? ["A", "B", "C"] : []),
    resolveBinding: (ref, scope) => (ref === "item.title" ? { value: `${scope.item}#${scope.index}` } : { value: "" }),
  };
  const out = resolveTree(list, host);
  check("collection materializes N children", out.children.length === 3);
  check("collection strips its own marker", out.data === undefined);
  check("nested bind sees the threaded item+index", out.children.map((c) => c.children[0]).join(",") === "A#0,B#1,C#2");
}

// ── collection, empty array: one placeholder item, not zero ────────────────
{
  const row = el("li", "item", { text: "placeholder" });
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products" };
  const host = { resolveCollection: () => [] };
  const out = resolveTree(list, host);
  check("empty collection renders exactly one placeholder item", out.children.length === 1);
  check("placeholder item is the authored template, untouched", out.children[0].children[0] === "placeholder");
}

// ── collection, no resolver supplied: placeholder renders unchanged ────────
{
  const row = el("li", "item", { text: "placeholder" });
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products" };
  const out = resolveTree(list, { resolveBinding: () => ({ value: "" }) }); // resolveCollection absent
  check("no resolveCollection: authored children render once, unchanged", out.children.length === 1 && out.data?.kind === "collection");
}

// ── action: never touched, stays inert ──────────────────────────────────────
{
  const btn = atom("Button", "btn btn-primary", { label: "Add to cart" });
  btn.data = { kind: "action", ref: "commerce.addToCart" };
  const host = { resolveBinding: () => ({ value: "SHOULD NOT BE CALLED" }) };
  const out = resolveTree(btn, host);
  check("action node's marker survives untouched", out.data?.kind === "action" && out.data.ref === "commerce.addToCart");
  check("action node's props are untouched", out.props?.label === "Add to cart");
}

// ── image fill: a string value sets src on <img>, not text content ─────────
{
  const img = el("img", "rounded-box");
  img.data = { kind: "value", ref: "product.image" };
  const host = { resolveBinding: () => ({ value: "https://example.com/p.jpg" }) };
  const out = resolveTree(img, host);
  check("string value on <img> sets src, not children", out.attrs?.src === "https://example.com/p.jpg" && !out.children);
}

// ── nested repeats: inner collection resolves against the outer item scope ─
{
  const innerItem = el("li", "review", { text: "placeholder review" });
  innerItem.data = { kind: "value", ref: "review.text" };
  const innerList = el("ul", "reviews", { children: [innerItem] });
  innerList.data = { kind: "collection", ref: "reviews" };
  const outerCard = el("div", "product", { children: [innerList] });
  outerCard.data = undefined;
  const outerList = el("div", "products", { children: [outerCard] });
  outerList.data = { kind: "collection", ref: "products" };

  const products = { A: ["r1", "r2"], B: ["r3"] };
  const host = {
    resolveCollection: (ref, scope) => (ref === "products" ? ["A", "B"] : ref === "reviews" ? products[scope.item] : []),
    resolveBinding: (ref, scope) => (ref === "review.text" ? { value: `${scope.item}` } : { value: "" }),
  };
  const out = resolveTree(outerList, host);
  check("nested repeat: 2 outer products", out.children.length === 2);
  check("nested repeat: product A has 2 reviews", out.children[0].children[0].children.length === 2);
  check("nested repeat: product B has 1 review", out.children[1].children[0].children.length === 1);
  check(
    "nested repeat: inner bind resolves against ITS OWN item, not the outer's",
    out.children[0].children[0].children[0].children[0] === "r1",
  );
}

console.log(failures === 0 ? "\nAll resolveTree checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
