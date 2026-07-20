/**
 * Isolated proof for the SEMANTIC OPERATION contract — no React, no DOM.
 *
 * The headline test is convergence: two engines seeded from the same site, one
 * driven by a long script of ordinary editing, the other fed only the ops that
 * editing emitted. If they end up byte-identical, the vocabulary is sufficient —
 * every mutation the engine can perform is expressible, and nothing leaks
 * through as an unexpressed side effect. That is the actual question sparx
 * asked, and it is not answerable by inspecting op shapes one at a time.
 *
 * Around it: coverage (no mutation is silent), causal order, isolation (ops
 * don't keep changing after they're handed over), the concurrency properties
 * that make ops commute, and the ingress paths (`applyRemoteOps`,
 * `replaceState`, history delegation).
 */
import { Editor } from "./src/site/engine";
import type { ChangeEvent } from "./src/site/engine";
import type { Op } from "./src/site/ops";
import { el, stampTree } from "@wizeworks/silicaui-html";
import type { Node, Site, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

const theme: Theme = { name: "test", tokens: { "--color-primary": "blue" } };

/** Key-order-independent deep compare, so two engines that built the same value
 *  by different routes still register as equal. */
function stable(v: unknown): string {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") {
      return Object.fromEntries(
        Object.keys(x as Record<string, unknown>)
          .sort()
          .map((k) => [k, walk((x as Record<string, unknown>)[k])]),
      );
    }
    return x;
  };
  return JSON.stringify(walk(v));
}

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

/**
 * The shared starting document, run once through an `Editor` so it is already
 * NORMALIZED — a frame materialized, symbols and savedThemes seeded, ordering
 * keys backfilled.
 *
 * That normalization is deliberate here, not incidental. Loading a site that
 * lacks a frame mints one with fresh random ids, so two clients normalizing the
 * SAME raw site independently produce different frame node ids and can never
 * converge. In practice the first client's normalization is persisted with the
 * whole `Site` on its first `onChange`, and later clients load that — which is
 * exactly what this models. It's also why a host must store the `site`
 * argument at least once and not ops alone.
 */
const NORMALIZED: Site = new Editor({
  version: "1",
  theme,
  pages: [
    {
      id: "pg_home",
      name: "Home",
      slug: "/",
      root: stampTree(
        el("div", "page", {
          children: [
            el("section", "hero", {
              children: [el("h1", "text-3xl", { text: "Hello" }), el("p", "", { text: "Body" })],
            }),
            el("section", "feature", { children: [el("h2", "", { text: "Feature" })] }),
          ],
        }),
      ),
    },
  ],
}).extractSite();

function seedSite(): Site {
  return structuredClone(NORMALIZED);
}

/** An engine plus a live tape of every op it emitted. */
function taped(site: Site): { ed: Editor; ops: Op[]; events: ChangeEvent[] } {
  const ed = new Editor(structuredClone(site));
  const ops: Op[] = [];
  const events: ChangeEvent[] = [];
  ed.subscribe((e) => {
    events.push(e);
    ops.push(...e.ops);
  });
  return { ed, ops, events };
}

const byTag = (ed: Editor, tag: string) =>
  idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === tag))!;
const byClass = (ed: Editor, cls: string) =>
  idOf(find(ed.extract().root, (n) => n.kind === "element" && n.class === cls))!;

