/**
 * Isolated proof for HOST NODES (host-nodes-and-node-locking spec §A) — no React,
 * no DOM. Covers the whole seam below the UI: the `toHtml` mount-point projection,
 * traversal passthrough (flatten/resolve), the engine leaf rules (selectable,
 * drop-BESIDE not into, setProp), the palette conversion (`hostComponentGroups`/
 * `catalogForHost`), and the pinned → host-locked → non-deletable composition.
 */
import { Editor, acceptsChildren } from "./src/site/engine";
import { hostComponentGroups, catalogForHost, paletteGroups, makeInsertNode } from "./src/site/palette";
import { nodeIconName, nodeName, nodeTypeLabel } from "./src/site/node-display";
import type { HostDisplayLookup } from "./src/site/node-display";
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

// ── 4b. the row carries the WHOLE def, not four fields of it ─────────────────
// Everything below is invisible to any assertion about trees or rendered HTML —
// it lives in how the palette and inspector READ a def — which is why it once
// shipped past a full render sweep. Probing it here is the cheap half; the e2e
// spec covers the same ground through the real chrome.
console.log("a host component is a first-class palette row");
{
  const warnings: string[] = [];
  const realWarn = console.warn;
  console.warn = (msg: string) => void warnings.push(String(msg));

  const defs: HostComponentDef[] = [
    { name: "site.map", label: "Store map", category: "Media", icon: "image", hint: "Where to find us." },
    { name: "site.reel", label: "Reel", category: "Media", icon: "no-such-icon" },
    { name: "site.bare", label: "Bare", category: "Video & Maps" },
  ];
  const base = paletteGroups();
  const groups = hostComponentGroups(defs, base);
  const item = (key: string) => groups.flatMap((g) => g.items).find((i) => i.key === key);

  check("icon is READ from the def", item("host:site.map")?.icon === "image");
  check("hint reaches the row (tooltip + search)", item("host:site.map")?.hint === "Where to find us.");
  check("an unknown icon falls back to the plug", item("host:site.reel")?.icon === "plug");
  check(
    "…and says so once, naming the icon",
    warnings.filter((w) => w.includes("no-such-icon")).length === 1,
  );
  check("no icon at all is still the plug", item("host:site.bare")?.icon === "plug");

  // `category` is display copy: one that NAMES a built-in shelf merges into it
  // rather than opening a second section with an identical heading.
  check("a category matching a built-in group reuses its key", groups.some((g) => g.key === "media"));
  check("…and does NOT mint a parallel hostcat group", !groups.some((g) => g.key === "hostcat:media"));
  const own = groups.find((g) => g.key === "hostcat:video-&-maps");
  check("an unmatched category opens its own group, labelled verbatim", own?.label === "Video & Maps");

  const mergedGroups = catalogForHost(base, { hostComponents: () => defs });
  const media = mergedGroups.filter((g) => g.label === "Media");
  check("the palette shows ONE Media heading, not two", media.length === 1);
  check("the host row lands inside it", media[0]!.items.some((i) => i.key === "host:site.map"));
  check("the built-in Media items are still there", media[0]!.items.some((i) => i.key === "carousel"));

  // The registered label reaches the NODE, so the inspector never shows the key.
  const placed = makeInsertNode(item("host:site.map")!);
  check("insert stamps the registered label", placed.kind !== "outlet" && placed.label === "Store map");

  // …and a host node authored programmatically (never through the palette)
  // resolves the same label + glyph through the host's defs.
  const lookup: HostDisplayLookup = (name) => defs.find((d) => d.name === name);
  const bare = host("site.map");
  check("nodeTypeLabel prefers the host's label", nodeTypeLabel(bare, lookup) === "Store map");
  check("nodeName follows it", nodeName(bare, lookup) === "Store map");
  check("nodeIconName reads the def's icon", nodeIconName(bare, lookup) === "image");
  check("no lookup → the plug, as before", nodeIconName(bare) === "plug");
  check("no lookup → prose, never `Site.map`", nodeTypeLabel(bare) === "Site map");

  console.warn = realWarn;
}

// ── 4c. `hide` reaches a host row ────────────────────────────────────────────
console.log("host.catalog().hide can suppress a host component row");
{
  const defs: HostComponentDef[] = [
    { name: "map", label: "Map", category: "Media" },
    { name: "map.bare", label: "Map frame", category: "Media" },
    { name: "Solo", label: "Solo", category: "Widgets" },
  ];
  const base = paletteGroups();
  const keys = (groups: ReturnType<typeof paletteGroups>) => groups.flatMap((g) => g.items).map((i) => i.key);

  const hidden = catalogForHost(base, {
    hostComponents: () => defs,
    catalog: () => ({ hide: ["host:map.bare"] }),
  });
  check("the hidden host row is gone", !keys(hidden).includes("host:map.bare"));
  check("its sibling survives", keys(hidden).includes("host:map"));
  check("a built-in row is untouched", keys(hidden).includes("image"));

  // Hiding a host group's last row drops the group heading with it, rather than
  // leaving an empty section.
  const emptied = catalogForHost(base, {
    hostComponents: () => defs,
    catalog: () => ({ hide: ["host:Solo"] }),
  });
  check("a host group emptied by hide disappears", !emptied.some((g) => g.key === "hostcat:widgets"));

  // And hiding still composes with the built-in behaviour it always had.
  const both = catalogForHost(base, {
    hostComponents: () => defs,
    catalog: () => ({ hide: ["host:map", "input"] }),
  });
  check("a built-in item hide still works alongside", !keys(both).includes("input"));
  check("…and the un-hidden host row remains", keys(both).includes("host:map.bare"));
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
