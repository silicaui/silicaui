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
  HtmlNode,
  ImageNode,
  LayoutChild,
  LinkNode,
  SocialNode,
  SpacerNode,
  TextNode,
  VideoNode,
} from "./schema";
import { SOCIAL_PLATFORM } from "./node-display";
import { resolveEmailTree, resolveTokens } from "./resolve";
import type { EmailResolveHost } from "./resolve";
import { composeEmailDocument } from "./frame";
import type { EmailFrame } from "./frame";

export const FONT_WEIGHT_CSS: Record<TextNode["fontWeight"], number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function styleAttr(rules: Record<string, string | number | undefined>): string {
  const parts = Object.entries(rules)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}:${v}`);
  return parts.length ? ` style="${esc(parts.join(";"))}"` : "";
}

/**
 * Paint `<a>` elements inside a text node's inline HTML.
 *
 * Email clients apply their own hyperlink blue to any unstyled anchor, and no
 * `<style>` rule reliably overrides it (Gmail's app strips the block), so the
 * color HAS to land as an inline style on each anchor. That means the one spot
 * where this projector reads markup instead of just emitting it — justified
 * only because `TextNode.html` is a documented, constrained inline-safe subset.
 * `HtmlNode` — the arbitrary-markup escape hatch — is never touched.
 *
 * The color is PREPENDED into an existing `style`, so a later `color:` the
 * author wrote by hand still wins on CSS ordering rules.
 */
export function withLinkColor(html: string, color: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (whole, attrs: string) => {
    const styled = /\bstyle\s*=\s*(["'])[\s\S]*?\1/i;
    if (styled.test(attrs)) {
      return whole.replace(styled, (m) => m.replace(/=\s*(["'])/, (_e, q: string) => `=${q}color:${color};`));
    }
    return `<a${attrs} style="color:${esc(color)}">`;
  });
}

/** Does this inline HTML already contain an anchor the author put there? An
 *  inherited group link must not wrap one (nested anchors are invalid, and the
 *  inner link would be the one that fires anyway). */
const HAS_ANCHOR = /<a\b/i;

function renderText(node: TextNode, link?: string): string {
  let html = node.linkColor ? withLinkColor(node.html, node.linkColor) : node.html;
  // A group link (`LinkNode`) lands as a plain inline anchor around the copy —
  // `color:inherit` and no underline, because this is a card title that happens
  // to be clickable, not a link inside a sentence. An author who wants it to
  // READ as a link sets the text color themselves. Applied AFTER `withLinkColor`
  // so that rewrite only ever touches the author's own anchors, not this one.
  if (link && !HAS_ANCHOR.test(node.html)) {
    html = `<a href="${esc(link)}" target="_blank" style="color:inherit;text-decoration:none">${html}</a>`;
  }
  return `<div${styleAttr({
    "text-align": node.align,
    color: node.color,
    "font-size": `${node.fontSize}px`,
    "font-weight": FONT_WEIGHT_CSS[node.fontWeight],
    "line-height": `${node.lineHeight}px`,
  })}>${html}</div>`;
}

function renderImage(node: ImageNode, link?: string): string {
  const img = `<img src="${esc(node.src)}" alt="${esc(node.alt)}" width="${node.width}"${styleAttr({
    display: "block",
    width: `${node.width}px`,
    "max-width": "100%",
    ...(node.align === "center" ? { margin: "0 auto" } : node.align === "right" ? { "margin-left": "auto" } : {}),
  })} />`;
  // The image's own href wins over a group link — explicit beats inherited.
  const href = node.href || link;
  return href ? `<a href="${esc(href)}" target="_blank">${img}</a>` : img;
}

function renderButton(node: ButtonNode): string {
  // "Bulletproof" button: a table cell carries the background so Outlook (which
  // ignores border-radius/padding on <a>) still renders a solid, sized target.
  //
  // An OUTLINE button drops the `bgcolor` attribute entirely rather than trying
  // to spell "transparent" in it — `bgcolor` has no transparent value, and a
  // bogus one paints black in some clients. With the attribute gone and
  // `background:transparent` inline, whatever is behind the button (the
  // section's own fill) shows through in every client, Outlook included.
  const outline = node.variant === "outline";
  const borderWidth = node.borderWidth ?? (outline ? 1 : 0);
  const border = borderWidth > 0 ? `${borderWidth}px solid ${node.borderColor ?? node.bg}` : undefined;
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${styleAttr({
      margin: node.align === "center" ? "0 auto" : node.align === "right" ? "0 0 0 auto" : "0",
    })}><tr><td align="center"${outline ? "" : ` bgcolor="${node.bg}"`}${styleAttr({
      "border-radius": `${node.radius}px`,
      background: outline ? "transparent" : node.bg,
      border,
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

function renderSocial(node: SocialNode): string {
  const cells = node.links
    .map(
      (l) =>
        `<td${styleAttr({ padding: `0 ${node.gap / 2}px` })}>` +
        `<a href="${esc(l.url)}" target="_blank"${styleAttr({
          display: "inline-block",
          width: `${node.iconSize}px`,
          height: `${node.iconSize}px`,
          "line-height": `${node.iconSize}px`,
          "text-align": "center",
          "border-radius": "50%",
          background: SOCIAL_PLATFORM[l.platform].color,
          color: "#ffffff",
          "font-size": `${Math.max(10, node.iconSize * 0.45)}px`,
          "font-weight": "bold",
          "text-decoration": "none",
        })}>${esc(SOCIAL_PLATFORM[l.platform].label)}</a></td>`,
    )
    .join("");
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${styleAttr({
      margin: node.align === "center" ? "0 auto" : node.align === "right" ? "0 0 0 auto" : "0",
    })}><tr>${cells}</tr></table>`
  );
}

