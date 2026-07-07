/**
 * Site helpers (architecture spec §3): the multi-page container around the
 * single-page `Document`. A `Site` holds many `Page`s sharing one theme + frame;
 * each page projects THROUGH a `Document` for HTML output/storage. These are pure
 * schema transforms — the builder engine owns the live editing state.
 */
import type { Document, ElementNode, Node, Page, Site } from "./schema";
import type { MakeId } from "./stamp";
import { defaultMakeId } from "./stamp";
import { composeFrame } from "./tree";
import { toHtml } from "./to-html";
import type { ToHtmlOptions } from "./to-html";

/**
 * The page BODY container: a labeled `<div>` wrapper that holds a page's top-level
 * sections/blocks as SIBLINGS. A page's `root` is always one of these so the
 * Navigator shows a real "Page" root you can drop multiple sections into — rather
 * than the first block masquerading as the page (which forces every new section to
 * nest inside it). Carries an id so it's selectable/markable.
 */
export function pageBody(children: Node[], makeId: MakeId = defaultMakeId): ElementNode {
  return { kind: "element", tag: "div", class: "flex flex-col", label: "Page", id: makeId(), children };
}

/** True when a node is already a page-body container (so we never double-wrap). */
function isPageBody(node: Node): boolean {
  return node.kind === "element" && node.label === "Page";
}

/** Build a page record with a fresh page id (its own id space, not a node id). */
export function makePage(
  name: string,
  slug: string,
  root: Node,
  makeId: MakeId = defaultMakeId,
): Page {
  return { id: makeId(), name, slug, root };
}

/** Normalize a label into a route slug: "Pricing Plans" → "/pricing-plans". */
export function slugify(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return "/" + s;
}

/**
 * Wrap a single `Document` as a one-page `Site` — the migration path when the
 * builder is handed a legacy single-page document. The page inherits the
 * document's root as-is (ids preserved); theme + frame move up to the site.
 */
export function siteFromDocument(
  doc: Document,
  pageName = "Home",
  makeId: MakeId = defaultMakeId,
): Site {
  // Ensure the page has a real body root: if the document's root is already a page
  // body use it, otherwise wrap the single block so the page can hold siblings.
  const root = isPageBody(doc.root) ? doc.root : pageBody([doc.root], makeId);
  const site: Site = {
    version: doc.version,
    theme: doc.theme,
    pages: [{ id: makeId(), name: pageName, slug: "/", root }],
  };
  if (doc.frame) site.frame = doc.frame;
  return site;
}

/**
 * Project one page of a site to a standalone `Document`: that page's root in the
 * site's shared theme + frame context. This is the unit `toHtml` renders, and
 * the shape the builder exposes to the canvas as "the current page".
 */
export function pageDocument(site: Site, pageId: string): Document | undefined {
  const page = site.pages.find((p) => p.id === pageId);
  if (!page) return undefined;
  const doc: Document = { version: site.version, root: page.root, theme: site.theme };
  if (site.frame) doc.frame = site.frame;
  return doc;
}

/** One rendered page: its identity plus the composed (frame⊕body) HTML string. */
export interface RenderedPage {
  id: string;
  name: string;
  /** Route path — the natural output file/key (e.g. "/" → index, "/pricing"). */
  slug: string;
  html: string;
}

/**
 * Project ONE page of a site to a full HTML string: the page body composed inside
 * the shared frame (the frame's single Outlet is replaced by the body). With no
 * frame the page renders bare. This is the production markup a visitor to that
 * route receives. Returns undefined for an unknown page id.
 */
export function renderPage(site: Site, pageId: string, opts?: ToHtmlOptions): string | undefined {
  const page = site.pages.find((p) => p.id === pageId);
  if (!page) return undefined;
  const tree = site.frame ? composeFrame(site.frame.root, page.root) : page.root;
  return toHtml(tree, opts);
}

/**
 * Render EVERY page of the site to composed HTML — the whole-site export the
 * builder hands its host on publish. The host maps each `slug` to a route/file
 * and owns hosting; silicaui just produces the markup + the structured `Site`.
 */
export function renderSite(site: Site, opts?: ToHtmlOptions): RenderedPage[] {
  return site.pages.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    // Safe non-null: we iterate the site's own pages, so each id resolves.
    html: renderPage(site, p.id, opts)!,
  }));
}
