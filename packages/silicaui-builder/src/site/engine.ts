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
import type { BehaviorMarker, ClassValidator, ComponentNode, DataBinding, Document, ElementNode, Frame, Node, Page, Site, SymbolDef, Theme } from "@wizeworks/silicaui-html";
import { applyOverrides, composeValidators, defaultMakeId, el, flattenSymbols, listComponents, makePage, pageBody, pageDocument, siteFromDocument, slugify, stampTree, stripIds, walk } from "@wizeworks/silicaui-html";
import { defaultFrameRoot } from "./frame";

/** Constructor-time options — currently just the host's class policy (§9 of
 *  builder-contract.md). Composed with the engine's built-in denylist floor;
 *  see `composeValidators`. */
export interface EditorOptions {
  validateClass?: ClassValidator;
}

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
  | "symbols"
  | "replace";

/** Which tree the editing spine targets: the page BODY, the site FRAME, or a
 *  reusable SYMBOL master (editing a saved component propagates to its instances). */
export type ActiveTree = "page" | "frame" | "symbol";

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

/** The path from (excl.) root to (excl.) `id` — root-first, empty if `id` is the
 *  root itself or isn't found. Powers the binding picker's ancestor-based scope
 *  narrowing (`scopeAt`) — a plain read, no engine mutation involved. */