// ── 1. no mutation is silent ─────────────────────────────────────────────────
// Requirement 1 of the contract: every mutation emits at least one op, and
// `site.replace` is reserved for what genuinely has no delta.
console.log("every stored-state mutation emits an op");
{
  const seed = seedSite();
  const cases: Array<[string, (ed: Editor) => void]> = [
    ["setClass", (ed) => ed.setClass(byTag(ed, "h1"), "text-4xl")],
    ["setText", (ed) => ed.setText(byTag(ed, "h1"), "Changed")],
    ["setLabel", (ed) => ed.setLabel(byTag(ed, "h1"), "Title")],
    ["setTag", (ed) => ed.setTag(byTag(ed, "h1"), "h2")],
    ["setAttr", (ed) => ed.setAttr(byTag(ed, "h1"), "id", "x")],
    ["setData", (ed) => ed.setData(byTag(ed, "h1"), { kind: "value", ref: "a.b" })],
    ["setBehavior", (ed) => ed.setBehavior(byTag(ed, "h1"), { type: "reveal" })],
    ["setLocked", (ed) => ed.setLocked(byTag(ed, "h1"), "author")],
    ["insert", (ed) => ed.insert(el("p", "", { text: "n" }), byClass(ed, "hero"))],
    ["remove", (ed) => ed.remove(byTag(ed, "p"))],
    ["move", (ed) => ed.move(byTag(ed, "h1"), byClass(ed, "feature"), 0)],
    ["duplicate", (ed) => ed.duplicate(byTag(ed, "h1"))],
    ["paste", (ed) => (ed.copy(byTag(ed, "h1")), ed.select(byClass(ed, "feature")), ed.paste())],
    ["addPage", (ed) => ed.addPage("Two")],
    ["renamePage", (ed) => ed.renamePage("pg_home", "Start")],
    ["setPageSlug", (ed) => ed.setPageSlug("pg_home", "/start")],
    ["removePage", (ed) => (ed.addPage("Two"), ed.removePage("pg_home"))],
    ["reorderPages", (ed) => (ed.addPage("Two"), ed.reorderPages(ed.pagesView.pages.map((p) => p.id).reverse()))],
    ["setFrameEditable", (ed) => ed.setFrameEditable(false)],
    ["createSymbol", (ed) => ed.createSymbol("Hero", byClass(ed, "hero"))],
    ["createBlankSymbol", (ed) => ed.createBlankSymbol("Blank")],
    ["renameSymbol", (ed) => ed.renameSymbol(ed.createSymbol("Hero", byClass(ed, "hero"))!, "Banner")],
    ["deleteSymbol", (ed) => ed.deleteSymbol(ed.createSymbol("Hero", byClass(ed, "hero"))!)],
    ["detachInstance", (ed) => {
      const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
      const inst = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
      ed.detachInstance(inst);
    }],
    ["setInstanceOverrideText", (ed) => {
      const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
      const inst = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
      const master = idOf(find(ed.symbol(sym)!.root, (n) => n.kind === "element" && n.tag === "h1"))!;
      ed.setInstanceOverrideText(inst, master, "Override");
    }],
    ["setTheme", (ed) => ed.setTheme({ name: "other", tokens: {} })],
    ["setThemeMode", (ed) => ed.setThemeMode("dark")],
    ["saveTheme", (ed) => ed.saveTheme()],
    ["deleteSavedTheme", (ed) => (ed.saveTheme(), ed.deleteSavedTheme("test"))],
  ];
  for (const [name, run] of cases) {
    const { ed, ops } = taped(seed);
    const before = ops.length;
    run(ed);
    const produced = ops.slice(before);
    check(`${name} emits ≥1 op`, produced.length > 0, "emitted nothing");
    const fellBack = produced.filter((o) => o.kind === "site.replace");
    check(`${name} does not fall back to site.replace`, fellBack.length === 0, `${fellBack.length} replace op(s)`);
  }
}
console.log("view-only actions emit none");
{
  const { ed, ops } = taped(seedSite());
  const before = ops.length;
  ed.select(byTag(ed, "h1"));
  ed.setActiveTree("frame");
  ed.setActiveTree("page");
  ed.copy(byTag(ed, "h1"));
  ed.addPage("Two");
  const after = ops.length;
  ed.setActivePage("pg_home");
  check("selection / tree switch / copy emit no ops", after - before === 1, `${after - before} ops (expected the addPage only)`);
  check("page switch emits no ops", ops.length === after);
}
console.log("undo/redo use the escape hatch, and only they do");
{
  const { ed, ops } = taped(seedSite());
  ed.setClass(byTag(ed, "h1"), "text-4xl");
  const before = ops.length;
  ed.undo();
  const undoOps = ops.slice(before);
  check("undo emits exactly one site.replace", undoOps.length === 1 && undoOps[0]!.kind === "site.replace");
  ed.redo();
  check("redo emits exactly one site.replace", ops.length === before + 2 && ops[before + 1]!.kind === "site.replace");
}