function renderHtml(node: HtmlNode): string {
  // Verbatim passthrough — no escaping (it IS markup), no parsing (a merge tag
  // like `{{first_name}}` rides through untouched for the ESP to substitute).
  return node.html;
}

function renderVideo(node: VideoNode): string {
  const img = `<img src="${esc(node.thumbnail)}" alt="Video thumbnail" width="${node.width}"${styleAttr({
    display: "block",
    width: `${node.width}px`,
    "max-width": "100%",
  })} />`;
  // The play glyph is `position:absolute` — a graceful-degradation overlay:
  // clients that honor it show a centered play button; Outlook's Word engine
  // (which ignores absolute positioning) just renders it as plain text under
  // the image instead of breaking. No MSO-specific branch needed either way.
  const play = node.showPlayButton
    ? `<div${styleAttr({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "56px",
        height: "56px",
        "border-radius": "50%",
        background: "rgba(0,0,0,0.6)",
        color: "#ffffff",
        "text-align": "center",
        "line-height": "56px",
        "font-size": "20px",
      })}>&#9658;</div>`
    : "";
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    `<a href="${esc(node.href)}" target="_blank"${styleAttr({
      display: "flex",
      "justify-content": justify,
      position: "relative",
      "text-decoration": "none",
    })}>${img}${play}</a>`
  );
}

/** `link` is the destination inherited from an enclosing `LinkNode`, if any —
 *  see `renderLink`. Only the two kinds that have no link of their own take it. */
function renderContent(node: ContentNode, link?: string): string {
  switch (node.kind) {
    case "text":
      return renderText(node, link);
    case "image":
      return renderImage(node, link);
    case "button":
      return renderButton(node);
    case "divider":
      return renderDivider(node);
    case "spacer":
      return renderSpacer(node);
    case "social":
      return renderSocial(node);
    case "html":
      return renderHtml(node);
    case "video":
      return renderVideo(node);
  }
}

