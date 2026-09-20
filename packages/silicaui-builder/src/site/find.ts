/**
 * Find (and replace) a piece of text across a WHOLE site — every page, the
 * shared frame, and every saved component.
 *
 * Why this exists. [073](docs/personas/issues/073) closed with a line it could
 * not act on at the time: *"The site builder has no Find either. The same
 * argument applies to a site with…"*. The email builder got one, the site
 * builder did not, and in the meantime its toolbar printed a `⌘ /` hint for a
 * feature that was not there ([102](docs/personas/issues/102)).
 *
 * The argument transfers exactly. A phone number, a price, an opening time or a
 * campaign URL does not live in one place on a site — it is in the header, in a
 * card, on the contact page, and behind a button — and three of those four are
 * on no screen the author is looking at. A link's address is only visible once
 * that link is selected. Something in the shared frame is on every page and
 * belongs to none of them. Something in a saved component is behind two clicks
 * and a mode switch. So "change it everywhere" means "remember everywhere", and
 * the one you forget is the one a customer rings.
 *
 * SCOPE, stated rather than discovered — the same three rules the email finder
 * settled on, because the reasons are the same:
 *
 * - **Exact text, capitals included.** No case folding, no wildcards, no regular
 *   expressions. A price, a date, a phone number and a URL are what people
 *   actually hunt, and all four are typed exactly.
 * - **Only what a reader would see or follow** — the words, a link's address, an
 *   image's description, a page's name, and the author's own layer names. Never
 *   class names, colours or sizes: those are the design, and a replace that
 *   rewrote `#18181b` because it contained `18` would be a disaster.
 * - **Never inside markup.** A rich-text node stores HTML, so a naive replace of
 *   "a" would rewrite `<a href=…>` into nonsense. Matching and replacing happen
 *   in the text between the tags, never in a tag.
 *
 * WHAT IS DELIBERATELY NOT SEARCHED, so its absence is a decision:
 *
 * - **A page's slug.** It is a route, and changing it silently breaks every link
 *   that points at it and every bookmark a visitor has. It is listed as a place
 *   the text appears so the author can see it, and it is never replaced.
 * - **A binding reference** (`{{ref}}`). It names the host's data, not the
 *   author's words; rewriting it would break the bind rather than fix the copy.
 */
import type { Node, Site } from "@wizeworks/silicaui-html";
import { nodeRowLabel } from "./node-display";

/** Where a hit lives — the three trees a site has, which are also the three
 *  scopes an op can address, so taking the author there is a switch and a
 *  select rather than a search. */
export type FindScope =
  | { kind: "page"; pageId: string }
  | { kind: "frame" }
  | { kind: "symbol"; symbolId: string };

/** One place a search term sits. A FIELD, not a character offset: the author
 *  fixes a field, and a field is what the Inspector puts in front of them. */
export interface SiteTextMatch {
  scope: FindScope;
  /** What to call that tree on screen, in the author's words. */
  scopeName: string;
  /** Absent for a page's own name or slug, which belong to the page not a node. */
  nodeId?: string;
  field: "pageName" | "pageSlug" | "text" | "label" | "href" | "alt" | "src" | "title" | "ariaLabel" | "html";
  /** Plain English, for someone who has never heard the word "node". */
  where: string;
  /** The words around the match, for recognising the right one at a glance. */
  excerpt: string;
  /** How many times the term appears in THIS field. */
  count: number;
  /** A slug is shown and never rewritten — see the header. */
  readOnly?: boolean;
}

/** An outlet has neither children nor a label, so every walk narrows through
 *  here rather than casting at each use. */
function childrenOf(node: Node): readonly (Node | string)[] {
  return node.kind === "outlet" ? [] : ((node.children ?? []) as readonly (Node | string)[]);
}

/** Alternating text and tags: even indices are what a reader sees, odd are markup. */
function htmlParts(html: string): string[] {
  return html.split(/(<[^>]*>)/);
}

/** Occurrences of `find` in `hay`. An empty needle counts as none — otherwise
 *  every gap between characters is a match and the panel reports nonsense. */
function countOf(hay: string, find: string): number {
  return find ? hay.split(find).length - 1 : 0;
}

/** Count in the READABLE text of an HTML fragment only. */
export function countOutsideTags(html: string, find: string): number {
  let n = 0;
  const parts = htmlParts(html);
  for (let i = 0; i < parts.length; i += 2) n += countOf(parts[i]!, find);
  return n;
}

/** Replace in the READABLE text of an HTML fragment only — tags untouched. */
export function replaceOutsideTags(html: string, find: string, to: string): string {
  if (!find) return html;
  const parts = htmlParts(html);
  for (let i = 0; i < parts.length; i += 2) parts[i] = parts[i]!.split(find).join(to);
  return parts.join("");
}

