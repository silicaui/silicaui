/**
 * Isolated engine proof for the email editor (no React, no DOM). Drives the
 * `EmailEditor` through insert/move/remove/duplicate/undo across the closed
 * section→columns→column→content schema, then checks the projector emits
 * valid-looking table markup. Bundled with esbuild and run under node.
 */
import { EmailEditor } from "./src/email/engine";
import { toEmailHtml } from "./src/email/projector";
import { EMAIL_PALETTE } from "./src/email/palette";
import type { ButtonNode, ColumnsNode, EmailColorDefaults, TextNode } from "./src/email/schema";

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

// ── 5. section background image projects with an Outlook VML fallback ────────
console.log("section background image");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;
  ed.update(sectionId, { bgImage: "https://example.com/bg.jpg" });
  const html = toEmailHtml(ed.extract());
  check("background attribute carries the image", html.includes('background="https://example.com/bg.jpg"'));
  check("VML v:fill fallback present for Outlook", html.includes("v:fill") && html.includes("v:rect"));
  check("bgcolor fallback still present alongside the image", html.includes('bgcolor="#ffffff"'));
}

// ── 5b. nested columns: a column can hold another columns row ────────────────
console.log("nested columns");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;
  const outer: ColumnsNode = { id: "x", kind: "columns", stackOnMobile: true, children: [
    { id: "a", kind: "column", widthPct: 50, children: [] },
    { id: "b", kind: "column", widthPct: 50, children: [] },
  ] };
  const outerId = ed.insert(outer, sectionId)!;
  const outerCol = ed.node(outerId) as ColumnsNode;
  const inner: ColumnsNode = { id: "y", kind: "columns", stackOnMobile: true, children: [
    { id: "c", kind: "column", widthPct: 50, children: [] },
    { id: "d", kind: "column", widthPct: 50, children: [] },
  ] };
  const innerId = ed.insert(inner, outerCol.children[0]!.id);
  check("a columns row inserts into a column (nesting)", typeof innerId === "string");
  const html = toEmailHtml(ed.extract());
  const tableCount = (html.match(/<table/g) ?? []).length;
  check("the projector renders BOTH the outer and inner MSO column tables", tableCount >= 2);
}

// ── 5c. add / duplicate / remove a column rebalances widthPct evenly ─────────
console.log("column add/duplicate/remove");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;
  const colsId = ed.insert({ id: "x", kind: "columns", stackOnMobile: true, children: [
    { id: "a", kind: "column", widthPct: 50, children: [] },
    { id: "b", kind: "column", widthPct: 50, children: [] },
  ] }, sectionId)!;

  ed.addColumn(colsId);
  let cols = ed.node(colsId) as ColumnsNode;
  check("addColumn appends a third column", cols.children.length === 3);
  check("widths rebalance evenly after add", cols.children.every((c) => Math.abs(c.widthPct - 100 / 3) < 0.01));

  const dupId = ed.duplicateColumn(cols.children[0]!.id);
  cols = ed.node(colsId) as ColumnsNode;
  check("duplicateColumn adds a fourth column", cols.children.length === 4 && typeof dupId === "string");
  check("widths rebalance evenly after duplicate", cols.children.every((c) => Math.abs(c.widthPct - 25) < 0.01));

  ed.removeColumn(cols.children[0]!.id);
  cols = ed.node(colsId) as ColumnsNode;
  check("removeColumn drops back to three", cols.children.length === 3);
  check("widths rebalance evenly after remove", cols.children.every((c) => Math.abs(c.widthPct - 100 / 3) < 0.01));

  ed.removeColumn(cols.children[0]!.id);
  ed.removeColumn(cols.children[0]!.id);
  cols = ed.node(colsId) as ColumnsNode;
  check("removeColumn refuses to drop the LAST column", cols.children.length === 1);
}

// ── 5d. brand color defaults seed the document AND new palette inserts ───────
console.log("brand color defaults");
{
  const brand: EmailColorDefaults = {
    primary: "#ff6600",
    primaryContent: "#000000",
    baseContent: "#111111",
    base100: "#fffbe6",
    base200: "#fff3c4",
    base300: "#ffe58a",
  };
  const ed = new EmailEditor(undefined, brand);
  check("a fresh document's body picks up the brand outer background", ed.root.bg === brand.base200);
  check("a fresh document's section picks up the brand content background", ed.root.children[0]!.bg === brand.base100);
  check("the seeded text picks up the brand text color", (ed.root.children[0]!.children[0] as TextNode).color === brand.baseContent);

  const btnItem = EMAIL_PALETTE.find((i) => i.key === "button")!;
  const btn = btnItem.make(ed.colorDefaults) as ButtonNode;
  check("a new Button insert picks up the brand primary color", btn.bg === brand.primary && btn.color === brand.primaryContent);

  const defaultItem = EMAIL_PALETTE.find((i) => i.key === "button")!;
  const defaultBtn = defaultItem.make() as ButtonNode;
  check("make() with no colors falls back to the neutral default", defaultBtn.bg !== brand.primary);
}

// ── 5e. Social / HTML / Video blocks insert and project correctly ────────────
console.log("social / html / video blocks");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;

  const socialItem = EMAIL_PALETTE.find((i) => i.key === "social")!;
  ed.insert(socialItem.make(), sectionId);
  const htmlItem = EMAIL_PALETTE.find((i) => i.key === "html")!;
  ed.insert(htmlItem.make(), sectionId);
  const videoItem = EMAIL_PALETTE.find((i) => i.key === "video")!;
  ed.insert(videoItem.make(), sectionId);

  check("all three insert into a section (content kinds)", ed.root.children[0]!.children.length === 4); // + seeded text

  ed.update(ed.root.children[0]!.children[1]!.id, {
    links: [{ platform: "facebook", url: "https://facebook.com/acme" }, { platform: "x", url: "https://x.com/acme" }],
  });
  ed.update(ed.root.children[0]!.children[2]!.id, { html: "<p>{{first_name}}, welcome!</p>" });
  ed.update(ed.root.children[0]!.children[3]!.id, { thumbnail: "https://example.com/thumb.jpg", href: "https://example.com/watch" });

  const html = toEmailHtml(ed.extract());
  check("social links render as anchors with the right hrefs", html.includes('href="https://facebook.com/acme"') && html.includes('href="https://x.com/acme"'));
  check("custom HTML passes through verbatim, INCLUDING the merge tag", html.includes("{{first_name}}, welcome!"));
  check("video renders a linked thumbnail", html.includes('href="https://example.com/watch"') && html.includes('src="https://example.com/thumb.jpg"'));
  check("video play button overlay is present", html.includes("&#9658;"));
}

// ── 6. fallbackParent resolves a sane target for a margin move/drop ──────────
console.log("fallbackParent");
{
  const ed = new EmailEditor();
  const sectionId = ed.root.children[0]!.id;
  check("a Section falls back to the body itself", ed.fallbackParent({ id: "x", kind: "section", bg: "#fff", paddingX: 0, paddingY: 0, children: [] }) === ed.root.id);
  const btn: ButtonNode = { id: "x", kind: "button", label: "Go", href: "", bg: "#000", color: "#fff", radius: 0, align: "left", paddingX: 0, paddingY: 0 };
  check("a content node falls back to the LAST section", ed.fallbackParent(btn) === sectionId);
}

console.log(`\n${failures === 0 ? "✅ email engine: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
