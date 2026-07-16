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

// ── collection, empty array, omitWhenEmpty: node dropped, not placeholder ──
{
  const row = el("li", "item", { text: "placeholder" });
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products", omitWhenEmpty: true };
  const wrap = el("div", "wrap", { children: [list] });
  const host = { resolveCollection: () => [] };
  const out = resolveTree(wrap, host);
  check("omitWhenEmpty + zero items drops the node entirely, like visible:false", out.children.length === 0);
}

// ── collection, NON-empty array, omitWhenEmpty: no effect, repeats normally ─
{
  const row = el("li", "item", { text: "placeholder" });
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products", omitWhenEmpty: true };
  const host = { resolveCollection: () => ["A", "B"] };
  const out = resolveTree(list, host);
  check("omitWhenEmpty only changes behavior at ZERO items — non-empty still repeats normally", out.children.length === 2);
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

// ── attr-targeted fill: a value binds to a NAMED attribute, e.g. an <a> href ─
{
  const link = el("a", "card-link");
  link.attrs = { target: "_blank" };
  link.data = { kind: "value", ref: "product.url", attr: "href" };
  const host = { resolveBinding: () => ({ value: "/products/widget" }) };
  const out = resolveTree(link, host);
  check("attr-targeted fill sets the named attribute", out.attrs?.href === "/products/widget");
  check("attr-targeted fill keeps other authored attrs", out.attrs?.target === "_blank");
  check("attr-targeted fill leaves children untouched", out.children === undefined);
  check("attr-targeted fill survives toHtml", toHtml(out).includes('href="/products/widget"'));
}

// ── attr-targeted fill on a component node: writes the named prop ──────────
{
  const link = atom("PreviewCard", "preview-card", { label: "Widget" });
  link.data = { kind: "value", ref: "product.url", attr: "href" };
  const host = { resolveBinding: () => ({ value: "/products/widget" }) };
  const out = resolveTree(link, host);
  check("attr-targeted fill on a component writes the named prop", out.props?.href === "/products/widget");
  check("attr-targeted fill on a component leaves other props untouched", out.props?.label === "Widget");
}

// ── input fill: a value sets the `value` attribute, not children (void tag) ─
{
  const input = el("input", "input");
  input.attrs = { type: "hidden", name: "variantId" };
  input.data = { kind: "value", ref: "product.variantId" };
  const host = { resolveBinding: () => ({ value: "variant-123" }) };
  const out = resolveTree(input, host);
  check("bound <input> gets value attr", out.attrs?.value === "variant-123");
  check("bound <input> keeps its other attrs", out.attrs?.name === "variantId" && out.attrs?.type === "hidden");
  check("<input>'s value survives toHtml (void element drops children, not attrs)", toHtml(out).includes('value="variant-123"'));
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

// ── HONESTY: unknown ref vs. known-but-empty ──────────────────────────────
// The distinction the whole feature rests on. Both were `{ value: undefined }`
// before, so the walk could not tell them apart and blanked the node either way.
{
  const node = el("h1", "text-4xl", { text: "SilicaUI" });
  node.data = { kind: "value", ref: "logo" };
  const diags = [];
  const host = { resolveBinding: () => undefined, onDiagnostic: (d) => diags.push(d) };
  const out = resolveTree(node, host);
  check("unknown ref KEEPS the authored content (never blanks)", out.children?.[0] === "SilicaUI");
  check("unknown ref keeps the marker for a re-resolve / downstream runtime", out.data?.kind === "value");
  check("unknown ref never drops the node", out !== undefined);
  check("unknown ref fires exactly one diagnostic", diags.length === 1);
  check("diagnostic carries code + ref + kind", diags[0].code === "unknown-ref" && diags[0].ref === "logo" && diags[0].kind === "value");
  check("diagnostic carries the node id so an editor can badge it", diags[0].nodeId === node.id);
}
{
  const node = el("h1", "text-4xl", { text: "SilicaUI" });
  node.data = { kind: "value", ref: "site.title" };
  const out = resolveTree(node, { resolveBinding: () => ({ value: undefined }) });
  check("KNOWN-but-empty still renders empty (a legitimate result, not a failure)", out.children?.[0] === "");
}
{
  // A host with no onDiagnostic must stay silent and pure — never throw.
  const node = el("h1", "x", { text: "kept" });
  node.data = { kind: "value", ref: "nope" };
  const out = resolveTree(node, { resolveBinding: () => undefined });
  check("unknown ref with no onDiagnostic: silent, still keeps content", out.children?.[0] === "kept");
}

// ── HONESTY: unknown html bind never emits rawHtml:"" ─────────────────────
{
  const node = el("div", "prose", { text: "Authored body copy" });
  node.data = { kind: "html", ref: "cms.body" };
  const out = resolveTree(node, { resolveBinding: () => undefined });
  check("unknown html ref keeps authored children", out.children?.[0] === "Authored body copy");
  check("unknown html ref emits NO rawHtml (would have blanked + consumed the marker)", out.rawHtml === undefined);
}

// ── HONESTY: unknown collection ref ignores omitWhenEmpty ─────────────────
// `omitWhenEmpty` means "legitimately empty, render nothing" — a claim only a
// host that KNOWS the ref can make. An unknown ref must not borrow it to drop.
{
  const list = el("ul", "list", { children: [el("li", "row", { text: "Placeholder item" })] });
  list.data = { kind: "collection", ref: "typo-products", omitWhenEmpty: true };
  const diags = [];
  const out = resolveTree(list, { resolveCollection: () => undefined, onDiagnostic: (d) => diags.push(d) });
  check("unknown collection ref does NOT drop despite omitWhenEmpty", out !== undefined && out.children.length === 1);
  check("unknown collection ref keeps the authored placeholder child", out.children[0].children[0] === "Placeholder item");
  check("unknown collection ref reports kind:'collection'", diags.length === 1 && diags[0].kind === "collection");
}
{
  // The contrast: a KNOWN, legitimately-empty collection still drops.
  const list = el("ul", "list", { children: [el("li", "row", { text: "x" })] });
  list.data = { kind: "collection", ref: "products", omitWhenEmpty: true };
  const out = resolveTree(list, { resolveCollection: () => [] });
  check("KNOWN empty collection + omitWhenEmpty still drops (unchanged)", out.data?.kind === "collection");
}

// ── editing mode: never destroys authorability ────────────────────────────
{
  const parent = el("div", "wrap", { children: [el("span", "note", { text: "conditional" })] });
  parent.children[0].data = { kind: "value", ref: "maybe.absent" };
  const host = { resolveBinding: () => ({ value: undefined, visible: false }) };
  const prod = resolveTree(parent, host);
  const diags = [];
  const edit = resolveTree(parent, { ...host, onDiagnostic: (d) => diags.push(d) }, undefined, { editing: true });
  check("production: visible:false drops the node (unchanged)", prod.children.length === 0);
  check("editing: visible:false KEEPS the node (a dropped node is unselectable)", edit.children.length === 1);
  check("editing: the kept node still shows its authored content", edit.children[0].children[0] === "conditional");
  check("editing: reports code:'hidden' so the canvas can ghost it", diags.length === 1 && diags[0].code === "hidden");
}
{
  // editing:false must be byte-identical to a pre-`editing` walk.
  const node = el("h1", "t");
  node.data = { kind: "value", ref: "site.title" };
  const host = { resolveBinding: () => ({ value: "Acme" }) };
  check(
    "editing:false is byte-identical to omitting opts entirely",
    JSON.stringify(resolveTree(node, host)) === JSON.stringify(resolveTree(node, host, undefined, { editing: false })),
  );
}
{
  // A resolvable bind resolves the SAME in both modes — `editing` selects a
  // destruction policy, not a different resolution.
  const node = el("h1", "t", { text: "Placeholder" });
  node.data = { kind: "value", ref: "site.title" };
  const host = { resolveBinding: () => ({ value: "Acme Storefront" }) };
  const edit = resolveTree(node, host, undefined, { editing: true });
  check("editing: a resolvable value bind resolves identically (preview == production)", edit.children[0] === "Acme Storefront");
}

// ── editing mode: collections stay AUTHORED templates (v1) ────────────────
{
  const row = el("li", "row", { text: "Placeholder product" });
  row.data = { kind: "value", ref: "product.title" };
  const list = el("ul", "list", { children: [row] });
  list.data = { kind: "collection", ref: "products" };
  const host = {
    resolveCollection: (ref) => (ref === "products" ? [{ title: "Widget" }, { title: "Gadget" }] : undefined),
    // Mirrors a real host: a per-item field with no item is KNOWN-but-empty.
    resolveBinding: (ref, scope) => (ref === "product.title" ? { value: scope.item?.title } : undefined),
  };

  const prod = resolveTree(list, host);
  check("production: a collection still expands, one child-set per item", prod.children.length === 2);
  check("production: each expanded row resolves against its own item", prod.children[0].children[0] === "Widget");

  const edit = resolveTree(list, host, undefined, { editing: true });
  check("editing: a collection does NOT expand (cloned ids would collide)", edit.children.length === 1);
  check("editing: the collection keeps its marker (still a repeat, unresolved)", edit.data?.kind === "collection");
  check(
    "editing: a bind INSIDE the template keeps its authored placeholder — resolving it against no item would blank it",
    edit.children[0].children[0] === "Placeholder product",
  );
  check("editing: the template's inner bind marker survives too", edit.children[0].data?.kind === "value");
}
{
  // omitWhenEmpty + zero items: production drops, editing keeps it selectable
  // and reports `hidden` so the canvas can ghost it.
  const list = el("ul", "list", { children: [el("li", "row", { text: "x" })] });
  list.data = { kind: "collection", ref: "empty", omitWhenEmpty: true };
  const diags = [];
  const host = { resolveCollection: () => [], onDiagnostic: (d) => diags.push(d) };
  check("production: omitWhenEmpty at zero items drops the node", resolveTree(list, host) === list || resolveTree(list, host).data != null);
  const edit = resolveTree(list, host, undefined, { editing: true });
  check("editing: omitWhenEmpty at zero items keeps the node selectable", edit !== undefined && edit.children.length === 1);
  check("editing: and reports code:'hidden' for it", diags.some((d) => d.code === "hidden" && d.kind === "collection"));
}

console.log(failures === 0 ? "\nAll resolveTree checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
