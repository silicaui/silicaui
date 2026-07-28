/**
 * Isolated engine proof for the structural editor COMMANDS (doc 139 §4) — the
 * tree moves the keyboard shortcuts perform. No React, no DOM: the key mapping
 * is trivial, the tree arithmetic is not.
 *
 * The one that earns this file: `Editor.move` takes a PRE-removal gap index, so
 * "move down one" is `index + 2`. `index + 1` reads correctly, typechecks, and
 * silently resolves to the slot the node already occupies — a no-op that looks
 * like a dead keyboard shortcut and would never fail a typecheck or a smoke test.
 */
import { Editor } from "./src/site/engine";
import { cutNode, groupNode, moveSibling, selectFirstChild, selectParent, selectSibling } from "./src/site/commands";
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

/** page > [a, b, c], where `b` itself has [b1, b2]. */
function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("p", "a", { text: "A" }),
        el("div", "b", { children: [el("span", "b1", { text: "B1" }), el("span", "b2", { text: "B2" })] }),
        el("p", "c", { text: "C" }),
      ],
    }),
  );
  return new Editor({ version: "1", root, theme });
}
const byClass = (ed: Editor, cls: string): string => idOf(find(ed.extract().root, (n) => n.kind !== "outlet" && n.class === cls))!;
/** The TRUE tree root — `siteFromDocument` wraps an authored root in a `pageBody`
 *  container, so the authored "page" div is a child, not the root. */
const rootId = (ed: Editor): string => idOf(ed.extract().root)!;
const order = (ed: Editor): string =>
  ((find(ed.extract().root, (n) => n.kind !== "outlet" && n.class === "page") as Node & { children: Node[] }).children as Node[])
    .map((c) => (c.kind !== "outlet" ? c.class : "outlet"))
    .join(" ");

// ── reorder: the gap-index arithmetic ────────────────────────────────────────
console.log("moveSibling — the pre-removal gap index");
{
  const ed = freshEditor();
  check("start", order(ed) === "a b c", order(ed));
  moveSibling(ed, byClass(ed, "b"), 1);
  check("down one actually moves (NOT a no-op — this is the +2 case)", order(ed) === "a c b", order(ed));
}
{
  const ed = freshEditor();
  moveSibling(ed, byClass(ed, "b"), -1);
  check("up one moves", order(ed) === "b a c", order(ed));
}
{
  const ed = freshEditor();
  const a = byClass(ed, "a");
  moveSibling(ed, a, 1);
  check("first → down", order(ed) === "b a c", order(ed));
  moveSibling(ed, a, 1);
  check("...and again", order(ed) === "b c a", order(ed));
  check("...at the end it reports no-op", moveSibling(ed, a, 1) === false);
  check("...and the order is untouched", order(ed) === "b c a", order(ed));
}
{
  const ed = freshEditor();
  check("at the start, up reports no-op", moveSibling(ed, byClass(ed, "a"), -1) === false);
  check("...and the order is untouched", order(ed) === "a b c", order(ed));
}
{
  // A round trip must return the exact original order — the sharpest test that
  // the two directions use consistent arithmetic.
  const ed = freshEditor();
  const c = byClass(ed, "c");
  moveSibling(ed, c, -1);
  moveSibling(ed, c, -1);
  check("c walked to the front", order(ed) === "c a b", order(ed));
  moveSibling(ed, c, 1);
  moveSibling(ed, c, 1);
  check("...and back down to the end", order(ed) === "a b c", order(ed));
}
{
  const ed = freshEditor();
  moveSibling(ed, byClass(ed, "b"), 1);
  ed.undo();
  check("one undo reverses a reorder", order(ed) === "a b c", order(ed));
}

// ── navigation ───────────────────────────────────────────────────────────────
console.log("\nnavigation");
{
  const ed = freshEditor();
  const a = byClass(ed, "a");
  ed.select(a);
  check("↓ selects the next sibling", selectSibling(ed, a, 1) && ed.selection === byClass(ed, "b"));
  check("↑ selects the previous", selectSibling(ed, ed.selection!, -1) && ed.selection === a);
  check("↑ at the start is a no-op", selectSibling(ed, a, -1) === false);
  check("...and does NOT wrap around to the end", ed.selection === a);
}
{
  const ed = freshEditor();
  const b = byClass(ed, "b");
  check("→ selects the first child", selectFirstChild(ed, b) && ed.selection === byClass(ed, "b1"));
  check("→ on a leaf is a no-op", selectFirstChild(ed, byClass(ed, "b1")) === false);
  check("← selects the parent", selectParent(ed, byClass(ed, "b1")) && ed.selection === b);
  check("← at the tree root reports false, so Escape can fall back to deselect", selectParent(ed, rootId(ed)) === false);
}

// ── group + cut ──────────────────────────────────────────────────────────────
console.log("\ngroup + cut");
{
  const ed = freshEditor();
  const b = byClass(ed, "b");
  const wrapperId = groupNode(ed, b);
  check("group returns the new wrapper's id", typeof wrapperId === "string");
  check("...and selects it", ed.selection === wrapperId);
  check("...the wrapper took the node's place in the parent", order(ed) === "a flex flex-col c", order(ed));
  const wrapper = ed.node(wrapperId!) as Node & { children: Node[] };
  check("...with the node inside it", wrapper.children.length === 1 && idOf(wrapper.children[0] as Node) === b);
  ed.undo();
  check("ONE undo unwraps it", order(ed) === "a b c", order(ed));
  check("...leaving no second step", !ed.canUndo);
}
{
  const ed = freshEditor();
  check("the root cannot be grouped — there is nowhere to put the wrapper", groupNode(ed, rootId(ed)) === undefined);
}
{
  const ed = freshEditor();
  cutNode(ed, byClass(ed, "b"));
  check("cut removes the node", order(ed) === "a c", order(ed));
  check("...and fills the clipboard", ed.canPaste);
  ed.undo();
  check("ONE undo restores it — not a half-done cut", order(ed) === "a b c", order(ed));
  check("...leaving no second step", !ed.canUndo);
}

console.log(failures === 0 ? "\nALL SHORTCUT PROBES PASSED" : `\n${failures} SHORTCUT PROBE(S) FAILED`);
if (failures) process.exit(1);
