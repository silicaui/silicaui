/**
 * Isolated engine proof for the email editor (no React, no DOM). Drives the
 * `EmailEditor` through insert/move/remove/duplicate/undo across the closed
 * section→columns→column→content schema, then checks the projector emits
 * valid-looking table markup. Bundled with esbuild and run under node.
 */
import { EmailEditor } from "./src/email/engine";
import { toEmailHtml } from "./src/email/projector";
import { EMAIL_PALETTE } from "./src/email/palette";
import { resolveEmailTree } from "./src/email/resolve";
import type { EmailResolveHost } from "./src/email/resolve";
import type { ButtonNode, ColumnsNode, DataScope, EmailBody, EmailColorDefaults, HtmlNode, Resolved, SectionNode, TextNode } from "./src/email/schema";

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

// ── 7. multi-template project: add/rename/remove/switch + whole-project undo ──
console.log("multi-template project");
{
  const ed = new EmailEditor();
  const firstId = ed.templatesView.activeId;
  check("a fresh editor starts with exactly one template", ed.templatesView.templates.length === 1);

  const secondId = ed.addTemplate("Welcome series #2");
  check("addTemplate appends a second template and switches to it", ed.templatesView.templates.length === 2 && ed.activeTemplate === secondId);
  check("the new template is a fresh, independent document (one seeded section)", ed.root.children.length === 1);

  ed.setActiveTemplate(firstId);
  check("setActiveTemplate switches back", ed.activeTemplate === firstId);
  const firstSectionId = ed.root.children[0]!.id;
  ed.update(ed.root.children[0]!.children[0]!.id, { html: "Edited on template 1 only" });
  check("an edit on template 1 doesn't touch template 2", ed.root.children[0]!.children[0]!.kind === "text");

  ed.setActiveTemplate(secondId);
  check("template 2's own content is untouched by template 1's edit", (ed.root.children[0]!.children[0] as TextNode).html !== "Edited on template 1 only");

  ed.renameTemplate(secondId, "Renamed");
  check("renameTemplate updates the roster label", ed.templatesView.templates.find((t) => t.id === secondId)?.name === "Renamed");

  const project = ed.extractProject();
  check("extractProject returns every template, not just the active one", project.templates.length === 2);
  const extracted = ed.extract();
  check("extract() still returns just the ACTIVE template's document (unchanged contract)", extracted.root.children[0]!.id !== firstSectionId);

  ed.removeTemplate(firstId);
  check("removeTemplate drops a template and falls back to the remaining one", ed.templatesView.templates.length === 1 && ed.activeTemplate === secondId);
  ed.removeTemplate(secondId);
  check("removeTemplate refuses to drop the LAST template", ed.templatesView.templates.length === 1);

  // Undo restores the whole PROJECT (template roster + content), same as the
  // site engine's whole-site history spans page add/remove/rename.
  const ed2 = new EmailEditor();
  const t1 = ed2.templatesView.activeId;
  ed2.addTemplate("T2");
  check("history: 2 templates exist after addTemplate", ed2.templatesView.templates.length === 2);
  ed2.setActiveTemplate(t1);
  ed2.setActiveTemplate(ed2.templatesView.templates[1]!.id);
  ed2.undo();
  check(
    "history: undo removes the added template in ONE step (switching is not its own history entry)",
    ed2.templatesView.templates.length === 1 && ed2.activeTemplate === t1,
  );
  ed2.redo();
  check("history: redo re-adds it", ed2.templatesView.templates.length === 2);
}

