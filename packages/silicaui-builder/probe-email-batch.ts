/**
 * Isolated proof for ACTION BATCHING in the EMAIL engine — the twin of
 * `probe-batch.ts`, which covers the site engine.
 *
 * Same invariant: ONE user action emits exactly ONE event, carrying EVERY kind
 * it touched, and takes exactly ONE history step. Before this, every structural
 * op fired twice (the mutation, then the selection move behind it), and
 * `addTemplate`/`removeTemplate`/`renameTemplate` pushed history by hand outside
 * the commit chokepoint.
 *
 * Why this matters even though the email builder isn't collaborative: a double
 * emit is a double `onChange`, which is a double save round-trip per keystroke
 * burst, and a manual history push outside the chokepoint is a step that any
 * later change to `commit` silently fails to cover.
 */
import { EmailEditor } from "./src/email/engine";
import type { ChangeEvent, ChangeKind } from "./src/email/engine";
import { DEFAULT_EMAIL_COLORS, emptyEmailDocument } from "./src/email/schema";
import type { EmailNode, TextNode } from "./src/email/schema";
import { defaultMakeId } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

/**
 * body → section → text, built as a DOCUMENT rather than via `insert` calls, so
 * the editor starts with an empty undo stack. (Seeding through the editing API
 * would leave setup edits on the stack and make "one action = one undo step"
 * unmeasurable.)
 */
function freshEditor(): EmailEditor {
  const doc = emptyEmailDocument(defaultMakeId, DEFAULT_EMAIL_COLORS);
  (doc.root.children as unknown as EmailNode[]).push({
    id: defaultMakeId(),
    kind: "section",
    children: [{ id: defaultMakeId(), kind: "text", html: "Hello" }],
  } as unknown as EmailNode);
  return new EmailEditor(doc);
}
const firstSection = (ed: EmailEditor): string => (ed.root.children[0] as EmailNode).id;
const firstText = (ed: EmailEditor): string => {
  const section = ed.root.children[0] as unknown as { children: EmailNode[] };
  return section.children[0]!.id;
};

/** Record every event an action emits. */
function record(ed: EmailEditor, action: () => void): ChangeEvent[] {
  const seen: ChangeEvent[] = [];
  const unsub = ed.subscribe((e) => seen.push({ kind: e.kind, kinds: [...e.kinds] }));
  action();
  unsub();
  return seen;
}
const show = (events: ChangeEvent[]) => JSON.stringify(events.map((e) => e.kinds));

function single(label: string, events: ChangeEvent[], expected: ChangeKind[]): void {
  check(`${label} emits exactly one event`, events.length === 1, `got ${events.length}: ${show(events)}`);
  if (events.length !== 1) return;
  const got = [...events[0]!.kinds].sort();
  check(
    `${label} reports ${JSON.stringify([...expected].sort())}`,
    JSON.stringify(got) === JSON.stringify([...expected].sort()),
    show(events),
  );
}