// ── 2. causal order + isolation ──────────────────────────────────────────────
console.log("ops are causally ordered within an action");
{
  const { ed, ops } = taped(seedSite());
  const before = ops.length;
  ed.createSymbol("Hero", byClass(ed, "hero"));
  const kinds = ops.slice(before).map((o) => o.kind);
  check("createSymbol: symbol.set → node.remove → node.insert",
    stable(kinds) === stable(["symbol.set", "node.remove", "node.insert"]), JSON.stringify(kinds));
}
{
  const { ed, ops } = taped(seedSite());
  const sym = ed.createSymbol("Hero", byClass(ed, "hero"))!;
  const before = ops.length;
  const inst = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
  ed.detachInstance(inst);
  const kinds = ops.slice(before).map((o) => o.kind);
  check("detach: node.remove → node.insert", stable(kinds) === stable(["node.remove", "node.insert"]), JSON.stringify(kinds));
}
console.log("emitted ops are frozen snapshots, not live references");
{
  const { ed, ops } = taped(seedSite());
  const h1 = byTag(ed, "h1");
  ed.insert(el("p", "", { text: "first" }), byClass(ed, "hero"));
  const insertOp = ops.find((o) => o.kind === "node.insert")!;
  const snapshot = stable(insertOp);
  // Keep editing — including undo, which rewrites the live tree wholesale.
  ed.setClass(h1, "changed");
  ed.setText(h1, "changed");
  ed.undo();
  ed.undo();
  check("an already-emitted op is unchanged by later edits", stable(insertOp) === snapshot);
}

