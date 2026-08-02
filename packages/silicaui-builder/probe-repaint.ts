/**
 * The VIEW SNAPSHOT contract — `activeRootNode` hands back a new object identity
 * whenever the tree it points at changed, and the same one when it didn't.
 *
 * What this exists to catch, because nothing else could: an edit that lands in
 * the model and never reaches the screen. Node edits mutate the stored tree in
 * place, so a getter returning the live root returns one identity forever. Every
 * consumer that memoizes on the tree — `useMemo`, `React.memo`, a
 * `useSyncExternalStore` snapshot compare — then keeps its pre-edit copy, while
 * `setClass` succeeds, `onChange` fires, the draft saves, and a reload shows the
 * edit. That shipped: Layout mode read its shell from here while Page mode read
 * it from `extract()` (cloned per commit), so padding and background edits to a
 * site header were invisible on the canvas — in Layout mode only — until reload.
 *
 * Every check below is a property of the ENGINE seam, so it holds for the React
 * canvas, the Navigator, and a host's own view alike. `e2e/layout-frame.spec.ts`
 * covers the same bug through the real canvas.
 */
import { Editor } from "./src/site/engine";
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
const byTag = (root: Node, tag: string): Node | undefined => find(root, (n) => n.kind === "element" && n.tag === tag);
/** The class of the node with `id`, read out of a SNAPSHOT tree (not the engine)
 *  — which is the whole question: does what a view holds show the edit? */
function classAt(root: Node, id: string): string {
  const n = find(root, (x) => idOf(x) === id);
  return n && n.kind !== "outlet" ? n.class ?? "" : "";
}

function freshEditor(): Editor {
  const root = stampTree(el("div", "page", { children: [el("section", "hero px-6 py-20", { text: "Hi" })] }));
  return new Editor({ version: "1", root, theme });
}

// ── Layout mode: the reported bug ────────────────────────────────────────────
console.log("activeRootNode in Layout mode");
{
  const ed = freshEditor();
  ed.setActiveTree("frame");
  const before = ed.activeRootNode;
  const nav = byTag(before, "header");
  check("the default layout shell has a header to edit", !!nav, "no <header> in the frame");
  const navId = idOf(nav)!;

  check("repeated reads within one commit are the SAME object", ed.activeRootNode === before);

  ed.setClassToken(navId, ["px-6", "px-12"], "px-12");
  const after = ed.activeRootNode;
  check("an edit produces a NEW identity — what a memo keys off", after !== before);
  check("...and the new snapshot carries the edit", classAt(after, navId).includes("px-12"), classAt(after, navId));
  check("the OLD snapshot is untouched (it's a snapshot, not a view)", !classAt(before, navId).includes("px-12"));

  // A memo keyed on tree identity — the exact shape `useResolved` uses. Keyed
  // this way against a live root, it never recomputed; that WAS the bug.
  let renders = 0;
  let memoKey: Node = ed.activeRootNode;
  const paint = (): string => {
    const root = ed.activeRootNode;
    if (root !== memoKey) {
      memoKey = root;
      renders++;
    }
    return classAt(memoKey, navId);
  };
  paint();
  check("a settled memo does not re-run", renders === 0);
  ed.setClassToken(navId, ["bg-base-100", "bg-info"], "bg-info");
  const painted = paint();
  check("...but an edit makes it re-run", renders === 1);
  check("...and it paints the edited class", painted.includes("bg-info"), painted);
  paint();
  check("...then settles again", renders === 1);
}

// ── the same guarantee everywhere the spine can point ────────────────────────
console.log("\nevery active tree, and every switch");
{
  const ed = freshEditor();
  const page = ed.activeRootNode;
  ed.setActiveTree("frame");
  check("switching to Layout mode changes identity", ed.activeRootNode !== page);
  const frame = ed.activeRootNode;
  ed.setActiveTree("page");
  check("...and switching back changes it again", ed.activeRootNode !== frame);
  check("...to the page tree, not the frame's", !!byTag(ed.activeRootNode, "section"));
}
{
  const ed = freshEditor();
  ed.createComponent("Card", el("div", "card p-4", { text: "x" }));
  const master = ed.activeRootNode;
  const cardId = idOf(master)!;
  check("editing a symbol master targets it", classAt(master, cardId).includes("card"), classAt(master, cardId));
  ed.setClassToken(cardId, ["p-4", "p-8"], "p-8");
  check("a master edit produces a new identity too", ed.activeRootNode !== master);
  check("...carrying the edit", classAt(ed.activeRootNode, cardId).includes("p-8"), classAt(ed.activeRootNode, cardId));
}
{
  const ed = freshEditor();
  ed.addPage("Second");
  const second = ed.activeRootNode;
  ed.setActivePage(ed.pagesView.pages[0]!.id);
  check("switching page changes identity", ed.activeRootNode !== second);
}

// ── it is a defensive copy, and undo re-snapshots ────────────────────────────
console.log("\nsnapshot semantics");
{
  const ed = freshEditor();
  ed.setActiveTree("frame");
  const snap = ed.activeRootNode;
  const navId = idOf(byTag(snap, "header"))!;
  // A view that scribbles on its own render tree must not corrupt the document.
  const copy = find(snap, (n) => idOf(n) === navId)!;
  if (copy.kind !== "outlet") copy.class = "vandalized";
  const stored = ed.node(navId);
  check(
    "mutating the snapshot does not reach the engine",
    !(stored && stored.kind !== "outlet" && stored.class === "vandalized"),
  );

  ed.setClassToken(navId, ["px-6", "px-12"], "px-12");
  const edited = ed.activeRootNode;
  ed.undo();
  check("undo produces a new identity as well", ed.activeRootNode !== edited);
  check("...showing the reverted tree", !classAt(ed.activeRootNode, navId).includes("px-12"));
}

// ── parity with the page path, so the asymmetry can't come back ──────────────
console.log("\nparity with extract()");
{
  const ed = freshEditor();
  const secId = idOf(byTag(ed.extract().root, "section"))!;
  const beforeDoc = ed.extract().root;
  const beforeActive = ed.activeRootNode;
  ed.setClassToken(secId, ["py-20", "py-8"], "py-8");
  check("extract() re-snapshots on edit", ed.extract().root !== beforeDoc);
  check("activeRootNode does the same, in the same commit", ed.activeRootNode !== beforeActive);
  check(
    "...and both show the edit",
    classAt(ed.extract().root, secId).includes("py-8") && classAt(ed.activeRootNode, secId).includes("py-8"),
  );
}

console.log(failures === 0 ? "\nALL REPAINT PROBES PASSED" : `\n${failures} REPAINT PROBE(S) FAILED`);
if (failures) process.exit(1);
