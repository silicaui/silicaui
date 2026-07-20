/**
 * Isolated engine proof for ACTION BATCHING (the emission-hygiene phase of the
 * state-and-intent-out contract) — no React, no DOM. Drives the real `Editor`.
 *
 * The invariant under test: ONE user action emits exactly ONE event, carrying
 * EVERY kind it touched, and takes exactly ONE history step. That is what makes
 * a semantic-op recorder possible — an op batch has to correspond to a user
 * action, not to however many internal mutations the method happened to make.
 *
 * Before this, `createSymbol` fired twice (structure, then symbols) plus a third
 * for the selection, and `addPage`/`renameSymbol`/`deleteSymbol`/`createComponent`
 * each pushed history by hand outside the commit chokepoint.
 */
import { Editor } from "./src/site/engine";
import type { ChangeEvent, ChangeKind } from "./src/site/engine";
import { el, stampTree } from "@wizeworks/silicaui-html";
import type { Node, Theme } from "@wizeworks/silicaui-html";

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

function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("section", "card p-6", {
          children: [el("h2", "text-xl", { text: "Title" }), el("button", "btn", { text: "Click" })],
        }),
        el("p", "foot", { text: "footer" }),
      ],
    }),
  );
  return new Editor({ version: "1", root, theme });
}
const sectionId = (ed: Editor) => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"))!;
const pageId = (ed: Editor) => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.class === "page"))!;

/** Record every event an action emits. */
function record(ed: Editor, action: () => void): ChangeEvent[] {
  const seen: ChangeEvent[] = [];
  const unsub = ed.subscribe((e) => seen.push({ kind: e.kind, kinds: [...e.kinds] }));
  action();
  unsub();
  return seen;
}
const show = (events: ChangeEvent[]) => JSON.stringify(events.map((e) => e.kinds));

/** One event, whose `kinds` are exactly `expected` (order-insensitive). */
function single(label: string, events: ChangeEvent[], expected: ChangeKind[]): void {
  check(`${label} emits exactly one event`, events.length === 1, `got ${events.length}: ${show(events)}`);
  if (events.length !== 1) return;
  const got = [...events[0]!.kinds].sort();
  check(`${label} reports ${JSON.stringify(expected.sort())}`, JSON.stringify(got) === JSON.stringify([...expected].sort()), show(events));
}

// ── 1. the actions that used to double-emit ──────────────────────────────────
console.log("multi-kind actions batch into one event");
{
  const ed = freshEditor();
  single("createSymbol", record(ed, () => ed.createSymbol("Hero", sectionId(ed))), ["structure", "symbols", "selection"]);
}
{
  const ed = freshEditor();
  single("createComponent", record(ed, () => ed.createBlankSymbol("Card")), ["symbols", "active"]);
}
{
  const ed = freshEditor();
  const sym = ed.createSymbol("Hero", sectionId(ed))!;
  single("renameSymbol", record(ed, () => ed.renameSymbol(sym, "Banner")), ["symbols", "structure"]);
}
{
  const ed = freshEditor();
  const sym = ed.createSymbol("Hero", sectionId(ed))!;
  single("deleteSymbol", record(ed, () => ed.deleteSymbol(sym)), ["structure", "symbols", "selection"]);
}