function renderColumn(col: ColumnNode, index: number): string {
  // A column's children are `LayoutChild` too — a nested `columns` row renders
  // through `renderColumns` recursively (one level of column-in-column nesting).
  const body = col.children.map(renderLayoutChild).join("\n");
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

/**
 * A clickable group — projected by DISTRIBUTING its `href` onto each child that
 * can carry one, NOT by wrapping the group in a single `<a>`.
 *
 * That is the whole design, and it is a rendering constraint rather than a
 * preference. An anchor around block-level content is invalid in the HTML
 * dialect Outlook's Word engine parses, and Outlook drops the link: the card
 * would render, look clickable, and do nothing — the worst kind of failure,
 * because nothing about the markup or a webmail preview reveals it. An inline
 * `<a>` around an `<img>`, and another around a line of copy, are bulletproof
 * in every client.
 *
 * So the group emits NO wrapper element of its own. Its children render exactly
 * where they would have, each one linked. The trade this makes is explicit in
 * `LinkNode`'s doc comment: the content is clickable, the padding around it
 * isn't.
 *
 * An empty/whitespace `href` distributes nothing — an author who has added the
 * group but not yet the URL (or a `value` bind that resolved empty) gets plain
 * unlinked content, never `<a href="">`, which some clients resolve to the
 * message itself.
 */
function renderLink(node: LinkNode): string {
  const href = node.href?.trim() ? node.href : undefined;
  return node.children.map((c) => renderContent(c, href)).join("\n");
}

function renderLayoutChild(child: LayoutChild): string {
  if (child.kind === "columns") return renderColumns(child);
  if (child.kind === "link") return renderLink(child);
  return renderContent(child);
}

/**
 * A section with a background image: `background`/`background-image` covers
 * Gmail, Apple Mail, and most webmail; Outlook desktop (the Word engine) needs
 * a VML `v:rect` wrapper carrying its own `v:fill` — everything else in the
 * `[if mso]` branch is invisible there. `bg` always renders too (both as the
 * `bgcolor` attribute and inside the VML fill), so a client that drops the
 * image entirely still shows a sane solid color.
 */
function renderSectionBgImage(node: import("./schema").SectionNode, body: string, align: string): string {
  return (
    `<td align="${align}" background="${esc(node.bgImage!)}" bgcolor="${node.bg}"${styleAttr({
      background: `${node.bg} url(${node.bgImage}) center/cover no-repeat`,
      padding: "0",
    })}>` +
    `<!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="mso-width-percent:1000"><v:fill type="tile" src="${esc(node.bgImage!)}" color="${node.bg}" /><v:textbox inset="0,0,0,0"><![endif]-->` +
    `<div${styleAttr({ padding: `${node.paddingY}px ${node.paddingX}px` })}>${body}</div>` +
    `<!--[if mso]></v:textbox></v:rect><![endif]-->` +
    `</td>`
  );
}

/**
 * Project a section carrying box decoration (radius / border / margin) as a
 * nested-table CARD.
 *
 * The outer `<td>` carries the margin AS PADDING — deliberate, not a shortcut:
 * a `<td>` can't take real `margin` in Outlook's Word engine, and padding on the
 * cell outside the card is the technique every email builder converges on.
 * The inner table then owns the fill, border, and radius, so the margin is true
 * outside space with the body's own background showing through it.
 *
 * `border-collapse:separate` is required — without it a table's `border-radius`
 * is ignored even in clients that otherwise support it.
 */
function renderSectionCard(node: import("./schema").SectionNode, inner: string, marginX: number, marginY: number, radius: number, borderWidth: number): string {
  const decorated = !node.bgImage;
  return (
    `<tr><td${styleAttr({ padding: `${marginY}px ${marginX}px` })}>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${decorated ? ` bgcolor="${node.bg}"` : ""}${styleAttr({
      // With a background image the inner <td> already paints itself (VML and
      // all) — painting the wrapper too would draw the fill OVER the image in
      // clients that honor both.
      background: decorated ? node.bg : undefined,
      "border-radius": radius > 0 ? `${radius}px` : undefined,
      border: borderWidth > 0 ? `${borderWidth}px solid ${node.borderColor ?? node.bg}` : undefined,
      "border-collapse": "separate",
    })}><tr>${inner}</tr></table>` +
    `</td></tr>`
  );
}

function renderSection(node: import("./schema").SectionNode): string {
  const body = node.children.map(renderLayoutChild).join("\n");
  const align = node.align ?? "center";
  const marginX = node.marginX ?? 0;
  const marginY = node.marginY ?? 0;
  const radius = node.radius ?? 0;
  const borderWidth = node.borderWidth ?? 0;

  // The plain path is preserved EXACTLY as it was — a section that sets none of
  // the box-decoration fields projects byte-for-byte the markup it always did,
  // so adding these fields can't perturb an existing document's output.
  if (marginX === 0 && marginY === 0 && radius === 0 && borderWidth === 0) {
    if (node.bgImage) return `<tr>${renderSectionBgImage(node, body, align)}</tr>`;
    return (
      `<tr><td align="${align}" bgcolor="${node.bg}"${styleAttr({
        background: node.bg,
        padding: `${node.paddingY}px ${node.paddingX}px`,
      })}>${body}</td></tr>`
    );
  }

  const inner = node.bgImage
    ? renderSectionBgImage(node, body, align)
    : `<td align="${align}"${styleAttr({ padding: `${node.paddingY}px ${node.paddingX}px` })}>${body}</td>`;
  return renderSectionCard(node, inner, marginX, marginY, radius, borderWidth);
}

const MOBILE_CSS = `
@media only screen and (max-width: 480px) {
  .sui-col { display: block !important; width: 100% !important; }
}
`.trim();

/**
 * Caller-supplied additions to the document `<head>`.
 *
 * This is an ESCAPE HATCH, and scoped as one on purpose. The two things almost
 * every sender reaches for — a brand webfont and a color-scheme declaration —
 * are NOT here: they're `EmailBody.webFonts` / `EmailBody.colorScheme`, because
 * they're design decisions that should travel with the document and be editable
 * in the Inspector, not invisible strings at a render call site. What's left
 * genuinely can't be modeled: client-specific hacks (`[data-ogsc]`,
 * `u + .body`, `@media (prefers-color-scheme: dark)` overrides, MSO
 * conditionals) are open-ended by nature, and pretending otherwise would just
 * force every consumer to fight the schema.
 *
 * Everything here is emitted VERBATIM and LAST, after the projector's own head
 * content, so a caller can always override what we generate.
 */
export interface EmailHeadExtras {
  /** CSS appended inside its own `<style>` block. */
  css?: string;
  /** `<meta name content>` pairs. */
  meta?: ReadonlyArray<{ name: string; content: string }>;
  /** Raw markup spliced into `<head>` — for anything the above can't express
   *  (a conditional comment, a `<link>`). Never escaped or parsed. */
  raw?: string;
}

export interface EmailRenderOptions {
  /** Host data hooks; bound nodes are substituted before projection. */
  resolver?: EmailResolveHost;
  head?: EmailHeadExtras;
  /**
   * Fixed host chrome composed AROUND the authored body — a brand bar, a legal
   * footer (see `EmailFrame`). Composed BEFORE resolution, so frame sections
   * get the same data bindings and `{{merge}}` tokens the body does.
   *
   * This is the one composition step, shared by the builder's canvas/preview
   * and a host's own send path, so the framed email a user previews and the
   * one a recipient opens can't drift apart.
   */
  frame?: EmailFrame;
}

/** Quote a font family for CSS unless it's already quoted or a bare single
 *  token (`Inter` needs no quotes; `Playfair Display` does). */
function quoteFamily(family: string): string {
  if (/^["'].*["']$/.test(family)) return family;
  return /^[A-Za-z][\w-]*$/.test(family) ? family : `"${family.replace(/"/g, "")}"`;
}

/** `@font-face` rules for the document's webfonts, wrapped in `@media screen`.
 *  That wrapper is load-bearing: Outlook's Word engine ignores the at-rule
 *  entirely, which stops it half-seeing a webfont it can't load and falling
 *  back to Times New Roman for the whole email. */
export function fontFaceCss(fonts: ReadonlyArray<import("./schema").EmailWebFont>): string {
  const faces = fonts
    .map((f) =>
      `  @font-face { font-family: ${quoteFamily(f.family)}; font-style: ${f.style ?? "normal"}; font-weight: ${f.weight ?? 400}; src: url(${f.src}); }`,
    )
    .join("\n");
  return `@media screen {\n${faces}\n}`;
}

/** The body font stack: webfont families first, the authored `fontFamily` stack
 *  behind them as the fallback every non-supporting client actually gets. */
export function bodyFontStack(root: import("./schema").EmailBody): string {
  const fonts = root.webFonts ?? [];
  if (!fonts.length) return root.fontFamily;
  const seen = root.fontFamily.toLowerCase();
  const families = fonts
    .map((f) => quoteFamily(f.family))
    .filter((q, i, all) => all.indexOf(q) === i && !seen.includes(q.replace(/["']/g, "").toLowerCase()));
  return families.length ? `${families.join(", ")}, ${root.fontFamily}` : root.fontFamily;
}

function renderHead(root: import("./schema").EmailBody, subject: string, extras?: EmailHeadExtras): string {
  const fonts = root.webFonts ?? [];
  const parts = [
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<meta http-equiv="X-UA-Compatible" content="IE=edge" />`,
  ];
  if (root.colorScheme) {
    parts.push(`<meta name="color-scheme" content="${esc(root.colorScheme)}" />`);
    parts.push(`<meta name="supported-color-schemes" content="${esc(root.colorScheme)}" />`);
  }
  parts.push(`<title>${esc(subject)}</title>`);
  parts.push(
    `<!--[if mso]>\n<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>\n<![endif]-->`,
  );
  const css = [
    root.colorScheme ? `:root { color-scheme: ${root.colorScheme}; supported-color-schemes: ${root.colorScheme}; }` : "",
    fonts.length ? fontFaceCss(fonts) : "",
    MOBILE_CSS,
  ]
    .filter(Boolean)
    .join("\n");
  parts.push(`<style>${css}</style>`);
  // Caller extras go LAST so they can override anything above.
  for (const m of extras?.meta ?? []) parts.push(`<meta name="${esc(m.name)}" content="${esc(m.content)}" />`);
  if (extras?.css) parts.push(`<style>${extras.css}</style>`);
  if (extras?.raw) parts.push(extras.raw);
  return parts.join("\n");
}

/**
 * Accept both `toEmailHtml(doc, resolver)` (the original positional form) and
 * `toEmailHtml(doc, { resolver, head })`. An `EmailResolveHost` is identified by
 * its hooks — the two shapes have no overlapping keys, so this can't misread
 * one as the other, and the older call form keeps working untouched.
 */
function normalizeOptions(arg?: EmailResolveHost | EmailRenderOptions): EmailRenderOptions {
  if (!arg) return {};
  const rec = arg as Record<string, unknown>;
  if ("resolveBinding" in rec || "resolveCollection" in rec || "onDiagnostic" in rec) {
    return { resolver: arg as EmailResolveHost };
  }
  return arg as EmailRenderOptions;
}

/**
 * Project a document to a full, standalone HTML email. With a `resolver`
 * (host `resolveBinding`/`resolveCollection`), bound nodes are substituted
 * with real data FIRST — the same `resolveEmailTree` pass the Inspector's
 * live preview uses — so this one function serves both a static export and a
 * host's real send, per the Q25 resolving-projector direction: preview and
 * send stop being two code paths that can drift. Omit it and this behaves
 * exactly as before (today's static projection, zero cost).
 *
 * The second argument also accepts `{ resolver, head, frame }` — see
 * `EmailRenderOptions` — for injecting client-hack CSS/meta into the `<head>`
 * and for composing host chrome (a brand bar, a legal footer) around the
 * authored body. Passing a bare resolver positionally still works and is not
 * deprecated.
 */
export function toEmailHtml(doc: EmailDocument, options?: EmailResolveHost | EmailRenderOptions): string {
  const { resolver, head, frame } = normalizeOptions(options);
  // The frame composes FIRST, so its sections go through the same resolution
  // pass the body does — a brand bar can bind its wordmark exactly the way a
  // body image would. Composition is pure: `doc` is never mutated, and with no
  // frame this returns `doc` itself.
  const framed = composeEmailDocument(doc, frame);
  const root = resolver ? resolveEmailTree(framed.root, resolver) : framed.root;
  // Subject/preheader live on the DOCUMENT, not the node tree `resolveEmailTree`
  // walks — resolved separately here via the same `{{ref}}` merge-token pass
  // (raw, unescaped: `esc()` below is the one escape, same as every other
  // field this projector emits).
  const subject = resolver ? resolveTokens(doc.subject, resolver, {}, false) : doc.subject;
  const preheader = resolver ? resolveTokens(doc.preheader, resolver, {}, false) : doc.preheader;
  const sections = root.children.map(renderSection).join("\n");
  return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
${renderHead(root, subject, head)}
</head>
<body${styleAttr({ margin: "0", padding: "0", background: root.bg, "font-family": bodyFontStack(root) })}>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ""}
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
