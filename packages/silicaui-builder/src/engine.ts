/**
 * The builder engine — framework-neutral document state + a tiny subscription
 * model. Holds the `Document` (root + theme), the site's saved-theme library,
 * the current selection, and the full node-editing spine (class/prop/attr edits,
 * structural insert/remove/move/duplicate) with whole-document undo/redo.
 *
 * Everything mutates through here; React reads via the hooks in
 * `react/editor-context`. Node mutations run through `commit`, which snapshots
 * the document onto the undo stack first; theme + library edits deliberately
 * skip history (a token drag would otherwise flood it) but still mutate the live
 * doc IN PLACE, so a later undo snapshot always carries the current theme.
 */
import type { ComponentNode, Document, ElementNode, Frame, Node, Page, Site, Theme } from "silicaui-html";
import { el, listComponents, makePage, pageBody, pageDocument, siteFromDocument, slugify, stampTree, stripIds, walk } from "silicaui-html";
import { defaultFrameRoot } from "./frame";

/** A node that carries id/class/children — everything except an outlet. */
type Markable = ElementNode | ComponentNode;

export type ChangeKind =
  | "theme"
  | "library"
  | "structure"
  | "class"
  | "props"
  | "selection"
  | "active"
  | "page"
  | "replace";

/** Which tree the editing spine currently targets: the page BODY or the site FRAME. */
export type ActiveTree = "page" | "frame";

/** Lightweight page descriptor for the page switcher (no tree — just identity). */
export interface PageMeta {
  id: string;
  name: string;
  slug: string;
}

/** The current page roster + which one is active — a referentially-stable view
 *  for the switcher (rebuilt only when the roster or active page actually change). */
export interface PagesView {
  pages: readonly PageMeta[];
  activeId: string;
}

/** A fresh page: a "Page" body container seeded with one starter section (so the
 *  page reads as a multi-section body, not a lone block). Classes are LITERAL here
 *  so the canvas safelist scanner (`@source src`) emits their CSS. `pageBody` +
 *  `stampTree` (in addPage) mint the ids. */
function newPageRoot(): Node {
  return pageBody([
    el("section", "px-6 py-16 flex flex-col items-center gap-3 text-center", {
      children: [
        el("h1", "text-3xl font-bold", { text: "New page" }),
        el("p", "text-base-content/60", { text: "Add sections from the Insert panel." }),
      ],
    }),
  ]);
}
export interface ChangeEvent {
  kind: ChangeKind;
}

/** A node found in the tree, with the context needed to move/remove it. Only
 *  markable nodes carry ids, so `locate` never returns an outlet. */
interface Located {
  node: Markable;
  /** The containing node, or undefined for the root. */
  parent: Markable | undefined;
  /** Index of `node` within `parent.children`, or -1 for the root. */
  index: number;
}

/** Depth-first search for `id`, tracking parent + child index. */
function locate(root: Node, id: string): Located | undefined {
  if (root.kind !== "outlet" && root.id === id) return { node: root, parent: undefined, index: -1 };
  const stack: Markable[] = root.kind === "outlet" ? [] : [root];
  while (stack.length) {
    const parent = stack.pop() as Markable;
    const children = parent.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child === undefined || typeof child === "string" || child.kind === "outlet") continue;
      if (child.id === id) return { node: child, parent, index: i };
      stack.push(child);
    }
  }
  return undefined;
}

/** True when `ancestorId` is `id` or contains it — a cycle guard for moves. */
function contains(root: Node, ancestorId: string, id: string): boolean {
  const found = locate(root, ancestorId);
  if (!found) return false;
  let hit = false;
  walk(found.node, (n) => {
    if (n.kind !== "outlet" && n.id === id) hit = true;
  });
  return hit;
}

/** A node that can hold children (everything but an outlet). */
function isContainer(node: Node): node is Markable {
  return node.kind !== "outlet";
}