// ── 1. structural ops fold their selection move in ───────────────────────────
console.log("structural ops carry their selection change");
{
  const ed = freshEditor();
  single("insert", record(ed, () => ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed))), [
    "structure",
    "selection",
  ]);
}
{
  const ed = freshEditor();
  single("duplicate", record(ed, () => ed.duplicate(firstText(ed))), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  const id = firstText(ed);
  ed.select(id);
  single("remove", record(ed, () => ed.remove(id)), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  const cols = ed.insert({ id: "", kind: "columns", children: [] } as unknown as EmailNode, firstSection(ed))!;
  ed.addColumn(cols);
  ed.addColumn(cols);
  const colId = (ed.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id;
  single("duplicateColumn", record(ed, () => ed.duplicateColumn(colId)), ["structure", "selection"]);
}
{
  const ed = freshEditor();
  const cols = ed.insert({ id: "", kind: "columns", children: [] } as unknown as EmailNode, firstSection(ed))!;
  ed.addColumn(cols);
  ed.addColumn(cols);
  const colId = (ed.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id;
  ed.select(colId);
  single("removeColumn", record(ed, () => ed.removeColumn(colId)), ["structure", "selection"]);
}

// ── 2. template ops (previously manual pushHistory) ──────────────────────────
console.log("template ops run through the chokepoint");
{
  const ed = freshEditor();
  single("addTemplate (nothing selected)", record(ed, () => ed.addTemplate("Second")), ["template"]);
}
{
  // With a selection to clear, the clear is REPORTED — the batch must describe
  // everything that changed, not just the headline mutation.
  const ed = freshEditor();
  ed.select(firstText(ed));
  single("addTemplate (clearing a selection)", record(ed, () => ed.addTemplate("Second")), ["template", "selection"]);
}
{
  const ed = freshEditor();
  ed.select(firstText(ed));
  const id = ed.activeTemplate;
  ed.addTemplate("Second");
  single("removeTemplate", record(ed, () => ed.removeTemplate(id)), ["template"]);
}
{
  const ed = freshEditor();
  single("renameTemplate", record(ed, () => ed.renameTemplate(ed.activeTemplate, "Renamed")), ["template"]);
}

// ── 3. single-kind ops stay single ───────────────────────────────────────────
console.log("single-kind actions are unchanged");
{
  const ed = freshEditor();
  single("update", record(ed, () => ed.update<TextNode>(firstText(ed), { html: "Changed" })), ["props"]);
  single("setData", record(ed, () => ed.setData(firstText(ed), { kind: "value", ref: "a.b" })), ["props"]);
  single("setSubject", record(ed, () => ed.setSubject("Hi")), ["meta"]);
  single("setPreheader", record(ed, () => ed.setPreheader("Preview")), ["meta"]);
  single("select", record(ed, () => ed.select(firstSection(ed))), ["selection"]);
  single("moveUp", record(ed, () => (ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed)), ed.moveUp(firstText(ed)))), [
    "structure",
    "selection",
  ]);
}

// ── 4. `kind` reports the most structural kind ───────────────────────────────
console.log("kind is the most structural of kinds");
{
  const ed = freshEditor();
  const ev = record(ed, () => ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed)))[0]!;
  check("insert kind === 'structure' (not 'selection')", ev.kind === "structure", `got ${ev.kind}`);
}
{
  const ed = freshEditor();
  const ev = record(ed, () => ed.addTemplate("Second"))[0]!;
  check("addTemplate kind === 'template'", ev.kind === "template", `got ${ev.kind}`);
}

// ── 5. no-op actions stay SILENT ─────────────────────────────────────────────
console.log("no-op actions emit nothing");
{
  const ed = freshEditor();
  check("remove(missing id)", record(ed, () => ed.remove("nope")).length === 0);
  check("update(missing id)", record(ed, () => ed.update(("nope"), { })).length === 0);
  check("renameTemplate(unchanged)", record(ed, () => ed.renameTemplate(ed.activeTemplate, ed.templatesView.templates[0]!.name)).length === 0);
  check("removeTemplate(last remaining)", record(ed, () => ed.removeTemplate(ed.activeTemplate)).length === 0);
  check("select(already selected)", (ed.select(firstText(ed)), record(ed, () => ed.select(firstText(ed))).length === 0));
  check("setActiveTemplate(already active)", record(ed, () => ed.setActiveTemplate(ed.activeTemplate)).length === 0);
  check("copy() is silent (clipboard is view state)", record(ed, () => ed.copy(firstText(ed))).length === 0);
  const cols = ed.insert({ id: "", kind: "columns", children: [] } as unknown as EmailNode, firstSection(ed))!;
  ed.addColumn(cols);
  const only = (ed.node(cols) as unknown as { children: EmailNode[] }).children[0]!.id;
  check("removeColumn(last column in row)", record(ed, () => ed.removeColumn(only)).length === 0);
  check("moveUp(already first)", record(ed, () => ed.moveUp(firstSection(ed))).length === 0);
  // Every subject/preheader call site commits on BLUR, so tabbing through the
  // field re-sends the current value. Without this guard that would be a junk
  // undo step per focus.
  ed.setSubject("Hello");
  check("setSubject(unchanged)", record(ed, () => ed.setSubject("Hello")).length === 0);
  ed.setPreheader("Preview");
  check("setPreheader(unchanged)", record(ed, () => ed.setPreheader("Preview")).length === 0);
}