// ── 8. data binding: resolveEmailTree + toEmailHtml(doc, resolver) ───────────
// The Q23/Q24/Q25 keystone — bind/repeat/resolving-projector ported from the
// site engine's already-shipped resolveTree/BuilderHost seam.
console.log("data binding");
{
  const textNode: TextNode = {
    id: "txt1",
    kind: "text",
    html: "static placeholder",
    align: "left",
    color: "#000",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: 24,
    data: { kind: "value", ref: "greeting" },
  };
  const buttonNode: ButtonNode = {
    id: "btn1",
    kind: "button",
    label: "Click me",
    href: "#",
    bg: "#000",
    color: "#fff",
    radius: 4,
    align: "center",
    paddingX: 16,
    paddingY: 8,
    data: { kind: "value", ref: "productUrl", attr: "href" },
  };
  const actionButton: ButtonNode = {
    id: "btn2",
    kind: "button",
    label: "Add to cart",
    href: "",
    bg: "#000",
    color: "#fff",
    radius: 4,
    align: "center",
    paddingX: 16,
    paddingY: 8,
    data: { kind: "action", ref: "add-to-cart" },
  };
  const section: SectionNode = {
    id: "sec1",
    kind: "section",
    bg: "#eee",
    paddingX: 24,
    paddingY: 24,
    data: { kind: "value", ref: "banner", attr: "bg" },
    children: [textNode, buttonNode, actionButton],
  };
  const body: EmailBody = {
    id: "body1",
    kind: "body",
    width: 600,
    bg: "#fff",
    contentBg: "#fff",
    fontFamily: "Arial",
    children: [section],
  };

  const host: EmailResolveHost = {
    resolveBinding: (ref: string, scope: DataScope): Resolved => {
      if (ref === "greeting") return { value: "Hi <script>alert(1)</script> & welcome" };
      if (ref === "productUrl") return { value: "https://example.com/p/123" };
      if (ref === "banner") return { value: "#ff0000" };
      if (ref === "hidden-field") return { value: "x", visible: false };
      if (ref === "item.name") return { value: (scope.item as { name: string } | undefined)?.name ?? "" };
      return { value: "" };
    },
  };

  check("absent BOTH hooks: resolveEmailTree returns the SAME reference (zero-cost no-op)", resolveEmailTree(body, {}) === body);

  const resolved = resolveEmailTree(body, host);
  const rSection = resolved.children[0]!;
  const rText = rSection.children[0] as TextNode;
  const rButton = rSection.children[1] as ButtonNode;
  const rAction = rSection.children[2] as ButtonNode;

  check("value bind fills a TextNode's html with the resolved value", rText.html.includes("Hi") && rText.html.includes("welcome"));
  check("a bound text value is HTML-escaped (no raw <script> tag survives)", !rText.html.includes("<script>") && rText.html.includes("&lt;script&gt;"));
  check("a bound text value escapes bare & too", rText.html.includes("&amp;"));
  check("value+attr bind fills exactly the target field (button href)", rButton.href === "https://example.com/p/123");
  check("value+attr bind leaves OTHER fields untouched (button label)", rButton.label === "Click me");
  check(
    "value+attr bind on a CONTAINER (section.bg) still resolves its children — the Q22 defect the site version has, fixed here",
    rSection.bg === "#ff0000" && rText.html.includes("welcome") && rButton.href === "https://example.com/p/123",
  );
  check("an action bind is NEVER touched — stays an inert marker for the host's own wiring", rAction.data?.kind === "action" && rAction.href === "");
  check("a resolved node's `data` marker is consumed (not carried into the output)", rText.data === undefined && rButton.data === undefined);

  // Collection repeat + empty-collection placeholder convention.
  const template: TextNode = { id: "item-tpl", kind: "text", html: "x", align: "left", color: "#000", fontSize: 14, fontWeight: "normal", lineHeight: 20, data: { kind: "value", ref: "item.name" } };
  const repeatSection: SectionNode = { id: "sec2", kind: "section", bg: "#fff", paddingX: 0, paddingY: 0, data: { kind: "collection", ref: "products" }, children: [template] };
  const repeatBody: EmailBody = { id: "body2", kind: "body", width: 600, bg: "#fff", contentBg: "#fff", fontFamily: "Arial", children: [repeatSection] };

  const items = [{ name: "Aurora Lamp" }, { name: "Solstice Mug" }, { name: "Nimbus Rug" }];
  const withItems = resolveEmailTree(repeatBody, { ...host, resolveCollection: () => items });
  const repeatedChildren = withItems.children[0]!.children as TextNode[];
  check("collection bind repeats children once per resolved item", repeatedChildren.length === 3);
  check("each repeated item resolves its own scoped binding (item.name threaded down)", repeatedChildren.map((c) => c.html).join("|") === "Aurora Lamp|Solstice Mug|Nimbus Rug");

  const withEmpty = resolveEmailTree(repeatBody, { ...host, resolveCollection: () => [] });
  check("an empty collection renders the authored template ONCE, as the editor's placeholder convention", (withEmpty.children[0]!.children as TextNode[]).length === 1);

  // omitWhenEmpty: opts OUT of the placeholder convention, dropping the node
  // entirely at zero items — same effect as a value bind's visible:false.
  const omitSection: SectionNode = { id: "sec2b", kind: "section", bg: "#fff", paddingX: 0, paddingY: 0, data: { kind: "collection", ref: "products", omitWhenEmpty: true }, children: [template] };
  const omitBody: EmailBody = { id: "body2b", kind: "body", width: 600, bg: "#fff", contentBg: "#fff", fontFamily: "Arial", children: [omitSection] };
  const omitEmpty = resolveEmailTree(omitBody, { ...host, resolveCollection: () => [] });
  check("omitWhenEmpty + zero items drops the node entirely, like visible:false", omitEmpty.children.length === 0);
  const omitNonEmpty = resolveEmailTree(omitBody, { ...host, resolveCollection: () => items });
  check("omitWhenEmpty only changes behavior at ZERO items — non-empty still repeats normally", (omitNonEmpty.children[0]!.children as TextNode[]).length === 3);

  // visible:false drops the node (and its subtree) from the resolved output.
  const hiddenSection: SectionNode = { id: "sec3", bg: "#fff", kind: "section", paddingX: 0, paddingY: 0, data: { kind: "value", ref: "hidden-field" }, children: [] };
  const hiddenBody: EmailBody = { id: "body3", kind: "body", width: 600, bg: "#fff", contentBg: "#fff", fontFamily: "Arial", children: [hiddenSection] };
  const withHidden = resolveEmailTree(hiddenBody, host);
  check("visible:false drops the bound node from the resolved tree", withHidden.children.length === 0);

  // End-to-end: a real EmailEditor + toEmailHtml(doc, resolver) — the actual
  // public path a host calls, not just the resolver internals.
  const ed = new EmailEditor();
  const introId = ed.root.children[0]!.children[0]!.id;
  ed.setData(introId, { kind: "value", ref: "greeting" });
  const html = toEmailHtml(ed.extract());
  check(
    "toEmailHtml with NO resolver leaves an authored bind unresolved (static projection unchanged)",
    html.includes("Start writing your email") && !html.includes("Hi &lt;script&gt;"),
  );
  const resolvedHtml = toEmailHtml(ed.extract(), host);
  check("toEmailHtml(doc, resolver) bakes the resolved value into the real output", resolvedHtml.includes("Hi") && resolvedHtml.includes("welcome") && !resolvedHtml.includes("Start writing your email"));
}