// Which nodes a new insertion nests INTO vs sits beside. Layout tags + the
// container atoms accept children; text/leaf tags (h1, p, a, button, img, …) and
// leaf atoms (Button, Image, Heading, …) take a sibling instead. This is the
// heuristic behind selection-relative + drop-relative insertion.
const CONTAINER_TAGS = new Set([
  "div", "section", "main", "article", "aside", "header", "footer", "nav",
  "ul", "ol", "li", "form", "figure", "blockquote", "dl", "fieldset",
]);
// Derived from the component registry (`container` flag), not hand-listed — a new
// container component accepts children with no engine edit.
const CONTAINER_COMPONENTS = new Set(listComponents().filter((c) => c.container).map((c) => c.name));

/** True when a node should receive an insertion as a CHILD (vs a sibling). */
export function acceptsChildren(node: Node): boolean {
  if (node.kind === "outlet") return false;
  if (node.kind === "component") return CONTAINER_COMPONENTS.has(node.component);
  return CONTAINER_TAGS.has(node.tag);
}

export class Editor {
  // The whole site — pages sharing one theme + frame. The builder edits ONE page
  // at a time (`activePageId`); `useDocument`/`extract` synthesize that page as a
  // single-page `Document` so the canvas + spine stay page-shaped and unchanged.
  private site: Site;
  private activePageId: string;
  // Cached switcher view — swapped (never mutated) only when the roster or the
  // active page changes, so `useSyncExternalStore` stays referentially stable.
  private pagesViewCache: PagesView = { pages: [], activeId: "" };
  private listeners = new Set<(e: ChangeEvent) => void>();
  // The site's saved-theme library ("This site" in the Themes panel). Seeded with
  // the document's own theme so the current site theme is always present. Held as
  // an immutable array — replaced (never mutated) on change so getSnapshot stays
  // referentially stable for `useSyncExternalStore`.
  private saved: readonly Theme[];
  // Currently-selected node id (canvas outline, inspector target). Not part of the
  // document — a view concern — so it rides its own "selection" change kind and is
  // never snapshotted into history.
  private selectedId: string | undefined;
  // Copy/paste buffer — an id-STRIPPED subtree (so paste stamps fresh ids). A view
  // concern, not part of the document, and never snapshotted into history.
  private clipboard: Node | undefined;
  // Which tree the spine edits. "page" targets the document body (`doc.root`);
  // "frame" targets the shared site shell (`doc.frame.root`) — the header/footer/
  // nav that wraps every page, with an Outlet where the body renders. The whole
  // node-editing spine (select/edit/insert/move/undo) runs against `activeRoot()`,
  // so Layout mode reuses Page mode's machinery unchanged.
  private active: ActiveTree = "page";
  // Whole-SITE undo history. `past` holds snapshots taken BEFORE each edit (node
  // or page structure); `future` holds snapshots undone past (for redo). Snapshots
  // are the whole site, so a node edit on any page — and page add/remove/rename —
  // all undo together. Capped so a long session can't grow the stack without bound.
  private past: Site[] = [];
  private future: Site[] = [];
  private static readonly HISTORY_LIMIT = 100;

  /** Accepts a legacy single-page `Document` (wrapped as a one-page site) or a
   *  full multi-page `Site`. */
  constructor(input: Document | Site) {
    this.site = "pages" in input ? structuredClone(input) : siteFromDocument(input);
    // A site always has a layout — a page renders *within* the shared shell, it is
    // never layout-less. So materialize a default frame up front (rather than
    // lazily on first Layout-mode entry) so the Page tab shows the locked layout
    // chrome from first paint. A site that already carries one keeps it.
    if (!this.site.frame) {
      this.site.frame = { root: stampTree(defaultFrameRoot()), editable: true };
    }
    // A site always has at least one page.
    if (this.site.pages.length === 0) {
      this.site.pages = [makePage("Home", "/", stampTree(newPageRoot()))];
    }
    this.activePageId = this.site.pages[0]!.id;
    this.saved = [structuredClone(this.site.theme)];
    this.syncPages();
  }

