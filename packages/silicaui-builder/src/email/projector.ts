/**
 * The email HTML projector — EmailDocument → a self-contained, table-based,
 * fully inline-styled HTML string. This is a SEPARATE contract from
 * `@wizeworks/silicaui-html`'s `toHtml` (which projects to native elements + classes
 * for a live browser DOM): email clients strip `<style>` blocks (Gmail app),
 * ignore flexbox/grid/container-queries entirely, and route through Outlook's
 * Word rendering engine, which only trusts `<table>` layout + inline `style=`
 * attributes (plus `width`/`bgcolor` attributes as a belt-and-suspenders
 * fallback for clients that mangle inline styles).
 *
 * Mobile responsiveness is progressive enhancement only: a `<style>` media query
 * stacks columns and scales images for clients that keep `<style>`; clients that
 * strip it just show the desktop table, which still reads fine at a fixed width.
 */
import type {
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DividerNode,
  EmailDocument,
  ImageNode,
  SectionChild,
  SpacerNode,
  TextNode,
} from "./schema";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function styleAttr(rules: Record<string, string | number | undefined>): string {
  const parts = Object.entries(rules)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}:${v}`);
  return parts.length ? ` style="${esc(parts.join(";"))}"` : "";
}

function renderText(node: TextNode): string {
  return `<div${styleAttr({
    "text-align": node.align,
    color: node.color,
    "font-size": `${node.fontSize}px`,
    "line-height": `${node.lineHeight}px`,
  })}>${node.html}</div>`;
}

function renderImage(node: ImageNode): string {
  const img = `<img src="${esc(node.src)}" alt="${esc(node.alt)}" width="${node.width}"${styleAttr({
    display: "block",
    width: `${node.width}px`,
    "max-width": "100%",
    ...(node.align === "center" ? { margin: "0 auto" } : node.align === "right" ? { "margin-left": "auto" } : {}),
  })} />`;
  return node.href ? `<a href="${esc(node.href)}" target="_blank">${img}</a>` : img;
}

function renderButton(node: ButtonNode): string {
  // "Bulletproof" button: a table cell carries the background so Outlook (which
  // ignores border-radius/padding on <a>) still renders a solid, sized target.
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${styleAttr({
      margin: node.align === "center" ? "0 auto" : node.align === "right" ? "0 0 0 auto" : "0",
    })}><tr><td align="center" bgcolor="${node.bg}"${styleAttr({
      "border-radius": `${node.radius}px`,
      background: node.bg,
    })}>` +
    `<a href="${esc(node.href)}" target="_blank"${styleAttr({
      display: "inline-block",
      padding: `${node.paddingY}px ${node.paddingX}px`,
      color: node.color,
      "text-decoration": "none",
      "font-weight": "bold",
      "border-radius": `${node.radius}px`,
    })}>${esc(node.label)}</a></td></tr></table>`
  );
}

function renderDivider(node: DividerNode): string {
  return `<hr${styleAttr({
    border: "none",
    "border-top": `${node.thickness}px solid ${node.color}`,
    margin: "0",
  })} />`;
}

function renderSpacer(node: SpacerNode): string {
  return `<div${styleAttr({ height: `${node.height}px`, "line-height": `${node.height}px`, "font-size": "1px" })}>&nbsp;</div>`;
}

function renderContent(node: ContentNode): string {
  switch (node.kind) {
    case "text":
      return renderText(node);
    case "image":
      return renderImage(node);
    case "button":
      return renderButton(node);
    case "divider":
      return renderDivider(node);
    case "spacer":
      return renderSpacer(node);
  }
}

function renderColumn(col: ColumnNode, index: number): string {
  const body = col.children.map(renderContent).join("\n");
  return (
    `<!--[if mso]><td width="${col.widthPct}%" valign="top"><![endif]-->` +
    `<div class="sui-col" data-col="${index}"${styleAttr({
      display: "inline-block",
      width: `${col.widthPct}%`,
      "vertical-align": "top",
    })}>${body}</div>` +
    `<!--[if mso]></td><![endif]-->`
  );
}

function renderColumns(node: ColumnsNode): string {
  const cols = node.children.map(renderColumn).join("\n");
  // MSO gets a real <table><tr> (Outlook can't lay out inline-block columns);
  // other clients get the inline-block column divs directly.
  return (
    `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->` +
    cols +
    `<!--[if mso]></tr></table><![endif]-->`
  );
}

function renderSectionChild(child: SectionChild): string {
  return child.kind === "columns" ? renderColumns(child) : renderContent(child);
}

function renderSection(node: import("./schema").SectionNode): string {
  const body = node.children.map(renderSectionChild).join("\n");
  return (
    `<tr><td align="center" bgcolor="${node.bg}"${styleAttr({
      background: node.bg,
      padding: `${node.paddingY}px ${node.paddingX}px`,
    })}>${body}</td></tr>`
  );
}

const MOBILE_CSS = `
@media only screen and (max-width: 480px) {
  .sui-col { display: block !important; width: 100% !important; }
}
`.trim();

/** Project a document to a full, standalone HTML email. */
export function toEmailHtml(doc: EmailDocument): string {
  const { root } = doc;
  const sections = root.children.map(renderSection).join("\n");
  return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(doc.subject)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>${MOBILE_CSS}</style>
</head>
<body${styleAttr({ margin: "0", padding: "0", background: root.bg, "font-family": root.fontFamily })}>
${doc.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(doc.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${styleAttr({ background: root.bg })}>
<tr><td align="center">
<table role="presentation" width="${root.width}" cellpadding="0" cellspacing="0" border="0"${styleAttr({
    width: `${root.width}px`,
    "max-width": "100%",
    background: root.contentBg,
  })}>
${sections}
</table>
</td></tr>
</table>
</body>
</html>`;
}