// ── 9. merge tokens: inline `{{ref}}` substitution (Q23) ─────────────────────
// The counterpart to §8's whole-field `data` bind: a sentence like "Hi
// {{customer.firstName}}, your order shipped" has no single field to bind
// wholesale, so each token resolves independently via the SAME
// `resolveBinding` hook, inside text.html/button.label/subject/preheader.
console.log("merge tokens");
{
  const host: EmailResolveHost = {
    resolveBinding: (ref: string, scope: DataScope): Resolved => {
      if (ref === "customer.firstName") return { value: "Jordan" };
      if (ref === "customer.company") return { value: "Acme & Co <Ltd>" };
      if (ref === "hidden") return { value: "x", visible: false };
      if (ref === "missing") return { value: undefined };
      if (ref === "item.name") return { value: (scope.item as { name: string } | undefined)?.name ?? "" };
      return { value: "" };
    },
  };

  const greetingText: TextNode = {
    id: "tok-txt",
    kind: "text",
    html: "Hi {{customer.firstName}}, welcome to {{customer.company}}!",
    align: "left",
    color: "#000",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: 24,
  };
  const tokenButton: ButtonNode = {
    id: "tok-btn",
    kind: "button",
    label: "View order, {{customer.firstName}}",
    href: "#",
    bg: "#000",
    color: "#fff",
    radius: 4,
    align: "center",
    paddingX: 16,
    paddingY: 8,
    data: { kind: "value", ref: "customer.firstName", attr: "href" },
  };
  const htmlNode: HtmlNode = { id: "tok-html", kind: "html", html: "<p>Raw {{customer.firstName}}</p>" };
  const missingHiddenText: TextNode = {
    id: "tok-txt2",
    kind: "text",
    html: "Missing:[{{missing}}] Hidden:[{{hidden}}]",
    align: "left",
    color: "#000",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: 24,
  };
  const tokSection: SectionNode = {
    id: "tok-sec",
    kind: "section",
    bg: "#fff",
    paddingX: 0,
    paddingY: 0,
    children: [greetingText, tokenButton, htmlNode, missingHiddenText],
  };
  const tokBody: EmailBody = { id: "tok-body", kind: "body", width: 600, bg: "#fff", contentBg: "#fff", fontFamily: "Arial", children: [tokSection] };

  const resolvedTok = resolveEmailTree(tokBody, host);
  const rGreeting = resolvedTok.children[0]!.children[0] as TextNode;
  const rTokBtn = resolvedTok.children[0]!.children[1] as ButtonNode;
  const rTokHtml = resolvedTok.children[0]!.children[2] as HtmlNode;
  const rMissingHidden = resolvedTok.children[0]!.children[3] as TextNode;

  check("no resolver: tokens pass through UNCHANGED (static projection)", resolveEmailTree(tokBody, {}).children[0]!.children[0] === greetingText);
  check("a text node with NO `data` bind still resolves its inline tokens", rGreeting.html.includes("Jordan"));
  check("multiple tokens in the same sentence all resolve", rGreeting.html === "Hi Jordan, welcome to Acme &amp; Co &lt;Ltd&gt;!");
  check("an inline token's resolved value is HTML-escaped inside text.html", rGreeting.html.includes("&amp;") && rGreeting.html.includes("&lt;Ltd&gt;"));
  check(
    "a button's label token resolves INDEPENDENTLY of its own whole-field href bind (both apply)",
    rTokBtn.label === "View order, Jordan" && rTokBtn.href === "Jordan",
  );
  check("HtmlNode.html is NEVER token-substituted — raw passthrough stays raw, even with a resolver wired", rTokHtml.html === "<p>Raw {{customer.firstName}}</p>");
  check("a missing (undefined) token value elides to empty string", rMissingHidden.html.includes("Missing:[]"));
  check("a visible:false token value elides to empty string too", rMissingHidden.html.includes("Hidden:[]"));

  // Tokens inside a collection repeat resolve against the per-item scope.
  const itemTok: TextNode = { id: "tok-item", kind: "text", html: "{{item.name}}", align: "left", color: "#000", fontSize: 14, fontWeight: "normal", lineHeight: 20 };
  const tokRepeatSection: SectionNode = { id: "tok-sec2", kind: "section", bg: "#fff", paddingX: 0, paddingY: 0, data: { kind: "collection", ref: "products" }, children: [itemTok] };
  const tokRepeatBody: EmailBody = { id: "tok-body2", kind: "body", width: 600, bg: "#fff", contentBg: "#fff", fontFamily: "Arial", children: [tokRepeatSection] };
  const items = [{ name: "Aurora Lamp" }, { name: "Solstice Mug" }];
  const withItems = resolveEmailTree(tokRepeatBody, { ...host, resolveCollection: () => items });
  const repeated = withItems.children[0]!.children as TextNode[];
  check("an inline token inside a repeated child resolves per-item, not just a whole-field bind", repeated.map((c) => c.html).join("|") === "Aurora Lamp|Solstice Mug");

  // End-to-end via toEmailHtml: subject + preheader (document-level, outside
  // the node tree resolveEmailTree walks) plus a text node, all in one pass.
  const ed = new EmailEditor();
  ed.setSubject("Hi {{customer.firstName}}, your order shipped");
  ed.setPreheader("From {{customer.company}}");
  const introId = ed.root.children[0]!.children[0]!.id;
  ed.update<TextNode>(introId, { html: "Welcome, {{customer.firstName}}!" });

  const staticHtml = toEmailHtml(ed.extract());
  check("toEmailHtml with NO resolver leaves subject/preheader/body tokens as literal text", staticHtml.includes("{{customer.firstName}}") && staticHtml.includes("<title>Hi {{customer.firstName}}, your order shipped</title>"));

  const resolvedEmailHtml = toEmailHtml(ed.extract(), host);
  check("toEmailHtml(doc, resolver) resolves the SUBJECT's token (<title>)", resolvedEmailHtml.includes("<title>Hi Jordan, your order shipped</title>"));
  check("toEmailHtml(doc, resolver) resolves the PREHEADER's token, escaped exactly ONCE (not double-escaped)", resolvedEmailHtml.includes("From Acme &amp; Co &lt;Ltd&gt;"));
  check("toEmailHtml(doc, resolver) resolves the BODY text's token", resolvedEmailHtml.includes("Welcome, Jordan!"));
  check("no unresolved `{{` tokens survive the resolved export", !resolvedEmailHtml.includes("{{customer"));
}

console.log(`\n${failures === 0 ? "✅ email engine: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