// ── 2. structural ops fold their selection move into the same event ──────────
console.log("structural ops carry their selection change");
{
  const ed = freshEditor();
  single("insert", record(ed, () => ed.insert(el("p", "x", { text: "new" }), pageId(ed))), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  single("duplicate", record(ed, () => ed.duplicate(sectionId(ed))), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.select(id);
  single("remove", record(ed, () => ed.remove(id)), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  const sym = ed.createSymbol("Hero", sectionId(ed))!;
  const inst = idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.instanceOf === sym))!;
  single("detachInstance", record(ed, () => ed.detachInstance(inst)), ["structure", "selection"]);
}

// ── 3. single-kind ops stay single ───────────────────────────────────────────
console.log("single-kind actions are unchanged");
{
  const ed = freshEditor();
  single("setClass", record(ed, () => ed.setClass(sectionId(ed), "card p-8")), ["class"]);
  single("setText", record(ed, () => ed.setText(sectionId(ed), "hi")), ["props"]);
  single("addPage", record(ed, () => ed.addPage("Two")), ["page"]);
  single("setTheme", record(ed, () => ed.setTheme({ name: "other", tokens: {} })), ["theme"]);
  single("saveTheme", record(ed, () => ed.saveTheme()), ["library"]);
  single("select", record(ed, () => ed.select(sectionId(ed))), ["selection"]);
}

// ── 4. `kind` reports the most structural kind of the batch ──────────────────
console.log("kind is the most structural of kinds");
{
  const ed = freshEditor();
  const ev = record(ed, () => ed.createSymbol("Hero", sectionId(ed)))[0]!;
  check("createSymbol kind === 'symbols'", ev.kind === "symbols", `got ${ev.kind}`);
}
{
  const ed = freshEditor();
  const ev = record(ed, () => ed.insert(el("p", "x", { text: "n" }), pageId(ed)))[0]!;
  check("insert kind === 'structure' (not 'selection')", ev.kind === "structure", `got ${ev.kind}`);
}
{
  const ed = freshEditor();
  const ev = record(ed, () => ed.createBlankSymbol("C"))[0]!;
  check("createComponent kind === 'symbols' (not 'active')", ev.kind === "symbols", `got ${ev.kind}`);
}

// ── 5. no-op actions stay SILENT ─────────────────────────────────────────────
// A rejected/no-op mutation must not wake subscribers — every event costs the
// host a full-Site relay, and under the ops contract an empty batch is a lie.
console.log("no-op actions emit nothing");
{
  const ed = freshEditor();
  check("remove(missing id)", record(ed, () => ed.remove("nope")).length === 0);
  check("setClass(missing id)", record(ed, () => ed.setClass("nope", "x")).length === 0);
  check("renamePage(unchanged name)", record(ed, () => ed.renamePage(ed.pagesView.pages[0]!.id, ed.pagesView.pages[0]!.name)).length === 0);
  check("removePage(last remaining page)", record(ed, () => ed.removePage(ed.pagesView.pages[0]!.id)).length === 0);
  check("select(already selected)", (ed.select(sectionId(ed)), record(ed, () => ed.select(sectionId(ed))).length === 0));
  const locked = sectionId(ed);
  ed.setLocked(locked, "host");
  check("remove(locked node)", record(ed, () => ed.remove(locked)).length === 0);
}

// ── 6. ONE action = ONE history step ─────────────────────────────────────────
// The regression that matters most: batching must not have split (or merged)
// undo steps. A single undo has to revert the whole action.
console.log("one action = one undo step");
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractSite());
  ed.createSymbol("Hero", sectionId(ed));
  check("createSymbol changed the site", JSON.stringify(ed.extractSite()) !== before);
  ed.undo();
  check("one undo fully reverts createSymbol", JSON.stringify(ed.extractSite()) === before);
  check("…and the symbol is gone", ed.symbols.length === 0);
  check("no second undo step remains", !ed.canUndo);
}
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractSite());
  ed.createBlankSymbol("Card");
  ed.undo();
  check("one undo reverts createComponent", JSON.stringify(ed.extractSite()) === before);
  check("no second undo step remains", !ed.canUndo);
}
{
  const ed = freshEditor();
  const sym = ed.createSymbol("Hero", sectionId(ed))!;
  const afterCreate = JSON.stringify(ed.extractSite());
  ed.deleteSymbol(sym);
  ed.undo();
  check("one undo reverts deleteSymbol", JSON.stringify(ed.extractSite()) === afterCreate);
}
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractSite());
  ed.addPage("Two");
  ed.undo();
  check("one undo reverts addPage", JSON.stringify(ed.extractSite()) === before);
  check("no second undo step remains", !ed.canUndo);
}

// ── 7. theme + library edits still skip history ──────────────────────────────
console.log("theme/library edits stay out of history");
{
  const ed = freshEditor();
  ed.setTheme({ name: "other", tokens: { "--color-primary": "red" } });
  ed.setThemeMode("dark");
  ed.saveTheme();
  ed.deleteSavedTheme("other");
  check("no history steps taken", !ed.canUndo);
}
{
  // …and a theme edit made BETWEEN two structural edits doesn't get swallowed by
  // the undo of the second (the in-place-mutation rationale in the engine).
  const ed = freshEditor();
  ed.setClass(sectionId(ed), "card p-8");
  ed.setTheme({ name: "themed", tokens: { "--color-primary": "blue" } });
  ed.setClass(sectionId(ed), "card p-12");
  ed.undo();
  check("undo keeps the newer theme", ed.theme.name === "themed");
  check("undo reverted the class", find(ed.extract().root, (n) => idOf(n) === sectionId(ed))?.class === "card p-8");
}

// ── 8. nested actions collapse (no partial emits, no double history) ─────────
console.log("nested actions collapse into the outermost");
{
  // `paste` → `insertRelative` → `insert` → `select`: four levels, one event.
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.copy(id);
  check("copy() is silent (clipboard is view state)", record(ed, () => ed.copy(id)).length === 0);
  ed.select(pageId(ed));
  const before = JSON.stringify(ed.extractSite());
  const events = record(ed, () => ed.paste());
  single("paste", events, ["structure", "selection"]);
  ed.undo();
  check("one undo reverts paste", JSON.stringify(ed.extractSite()) === before);
}

// ── 9. undo/redo are single actions too ──────────────────────────────────────
// They swap the whole site and can invalidate the selection; the clamp has to
// ride the SAME event, not trail behind as a second one.
console.log("undo/redo emit one event");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.select(id);
  ed.remove(id); // selection moves to the parent
  check("undo emits exactly one event", record(ed, () => ed.undo()).length === 1);
  check("redo emits exactly one event", record(ed, () => ed.redo()).length === 1);
  check("exhausted undo is silent", (ed.undo(), ed.undo(), record(ed, () => ed.undo()).length === 0));
}
{
  // An undo that strands the selection reports it in the same batch.
  const ed = freshEditor();
  const newId = ed.insert(el("p", "x", { text: "new" }), pageId(ed))!;
  check("inserted node is selected", ed.selection === newId);
  const events = record(ed, () => ed.undo());
  check("undo emits one event", events.length === 1, show(events));
  check("…reporting the stranded selection", events[0]?.kinds.includes("selection") === true, show(events));
  check("…and the selection is actually cleared", ed.selection === undefined);
}

console.log(failures === 0 ? "\nALL BATCH PROBES PASSED" : `\n${failures} BATCH PROBE(S) FAILED`);
if (failures) process.exit(1);