// ── 3. CONVERGENCE — the real test ───────────────────────────────────────────
// Peer A edits normally. Peer B, from the same starting site, sees only the ops.
// If the vocabulary is complete they end up identical.
console.log("a peer fed only ops converges on the same document");
{
  const seed = seedSite();
  const { ed: a, ops } = taped(seed);
  const b = new Editor(structuredClone(seed));

  // A long, deliberately awkward script: every op family, interleaved, including
  // the cascades and the cross-tree edits.
  const hero = byClass(a, "hero");
  a.setClass(byTag(a, "h1"), "text-5xl font-bold");
  a.setText(byTag(a, "h1"), "Welcome");
  a.setLabel(byTag(a, "h1"), "Headline");
  a.setTag(byTag(a, "p"), "span");
  a.setAttr(byTag(a, "span"), "id", "lede");
  a.setData(byTag(a, "span"), { kind: "value", ref: "site.tagline" });
  a.setBehavior(byTag(a, "span"), { type: "reveal", params: { delay: 100 } });
  a.insert(el("p", "added", { text: "New paragraph" }), hero, 1);
  a.insert(el("p", "added2", { text: "Second" }), hero, 0);
  a.duplicate(byClass(a, "added"));
  a.move(byClass(a, "added2"), byClass(a, "feature"), 0);
  a.setLocked(byClass(a, "added"), "host");
  a.remove(byClass(a, "feature"));
  a.addPage("Pricing", "/pricing");
  a.renamePage("pg_home", "Start");
  a.setPageSlug("pg_home", "/home");
  a.reorderPages(a.pagesView.pages.map((p) => p.id).reverse());
  a.setFrameEditable(false);
  // Frame tree edits — a different target scope.
  a.setActiveTree("frame");
  const frameRootId = idOf(a.frame!.root)!;
  a.insert(el("div", "frame-extra", { text: "shell" }), frameRootId);
  a.setActiveTree("page");
  // Symbols: create, edit the master (a third target scope), instance override.
  a.setActivePage("pg_home");
  const sym = a.createSymbol("Hero", byClass(a, "hero"))!;
  const inst = idOf(find(a.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
  const masterH1 = idOf(find(a.symbol(sym)!.root, (n) => n.kind === "element" && n.tag === "h1"))!;
  a.setInstanceOverrideText(inst, masterH1, "Per-instance");
  a.enterSymbol(sym);
  a.setClass(masterH1, "text-6xl");
  a.exitSymbol();
  a.renameSymbol(sym, "Banner");
  a.setTheme({ name: "brand", tokens: { "--color-primary": "red" }, mode: "light" });
  a.setThemeMode("dark");
  a.saveTheme();
  // …and a cascade that mints ids on the fly.
  a.deleteSymbol(sym);

  const result = b.applyRemoteOps(ops);
  check("every op applied", result.dropped.length === 0, `dropped ${result.dropped.map((o) => o.kind).join(", ")}`);
  check("op count is non-trivial", ops.length >= 25, `${ops.length} ops`);
  const same = stable(a.extractSite()) === stable(b.extractSite());
  check("the two documents are identical", same);
  if (!same) {
    const sa = stable(a.extractSite());
    const sb = stable(b.extractSite());
    let i = 0;
    while (i < sa.length && sa[i] === sb[i]) i++;
    console.log(`      diverges at ${i}:\n        A …${sa.slice(Math.max(0, i - 60), i + 90)}\n        B …${sb.slice(Math.max(0, i - 60), i + 90)}`);
  }
}
console.log("convergence is order-preserving under batching");
{
  // The same ops delivered one batch at a time must land identically to one
  // big batch — a host may flush at any granularity.
  const seed = seedSite();
  const { ed: a, ops } = taped(seed);
  const hero = byClass(a, "hero");
  a.insert(el("p", "x1", { text: "1" }), hero, 0);
  a.insert(el("p", "x2", { text: "2" }), hero, 1);
  a.insert(el("p", "x3", { text: "3" }), hero, 1);
  a.move(byClass(a, "x1"), hero, 3);
  a.setClass(byTag(a, "h1"), "y");

  const bulk = new Editor(structuredClone(seed));
  bulk.applyRemoteOps(ops);
  const drip = new Editor(structuredClone(seed));
  for (const op of ops) drip.applyRemoteOps([op]);
  check("one batch == many batches", stable(bulk.extractSite()) === stable(drip.extractSite()));
  check("…and both match the author", stable(a.extractSite()) === stable(bulk.extractSite()));
}

// ── 4. the properties that make ops commute ──────────────────────────────────
console.log("setProps is a shallow merge, so two authors don't collide");
{
  const seed = seedSite();
  const a = new Editor(structuredClone(seed));
  const btn = a.insert({ kind: "component", component: "Button", props: { label: "Buy", color: "primary" } }, byClass(a, "hero"))!;
  const shared = a.extractSite();
  const p1 = new Editor(structuredClone(shared));
  const p2 = new Editor(structuredClone(shared));
  const tape1: Op[] = [];
  const tape2: Op[] = [];
  p1.subscribe((e) => tape1.push(...e.ops));
  p2.subscribe((e) => tape2.push(...e.ops));
  p1.setProp(btn, "label", "Buy now"); // one author edits the copy
  p2.setProp(btn, "color", "success"); // the other swaps the color
  p1.applyRemoteOps(tape2);
  p2.applyRemoteOps(tape1);
  const props1 = (find(p1.extract().root, (n) => idOf(n) === btn) as { props?: Record<string, unknown> }).props;
  check("author 1 keeps their label AND gains the color", props1?.label === "Buy now" && props1?.color === "success", stable(props1));
  check("both peers converge", stable(p1.extractSite()) === stable(p2.extractSite()));
}
console.log("concurrent inserts into one parent don't collide");
{
  const seed = seedSite();
  const base = new Editor(structuredClone(seed));
  const hero = byClass(base, "hero");
  const shared = base.extractSite();
  const p1 = new Editor(structuredClone(shared));
  const p2 = new Editor(structuredClone(shared));
  const tape1: Op[] = [];
  const tape2: Op[] = [];
  p1.subscribe((e) => tape1.push(...e.ops));
  p2.subscribe((e) => tape2.push(...e.ops));
  p1.insert(el("p", "from-1", { text: "one" }), hero, 1); // both target the SAME slot
  p2.insert(el("p", "from-2", { text: "two" }), hero, 1);
  p1.applyRemoteOps(tape2);
  p2.applyRemoteOps(tape1);
  const kids1 = (find(p1.extract().root, (n) => idOf(n) === hero) as { children?: Node[] }).children ?? [];
  const classes = (ed: Editor) =>
    (((find(ed.extract().root, (n) => idOf(n) === hero) as { children?: Node[] }).children ?? []) as Node[])
      .map((c) => (typeof c === "string" || c.kind === "outlet" ? "" : c.class ?? ""));
  check("both inserts survive", kids1.length === 4, `${kids1.length} children`);
  check("neither overwrote the other", classes(p1).includes("from-1") && classes(p1).includes("from-2"), stable(classes(p1)));
  check("both peers agree on the ORDER", stable(classes(p1)) === stable(classes(p2)), `${stable(classes(p1))} vs ${stable(classes(p2))}`);
}

// ── 5. drop / reject semantics ───────────────────────────────────────────────
console.log("ops whose subject is gone are dropped, not fatal");
{
  const seed = seedSite();
  const a = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  a.subscribe((e) => tape.push(...e.ops));
  const h1 = byTag(a, "h1");
  a.setClass(h1, "text-4xl");

  const b = new Editor(structuredClone(seed));
  b.remove(byTag(b, "h1")); // an intervening edit removed the node
  const result = b.applyRemoteOps(tape);
  check("the stale op is dropped", result.dropped.length === 1 && result.dropped[0]!.kind === "node.setClass");
  check("nothing else broke", result.applied === 0 && b.extractSite().pages.length === 1);
}
{
  const seed = seedSite();
  const b = new Editor(structuredClone(seed));
  const hero = byClass(b, "hero");
  const h1 = byTag(b, "h1");
  // A move that would put an ancestor inside its own descendant.
  const bad: Op = { target: { scope: "page", id: "pg_home" }, kind: "node.move", nodeId: hero, parentId: h1, ord: "a1" };
  const before = stable(b.extractSite());
  const result = b.applyRemoteOps([bad]);
  check("a cycle-creating move is rejected", result.dropped.length === 1);
  check("…and the tree is untouched", stable(b.extractSite()) === before);
}
{
  const seed = seedSite();
  const a = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  a.subscribe((e) => tape.push(...e.ops));
  a.insert(el("p", "once", { text: "x" }), byClass(a, "hero"));
  const b = new Editor(structuredClone(seed));
  b.applyRemoteOps(tape);
  const after = stable(b.extractSite());
  const again = b.applyRemoteOps(tape); // redelivery
  check("a re-delivered insert is dropped, not duplicated", again.dropped.length === 1);
  check("…and the document is unchanged", stable(b.extractSite()) === after);
}

// ── 6. remote application doesn't echo, and doesn't touch local undo ─────────
console.log("remote ops stay out of the local history and the outbound stream");
{
  const seed = seedSite();
  const a = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  a.subscribe((e) => tape.push(...e.ops));
  a.setClass(byTag(a, "h1"), "text-4xl");

  const { ed: b, ops: bOut, events } = taped(seed);
  const evBefore = events.length;
  check("b has no history yet", !b.canUndo);
  b.applyRemoteOps(tape);
  check("remote ops emit NO outbound ops (no echo)", bOut.length === 0, `${bOut.length} echoed`);
  check("…but a change event still fires (the UI must repaint)", events.length === evBefore + 1);
  check("…carrying the real kinds", events[evBefore]!.kinds.includes("class"), stable(events[evBefore]!.kinds));
  check("remote ops do NOT become undoable", !b.canUndo);
}
{
  // The sharper case: local history that ALREADY EXISTS when a remote op lands.
  // Keeping the remote op off the stack isn't enough — the snapshots already on
  // it predate the remote edit, so undoing one reverts work this client never
  // did. They must be invalidated.
  const seed = seedSite();
  const other = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  const h1 = byTag(other, "h1");
  other.setText(h1, "Theirs");

  const mine = new Editor(structuredClone(seed));
  mine.setClass(byClass(mine, "feature"), "mine"); // a local edit, undoable
  check("local history exists before the remote op", mine.canUndo);
  mine.applyRemoteOps(tape);
  check("local history is invalidated by a remote op", !mine.canUndo && !mine.canRedo);
  mine.undo(); // a user pressing ctrl-z anyway
  const text = (find(mine.extract().root, (n) => idOf(n) === h1) as { children?: unknown[] }).children?.[0];
  check("undo cannot revert the other author's edit", text === "Theirs", String(text));
}
{
  // A host that DELEGATES keeps its own history — the engine must not clear a
  // stack it doesn't own.
  const seed = seedSite();
  const other = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  other.setText(byTag(other, "h1"), "Theirs");

  const mine = new Editor(structuredClone(seed));
  mine.setHistoryDelegate({ undo: () => {}, redo: () => {}, canUndo: () => true, canRedo: () => true });
  mine.applyRemoteOps(tape);
  check("a delegated history is left intact", mine.canUndo && mine.canRedo);
}
{
  // A remote delete of the locally-selected node must clear the selection
  // rather than strand it.
  const seed = seedSite();
  const a = new Editor(structuredClone(seed));
  const tape: Op[] = [];
  a.subscribe((e) => tape.push(...e.ops));
  const h1 = byTag(a, "h1");
  a.remove(h1);

  const b = new Editor(structuredClone(seed));
  b.select(h1);
  check("b has it selected", b.selection === h1);
  b.applyRemoteOps(tape);
  check("a remote delete clears the stranded selection", b.selection === undefined);
}

// ── 7. replaceState ──────────────────────────────────────────────────────────
console.log("replaceState resyncs and resets history");
{
  const seed = seedSite();
  const { ed, ops } = taped(seed);
  ed.setClass(byTag(ed, "h1"), "local-edit");
  check("local history exists", ed.canUndo);
  const before = ops.length;

  const authoritative = new Editor(structuredClone(seed));
  authoritative.setClass(byTag(authoritative, "h1"), "server-truth");
  ed.replaceState(authoritative.extractSite(), 42);

  check("document is the server's", stable(ed.extractSite()) === stable(authoritative.extractSite()));
  check("undo history is cleared", !ed.canUndo && !ed.canRedo);
  check("seq is recorded", ed.baseSeq === 42);
  check("no ops echoed", ops.length === before);
}
console.log("ackSeq tracks the host's sequence");
{
  const ed = new Editor(seedSite());
  check("starts at 0", ed.baseSeq === 0);
  ed.ackSeq(7);
  check("advances", ed.baseSeq === 7);
  ed.ackSeq(3);
  check("never goes backwards", ed.baseSeq === 7);
}

// ── 8. history delegation ────────────────────────────────────────────────────
console.log("undo/redo delegate to the host when asked");
{
  const ed = new Editor(seedSite());
  ed.setClass(byTag(ed, "h1"), "text-4xl");
  const calls: string[] = [];
  ed.setHistoryDelegate({
    undo: () => calls.push("undo"),
    redo: () => calls.push("redo"),
    canUndo: () => true,
    canRedo: () => false,
  });
  check("delegation is reported", ed.historyIsDelegated);
  check("canUndo comes from the delegate", ed.canUndo === true);
  check("canRedo comes from the delegate", ed.canRedo === false);
  const snapshot = stable(ed.extractSite());
  ed.undo();
  ed.redo();
  check("undo/redo call out instead of running locally", stable(calls) === stable(["undo", "redo"]));
  check("…and the local document is untouched", stable(ed.extractSite()) === snapshot);
  ed.setHistoryDelegate(undefined);
  check("clearing restores the local stack", !ed.historyIsDelegated && ed.canUndo);
  ed.undo();
  check("…which still works", stable(ed.extractSite()) !== snapshot);
}

console.log(failures === 0 ? "\nALL OPS PROBES PASSED" : `\n${failures} OPS PROBE(S) FAILED`);
if (failures) process.exit(1);