function ancestorPath(root: Node, id: string): Node[] {
  if (root.kind === "outlet" || root.id === id) return [];
  const path: Node[] = [];
  function search(node: Markable): boolean {
    for (const child of node.children ?? []) {
      if (typeof child === "string" || child.kind === "outlet") continue;
      if (child.id === id) return true;
      path.push(child);
      if (search(child)) return true;
      path.pop();
    }
    return false;
  }
  return search(root) ? [root, ...path] : [];
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
  // A symbol instance is ATOMIC — it renders its master, ignoring its own
  // children, so nothing may be nested inside it (it takes a sibling instead).
  if (node.instanceOf) return false;
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
  // The symbol master currently being edited (when `active === "symbol"`). Edits to
  // it flow to every instance because instances render THIS master, not a copy.
  private editingSymbolId: string | undefined;
  // Cached, referentially-stable symbol roster for the Components palette + hooks —
  // swapped (never mutated) only when a symbol is added/removed/renamed.
  private symbolsViewCache: readonly SymbolDef[] = [];
  // Whole-SITE undo history. `past` holds snapshots taken BEFORE each edit (node
  // or page structure); `future` holds snapshots undone past (for redo). Snapshots
  // are the whole site, so a node edit on any page — and page add/remove/rename —
  // all undo together. Capped so a long session can't grow the stack without bound.
  private past: Site[] = [];
  private future: Site[] = [];
  private static readonly HISTORY_LIMIT = 100;
  // The composed class-string validator (built-in floor + optional host policy),
  // fixed at construction — same single-seed-at-boot lifecycle as `document`.
  private readonly validateClass: ClassValidator;

  /** Accepts a legacy single-page `Document` (wrapped as a one-page site) or a
   *  full multi-page `Site`. */
  constructor(input: Document | Site, options: EditorOptions = {}) {
    this.validateClass = composeValidators(options.validateClass);
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
    // Symbols are site-scoped and shared across pages + the frame; a site may
    // arrive without any. (Held on the site so undo/redo + save carry them.)
    this.site.symbols ??= {};
    this.activePageId = this.site.pages[0]!.id;
    this.saved = [structuredClone(this.site.theme)];
    this.syncPages();
    this.syncSymbols();
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

  /** The root the spine currently edits — the active page body, the frame shell,
   *  or a symbol master. A dangling symbol pointer (e.g. after undo removed it)
   *  falls back to the page body so the spine always has a valid target. */
  private activeRoot(): Node {
    if (this.active === "frame" && this.site.frame) return this.site.frame.root;
    if (this.active === "symbol" && this.editingSymbolId) {
      const sym = this.site.symbols?.[this.editingSymbolId];
      if (sym) return sym.root;
    }
    return this.currentPage().root;
  }

  /** The live active-tree root (page/frame/symbol master) — the Canvas reads this
   *  directly for the symbol-editing case (the master isn't in the page Document). */
  get activeRootNode(): Node {
    return this.activeRoot();
  }

  /** Rebuild the cached symbol roster (stable identity between mutations). */
  private syncSymbols(): void {
    this.symbolsViewCache = Object.values(this.site.symbols ?? {});
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
    // A symbol master is entered by id (it needs one) — route through enterSymbol.
    if (which === "symbol") return;
    if (which === this.active) return;
    this.active = which;
    this.editingSymbolId = undefined; // leaving symbol mode drops the master pointer
    this.selectedId = undefined;
    this.emit("active");
  }

  // ── symbols (reusable saved components) ────────────────────────────────────
  /** The site's symbols — a stable roster for the Components palette + hooks. */
  get symbols(): readonly SymbolDef[] {
    return this.symbolsViewCache;
  }

  /** Look up one symbol by id (live reference — the Canvas resolves masters this way). */
  symbol(id: string): SymbolDef | undefined {
    return this.site.symbols?.[id];
  }

  /** The symbol master currently open for editing (id + name), or undefined. */
  get editingSymbol(): { id: string; name: string } | undefined {
    if (this.active !== "symbol" || !this.editingSymbolId) return undefined;
    const s = this.site.symbols?.[this.editingSymbolId];
    return s ? { id: s.id, name: s.name } : undefined;
  }

  /**
   * Save a node's subtree as a reusable symbol and replace it in place with an
   * INSTANCE of that new symbol (so the canvas looks unchanged but is now linked).
   * The master gets its own fresh ids, independent of the instance. Undoable.
   * No-op on the tree root (an instance needs a parent to live in). Returns the id.
   */
  createSymbol(name: string, fromId?: string): string | undefined {
    const target = fromId ?? this.selectedId;
    if (!target) return undefined;
    const found = locate(this.activeRoot(), target);
    if (!found || !found.parent) return undefined; // can't symbolize the root
    const label = name.trim() || "Component";
    const symId = defaultMakeId();
    const master = stampTree(found.node); // independent, editable master tree
    const instance = stampTree({ kind: "element", tag: "div", instanceOf: symId, label }) as ElementNode;
    this.pushHistory();
    (this.site.symbols ??= {})[symId] = { id: symId, name: label, root: master };
    found.parent.children![found.index] = instance;
    this.syncSymbols();
    this.emit("structure");
    this.emit("symbols");
    if (instance.id) this.select(instance.id);
    return symId;
  }

  /** Build a fresh (id-free) instance node for `symbolId`, or undefined if the
   *  symbol is gone or it would self-nest (a symbol inside its own master). The
   *  drop path stamps + places it; `insertSymbolInstance` is the click path. */
  makeInstanceNode(symbolId: string): Node | undefined {
    const sym = this.site.symbols?.[symbolId];
    if (!sym) return undefined;
    if (this.active === "symbol" && this.editingSymbolId === symbolId) return undefined;
    return { kind: "element", tag: "div", instanceOf: symbolId, label: sym.name };
  }

  /**
   * Create a brand-new blank component (a starter master) and OPEN it for editing.
   * The "create from scratch" path (vs `createSymbol`, which lifts existing nodes).
   * Undoable. Returns the new symbol id. Starter classes are LITERAL here so the
   * canvas safelist scanner emits them.
   */
  createBlankSymbol(name?: string): string {
    return this.createComponent(
      name,
      el("div", "flex flex-col gap-3 p-6", {
        children: [
          el("h3", "text-lg font-semibold text-base-content", { text: "New component" }),
          el("p", "text-base-content/70", { text: "Add elements from the Insert panel." }),
        ],
      }),
    );
  }

  /**
   * Create a new component from a starter `root` (a blank shell or a ready-made
   * section template) and OPEN it for editing. The root is deep-stamped with fresh
   * ids so a shared block template is safe to pass. Undoable. Returns the symbol id.
   */
  createComponent(name: string | undefined, root: Node): string {
    const label = name?.trim() || `Component ${this.symbolsViewCache.length + 1}`;
    const symId = defaultMakeId();
    const master = stampTree(root);
    this.pushHistory();
    (this.site.symbols ??= {})[symId] = { id: symId, name: label, root: master };
    this.editingSymbolId = symId;
    this.active = "symbol";
    this.selectedId = undefined;
    this.syncSymbols();
    this.emit("symbols");
    this.emit("active");
    return symId;
  }

  /** Insert an instance of `symbolId` relative to the selection (palette click). */
  insertSymbolInstance(symbolId: string, targetId?: string): string | undefined {
    const instance = this.makeInstanceNode(symbolId);
    return instance ? this.insertRelative(instance, targetId) : undefined;
  }

  /** Open a symbol master for editing — the whole spine retargets to it, and edits
   *  propagate to every instance (they render THIS master). Selection clears. */
  enterSymbol(symbolId: string): void {
    if (!this.site.symbols?.[symbolId]) return;
    this.editingSymbolId = symbolId;
    this.active = "symbol";
    this.selectedId = undefined;
    this.emit("active");
  }

  /** Leave symbol-editing, returning to the page body. */
  exitSymbol(): void {
    this.setActiveTree("page");
  }

  /**
   * Set (or clear, with `undefined`) this instance's text override for one master
   * node — so this instance can differ from its siblings without detaching. Keyed
   * by the MASTER node's id. Undoable. No-op on a non-instance.
   */
  setInstanceOverrideText(instanceId: string, masterNodeId: string, text: string | undefined): void {
    const found = locate(this.activeRoot(), instanceId);
    if (!found || !found.node.instanceOf) return;
    const node = found.node;
    this.commit("props", () => {
      const overrides = { ...(node.overrides ?? {}) };
      const rest = { ...overrides[masterNodeId] };
      if (text === undefined) delete rest.text;
      else rest.text = text;
      if (Object.keys(rest).length) overrides[masterNodeId] = rest;
      else delete overrides[masterNodeId];
      if (Object.keys(overrides).length) node.overrides = overrides;
      else delete node.overrides;
    });
  }

  /** Detach an instance from its symbol: replace it with an independent, editable
   *  clone of the master WITH this instance's overrides baked in (severing the
   *  propagation link but keeping what you customized). Undoable. */
  detachInstance(id: string): string | undefined {
    const found = locate(this.activeRoot(), id);
    if (!found || !found.parent || !found.node.instanceOf) return undefined;
    const master = this.site.symbols?.[found.node.instanceOf]?.root;
    if (!master) return undefined;
    const copy = stampTree(applyOverrides(structuredClone(master), found.node.overrides));
    const newId = copy.kind === "outlet" ? undefined : copy.id;
    this.commit("structure", () => {
      found.parent!.children![found.index] = copy;
    });
    if (newId) this.select(newId);
    return newId;
  }

  /** Rename a symbol (and refresh the Navigator label its instances carry). Undoable. */
  renameSymbol(symbolId: string, name: string): void {
    const sym = this.site.symbols?.[symbolId];
    const value = name.trim();
    if (!sym || !value || value === sym.name) return;
    this.pushHistory();
    sym.name = value;
    this.forEachTree((root) =>
      walk(root, (n) => {
        if (n.kind !== "outlet" && n.instanceOf === symbolId) n.label = value;
      }),
    );
    this.syncSymbols();
    this.emit("symbols");
    this.emit("structure");
  }

  /** Delete a symbol, detaching every instance of it (across all pages, the frame,
   *  and other masters) into an independent clone so no dangling ref remains. Undoable. */
  deleteSymbol(symbolId: string): void {
    const sym = this.site.symbols?.[symbolId];
    if (!sym) return;
    this.pushHistory();
    const master = sym.root;
    this.forEachTree((root) =>
      walk(root, (n) => {
        const kids = n.kind !== "outlet" ? n.children : undefined;
        if (!kids) return;
        for (let i = 0; i < kids.length; i++) {
          const c = kids[i];
          if (c && typeof c !== "string" && c.kind !== "outlet" && c.instanceOf === symbolId) {
            kids[i] = stampTree(applyOverrides(structuredClone(master), c.overrides));
          }
        }
      }),
    );
    delete this.site.symbols![symbolId];
    if (this.editingSymbolId === symbolId) {
      this.active = "page";
      this.editingSymbolId = undefined;
    }
    this.selectedId = undefined;
    this.syncSymbols();
    this.emit("structure");
    this.emit("symbols");
  }

  /** Run a fn over every editable tree in the site (pages, frame, symbol masters). */
  private forEachTree(fn: (root: Node) => void): void {
    for (const p of this.site.pages) fn(p.root);
    if (this.site.frame) fn(this.site.frame.root);
    for (const s of Object.values(this.site.symbols ?? {})) fn(s.root);
  }

  /** The whole site with every instance inlined + symbols dropped — ready for
   *  `toHtml` (output is always plain markup; symbols are an authoring concept). */
  exportSite(): Site {
    const site = structuredClone(this.site);
    const syms = site.symbols ?? {};
    const flat = (root: Node): Node => flattenSymbols(root, syms);
    return {
      version: site.version,
      theme: site.theme,
      frame: site.frame ? { ...site.frame, root: flat(site.frame.root) } : undefined,
      pages: site.pages.map((p) => ({ ...p, root: flat(p.root) })),
    };
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
  /** Replace a node's class string (the sole styling surface). Runs the
   *  composed floor+host policy (§9) first — a rejected string is a no-op and
   *  the reason comes back so the UI (e.g. `ClassField`) can surface it. */
  setClass(id: string, className: string): { ok: true } | { ok: false; reason: string } {
    const found = locate(this.activeRoot(), id);
    if (!found) return { ok: true };
    const value = className.trim();
    if (value) {
      const result = this.validateClass(value);
      if (!result.ok) return result;
    }
    this.commit("class", () => {
      if (value) found.node.class = value;
      else delete found.node.class;
    });
    return { ok: true };
  }

  /** The path from (excl.) root to (excl.) `id` within the ACTIVE tree — for a
   *  host-supplied binding picker's ancestor-based scope narrowing (`scopeAt`). */
  ancestorsOf(id: string): Node[] {
    return ancestorPath(this.activeRoot(), id);
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

  /**
   * Change an ELEMENT node's semantic tag (a heading level h1→h2, or a container
   * div→section/nav/header/footer). Pure semantics — style rides on `class`, so a
   * retagged node keeps its look. No-op on components/outlets or a blank tag.
   */
  setTag(id: string, tag: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found || found.node.kind !== "element") return;
    const value = tag.trim();
    if (!value) return;
    const node = found.node;
    this.commit("props", () => {
      node.tag = value;
    });
  }

  /**
   * Set (or clear, with undefined) a node's dynamic-content binding. The union is
   * "at most one" by construction, so this replaces any existing binding wholesale.
   * The `ref` is opaque — @wizeworks/silicaui never parses it; a host (sparx) interprets it.
   * Lowers to `data-sui-bind` / `-repeat` / `-action` (+ `href`) in `toHtml`.
   */
  setData(id: string, binding: DataBinding | undefined): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    const node = found.node;
    this.commit("props", () => {
      if (binding) node.data = binding;
      else delete node.data;
    });
  }

  /**
   * Set (or clear, with undefined) a node's behavior marker — e.g. the
   * Inspector's Animate section attaching `{ type: "reveal", params }` for a
   * Scroll trigger. Lowers to `data-sui-behavior` / `-params` in `toHtml`.
   */
  setBehavior(id: string, marker: BehaviorMarker | undefined): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    const node = found.node;
    this.commit("props", () => {
      if (marker) node.behavior = marker;
      else delete node.behavior;
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
    this.clampSymbol();
    this.clampSelection();
    this.syncPages();
    this.syncSymbols();
    this.emit("replace");
  }

  /** Re-apply the last undone edit. */
  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(structuredClone(this.site));
    this.site = next;
    this.clampActivePage();
    this.clampSymbol();
    this.clampSelection();
    this.syncPages();
    this.syncSymbols();
    this.emit("replace");
  }

  /** Point the active page at a surviving page if a snapshot dropped the current one. */
  private clampActivePage(): void {
    if (!this.site.pages.some((p) => p.id === this.activePageId)) {
      this.activePageId = this.site.pages[0]!.id;
    }
  }

  /** After a history swap, drop a symbol-editing pointer whose master is gone
   *  (fall back to the page body so the spine never targets a missing tree). */
  private clampSymbol(): void {
    if (this.active === "symbol" && (!this.editingSymbolId || !this.site.symbols?.[this.editingSymbolId])) {
      this.active = "page";
      this.editingSymbolId = undefined;
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