  /** Subscribe to committed edits; returns an unsubscribe. */
  subscribe(cb: (e: ChangeEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(kind: ChangeKind): void {
    for (const l of this.listeners) l({ kind });
  }

  /** The CURRENT page as a standalone `Document` (its root in the shared theme +
   *  frame context) — the shape the canvas + `useDocument` read. Defensively cloned. */
  extract(): Document {
    return structuredClone(pageDocument(this.site, this.currentPage().id)!);
  }

  /** A defensive clone of the WHOLE site — every page, theme, frame — for saving. */
  extractSite(): Site {
    return structuredClone(this.site);
  }

  get theme(): Theme {
    return this.site.theme;
  }

  // ── active page + tree (page body vs site frame) ───────────────────────────
  /** The active page (falls back to the first page if the pointer ever dangles). */
  private currentPage(): Page {
    return this.site.pages.find((p) => p.id === this.activePageId) ?? this.site.pages[0]!;
  }

  /** The root the spine currently edits — the active page body, or the frame shell. */
  private activeRoot(): Node {
    if (this.active === "frame" && this.site.frame) return this.site.frame.root;
    return this.currentPage().root;
  }

  /** Rebuild the cached switcher view (roster + active id). Called after any page
   *  change and after undo/redo, so `pagesView` swaps only when it truly changes. */
  private syncPages(): void {
    this.pagesViewCache = {
      pages: this.site.pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
      activeId: this.activePageId,
    };
  }

  // ── history-aware commit ───────────────────────────────────────────────────
  /** Snapshot the whole site onto the undo stack (and drop the redo future).
   *  Shared by node edits and page-structure edits. */
  private pushHistory(): void {
    this.past.push(structuredClone(this.site));
    if (this.past.length > Editor.HISTORY_LIMIT) this.past.shift();
    this.future = [];
  }

  /**
   * Run a node mutation against the ACTIVE tree, snapshotting the whole site first
   * so it can be undone. The mutator edits the live tree in place; `locate` returns
   * references INTO that live tree, so callers capture + mutate directly.
   * (Snapshotting the whole site means undo restores every page + the frame
   * together, whichever one the edit touched.)
   */
  private commit(kind: ChangeKind, mutate: () => void): void {
    this.pushHistory();
    mutate();
    this.emit(kind);
  }

  // ── selection ──────────────────────────────────────────────────────────────
  /** The selected node's id, or undefined. */
  get selection(): string | undefined {
    return this.selectedId;
  }

  /** The selected node itself, or undefined. */
  get selectedNode(): Node | undefined {
    return this.selectedId ? locate(this.activeRoot(), this.selectedId)?.node : undefined;
  }

  /** Select a node (or clear with undefined). No-op if already selected. */
  select(id: string | undefined): void {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this.emit("selection");
  }

  /** Look up a node by id (read-only clone-free reference into the live tree). */
  node(id: string): Node | undefined {
    return locate(this.activeRoot(), id)?.node;
  }

  // ── active tree / frame ────────────────────────────────────────────────────
  /** Which tree the spine currently edits. */
  get activeTree(): ActiveTree {
    return this.active;
  }

  /** The site frame (shared shell), or undefined if the site has none yet. */
  get frame(): Frame | undefined {
    return this.site.frame;
  }

  /**
   * Point the editing spine at the page body or the site frame (which always
   * exists — the constructor materializes a default one). Selection is tree-scoped
   * — an id in one tree means nothing in the other — so it clears on switch.
   */
  setActiveTree(which: ActiveTree): void {
    if (which === this.active) return;
    this.active = which;
    this.selectedId = undefined;
    this.emit("active");
  }

  // ── pages (multi-page site) ────────────────────────────────────────────────
  /** The current page roster + active id — a stable snapshot for the switcher. */
  get pagesView(): PagesView {
    return this.pagesViewCache;
  }

  /** The active page's id. */
  get activePage(): string {
    return this.activePageId;
  }

  /**
   * Switch which page the builder edits. A view concern (like selection) — NOT
   * history — so it never lands on the undo stack. Selection is page-scoped (an id
   * in one page means nothing in another), so it clears. The active TREE is left
   * as-is: in Layout mode the shared frame just re-composes with the new page in
   * its Outlet.
   */
  setActivePage(id: string): void {
    if (id === this.activePageId) return;
    if (!this.site.pages.some((p) => p.id === id)) return;
    this.activePageId = id;
    this.selectedId = undefined;
    this.syncPages();
    this.emit("active");
  }

  /** A slug not already taken by another page (appends -2, -3, … on collision). */
  private uniqueSlug(base: string): string {
    const taken = new Set(this.site.pages.map((p) => p.slug));
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  /**
   * Add a fresh page (auto-named "Page N", unique slug) and switch to it. Undoable.
   * Returns the new page's id.
   */
  addPage(name?: string, slug?: string): string {
    const label = name?.trim() || `Page ${this.site.pages.length + 1}`;
    const page = makePage(label, this.uniqueSlug(slug?.trim() || slugify(label)), stampTree(newPageRoot()));
    this.pushHistory();
    this.site.pages.push(page);
    this.activePageId = page.id;
    this.selectedId = undefined;
    this.syncPages();
    this.emit("page");
    return page.id;
  }

  /** Remove a page. Refuses to remove the last one (a site needs ≥1 page). If it
   *  was active, falls back to the previous page. Undoable. */
  removePage(id: string): void {
    if (this.site.pages.length <= 1) return;
    const idx = this.site.pages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    this.pushHistory();
    this.site.pages.splice(idx, 1);
    if (this.activePageId === id) {
      this.activePageId = (this.site.pages[idx - 1] ?? this.site.pages[0]!).id;
      this.selectedId = undefined;
    }
    this.syncPages();
    this.emit("page");
  }

  /** Rename a page's label (no-op on empty/unchanged). Undoable. */
  renamePage(id: string, name: string): void {
    const page = this.site.pages.find((p) => p.id === id);
    if (!page) return;
    const value = name.trim();
    if (!value || value === page.name) return;
    this.pushHistory();
    page.name = value;
    this.syncPages();
    this.emit("page");
  }

  /** Set a page's route slug (normalized + de-duped). Undoable. */
  setPageSlug(id: string, slug: string): void {
    const page = this.site.pages.find((p) => p.id === id);
    if (!page) return;
    const base = slugify(slug);
    // De-dupe against the OTHER pages only (keeping the page's own slug is a no-op).
    const others = new Set(this.site.pages.filter((p) => p.id !== id).map((p) => p.slug));
    let value = base;
    let i = 2;
    while (others.has(value)) value = `${base}-${i++}`;
    if (value === page.slug) return;
    this.pushHistory();
    page.slug = value;
    this.syncPages();
    this.emit("page");
  }

  // ── node edits ─────────────────────────────────────────────────────────────
  /** Replace a node's class string (the sole styling surface). */
  setClass(id: string, className: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    this.commit("class", () => {
      const value = className.trim();
      if (value) found.node.class = value;
      else delete found.node.class;
    });
  }

  /** Set (or clear, with undefined) a component node's typed prop. */
  setProp(id: string, key: string, value: unknown): void {
    const found = locate(this.activeRoot(), id);
    if (!found || found.node.kind !== "component") return;
    const node = found.node;
    this.commit("props", () => {
      const props = { ...(node.props ?? {}) };
      if (value === undefined) delete props[key];
      else props[key] = value;
      node.props = props;
    });
  }

  /** Set (or clear, with undefined) an element node's whitelisted attribute. */
  setAttr(id: string, key: string, value: string | number | boolean | undefined): void {
    const found = locate(this.activeRoot(), id);
    if (!found || found.node.kind !== "element") return;
    const node = found.node;
    this.commit("props", () => {
      const attrs = { ...(node.attrs ?? {}) };
      if (value === undefined) delete attrs[key];
      else attrs[key] = value;
      node.attrs = attrs;
    });
  }

  /**
   * Replace a node's primary text content. For an element, that's a single string
   * child; for a component, its `label` (if it has one) else `text` prop — the
   * same field `editableText` reads, so the Inspector's Content field round-trips.
   */
  setText(id: string, text: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    const node = found.node;
    this.commit("props", () => {
      if (node.kind === "element") {
        node.children = [text];
      } else {
        const props = { ...(node.props ?? {}) };
        if ("label" in props) props.label = text;
        else props.text = text;
        node.props = props;
      }
    });
  }

  /** Rename a node's Navigator layer label (or clear it). */
  setLabel(id: string, label: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    this.commit("props", () => {
      const value = label.trim();
      if (value) found.node.label = value;
      else delete found.node.label;
    });
  }

  // ── structure ──────────────────────────────────────────────────────────────
  /**
   * Insert a subtree under `parentId` at `index` (default: append). The node is
   * stamped with fresh ids first, so a template or a cross-document paste is safe.
   * Returns the new node's id and selects it. No-op if the parent can't hold
   * children.
   */
  insert(node: Node, parentId: string, index?: number): string | undefined {
    const parentLoc = locate(this.activeRoot(), parentId);
    if (!parentLoc || !isContainer(parentLoc.node)) return undefined;
    const stamped = stampTree(node);
    const newId = stamped.kind === "outlet" ? undefined : stamped.id;
    this.commit("structure", () => {
      const parent = parentLoc.node;
      const children = (parent.children ??= []);
      const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
      children.splice(at, 0, stamped);
    });
    if (newId) this.select(newId);
    return newId;
  }

  /**
   * Insert `node` relative to a target (default: the current selection), the way
   * a click-to-insert or a drop-on-node expects: if the target accepts children
   * it lands INSIDE (appended), otherwise it lands as the target's next SIBLING.
   * With no target it appends to the root. This is the palette's insert path.
   */
  insertRelative(node: Node, targetId?: string): string | undefined {
    const target = targetId ?? this.selectedId;
    const root = this.activeRoot();
    const rootId = root.kind === "outlet" ? undefined : root.id;

    if (!target) {
      return acceptsChildren(this.activeRoot()) && rootId ? this.insert(node, rootId) : undefined;
    }
    const found = locate(this.activeRoot(), target);
    if (!found) {
      return acceptsChildren(this.activeRoot()) && rootId ? this.insert(node, rootId) : undefined;
    }
    if (acceptsChildren(found.node) && found.node.id) return this.insert(node, found.node.id);
    if (found.parent?.id) return this.insert(node, found.parent.id, found.index + 1);
    return undefined; // a leaf root with no parent — nowhere to place it
  }

  /** Remove a node (never the root). Selects its parent if it was selected. */
  remove(id: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found || !found.parent) return; // missing or root
    const parentId = found.parent.id;
    this.commit("structure", () => {
      found.parent!.children!.splice(found.index, 1);
    });
    if (this.selectedId === id) this.select(parentId);
  }

  /**
   * Move a node under `parentId` at `index`. Refuses to drop a node into itself or
   * a descendant (would orphan the subtree). Indices are resolved against the
   * post-removal array when moving within the same parent.
   */
  move(id: string, parentId: string, index: number): void {
    if (id === parentId) return;
    const found = locate(this.activeRoot(), id);
    const parentLoc = locate(this.activeRoot(), parentId);
    if (!found || !found.parent || !parentLoc || !isContainer(parentLoc.node)) return;
    if (contains(this.activeRoot(), id, parentId)) return; // cycle guard
    this.commit("structure", () => {
      const from = found.parent!.children!;
      const [moved] = from.splice(found.index, 1);
      if (moved === undefined) return;
      const to = (parentLoc.node.children ??= []);
      // Same-parent moves shift indices left when the source sat before the target.
      const shift = found.parent === parentLoc.node && found.index < index ? 1 : 0;
      const at = Math.max(0, Math.min(index - shift, to.length));
      to.splice(at, 0, moved);
    });
  }

  /** Duplicate a node in place (fresh ids), inserting the copy right after it. */
  duplicate(id: string): string | undefined {
    const found = locate(this.activeRoot(), id);
    if (!found || !found.parent) return undefined; // can't duplicate the root
    const copy = stampTree(found.node);
    const newId = copy.kind === "outlet" ? undefined : copy.id;
    const parent = found.parent;
    const at = found.index + 1;
    this.commit("structure", () => {
      parent.children!.splice(at, 0, copy);
    });
    if (newId) this.select(newId);
    return newId;
  }

  // ── clipboard (copy / paste) ───────────────────────────────────────────────
  /** True when there's something to paste. */
  get canPaste(): boolean {
    return this.clipboard !== undefined;
  }

  /** Copy a node (default: the selection) into the clipboard as an id-free subtree. */
  copy(id?: string): void {
    const target = id ?? this.selectedId;
    if (!target) return;
    const found = locate(this.activeRoot(), target);
    if (!found) return;
    this.clipboard = stripIds(found.node);
  }

  /**
   * Paste the clipboard relative to the selection (inside a container, else as a
   * sibling — the same placement as the insert palette). Stamps fresh ids, so
   * repeated pastes never collide. Undoable; selects + returns the new node's id.
   */
  paste(): string | undefined {
    if (!this.clipboard) return undefined;
    return this.insertRelative(structuredClone(this.clipboard));
  }

  // ── undo / redo ────────────────────────────────────────────────────────────
  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Step back one edit (node or page structure). Theme/library edits aren't tracked. */
  undo(): void {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push(structuredClone(this.site));
    this.site = prev; // already an owned clone
    this.clampActivePage();
    this.clampSelection();
    this.syncPages();
    this.emit("replace");
  }

  /** Re-apply the last undone edit. */
  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(structuredClone(this.site));
    this.site = next;
    this.clampActivePage();
    this.clampSelection();
    this.syncPages();
    this.emit("replace");
  }

  /** Point the active page at a surviving page if a snapshot dropped the current one. */
  private clampActivePage(): void {
    if (!this.site.pages.some((p) => p.id === this.activePageId)) {
      this.activePageId = this.site.pages[0]!.id;
    }
  }

  /** Drop the selection if it points at a node the current tree no longer has. */
  private clampSelection(): void {
    if (this.selectedId && !locate(this.activeRoot(), this.selectedId)) {
      this.selectedId = undefined;
    }
  }

  // ── theme ──────────────────────────────────────────────────────────────────
  // Theme edits mutate the live site IN PLACE and skip the undo stack: a token
  // drag would otherwise bury real structural undo steps. Mutating in place (not
  // replacing `site`) keeps the current theme in every later history snapshot, so
  // undoing an edit never silently reverts the theme. (The theme is site-wide —
  // one theme across every page.)

  /** Replace the whole theme (the canvas + board repaint from the new tokens). */
  setTheme(theme: Theme): void {
    this.site.theme = structuredClone(theme);
    this.emit("theme");
  }

  /** Flip the previewed light/dark mode without disturbing the token bags. */
  setThemeMode(mode: "light" | "dark"): void {
    this.site.theme = { ...this.site.theme, mode };
    this.emit("theme");
  }

  // ── saved-theme library ──────────────────────────────────────────────────
  /** The site's saved themes (read-only snapshot; stable between mutations). */
  get savedThemes(): readonly Theme[] {
    return this.saved;
  }

  /** Snapshot the current theme into the library (replacing any of the same name). */
  saveTheme(): void {
    const snap = structuredClone(this.site.theme);
    this.saved = [snap, ...this.saved.filter((t) => t.name !== snap.name)];
    this.emit("library");
  }

  /** Apply a saved theme by name, preserving the previewed light/dark mode. */
  applySavedTheme(name: string): void {
    const found = this.saved.find((t) => t.name === name);
    if (!found) return;
    this.setTheme({ ...structuredClone(found), mode: this.site.theme.mode });
  }

  /** Remove a saved theme from the library. */
  deleteSavedTheme(name: string): void {
    if (!this.saved.some((t) => t.name === name)) return;
    this.saved = this.saved.filter((t) => t.name !== name);
    this.emit("library");
  }
}
