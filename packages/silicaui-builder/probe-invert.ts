/**
 * Op inversion (doc 139 §8) — `Editor.inverseOf`.
 *
 * THE TEST IS A ROUND TRIP, and it is the only test worth writing here: take a
 * document, do a thing, invert the ops it emitted, apply the inverse, and demand
 * the document be byte-identical to where it started. Anything less — checking
 * that an inverse "looks right" — passes for exactly the inverses that quietly
 * restore the wrong value.
 *
 * Every op kind gets a row, so a new op that nobody taught `invertOp` about
 * fails here rather than in a host's undo stack six months later.
 */
import { Editor } from "./src/site/engine";
import type { Op } from "./src/site/ops";
import { el, stampTree } from "@wizeworks/silicaui-html";
import type { Node, Site, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
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

function seedSite(): Site {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("section", "hero", {
          children: [
            el("h1", "text-3xl", { text: "Title" }),
            el("p", "lede", { children: ["Call ", el("a", "link", { text: "us", attrs: { href: "/x" } }), " today"] }),
          ],
        }),
        el("div", "feature", { children: [el("span", "chip", { text: "New" })] }),
      ],
    }),
  );
  return {
    version: "1",
    theme,
    pages: [{ id: "pg_home", name: "Home", slug: "/", root }],
    frame: { root: stampTree(el("div", "shell", { children: [el("header", "hdr", { text: "H" })] })), editable: true },
  };
}

/** Order-insensitive structural comparison — key order isn't meaning. */
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );

const byTag = (ed: Editor, tag: string): string => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === tag))!;
const byClass = (ed: Editor, cls: string): string => idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.class === cls))!;

/** Tape the ops an editor emits. */
function taped(site: Site): { ed: Editor; ops: Op[] } {
  const ed = new Editor(structuredClone(site));
  const ops: Op[] = [];
  ed.subscribe((e) => ops.push(...e.ops));
  return { ed, ops };
}

/**
 * Run `action`, invert what it emitted, apply the inverse, and demand the
 * document match where it started.
 */
function roundTrip(label: string, action: (ed: Editor) => void): void {
  const seed = seedSite();
  const { ed, ops } = taped(seed);
  // The engine normalizes at construction (ords, a default frame), so the
  // baseline is the document AFTER boot, not the literal seed.
  const before = ed.extractSite();
  const start = ops.length;
  action(ed);
  const produced = ops.slice(start);
  if (produced.length === 0) {
    check(`${label}: emitted ops`, false, "nothing emitted — the action did nothing");
    return;
  }
  const inverse = ed.inverseOf(produced, before);
  if (!inverse) {
    check(`${label}: invertible`, false, "inverseOf returned null");
    return;
  }
  const result = ed.applyRemoteOps(inverse);
  const after = ed.extractSite();
  const same = stable(after) === stable(before);
  check(`${label} round-trips`, same && result.dropped.length === 0, describeDiff(before, after, result.dropped.length));
}

function describeDiff(before: Site, after: Site, dropped: number): string {
  if (dropped) return `${dropped} inverse op(s) dropped`;
  const a = stable(before);
  const b = stable(after);
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `diverges at ${i}: …${a.slice(Math.max(0, i - 50), i + 70)}  ≠  …${b.slice(Math.max(0, i - 50), i + 70)}`;
}

console.log("every op kind round-trips through inverseOf");
roundTrip("setClass", (ed) => ed.setClass(byTag(ed, "h1"), "text-5xl font-bold"));
roundTrip("setClass on a node with NO prior class", (ed) => ed.setClass(byClass(ed, "hero"), "hero p-8"));
roundTrip("setText", (ed) => ed.setText(byTag(ed, "h1"), "Changed"));
roundTrip("setLabel", (ed) => ed.setLabel(byTag(ed, "h1"), "Headline"));
roundTrip("setTag", (ed) => ed.setTag(byTag(ed, "h1"), "h2"));
roundTrip("setAttr", (ed) => ed.setAttr(byTag(ed, "h1"), "id", "hero-title"));
roundTrip("setAttr overwriting an existing one", (ed) => ed.setAttr(byTag(ed, "a"), "href", "/y"));
roundTrip("setData", (ed) => ed.setData(byTag(ed, "h1"), { kind: "value", ref: "site.title" }));
roundTrip("setData clearing", (ed) => {
  ed.setData(byTag(ed, "h1"), { kind: "value", ref: "a" });
  ed.setData(byTag(ed, "h1"), undefined);
});
roundTrip("setBehavior", (ed) => ed.setBehavior(byClass(ed, "hero"), { type: "reveal", params: { once: true } }));
roundTrip("setLocked", (ed) => ed.setLocked(byTag(ed, "h1"), "author"));
roundTrip("setChildren", (ed) => ed.setChildren(byClass(ed, "lede"), ["flat text"]));
roundTrip("insert", (ed) => ed.insert(el("p", "added", { text: "New" }), byClass(ed, "hero")));
roundTrip("remove", (ed) => ed.remove(byTag(ed, "h1")));
roundTrip("remove a whole SUBTREE", (ed) => ed.remove(byClass(ed, "hero")));
roundTrip("move", (ed) => ed.move(byTag(ed, "h1"), byClass(ed, "feature"), 0));
roundTrip("duplicate", (ed) => ed.duplicate(byTag(ed, "h1")));
roundTrip("addPage", (ed) => ed.addPage("Pricing", "/pricing"));
roundTrip("removePage", (ed) => {
  ed.addPage("Two");
  ed.removePage("pg_home");
});
roundTrip("renamePage", (ed) => ed.renamePage("pg_home", "Start"));
roundTrip("setPageSlug", (ed) => ed.setPageSlug("pg_home", "/start"));
roundTrip("setPageFrame(null)", (ed) => ed.setPageFrame("pg_home", null));
roundTrip("setPageFrame(named)", (ed) => ed.setPageFrame("pg_home", "docs"));
roundTrip("reorderPages", (ed) => {
  ed.addPage("Two");
  ed.reorderPages(ed.pagesView.pages.map((p) => p.id).reverse());
});
roundTrip("setFrameEditable", (ed) => ed.setFrameEditable(false));
roundTrip("frame-tree edit (a different target scope)", (ed) => {
  ed.setActiveTree("frame");
  ed.setClass(idOf(ed.frame!.root)!, "shell bg-base-200");
});
roundTrip("setTheme", (ed) => ed.setTheme({ name: "brand", tokens: { "--color-primary": "red" } }));
roundTrip("saveTheme", (ed) => ed.saveTheme());

