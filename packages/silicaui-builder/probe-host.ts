/**
 * Isolated proof for HOST NODES (host-nodes-and-node-locking spec §A) — no React,
 * no DOM. Covers the whole seam below the UI: the `toHtml` mount-point projection,
 * traversal passthrough (flatten/resolve), the engine leaf rules (selectable,
 * drop-BESIDE not into, setProp), the palette conversion (`hostComponentGroups`/
 * `catalogForHost`), and the pinned → host-locked → non-deletable composition.
 */
import { Editor, acceptsChildren } from "./src/site/engine";
import { hostComponentGroups, catalogForHost, paletteGroups } from "./src/site/palette";
import type { HostComponentDef } from "./src/site/react/host";
import { el, host, stampTree, toHtml, flattenSymbols, resolveTree } from "@wizeworks/silicaui-html";
import type { Node, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
const theme: Theme = { name: "test", tokens: {} };
function find(root: Node, pred: (n: Node) => boolean): Node | undefined {
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (pred(n)) return n;
    if (n.kind !== "outlet") for (const c of n.children ?? []) if (typeof c !== "string") stack.push(c);
  }
  return undefined;
}
const idOf = (n: Node | undefined): string | undefined => (n && n.kind !== "outlet" ? n.id : undefined);
const lockedOf = (n: Node | undefined): unknown => (n && n.kind !== "outlet" ? n.locked : undefined);

// ── 1. projection: an empty, prop-carrying mount point ───────────────────────
console.log("toHtml projects an empty mount point");
{
  check("bare mount point", toHtml(host("Foo")) === `<div data-sui-host="Foo"></div>`);
  check(
    "class + escaped props",
    toHtml(host("CheckoutWidget", "my-4", { cartId: "c_1", n: 2 })) ===
      `<div class="my-4" data-sui-host="CheckoutWidget" data-sui-host-props="{&quot;cartId&quot;:&quot;c_1&quot;,&quot;n&quot;:2}"></div>`,
  );
  check("no children ever emitted", !toHtml(host("Foo", "", { a: 1 })).includes("</div><"));
  check("ids: emits data-sui-id", toHtml(stampTree(host("Bar")), { ids: true }).includes("data-sui-id="));
  check("component-class prefixing still applies to the wrapper", toHtml(host("Baz", "btn"), { prefix: "st-" }).includes(`class="st-btn"`));
}

// ── 2. traversal passthrough (kind-agnostic) ─────────────────────────────────
console.log("flatten + resolve pass a host node through untouched");
{
  const n = host("Q", "z", { a: 1 });
  check("flattenSymbols returns it unchanged", JSON.stringify(flattenSymbols(n, {})) === JSON.stringify(n));
  const resolved = resolveTree(n, { resolveBinding: () => ({ value: "X" }) });
  check("resolveTree leaves it a host node", resolved.kind === "host" && (resolved as { component?: string }).component === "Q");
}

// ── 3. engine: a host node is a selectable LEAF ──────────────────────────────
console.log("engine treats a host node as a selectable leaf");
{
  const root = stampTree(el("div", "page", { children: [el("section", "card", { children: [el("p", "", { text: "x" })] })] }));
  const ed = new Editor({ version: "1", root, theme });
  const sectionId = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"))!;
  const hostId = ed.insert(host("Widget", "block", { a: 1 }), sectionId)!;
  check("insert into a container returns an id + selects it", typeof hostId === "string" && ed.selection === hostId);
  const hostNode = ed.node(hostId)!;
  check("the inserted node is a host node", hostNode.kind === "host");
  check("acceptsChildren(host) is false (a leaf)", acceptsChildren(hostNode) === false);
  // Insert INTO a host is refused (not a container)…
  check("insert INTO a host is refused", ed.insert(el("span"), hostId) === undefined);
  // …but insertRelative lands BESIDE it (a sibling in the section).
  const sibId = ed.insertRelative(el("p", "", { text: "beside" }), hostId)!;
  const section = find(ed.extract().root, (n) => idOf(n) === sectionId) as { children?: Node[] };
  const kids = section.children ?? [];
  const hostIdx = kids.findIndex((c) => typeof c !== "string" && idOf(c) === hostId);
  const sibIdx = kids.findIndex((c) => typeof c !== "string" && idOf(c) === sibId);
  check("the sibling landed BESIDE the host (next index), never inside", sibIdx === hostIdx + 1);
  check("the host stayed a childless leaf", (hostNode as { children?: unknown }).children === undefined);
  // setProp writes host props.
  ed.setProp(hostId, "a", 42);
  check("setProp writes a host prop", (ed.node(hostId) as { props?: Record<string, unknown> }).props?.a === 42);
}

// ── 4. palette conversion ────────────────────────────────────────────────────
console.log("host components become palette items");
{
  const defs: HostComponentDef[] = [
    { name: "PriceTag", label: "Price Tag", category: "Commerce", props: [{ name: "amount", type: "number" }], defaultProps: { amount: 5 } },
    { name: "Checkout", label: "Checkout", defaultClass: "block", pinned: true },
  ];
  const groups = hostComponentGroups(defs);
  check("grouped by category", groups.length === 2 && groups.some((g) => g.label === "Commerce") && groups.some((g) => g.label === "Host"));
  const priceItem = groups.flatMap((g) => g.items).find((i) => i.key === "host:PriceTag")!;
  const priceNode = priceItem.make();
  check("make() builds a HostNode with defaultProps", priceNode.kind === "host" && (priceNode as { props?: Record<string, unknown> }).props?.amount === 5);
  check("an un-pinned node is unlocked", lockedOf(priceNode) === undefined);
  const checkoutNode = groups.flatMap((g) => g.items).find((i) => i.key === "host:Checkout")!.make();
  check("a pinned def stamps locked:'host' + default class", lockedOf(checkoutNode) === "host" && (checkoutNode as { class?: string }).class === "block");

  const merged = catalogForHost(paletteGroups(), { hostComponents: () => defs });
  check("catalogForHost appends the host groups", merged.some((g) => g.items.some((i) => i.key === "host:PriceTag")));
  check("built-in groups survive the merge", merged.some((g) => g.key === "layout"));
}

// ── 5. pinned host node is non-deletable (Feature A + B compose) ─────────────
console.log("a pinned host node inserts non-deletable");
{
  const root = stampTree(el("div", "page", { children: [el("section", "card", { children: [el("p", "", { text: "x" })] })] }));
  const ed = new Editor({ version: "1", root, theme });
  const sectionId = idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"))!;
  const pinned = hostComponentGroups([{ name: "Checkout", label: "Checkout", pinned: true }])[0]!.items[0]!.make();
  const hostId = ed.insert(pinned, sectionId)!;
  check("inserted host is host-locked", lockedOf(ed.node(hostId)) === "host");
  ed.remove(hostId);
  check("a pinned host node survives remove()", !!ed.node(hostId));
}

console.log(failures === 0 ? "\nALL HOST-NODE PROBES PASSED" : `\n${failures} HOST-NODE PROBE(S) FAILED`);
if (failures) process.exit(1);
