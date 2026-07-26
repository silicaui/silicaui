/**
 * Isolated engine proof for email node LOCKING — the email twin of
 * `probe-lock.ts` (host-nodes-and-node-locking spec §B), over the closed email
 * schema. No React, no DOM: drives the real `EmailEditor`.
 *
 * A locked node refuses remove/move (either owner, and either side of a
 * sibling swap), stays EDITABLE, duplicates UNLOCKED, round-trips through
 * undo/redo and through a remote op — and never reaches the sent HTML.
 */
import { EmailEditor } from "./src/email/engine";
import { toEmailHtml } from "./src/email/projector";
import type { Op } from "./src/email/ops";
import type { ColumnsNode, SectionNode, TextNode } from "./src/email/schema";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

/** A fresh editor with THREE sections, so there's always a sibling to swap
 *  with above and below the one under test. */
function freshEditor(): EmailEditor {
  const ed = new EmailEditor();
  const first = ed.root.children[0]!;
  ed.duplicate(first.id);
  ed.duplicate(first.id);
  return ed;
}
const sectionIds = (ed: EmailEditor) => ed.root.children.map((c) => c.id);
const has = (ed: EmailEditor, id: string) => ed.node(id) !== undefined;

// ── 1. remove refuses a locked node (both owners) ────────────────────────────
console.log("remove honors the lock");
for (const owner of ["author", "host"] as const) {
  const ed = freshEditor();
  const id = sectionIds(ed)[1]!;
  ed.setLocked(id, owner);
  check(`setLocked(${owner}) records the owner`, ed.node(id)?.locked === owner);
  ed.remove(id);
  check(`an ${owner}-locked section survives remove()`, has(ed, id));
}

// ── 2. move refuses a locked node ────────────────────────────────────────────
console.log("move honors the lock");
{
  const ed = freshEditor();
  const [a, b] = sectionIds(ed);
  ed.setLocked(b!, "host");
  ed.move(b!, ed.root.id, 0);
  check("a locked section keeps its position", sectionIds(ed)[0] === a);

  // A swap moves BOTH nodes, so a locked sibling blocks it from either side.
  ed.moveUp(b!);
  check("moveUp on the locked node is refused", sectionIds(ed)[1] === b);
  ed.moveDown(a!);
  check("moveDown INTO the locked node's slot is refused", sectionIds(ed)[0] === a);
  ed.moveUp(sectionIds(ed)[2]!);
  check("moveUp into the locked node's slot is refused", sectionIds(ed)[1] === b);
}

// ── 3. a locked node is still EDITABLE ───────────────────────────────────────
// The lock is structural, not editorial: fixing a typo in a pinned legal
// footer must stay possible, or hosts would pin nothing.
console.log("a locked node stays editable");
{
  const ed = freshEditor();
  const id = sectionIds(ed)[0]!;
  ed.setLocked(id, "host");
  ed.update<SectionNode>(id, { paddingY: 40 });
  check("props still patch", (ed.node(id) as SectionNode).paddingY === 40);

  const childId = (ed.node(id) as SectionNode).children[0]!.id;
  ed.update<TextNode>(childId, { html: "Fixed typo" });
  check("an unlocked child still edits", (ed.node(childId) as TextNode).html === "Fixed typo");
  ed.remove(childId);
  check("an unlocked child of a locked node is still removable", !has(ed, childId));
}

// ── 4. duplicate clears the lock on the COPY ─────────────────────────────────
// Otherwise duplicating a pinned block mints a second undeletable one.
console.log("duplicate produces an unlocked copy");
{
  const ed = freshEditor();
  const id = sectionIds(ed)[0]!;
  ed.setLocked(id, "host");
  const copyId = ed.duplicate(id)!;
  check("duplicate returns a new id", typeof copyId === "string" && copyId !== id);
  check("the original stays locked", ed.node(id)?.locked === "host");
  check("the copy is unlocked", ed.node(copyId)?.locked === undefined);
  check("the copy is removable", (ed.remove(copyId), !has(ed, copyId)));
}