/** Tags stripped, whitespace collapsed — what an excerpt is cut from. */
function plain(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** A window around the first match, so a long paragraph is recognisable without
 *  filling the rail. */
function excerptOf(text: string, find: string): string {
  const at = text.indexOf(find);
  if (at < 0) return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  const from = Math.max(0, at - 24);
  const to = Math.min(text.length, at + find.length + 24);
  return `${from > 0 ? "…" : ""}${text.slice(from, to)}${to < text.length ? "…" : ""}`;
}

/**
 * The attributes and props worth searching, with the words an author would use
 * for them. ONE table, so the finder and the replacer can never disagree about
 * what is searchable — the same guarantee the email side gets from its own.
 */
const FIELDS = [
  { key: "href", field: "href", label: "the web address" },
  { key: "alt", field: "alt", label: "the image description" },
  { key: "src", field: "src", label: "the image address" },
  { key: "title", field: "title", label: "the hover text" },
  { key: "aria-label", field: "ariaLabel", label: "the spoken name" },
] as const;

/** A component's props use camelCase where an element's attributes are kebab. */
const PROP_KEY: Record<string, string> = { "aria-label": "ariaLabel" };

/** The node's own readable text: an element's string child, or a component's
 *  `label`/`text` prop. The same field `editableText` reads, so what Find
 *  offers to change is what the Inspector's Content field round-trips. */
function textOf(node: Node): string | undefined {
  if (node.kind === "element") {
    const child = node.children?.find((c): c is string => typeof c === "string");
    return child;
  }
  if (node.kind === "component") {
    const v = node.props?.label ?? node.props?.text;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

/** Raw HTML a node carries (RichText / rawHtml), which is matched between tags. */
function htmlOf(node: Node): string | undefined {
  const raw = (node as { rawHtml?: unknown }).rawHtml;
  if (typeof raw === "string" && raw) return raw;
  if (node.kind === "component") {
    const v = node.props?.html;
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

/** Read one searchable field off a node, whichever kind it is. */
function fieldValue(node: Node, key: string): string | undefined {
  if (node.kind === "element") {
    const v = node.attrs?.[key];
    return typeof v === "string" ? v : undefined;
  }
  if (node.kind === "component") {
    const v = node.props?.[PROP_KEY[key] ?? key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

/** Every match in one tree, in the order the Layers rail lists it. */
function findInTree(root: Node, scope: FindScope, scopeName: string, find: string): SiteTextMatch[] {
  const out: SiteTextMatch[] = [];
  const visit = (node: Node): void => {
    const id = (node as { id?: string }).id;
    const base = { scope, scopeName, nodeId: id };

    // The author's own name for a layer — their label, so their words are in it.
    const label = (node as { label?: string }).label;
    if (typeof label === "string" && countOf(label, find)) {
      out.push({ ...base, field: "label", where: "the layer's name", excerpt: excerptOf(label, find), count: countOf(label, find) });
    }

    const text = textOf(node);
    if (text && countOf(text, find)) {
      out.push({ ...base, field: "text", where: `${nodeRowLabel(node)} — the words`, excerpt: excerptOf(text, find), count: countOf(text, find) });
    }

    const html = htmlOf(node);
    if (html && countOutsideTags(html, find)) {
      out.push({ ...base, field: "html", where: `${nodeRowLabel(node)} — the words`, excerpt: excerptOf(plain(html), find), count: countOutsideTags(html, find) });
    }

    for (const { key, field, label: what } of FIELDS) {
      const value = fieldValue(node, key);
      if (!value) continue;
      const n = countOf(value, find);
      if (!n) continue;
      out.push({ ...base, field, where: `${nodeRowLabel(node)} — ${what}`, excerpt: excerptOf(value, find), count: n });
    }

    for (const child of childrenOf(node)) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
}

/** Every match in the whole site — pages in authoring order, then the shared
 *  frame, then saved components. */
export function findInSite(site: Site, find: string): SiteTextMatch[] {
  if (!find) return [];
  const out: SiteTextMatch[] = [];

  for (const page of site.pages) {
    const scope: FindScope = { kind: "page", pageId: page.id };
    const n = countOf(page.name, find);
    if (n) out.push({ scope, scopeName: page.name, field: "pageName", where: "the page's name", excerpt: excerptOf(page.name, find), count: n });
    const s = countOf(page.slug, find);
    // Shown, never rewritten. A slug is a route: changing it breaks every link
    // that points at it and every bookmark a visitor has.
    if (s) out.push({ scope, scopeName: page.name, field: "pageSlug", where: "the page's web address — shown, not changed", excerpt: page.slug, count: s, readOnly: true });
    out.push(...findInTree(page.root, scope, page.name, find));
  }

  if (site.frame?.root) {
    out.push(...findInTree(site.frame.root as Node, { kind: "frame" }, "The header and footer every page shares", find));
  }

  for (const [id, sym] of Object.entries(site.symbols ?? {})) {
    const name = (sym as { name?: string }).name ?? "A saved component";
    const root = (sym as { root?: Node }).root;
    if (root) out.push(...findInTree(root, { kind: "symbol", symbolId: id }, name, find));
  }
  return out;
}

/** What one node needs changed, or undefined when it holds no match. Shares
 *  `FIELDS` with the finder, so what is listed is exactly what is changed. */
export interface NodePatch {
  text?: string;
  label?: string;
  html?: string;
  /** Element attributes, by their real attribute name. */
  attrs?: Record<string, string>;
  /** Component props, by their real prop name. */
  props?: Record<string, string>;
}

export function replacementFor(node: Node, find: string, to: string): NodePatch | undefined {
  const patch: NodePatch = {};

  const label = (node as { label?: string }).label;
  if (typeof label === "string" && countOf(label, find)) patch.label = label.split(find).join(to);

  const text = textOf(node);
  if (text && countOf(text, find)) patch.text = text.split(find).join(to);

  const html = htmlOf(node);
  if (html && countOutsideTags(html, find)) patch.html = replaceOutsideTags(html, find, to);

  for (const { key } of FIELDS) {
    const value = fieldValue(node, key);
    if (!value || !countOf(value, find)) continue;
    const next = value.split(find).join(to);
    if (node.kind === "element") (patch.attrs ??= {})[key] = next;
    else (patch.props ??= {})[PROP_KEY[key] ?? key] = next;
  }

  return Object.keys(patch).length ? patch : undefined;
}
