/**
 * Isolated engine proof for SELECTION LANDING (asks doc §15) — no React, no DOM.
 *
 * Selection is tree-scoped: an id only means something in the tree the spine is
 * currently pointed at. A host holding an id from somewhere else — a frame node
 * while the spine is on a page body, a node a concurrent editor already deleted,
 * a node in another email template — used to get a silent no-op that stored the
 * id anyway, so "wrong tree" and "gone" were indistinguishable AND the engine
 * was left holding a selection that resolved to nothing.
 *
 * Both engines now REFUSE such an id and say so. Covered here: the refusal, that
 * it leaves the existing selection alone, that a `setActiveTree` first makes the
 * same call land, and that every internal post-mutation select still lands (the
 * regression the validation could plausibly cause).
 */
import { Editor } from "./src/site/engine";
import { EmailEditor } from "./src/email/engine";
import { el, stampTree } from "@wizeworks/silicaui-html";
import type { Node, Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : ` — ${detail}`}`);
  if (!cond) failures++;
}
const theme: Theme = { name: "test", tokens: {} };

const pageRoot = (): Node =>
  stampTree(
    el("div", "page", {
      children: [el("section", "card", { children: [el("p", "", { text: "x" })] })],
    }),
  );
const fresh = (): Editor => new Editor({ version: "1", root: pageRoot(), theme });
const firstChildId = (root: Node): string => {
  const kids = root.kind === "outlet" ? [] : (root.children ?? []);
  const child = kids.find((c) => typeof c !== "string" && c.kind !== "outlet");
  return (child as { id: string }).id;
};

// ── 1. site: a cross-tree id is refused, and says so ─────────────────────────
console.log("site engine: select() reports whether it landed");
{
  const ed = fresh();
  const sectionId = firstChildId(ed.extract().root);
  const frameNodeId = firstChildId(ed.frame!.root);

  check("a node in the ACTIVE tree lands", ed.select(sectionId) === true);
  check("...and is the selection", ed.selection === sectionId);

  // The whole point: the frame id is real, it just isn't in the tree the spine
  // is pointed at. This is the "Show me" case — a finding in the header/footer.
  check("a FRAME id, while the spine is on the page body, does not land", ed.select(frameNodeId) === false);
  check("...and the existing selection survives", ed.selection === sectionId);
  check("...and no phantom node is resolvable", ed.selectedNode?.id === sectionId);

  // An id nobody has ever seen behaves the same way — from the host's side the
  // return value is what separates the two cases, not the engine's silence.
  check("a made-up id does not land", ed.select("no_such_node") === false);
  check("clearing always lands", ed.select(undefined) === true && ed.selection === undefined);

  // Point the spine at the frame and the SAME call now lands — which is the
  // recovery a host is supposed to make when it gets `false`.
  ed.setActiveTree("frame");
  check("after setActiveTree('frame') the frame id lands", ed.select(frameNodeId) === true);
  check("...and the page id no longer does", ed.select(sectionId) === false);
  check("...leaving the frame node selected", ed.selection === frameNodeId);
}

// ── 2. site: re-selecting the same node is still a no-op, but a LANDED one ────
console.log("site engine: an unchanged selection lands without emitting");
{
  const ed = fresh();
  const sectionId = firstChildId(ed.extract().root);
  ed.select(sectionId);
  let events = 0;
  const unsub = ed.subscribe(() => events++);
  check("re-selecting the same node lands", ed.select(sectionId) === true);
  check("...and emits nothing", events === 0);
  unsub();
}

// ── 3. site: every internal select still lands ───────────────────────────────
// The regression risk of validating: the engine selects nodes it has just
// created or moved, and each has to be in the tree by the time it does.
console.log("site engine: post-mutation selection still lands");
{
  const ed = fresh();
  const sectionId = firstChildId(ed.extract().root);
  const insertedId = ed.insert(el("p", "", { text: "new" }), sectionId)!;
  check("insert selects the new node", ed.selection === insertedId && !!ed.node(insertedId));

  const dupId = ed.duplicate(insertedId)!;
  check("duplicate selects the copy", ed.selection === dupId && !!ed.node(dupId));

  ed.createSymbol("Card", sectionId);
  check(
    "createSymbol selects the INSTANCE it left behind",
    !!ed.selection && !!ed.node(ed.selection),
    `selection=${ed.selection}`,
  );

  const ed2 = fresh();
  const section2 = firstChildId(ed2.extract().root);
  const child = ed2.insert(el("p", "", { text: "gone" }), section2)!;
  ed2.remove(child);
  check("remove falls back to a real parent", !!ed2.selection && !!ed2.node(ed2.selection), `selection=${ed2.selection}`);
}

// ── 4. email: same contract, scoped to the ACTIVE template ───────────────────
console.log("email engine: select() reports whether it landed");
{
  const ed = new EmailEditor();
  const firstRootId = ed.root.id;
  check("the document root lands", ed.select(firstRootId) === true);
  check("a made-up id does not", ed.select("nope") === false);
  check("...and the selection survives", ed.selection === firstRootId);
  check("clearing lands", ed.select(undefined) === true);

  // A second template is a second tree — the same "wrong tree" case the site
  // engine has between a page body and the frame.
  ed.addTemplate("Second");
  check("a node from the PREVIOUS template does not land", ed.select(firstRootId) === false);
  check("the active template's own root does", ed.select(ed.root.id) === true);
}

console.log(failures === 0 ? "\nALL SELECT PROBES PASSED" : `\n${failures} SELECT PROBE(S) FAILED`);
if (failures) process.exit(1);