// ── 5. columns honor the lock too ────────────────────────────────────────────
console.log("columns honor the lock");
{
  const ed = freshEditor();
  const sectionId = sectionIds(ed)[0]!;
  const colsId = ed.insert(
    {
      id: "x",
      kind: "columns",
      stackOnMobile: true,
      children: [
        { id: "a", kind: "column", widthPct: 50, children: [] },
        { id: "b", kind: "column", widthPct: 50, children: [] },
      ],
    },
    sectionId,
  )!;
  const cols = ed.node(colsId) as ColumnsNode;
  const colId = cols.children[0]!.id;
  ed.setLocked(colId, "host");
  ed.removeColumn(colId);
  check("removeColumn refuses a locked column", has(ed, colId));
  const dupId = ed.duplicateColumn(colId)!;
  check("duplicateColumn's copy is unlocked", ed.node(dupId)?.locked === undefined);
}

// ── 6. undo/redo round-trip ──────────────────────────────────────────────────
console.log("lock round-trips through undo/redo");
{
  const ed = freshEditor();
  const id = sectionIds(ed)[0]!;
  ed.setLocked(id, "author");
  ed.undo();
  check("undo removes the lock", ed.node(id)?.locked === undefined);
  ed.redo();
  check("redo restores the lock", ed.node(id)?.locked === "author");
}

// ── 7. the lock travels as an op, and applies remotely ───────────────────────
console.log("node.setLocked is a first-class op");
{
  const ed = freshEditor();
  const id = sectionIds(ed)[0]!;
  const seen: Op[] = [];
  ed.subscribe((e) => seen.push(...e.ops));
  ed.setLocked(id, "host");
  const op = seen.find((o) => o.kind === "node.setLocked");
  check("setLocked emits node.setLocked", op !== undefined);
  check("the op carries the owner", op?.kind === "node.setLocked" && op.locked === "host");

  // A peer applying that op ends up in the same state.
  const peer = new EmailEditor(ed.extractProject());
  peer.applyRemoteOps(seen.filter((o) => o.kind === "node.setLocked"));
  check("a peer applying it locks the same node", peer.node(id)?.locked === "host");

  // …and clearing round-trips as `null` (JSON drops `undefined`).
  const cleared: Op[] = [];
  ed.subscribe((e) => cleared.push(...e.ops));
  ed.setLocked(id, undefined);
  const clearOp = cleared.find((o) => o.kind === "node.setLocked");
  check("clearing emits locked: null", clearOp?.kind === "node.setLocked" && clearOp.locked === null);
  peer.applyRemoteOps(cleared.filter((o) => o.kind === "node.setLocked"));
  check("the peer unlocks too", peer.node(id)?.locked === undefined);
}

// ── 8. a REMOTE remove is not re-adjudicated ─────────────────────────────────
// Deliberate, and the same call the site engine makes: locks are an authoring
// policy the originating peer already enforced. Refusing here would leave two
// clients permanently disagreeing about what the document contains.
console.log("remote ops are authoritative");
{
  const ed = freshEditor();
  const id = sectionIds(ed)[1]!;
  ed.setLocked(id, "host");
  const target = ed.templatesView.activeId;
  const { applied } = ed.applyRemoteOps([{ target: { scope: "template", id: target }, kind: "node.remove", nodeId: id }]);
  check("a remote remove of a locked node applies", applied === 1 && !has(ed, id));
}

// ── 9. the lock never reaches sent markup ────────────────────────────────────
console.log("locked is authoring metadata only");
{
  const ed = freshEditor();
  ed.setLocked(sectionIds(ed)[0]!, "host");
  const html = toEmailHtml(ed.extract());
  check("no 'locked' attribute in the output", !/locked/i.test(html));
}

console.log(`\n${failures === 0 ? "✅ email lock: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
