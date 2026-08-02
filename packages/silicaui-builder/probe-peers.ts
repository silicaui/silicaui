/**
 * Isolated engine proof for OTHER EDITORS — presence in, claims honored. No
 * React, no DOM.
 *
 * The thing that has to be true, and the only reason a claim is engine-level
 * rather than chrome: EVERY node mutation refuses inside a held subtree, not
 * just the handful a canvas happens to route through. The editing spine has
 * eighteen of them; a claim honored by fifteen is worse than none, because the
 * three that slip through are the ones nobody tests and they silently overwrite
 * someone mid-sentence. So the list below is deliberately exhaustive against
 * the engine's public write surface — if a mutation is added and not routed
 * through `locateEditable`, this is what says so.
 *
 * The other half is what a claim must NOT do:
 *  - never block a REMOTE op (the holder's own edits arrive that way);
 *  - never touch the document, the op log, or the undo stack (it is presence,
 *    not state — a claim that survived a reload would be a support ticket);
 *  - never block a READ (you can look at what someone else is editing, and the
 *    Inspector saying who has it is the whole point).
 */
import { Editor } from "./src/site/engine";
import type { Peer } from "./src/site/engine";
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
const idOf = (n: Node | undefined): string => (n && n.kind !== "outlet" ? n.id ?? "" : "");
/** A node's text, read BY ID — never by tag. `duplicate` puts a second `<h2>` in
 *  the tree, and a tag search then answers about the copy. */
const textOf = (ed: Editor, id: string): unknown => {
  const n = ed.node(id);
  return n && n.kind !== "outlet" ? n.children?.[0] : undefined;
};

// A page: body div → [ section(h2 + button), p ]
function freshEditor(): Editor {
  const root = stampTree(
    el("div", "page", {
      children: [
        el("section", "card p-6", {
          children: [el("h2", "text-xl", { text: "Title" }), el("button", "btn", { text: "Click" })],
        }),
        el("p", "text-sm", { text: "Body" }),
      ],
    }),
  );
  return new Editor({ root, theme });
}

const ANA: Peer = { id: "sock_ana", name: "Ana" };

// ── 1. presence in, presence out ────────────────────────────────────────────
console.log("the roster round-trips and settles");
{
  const ed = freshEditor();
  check("no peers by default", ed.peers.length === 0);

  let events = 0;
  ed.subscribe((e) => {
    if (e.kinds.includes("peers")) events++;
  });

  ed.setPeers([{ ...ANA, selection: ["x"] }]);
  check("setting a roster emits once", events === 1);
  check("the roster reads back", ed.peers[0]?.name === "Ana");

  // A presence heartbeat carrying no news is the common case — every relay tick
  // sends the full roster. Re-rendering every ring on the canvas for it would
  // make co-editing feel like a slideshow.
  ed.setPeers([{ ...ANA, selection: ["x"] }]);
  check("an identical roster is a no-op", events === 1);

  ed.setPeers([{ ...ANA, selection: ["y"] }]);
  check("a changed selection emits", events === 2);

  ed.setPeers([]);
  check("clearing emits and empties", events === 3 && ed.peers.length === 0);
}

// ── 2. every mutation refuses inside a claim ────────────────────────────────
console.log("\na claimed subtree refuses every node mutation");
{
  const ed = freshEditor();
  const root = ed.extract().root;
  const sectionId = idOf(find(root, (n) => n.kind === "element" && n.tag === "section"));
  const headingId = idOf(find(root, (n) => n.kind === "element" && n.tag === "h2"));
  const paraId = idOf(find(root, (n) => n.kind === "element" && n.tag === "p"));

  ed.setPeers([{ ...ANA, claim: [sectionId] }]);

  check("the claim resolves to its holder", ed.claimOn(sectionId)?.name === "Ana");
  check("…and covers a DESCENDANT, not just the claim root", ed.claimOn(headingId)?.name === "Ana");
  check("…and nothing outside it", ed.claimOn(paraId) === undefined);

  const before = JSON.stringify(ed.extract().root);
  const unchanged = (label: string) =>
    check(label, JSON.stringify(ed.extract().root) === before);

  ed.setClass(headingId, "text-3xl");
  unchanged("setClass");
  ed.setClassToken(headingId, ["text-xl", "text-3xl"], "text-3xl");
  unchanged("setClassToken");
  ed.setProp(headingId, "size", "lg");
  unchanged("setProp");
  ed.setAttr(headingId, "title", "hi");
  unchanged("setAttr");
  ed.setText(headingId, "Hijacked");
  unchanged("setText");
  ed.setChildren(sectionId, []);
  unchanged("setChildren");
  ed.setLabel(headingId, "Renamed");
  unchanged("setLabel");
  ed.setTag(headingId, "h3");
  unchanged("setTag");
  ed.setData(headingId, { kind: "value", ref: "product.title" });
  unchanged("setData");
  ed.setBehavior(headingId, { name: "modal" } as never);
  unchanged("setBehavior");
  ed.setLocked(headingId, "author");
  unchanged("setLocked");
  ed.insert(el("span", "", { text: "nope" }), sectionId);
  unchanged("insert (into a held parent)");
  ed.remove(headingId);
  unchanged("remove");
  ed.move(headingId, idOf(find(ed.extract().root, (n) => n.kind === "element" && n.tag === "div")), 0);
  unchanged("move (out of a held subtree)");
  ed.move(paraId, sectionId, 0);
  unchanged("move (INTO a held subtree)");
  ed.createSymbol("Nope", headingId);
  unchanged("createSymbol");

  // insertRelative delegates to `insert`, and the delegation is the bit worth
  // pinning: an early version fell back to appending at the ROOT when the target
  // resolved to nothing, which would have turned "refused" into "silently landed
  // somewhere else".
  ed.insertRelative(el("span", "", { text: "nope" }), headingId);
  unchanged("insertRelative");

  // Undo is untouched by a claim, deliberately: the stack describes edits made
  // before it appeared, and refusing an undo would strand the author's own work.
  check("nothing above reached the undo stack", ed.canUndo === false);
}

