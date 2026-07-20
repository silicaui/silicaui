/**
 * Isolated proof for the EMAIL semantic-operation contract — the twin of
 * `probe-ops.ts`.
 *
 * The headline test is convergence: two engines seeded from the same project,
 * one driven by ordinary editing, the other fed only the ops that editing
 * emitted. Byte-identical results mean the vocabulary is sufficient — every
 * mutation the engine can perform is expressible, and nothing leaks through as
 * an unexpressed side effect. That is not answerable by inspecting op shapes
 * one at a time.
 *
 * Around it: coverage (no mutation is silent), the concurrency properties that
 * make ops commute, the closed schema's rules surviving remote application, and
 * the ingress paths.
 */
import { EmailEditor } from "./src/email/engine";
import type { ChangeEvent } from "./src/email/engine";
import type { Op } from "./src/email/ops";
import { DEFAULT_EMAIL_COLORS, emptyEmailDocument } from "./src/email/schema";
import type { EmailNode, EmailProject, TextNode } from "./src/email/schema";
import { defaultMakeId } from "@wizeworks/silicaui-html";
import { toEmailHtml } from "./src/email/projector";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

/** Key-order-independent deep compare. */
function stable(v: unknown): string {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") {
      return Object.fromEntries(
        Object.keys(x as Record<string, unknown>).sort().map((k) => [k, walk((x as Record<string, unknown>)[k])]),
      );
    }
    return x;
  };
  return JSON.stringify(walk(v));
}

/**
 * The shared starting project, run once through an `EmailEditor` so it is
 * already NORMALIZED (ordering keys backfilled) — what a host stores after the
 * first save, and what every later client loads.
 */
const NORMALIZED: EmailProject = (() => {
  const doc = emptyEmailDocument(defaultMakeId, DEFAULT_EMAIL_COLORS);
  // REPLACE the starter section rather than appending — otherwise every
  // `children[0]` lookup below addresses the default one, not this fixture.
  (doc.root.children as unknown as EmailNode[]).length = 0;
  (doc.root.children as unknown as EmailNode[]).push({
    id: "sec_1",
    kind: "section",
    bg: "#ffffff",
    paddingX: 24,
    paddingY: 24,
    children: [
      { id: "txt_1", kind: "text", html: "Hello", align: "left", color: "#111111", fontSize: 16, fontWeight: "normal", lineHeight: 1.5 },
      { id: "txt_2", kind: "text", html: "World", align: "left", color: "#111111", fontSize: 16, fontWeight: "normal", lineHeight: 1.5 },
    ],
  } as unknown as EmailNode);
  return new EmailEditor(doc).extractProject();
})();

const seed = (): EmailProject => structuredClone(NORMALIZED);

function taped(project: EmailProject): { ed: EmailEditor; ops: Op[]; events: ChangeEvent[] } {
  const ed = new EmailEditor(structuredClone(project));
  const ops: Op[] = [];
  const events: ChangeEvent[] = [];
  ed.subscribe((e) => {
    events.push(e);
    ops.push(...e.ops);
  });
  return { ed, ops, events };
}

const sectionId = (ed: EmailEditor) => (ed.root.children[0] as EmailNode).id;
const textIds = (ed: EmailEditor) =>
  ((ed.root.children[0] as unknown as { children: EmailNode[] }).children).map((c) => c.id);
const text = (o: unknown) => ({ id: "", kind: "text", html: String(o), align: "left", color: "#111111", fontSize: 16, fontWeight: "normal", lineHeight: 1.5 }) as unknown as EmailNode;
const divider = () => ({ id: "", kind: "divider", color: "#dddddd", thickness: 1 }) as unknown as EmailNode;