console.log("\nthe two that could not be inverted from outside");
// 1. `symbol.set` that CREATES — its inverse is a delete WITH a detach cascade
//    of engine-minted ids. This is the one that used to drop a host's history.
roundTrip("createSymbol (the save-as-component case)", (ed) => ed.createSymbol("Hero", byClass(ed, "hero")));
roundTrip("createBlankSymbol", (ed) => ed.createBlankSymbol("Blank"));
roundTrip("deleteSymbol (the cascade, in reverse)", (ed) => {
  const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
  ed.deleteSymbol(sym);
});
roundTrip("renameSymbol", (ed) => {
  const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
  ed.renameSymbol(sym, "Banner");
});

// 2. `node.setText` over RICH children — the flattening case. This is the one
//    that had no faithful inverse at all until `node.setChildren` existed.
{
  const seed = seedSite();
  const { ed, ops } = taped(seed);
  const before = ed.extractSite();
  const lede = byClass(ed, "lede");
  const richBefore = stable((ed.node(lede) as Node & { children: unknown }).children);
  const start = ops.length;
  ed.setText(lede, "flattened");
  const flattened = ed.node(lede) as Node & { children: unknown[] };
  check("setText really does flatten rich children", flattened.children.length === 1 && flattened.children[0] === "flattened");

  const inverse = ed.inverseOf(ops.slice(start), before)!;
  check("...and it inverts into node.setChildren, not another setText", inverse.some((o) => o.kind === "node.setChildren"), inverse.map((o) => o.kind).join(","));
  ed.applyRemoteOps(inverse);
  const restored = stable((ed.node(lede) as Node & { children: unknown }).children);
  check("...restoring the <a> child exactly", restored === richBefore, `${restored} ≠ ${richBefore}`);
}

console.log("\nmultiple edits in one action");
roundTrip("two edits to the SAME node invert against the state each saw", (ed) => {
  const h1 = byTag(ed, "h1");
  ed.batch(() => {
    ed.setClass(h1, "text-4xl");
    ed.setClass(h1, "text-5xl");
  });
});
roundTrip("a mixed batch across trees", (ed) =>
  ed.batch(() => {
    ed.setClass(byTag(ed, "h1"), "text-2xl");
    ed.setText(byTag(ed, "h1"), "Two");
    ed.remove(byClass(ed, "chip"));
    ed.insert(el("p", "n", { text: "n" }), byClass(ed, "feature"));
  }),
);

console.log("\ncontract");
{
  const seed = seedSite();
  const { ed } = taped(seed);
  check("an empty batch inverts to an empty batch", JSON.stringify(ed.inverseOf([], ed.extractSite())) === "[]");
  const bogus: Op = { target: { scope: "page", id: "nope" }, kind: "node.setClass", nodeId: "ghost", class: "x" };
  check("an op against a node that never existed refuses, rather than guessing", ed.inverseOf([bogus], ed.extractSite()) === null);
}
{
  // planSymbolDelete plans WITHOUT applying — that's what makes it usable as a
  // held inverse rather than a side effect.
  const seed = seedSite();
  const { ed } = taped(seed);
  const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
  const planned = ed.planSymbolDelete(sym);
  check("planSymbolDelete returns a symbol.delete op", planned?.kind === "symbol.delete");
  check("...carrying the detach cascade", planned?.kind === "symbol.delete" && planned.detach.length === 1);
  check("...with a freshly-minted replacement id", planned?.kind === "symbol.delete" && idOf(planned.detach[0]!.node) !== planned.detach[0]!.nodeId);
  check("...and the symbol is STILL THERE (it planned, it didn't delete)", ed.symbol(sym) !== undefined);
  check("an unknown symbol plans nothing", ed.planSymbolDelete("nope") === undefined);
}

console.log(failures === 0 ? "\nALL INVERT PROBES PASSED" : `\n${failures} INVERT PROBE(S) FAILED`);
if (failures) process.exit(1);