// ── 3. what a claim must NOT do ─────────────────────────────────────────────
console.log("\na claim is advisory, not correctness machinery");
{
  const ed = freshEditor();
  const root = ed.extract().root;
  const sectionId = idOf(find(root, (n) => n.kind === "element" && n.tag === "section"));
  const headingId = idOf(find(root, (n) => n.kind === "element" && n.tag === "h2"));
  const paraId = idOf(find(root, (n) => n.kind === "element" && n.tag === "p"));
  ed.setPeers([{ ...ANA, claim: [sectionId] }]);

  // THE one that matters: the holder's own edits arrive as remote ops. A claim
  // that blocked them would make the feature actively destructive — the peer
  // typing inside their own claim would find their work silently dropped here.
  const applied = ed.applyRemoteOps([
    { target: { scope: "page", id: ed.activePage }, kind: "node.setText", nodeId: headingId, text: "Ana's edit" },
  ]);
  check("a REMOTE op inside a claim still applies", applied.applied === 1);
  check(
    "…and really landed",
    textOf(ed, headingId) === "Ana's edit",
  );

  // Reads: the Inspector has to be able to describe a node it can't edit,
  // otherwise the rail goes blank exactly when the author needs to be told why.
  check("a read still resolves", ed.node(headingId) !== undefined);
  check("selection still lands", ed.select(headingId) === true);
  check("copy still works", (ed.copy(headingId), ed.canPaste));

  // Duplicate is allowed for the same reason a LOCKED node's is: the copy lands
  // beside the subtree, not in it, so it changes nothing the holder can see.
  const copyId = ed.duplicate(sectionId);
  check("duplicate is allowed (the copy lands outside the claim)", !!copyId);
  check("…and the copy is NOT itself claimed", ed.claimOn(copyId!) === undefined);

  // Everything outside the claim keeps working — a claim is a hole in the page,
  // not a mode.
  ed.setText(paraId, "Still mine");
  check("an unheld sibling is still editable", textOf(ed, paraId) === "Still mine");

  // Releasing is just a roster without it — no op, no document change.
  ed.setPeers([ANA]);
  ed.setText(headingId, "Mine now");
  check("releasing the claim restores editing", textOf(ed, headingId) === "Mine now");

  // A claim never becomes document state — the extracted site is what a host
  // persists, and presence has no business in it.
  check("no trace of the claim in the extracted site", !JSON.stringify(ed.extractSite()).includes("sock_ana"));
}

// ── 4. tree scope + degenerate rosters ──────────────────────────────────────
console.log("\nedge cases a relay will actually produce");
{
  const ed = freshEditor();
  const root = ed.extract().root;
  const sectionId = idOf(find(root, (n) => n.kind === "element" && n.tag === "section"));

  // A peer editing the FRAME while we're on a page body. The id isn't in this
  // tree, so it says nothing here — the same tree-scoping `select` has.
  ed.setPeers([{ ...ANA, claim: ["node_from_another_tree"] }]);
  check("a claim on another tree blocks nothing", ed.claimOn(sectionId) === undefined);

  // Two peers claiming one subtree is a host bug (a claim is exclusive), but it
  // has to resolve to a stable answer rather than flicker between two names.
  ed.setPeers([
    { ...ANA, claim: [sectionId] },
    { id: "sock_ben", name: "Ben", claim: [sectionId] },
  ]);
  check("a contested claim resolves to the first holder", ed.claimOn(sectionId)?.name === "Ana");

  // A claim on a node that gets deleted (by its holder, from another client)
  // must not strand the tree: the index still holds the id, and nothing else in
  // the page should care.
  ed.setPeers([{ ...ANA, claim: ["gone_" + sectionId] }]);
  check("a claim on a deleted node blocks nothing", ed.claimOn(sectionId) === undefined);
}

console.log(
  failures ? `\n❌ ${failures} failure(s)\n` : "\n✅ peers draw, claims hold, and neither touches the document\n",
);
process.exit(failures ? 1 : 0);
