/**
 * Isolated engine proof for node LOCKING (host-nodes-and-node-locking spec §B) —
 * no React, no DOM. Drives the real `Editor`: a locked node refuses remove/move
 * (either owner), stays editable (class/text), duplicates UNLOCKED, and the lock
 * round-trips through undo/redo. Bundled with esbuild + run under node.
 */
import { Editor } from "./src/site/engine";
import { el, stampTree } from "@wizeworks/silicaui-html";
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

// A page: body div → [ section(h2 + button), p ]
function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("section", "card p-6", {
          children: [
            el("h2", "text-xl", { text: "Title" }),
            el("button", "btn", { text: "Click" }),
          ],
        }),
        el("p", "foot", { text: "footer" }),
      ],
    }),
  );
  return new Editor({ version: "1", root, theme });
}
const sectionId = (ed: Editor) => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section"))!;
const hasSection = (ed: Editor) => !!find(ed.extract().root, (n) => n.kind === "element" && n.tag === "section");

// ── 1. remove refuses a locked node (both owners) ────────────────────────────
console.log("remove honors the lock");
for (const owner of ["author", "host"] as const) {
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, owner);
  check(`setLocked(${owner}) records the owner`, lockedOf(ed.node(id)) === owner);
  ed.remove(id);
  check(`${owner}-locked node survives remove()`, hasSection(ed));
}

// ── 2. unlocking re-enables remove ───────────────────────────────────────────
console.log("unlock re-enables remove");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "author");
  ed.remove(id);
  check("still present while locked", hasSection(ed));
  ed.setLocked(id, undefined);
  check("lock cleared", lockedOf(ed.node(id)) === undefined);
  ed.remove(id);
  check("removed once unlocked", !hasSection(ed));
}

// ── 3. host lock also clears via the primitive (host is never boxed out) ──────
console.log("host lock clears via the primitive");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "host");
  ed.setLocked(id, undefined); // the host's own unlock
  ed.remove(id);
  check("host-unlocked node removes", !hasSection(ed));
}

// ── 4. move refuses a locked node ────────────────────────────────────────────
// The section's real parent is the inner `div.page` (a page-body wrapper sits
// above it). `firstTag` reads that container's child order.
const pageId = (ed: Editor) => idOf(find(ed.extract().root, (n) => n.kind === "element" && n.class === "page"))!;
const firstTag = (ed: Editor): string | undefined => {
  const page = find(ed.extract().root, (n) => idOf(n) === pageId(ed)) as { children?: Node[] } | undefined;
  const first = page?.children?.[0];
  return first && typeof first !== "string" && first.kind !== "outlet" ? (first as { tag?: string }).tag : undefined;
};
console.log("move honors the lock");
{
  // control — an UNLOCKED move actually reorders (section index 0 → after <p>)
  const ctrl = freshEditor();
  ctrl.move(sectionId(ctrl), pageId(ctrl), 2);
  check("unlocked move reorders (section leaves index 0)", firstTag(ctrl) !== "section");

  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "author");
  ed.move(id, pageId(ed), 2); // try the same reorder
  check("locked node keeps its position (still index 0)", firstTag(ed) === "section");
}

// ── 5. locked node stays EDITABLE (lock is structural only) ───────────────────
console.log("locked node stays editable");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "author");
  ed.setClass(id, "card p-8 bg-base-200");
  check("class edit applies under lock", find(ed.extract().root, (n) => idOf(n) === id)?.class === "card p-8 bg-base-200");
}

// ── 6. duplicate is allowed and the copy is UNLOCKED ─────────────────────────
console.log("duplicate clears the clone lock");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "host");
  const copyId = ed.duplicate(id)!;
  check("duplicate returns a new id", typeof copyId === "string" && copyId !== id);
  check("original stays locked", lockedOf(ed.node(id)) === "host");
  check("the copy is unlocked", lockedOf(ed.node(copyId)) === undefined);
  check("the copy is removable", (ed.remove(copyId), !find(ed.extract().root, (n) => idOf(n) === copyId)));
}

// ── 7. setLocked is undoable ─────────────────────────────────────────────────
console.log("lock round-trips through undo/redo");
{
  const ed = freshEditor();
  const id = sectionId(ed);
  ed.setLocked(id, "author");
  ed.undo();
  check("undo removes the lock", lockedOf(ed.node(id)) === undefined);
  ed.redo();
  check("redo restores the lock", lockedOf(ed.node(id)) === "author");
}

console.log(failures === 0 ? "\nALL LOCK PROBES PASSED" : `\n${failures} LOCK PROBE(S) FAILED`);
if (failures) process.exit(1);