// ── 1. no mutation is silent ─────────────────────────────────────────────────
console.log("every stored-state mutation emits an op");
{
  const cases: Array<[string, (ed: EmailEditor) => void]> = [
    ["update", (ed) => ed.update<TextNode>(textIds(ed)[0]!, { html: "Changed" })],
    ["setData", (ed) => ed.setData(textIds(ed)[0]!, { kind: "value", ref: "a.b" })],
    ["setSubject", (ed) => ed.setSubject("Hi")],
    ["setPreheader", (ed) => ed.setPreheader("Preview")],
    ["insert", (ed) => ed.insert(divider(), sectionId(ed))],
    ["remove", (ed) => ed.remove(textIds(ed)[0]!)],
    ["move", (ed) => ed.move(textIds(ed)[1]!, sectionId(ed), 0)],
    ["duplicate", (ed) => ed.duplicate(textIds(ed)[0]!)],
    ["moveUp", (ed) => ed.moveUp(textIds(ed)[1]!)],
    ["moveDown", (ed) => ed.moveDown(textIds(ed)[0]!)],
    ["paste", (ed) => (ed.copy(textIds(ed)[0]!), ed.select(sectionId(ed)), ed.paste())],
    ["addTemplate", (ed) => ed.addTemplate("Second")],
    ["renameTemplate", (ed) => ed.renameTemplate(ed.activeTemplate, "Renamed")],
    ["removeTemplate", (ed) => (ed.addTemplate("Second"), ed.removeTemplate(ed.templatesView.templates[0]!.id))],
    ["addColumn", (ed) => ed.addColumn(ed.insert({ id: "", kind: "columns", children: [], stackOnMobile: true } as unknown as EmailNode, sectionId(ed))!)],
    ["removeColumn", (ed) => {
      const cols = ed.insert({ id: "", kind: "columns", children: [], stackOnMobile: true } as unknown as EmailNode, sectionId(ed))!;
      ed.addColumn(cols);
      ed.addColumn(cols);
      ed.removeColumn((ed.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id);
    }],
    ["duplicateColumn", (ed) => {
      const cols = ed.insert({ id: "", kind: "columns", children: [], stackOnMobile: true } as unknown as EmailNode, sectionId(ed))!;
      ed.addColumn(cols);
      ed.duplicateColumn((ed.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id);
    }],
    ["setColorDefaults", (ed) => ed.setColorDefaults({ ...DEFAULT_EMAIL_COLORS, primary: "#ff0000" })],
  ];
  for (const [name, run] of cases) {
    const { ed, ops } = taped(seed());
    const before = ops.length;
    run(ed);
    const produced = ops.slice(before);
    check(`${name} emits ≥1 op`, produced.length > 0, "emitted nothing");
    const fellBack = produced.filter((o) => o.kind === "project.replace");
    check(`${name} does not fall back to project.replace`, fellBack.length === 0, `${fellBack.length} replace op(s)`);
  }
}
console.log("view-only actions emit none, undo uses the escape hatch");
{
  const { ed, ops } = taped(seed());
  ed.select(sectionId(ed));
  ed.copy(sectionId(ed));
  ed.addTemplate("Second");
  const after = ops.length;
  ed.setActiveTemplate(ed.templatesView.templates[0]!.id);
  ed.select(textIds(ed)[0]!);
  check("selection / template switch / copy emit no ops", ops.length === after);
  const before = ops.length;
  ed.undo();
  const undoOps = ops.slice(before);
  check("undo emits exactly one project.replace", undoOps.length === 1 && undoOps[0]!.kind === "project.replace");
}

// ── 2. CONVERGENCE — the real test ───────────────────────────────────────────
console.log("a peer fed only ops converges on the same project");
{
  const start = seed();
  const { ed: a, ops } = taped(start);
  const b = new EmailEditor(structuredClone(start));

  const sec = sectionId(a);
  a.setSubject("Launch day");
  a.setPreheader("Open me");
  a.update<TextNode>(textIds(a)[0]!, { html: "Welcome", fontSize: 24, fontWeight: "bold" });
  a.setData(textIds(a)[1]!, { kind: "value", ref: "customer.name" });
  a.insert(divider(), sec, 1);
  a.insert(text("Third"), sec, 0);
  a.duplicate(textIds(a)[1]!);
  a.move(textIds(a)[0]!, sec, 3);
  a.moveUp(textIds(a)[2]!);
  a.moveDown(textIds(a)[0]!);
  a.remove(textIds(a)[1]!);
  // Columns — the rebalance path.
  const cols = a.insert({ id: "", kind: "columns", children: [], stackOnMobile: true } as unknown as EmailNode, sec)!;
  a.addColumn(cols);
  a.addColumn(cols);
  a.addColumn(cols);
  const firstCol = (a.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id;
  a.duplicateColumn(firstCol);
  a.removeColumn(firstCol);
  a.insert(text("In a column"), (a.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id);
  // A second template, edited while active — a different target scope.
  const t2 = a.addTemplate("Follow-up");
  a.setSubject("Second subject");
  a.insert(divider(), sectionId(a));
  a.renameTemplate(t2, "Follow up");
  a.setActiveTemplate(a.templatesView.templates[0]!.id);
  // …and a brand resync that repaints every auto-colored node across BOTH.
  a.setColorDefaults({ ...DEFAULT_EMAIL_COLORS, primary: "#ff0055", baseContent: "#222222" });

  const result = b.applyRemoteOps(ops);
  check("every op applied", result.dropped.length === 0, `dropped ${result.dropped.map((o) => o.kind).join(", ")}`);
  check("op count is non-trivial", ops.length >= 25, `${ops.length} ops`);
  const same = stable(a.extractProject()) === stable(b.extractProject());
  check("the two projects are identical", same);
  if (!same) {
    const sa = stable(a.extractProject());
    const sb = stable(b.extractProject());
    let i = 0;
    while (i < sa.length && sa[i] === sb[i]) i++;
    console.log(`      diverges at ${i}:\n        A …${sa.slice(Math.max(0, i - 60), i + 90)}\n        B …${sb.slice(Math.max(0, i - 60), i + 90)}`);
  }
}
console.log("convergence is order-preserving under batching");
{
  const start = seed();
  const { ed: a, ops } = taped(start);
  const sec = sectionId(a);
  a.insert(text("1"), sec, 0);
  a.insert(text("2"), sec, 1);
  a.insert(text("3"), sec, 1);
  a.move(textIds(a)[0]!, sec, 3);
  a.update<TextNode>(textIds(a)[0]!, { html: "moved" });

  const bulk = new EmailEditor(structuredClone(start));
  bulk.applyRemoteOps(ops);
  const drip = new EmailEditor(structuredClone(start));
  for (const op of ops) drip.applyRemoteOps([op]);
  check("one batch == many batches", stable(bulk.extractProject()) === stable(drip.extractProject()));
  check("…and both match the author", stable(a.extractProject()) === stable(bulk.extractProject()));
}

// ── 3. the properties that make ops commute ──────────────────────────────────
console.log("node.update is a shallow merge, so two authors don't collide");
{
  const shared = seed();
  const p1 = new EmailEditor(structuredClone(shared));
  const p2 = new EmailEditor(structuredClone(shared));
  const t1: Op[] = [];
  const t2: Op[] = [];
  p1.subscribe((e) => t1.push(...e.ops));
  p2.subscribe((e) => t2.push(...e.ops));
  const id = textIds(p1)[0]!;
  p1.update<TextNode>(id, { html: "Rewritten copy" }); // one author edits the words
  p2.update<TextNode>(id, { fontSize: 32 }); // the other restyles it
  p1.applyRemoteOps(t2);
  p2.applyRemoteOps(t1);
  const node = p1.node(id) as unknown as { html: string; fontSize: number };
  check("author 1 keeps their copy AND gains the size", node.html === "Rewritten copy" && node.fontSize === 32, stable(node));
  check("both peers converge", stable(p1.extractProject()) === stable(p2.extractProject()));
}
console.log("concurrent inserts into one section don't collide");
{
  const shared = seed();
  const p1 = new EmailEditor(structuredClone(shared));
  const p2 = new EmailEditor(structuredClone(shared));
  const t1: Op[] = [];
  const t2: Op[] = [];
  p1.subscribe((e) => t1.push(...e.ops));
  p2.subscribe((e) => t2.push(...e.ops));
  const sec = sectionId(p1);
  p1.insert(text("from-1"), sec, 1); // both target the SAME slot
  p2.insert(text("from-2"), sec, 1);
  p1.applyRemoteOps(t2);
  p2.applyRemoteOps(t1);
  const htmls = (ed: EmailEditor) =>
    ((ed.node(sec) as unknown as { children: EmailNode[] }).children).map((c) => (c as unknown as { html?: string }).html ?? "");
  check("both inserts survive", htmls(p1).length === 4, `${htmls(p1).length}`);
  check("neither overwrote the other", htmls(p1).includes("from-1") && htmls(p1).includes("from-2"), stable(htmls(p1)));
  check("both peers agree on the ORDER", stable(htmls(p1)) === stable(htmls(p2)), `${stable(htmls(p1))} vs ${stable(htmls(p2))}`);
}
console.log("a columns rebalance lands atomically");
{
  const start = seed();
  const { ed: a, ops } = taped(start);
  const cols = a.insert({ id: "", kind: "columns", children: [], stackOnMobile: true } as unknown as EmailNode, sectionId(a))!;
  a.addColumn(cols);
  a.addColumn(cols);
  a.addColumn(cols);
  const b = new EmailEditor(structuredClone(start));
  b.applyRemoteOps(ops);
  const widths = ((b.node(cols) as unknown as { children: { widthPct: number }[] }).children).map((c) => c.widthPct);
  check("the row is replicated", widths.length === 3, `${widths.length} columns`);
  check("widths sum to 100", Math.abs(widths.reduce((x, y) => x + y, 0) - 100) < 0.5, stable(widths));
  check("peer matches author", stable(a.extractProject()) === stable(b.extractProject()));
}

// ── 4. the closed schema still governs remote ops ────────────────────────────
// The site engine's tree is open; email's is not. A remote op must not be able
// to smuggle in a structure the local editing API would have refused.
console.log("the closed schema is enforced on remote ops too");
{
  const b = new EmailEditor(seed());
  const sec = sectionId(b);
  const bad: Op = {
    target: { scope: "template", id: b.activeTemplate },
    kind: "node.insert",
    parentId: sec,
    ord: "a1",
    // A section inside a section — `canHold` forbids it locally.
    node: { id: "smuggled", kind: "section", bg: "#fff", paddingX: 0, paddingY: 0, children: [] } as unknown as EmailNode,
  };
  const before = stable(b.extractProject());
  const res = b.applyRemoteOps([bad]);
  check("an illegal nesting is rejected", res.dropped.length === 1 && res.applied === 0);
  check("…and the document is untouched", stable(b.extractProject()) === before);
}
{
  const b = new EmailEditor(seed());
  const sec = sectionId(b);
  const bad: Op = { target: { scope: "template", id: b.activeTemplate }, kind: "node.move", nodeId: sec, parentId: textIds(b)[0]!, ord: "a1" };
  const before = stable(b.extractProject());
  check("a cycle-creating move is rejected", b.applyRemoteOps([bad]).dropped.length === 1);
  check("…and the document is untouched", stable(b.extractProject()) === before);
}
{
  const b = new EmailEditor(seed());
  const bad: Op = { target: { scope: "template", id: "no-such-template" }, kind: "node.remove", nodeId: "x" };
  check("an op for a missing template is dropped", b.applyRemoteOps([bad]).dropped.length === 1);
}
{
  const start = seed();
  const { ed: a, ops } = taped(start);
  a.insert(text("once"), sectionId(a));
  const b = new EmailEditor(structuredClone(start));
  b.applyRemoteOps(ops);
  const after = stable(b.extractProject());
  check("a re-delivered insert is dropped, not duplicated", b.applyRemoteOps(ops).dropped.length === 1);
  check("…and the document is unchanged", stable(b.extractProject()) === after);
}
{
  const start = seed();
  const { ed: a, ops } = taped(start);
  a.update<TextNode>(textIds(a)[0]!, { html: "x" });
  const b = new EmailEditor(structuredClone(start));
  b.remove(textIds(b)[0]!); // an intervening edit removed it
  const res = b.applyRemoteOps(ops);
  check("a stale op is dropped, not fatal", res.dropped.length === 1 && res.applied === 0);
}

// ── 5. remote application: no echo, no history poisoning ─────────────────────
console.log("remote ops stay out of the local history and the outbound stream");
{
  const start = seed();
  const other = new EmailEditor(structuredClone(start));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  other.update<TextNode>(textIds(other)[0]!, { html: "Theirs" });

  const { ed: b, ops: out, events } = taped(start);
  const evBefore = events.length;
  b.applyRemoteOps(tape);
  check("remote ops emit NO outbound ops (no echo)", out.length === 0, `${out.length} echoed`);
  check("…but a change event still fires (the UI must repaint)", events.length === evBefore + 1);
  check("…carrying the real kinds", events[evBefore]!.kinds.includes("props"), stable(events[evBefore]!.kinds));
  check("remote ops do NOT become undoable", !b.canUndo);
}
{
  // The sharper case: local history that ALREADY EXISTS when a remote op lands.
  const start = seed();
  const other = new EmailEditor(structuredClone(start));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  const shared = textIds(other)[0]!;
  other.update<TextNode>(shared, { html: "Theirs" });

  const mine = new EmailEditor(structuredClone(start));
  mine.update<TextNode>(textIds(mine)[1]!, { html: "Mine" });
  check("local history exists before the remote op", mine.canUndo);
  mine.applyRemoteOps(tape);
  check("local history is invalidated by a remote op", !mine.canUndo && !mine.canRedo);
  mine.undo(); // a user pressing ctrl-z anyway
  check("undo cannot revert the other author's edit", (mine.node(shared) as unknown as { html: string }).html === "Theirs");
}
{
  const start = seed();
  const other = new EmailEditor(structuredClone(start));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  other.update<TextNode>(textIds(other)[0]!, { html: "Theirs" });
  const mine = new EmailEditor(structuredClone(start));
  mine.setHistoryDelegate({ undo: () => {}, redo: () => {}, canUndo: () => true, canRedo: () => true });
  mine.applyRemoteOps(tape);
  check("a delegated history is left intact", mine.canUndo && mine.canRedo);
}
{
  // A remote delete of the locally-selected node must clear the selection.
  const start = seed();
  const other = new EmailEditor(structuredClone(start));
  const tape: Op[] = [];
  other.subscribe((e) => tape.push(...e.ops));
  const victim = textIds(other)[0]!;
  other.remove(victim);
  const mine = new EmailEditor(structuredClone(start));
  mine.select(victim);
  mine.applyRemoteOps(tape);
  check("a remote delete clears the stranded selection", mine.selection === undefined);
}

// ── 6. replaceState + seq + delegation ───────────────────────────────────────
console.log("replaceState resyncs and resets history");
{
  const { ed, ops } = taped(seed());
  ed.update<TextNode>(textIds(ed)[0]!, { html: "local" });
  check("local history exists", ed.canUndo);
  const before = ops.length;
  const authoritative = new EmailEditor(seed());
  authoritative.update<TextNode>(textIds(authoritative)[0]!, { html: "server truth" });
  ed.replaceState(authoritative.extractProject(), 42);
  check("project is the server's", stable(ed.extractProject()) === stable(authoritative.extractProject()));
  check("undo history is cleared", !ed.canUndo && !ed.canRedo);
  check("seq is recorded", ed.baseSeq === 42);
  check("no ops echoed", ops.length === before);
}
{
  const ed = new EmailEditor(seed());
  check("seq starts at 0", ed.baseSeq === 0);
  ed.ackSeq(7);
  check("ackSeq advances", ed.baseSeq === 7);
  ed.ackSeq(3);
  check("…and never goes backwards", ed.baseSeq === 7);
}
console.log("undo/redo delegate to the host when asked");
{
  const ed = new EmailEditor(seed());
  ed.update<TextNode>(textIds(ed)[0]!, { html: "x" });
  const calls: string[] = [];
  ed.setHistoryDelegate({ undo: () => calls.push("undo"), redo: () => calls.push("redo"), canUndo: () => true, canRedo: () => false });
  check("delegation is reported", ed.historyIsDelegated);
  check("canUndo comes from the delegate", ed.canUndo === true);
  check("canRedo comes from the delegate", ed.canRedo === false);
  const snapshot = stable(ed.extractProject());
  ed.undo();
  ed.redo();
  check("undo/redo call out instead of running locally", stable(calls) === stable(["undo", "redo"]));
  check("…and the local project is untouched", stable(ed.extractProject()) === snapshot);
  ed.setHistoryDelegate(undefined);
  check("clearing restores the local stack", !ed.historyIsDelegated && ed.canUndo);
}

// ── 7. ordering keys never reach sent markup ─────────────────────────────────
console.log("ordering keys are authoring-only");
{
  const ed = new EmailEditor(seed());
  ed.insert(text("visible"), sectionId(ed));
  
  const html = toEmailHtml(ed.extractProject().templates[0]!.document);
  check("no `ord` in the projected HTML", !html.includes("ord="), "ord leaked into output");
  check("the content still renders", html.includes("visible"));
}

console.log(failures === 0 ? "\nALL EMAIL OPS PROBES PASSED" : `\n${failures} EMAIL OPS PROBE(S) FAILED`);
if (failures) process.exit(1);
