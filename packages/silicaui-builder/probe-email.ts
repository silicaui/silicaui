/**
 * Isolated engine proof for the email editor (no React, no DOM). Drives the
 * `EmailEditor` through insert/move/remove/duplicate/undo across the closed
 * section→columns→column→content schema, then checks the projector emits
 * valid-looking table markup. Bundled with esbuild and run under node.
 */
import { EmailEditor } from "./src/email/engine";
import { toEmailHtml } from "./src/email/projector";
import type { ButtonNode, ColumnsNode, TextNode } from "./src/email/schema";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

// ── 1. a fresh editor has one section with intro text ────────────────────────
console.log("fresh document");
{
  const ed = new EmailEditor();
  check("root is a body with one section", ed.root.kind === "body" && ed.root.children.length === 1);
  check("the section holds one text node", ed.root.children[0]!.children.length === 1);
}

// ── 2. structural rules: content can't land directly under body/columns ──────
console.log("structural rules");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;
  const textId = ed.root.children[0]!.children[0]!.id;

  const bogus: TextNode = { id: "x", kind: "text", html: "nope", align: "left", color: "#000", fontSize: 14, lineHeight: 20 };
  check("inserting content directly under the body is refused", ed.insert(bogus, ed.root.id) === undefined);

  const columns: ColumnsNode = {
    id: "x",
    kind: "columns",
    stackOnMobile: true,
    children: [
      { id: "a", kind: "column", widthPct: 50, children: [] },
      { id: "b", kind: "column", widthPct: 50, children: [] },
    ],
  };
  const colsId = ed.insert(columns, sectionId);
  check("a columns row inserts into a section", typeof colsId === "string");

  const col = ed.node(colsId!) as ColumnsNode;
  const btn: ButtonNode = {
    id: "x",
    kind: "button",
    label: "Shop now",
    href: "https://example.com",
    bg: "#111827",
    color: "#ffffff",
    radius: 6,
    align: "center",
    paddingX: 20,
    paddingY: 12,
  };
  check("a button inserts into a column", typeof ed.insert(btn, col.children[0]!.id) === "string");
  check("a button is refused directly under a columns row", ed.insert(btn, colsId!) === undefined);
  check("the original section text is untouched", ed.node(textId)?.kind === "text");
}

// ── 3. edit, duplicate, remove, undo/redo ─────────────────────────────────────
console.log("edit / duplicate / remove / undo");
{
  const ed = new EmailEditor();
  const textId = ed.root.children[0]!.children[0]!.id;
  ed.update<TextNode>(textId, { html: "Hello world", color: "#ff0000" });
  check("update patches the node", (ed.node(textId) as TextNode).html === "Hello world");

  const dupId = ed.duplicate(textId);
  check("duplicate creates a sibling", ed.root.children[0]!.children.length === 2 && dupId !== textId);

  ed.remove(dupId!);
  check("remove drops it back to one", ed.root.children[0]!.children.length === 1);

  ed.undo(); // undoes remove
  check("undo restores the duplicate", ed.root.children[0]!.children.length === 2);
  ed.undo(); // undoes duplicate
  check("second undo removes the duplicate", ed.root.children[0]!.children.length === 1);
  ed.undo(); // undoes the html/color update
  check("third undo reverts the text edit", (ed.node(textId) as TextNode).html !== "Hello world");
  ed.redo();
  check("redo re-applies the text edit", (ed.node(textId) as TextNode).html === "Hello world");
}

// ── 4. projector emits table-based, inline-styled markup ─────────────────────
console.log("projector");
{
  const ed = new EmailEditor();
  ed.setSubject("Welcome!");
  ed.setPreheader("Glad you're here.");
  const html = toEmailHtml(ed.extract());
  check("no external stylesheet link", !html.includes("<link"));
  check("no class-based layout (table + inline style only)", !/class="(?!sui-col)/.test(html));
  check("subject lands in <title>", html.includes("<title>Welcome!</title>"));
  check("preheader is present but visually hidden", html.includes("Glad you're here.") && html.includes("display:none"));
  check("body renders as a table", html.includes("<table") && html.includes("role=\"presentation\""));
  check("mso conditional fallback present for Outlook", html.includes("[if mso]"));
}

console.log(`\n${failures === 0 ? "✅ email engine: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