// ── 5b. subject/preheader are undoable ───────────────────────────────────────
// They used to mutate with no history push, so a ctrl-z after typing a subject
// reverted the previous STRUCTURAL edit instead — the editor appearing to eat
// work at random.
console.log("subject/preheader edits are undoable");
{
  const ed = freshEditor();
  ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed));
  const afterStructural = JSON.stringify(ed.extractProject());

  ed.setSubject("Launch day");
  check("subject applied", ed.subject === "Launch day");
  ed.undo();
  check("undo reverts the SUBJECT", ed.subject !== "Launch day");
  check("…and leaves the structural edit alone", JSON.stringify(ed.extractProject()) === afterStructural);
  ed.redo();
  check("redo restores the subject", ed.subject === "Launch day");
}
{
  const ed = freshEditor();
  const before = ed.preheader;
  ed.setPreheader("Open me");
  ed.undo();
  check("undo reverts the preheader", ed.preheader === before);
}
{
  // One committed edit = one undo step, even across both fields.
  const ed = freshEditor();
  ed.setSubject("A");
  ed.setPreheader("B");
  ed.undo();
  check("undo steps are independent (preheader first)", ed.preheader !== "B" && ed.subject === "A");
  ed.undo();
  check("…then the subject", ed.subject !== "A");
  check("history is exhausted", !ed.canUndo);
}

// ── 6. ONE action = ONE undo step ────────────────────────────────────────────
console.log("one action = one undo step");
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractProject());
  ed.addTemplate("Second");
  check("addTemplate changed the project", JSON.stringify(ed.extractProject()) !== before);
  ed.undo();
  check("one undo fully reverts addTemplate", JSON.stringify(ed.extractProject()) === before);
  check("no second undo step remains", !ed.canUndo);
}
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractProject());
  ed.renameTemplate(ed.activeTemplate, "Renamed");
  ed.undo();
  check("one undo reverts renameTemplate", JSON.stringify(ed.extractProject()) === before);
  check("no second undo step remains", !ed.canUndo);
}
{
  const ed = freshEditor();
  ed.addTemplate("Second");
  const after = JSON.stringify(ed.extractProject());
  const id = ed.activeTemplate;
  ed.removeTemplate(id);
  ed.undo();
  check("one undo reverts removeTemplate", JSON.stringify(ed.extractProject()) === after);
}
{
  const ed = freshEditor();
  const before = JSON.stringify(ed.extractProject());
  ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed));
  ed.undo();
  check("one undo reverts insert", JSON.stringify(ed.extractProject()) === before);
  check("no second undo step remains", !ed.canUndo);
}

// ── 7. undo/redo are single actions ──────────────────────────────────────────
console.log("undo/redo emit one event");
{
  const ed = freshEditor();
  const id = firstText(ed);
  ed.select(id);
  ed.remove(id);
  check("undo emits exactly one event", record(ed, () => ed.undo()).length === 1);
  check("redo emits exactly one event", record(ed, () => ed.redo()).length === 1);
  check("exhausted undo is silent", (ed.undo(), ed.undo(), ed.undo(), record(ed, () => ed.undo()).length === 0));
}
{
  const ed = freshEditor();
  const newId = ed.insert({ id: "", kind: "divider" } as unknown as EmailNode, firstSection(ed))!;
  check("inserted node is selected", ed.selection === newId);
  const events = record(ed, () => ed.undo());
  check("undo emits one event", events.length === 1, show(events));
  check("…reporting the stranded selection", events[0]?.kinds.includes("selection") === true, show(events));
  check("…and the selection is actually cleared", ed.selection === undefined);
}

// ── 8. nested actions collapse ───────────────────────────────────────────────
console.log("nested actions collapse into the outermost");
{
  const ed = freshEditor();
  ed.copy(firstText(ed));
  ed.select(firstSection(ed));
  const before = JSON.stringify(ed.extractProject());
  single("paste", record(ed, () => ed.paste()), ["structure", "selection"]);
  ed.undo();
  check("one undo reverts paste", JSON.stringify(ed.extractProject()) === before);
}

console.log(failures === 0 ? "\nALL EMAIL BATCH PROBES PASSED" : `\n${failures} EMAIL BATCH PROBE(S) FAILED`);
if (failures) process.exit(1);
