/**
 * The builder engine — framework-neutral document state + a tiny subscription
 * model. Holds the `Document` (root + theme), the site's saved-theme library
 * (`site.savedThemes` — real site data, round-trips through `onChange` same as
 * everything else), the current selection, and the full node-editing spine
 * (class/prop/attr edits, structural insert/remove/move/duplicate) with
 * whole-document undo/redo.
 *
 * Everything mutates through here; React reads via the hooks in
 * `react/editor-context`. Node mutations run through `commit`, which snapshots
 * the document onto the undo stack first; theme + library edits deliberately
 * skip history (a token drag would otherwise flood it) but still mutate the live
 * doc IN PLACE, so a later undo snapshot always carries the current theme.
 */
import type { BehaviorMarker, Child, ClassValidator, ComponentNode, DataBinding, Document, ElementNode, Frame, HostNode, Node, Page, Site, SymbolDef, Theme } from "@wizeworks/silicaui-html";
import { applyOverrides, assignOrds, composeValidators, defaultMakeId, el, flattenSymbols, listComponents, makePage, ordAt, pageBody, pageDocument, siteFromDocument, slugify, stampTree, stripIds, stripOrds, walk } from "@wizeworks/silicaui-html";
import { defaultFrameRoot } from "./frame";
import type { Op, OpTarget, SymbolDetachment } from "./ops";

/** Constructor-time options — currently just the host's class policy (§9 of
 *  builder-contract.md). Composed with the engine's built-in denylist floor;
 *  see `composeValidators`. */
export interface EditorOptions {
  validateClass?: ClassValidator;
}

/** A node that carries an id — selectable/locatable. Everything except an outlet
 *  (a host node is markable but childless — see `Container`). */
type Markable = ElementNode | ComponentNode | HostNode;

/** A node that can HOLD children — the drop-into targets. A host node is a LEAF,
 *  so it's markable but never a container. */
type Container = ElementNode | ComponentNode;

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

/**
 * Host-owned undo/redo, for a collaborative session — see `setHistoryDelegate`.
 * The engine calls these instead of touching its own snapshot stack; the host
 * applies the outcome back through `applyRemoteOps` / `replaceState`.
 */
export interface HistoryDelegate {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

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
/**
 * Kind precedence, most structural first. A single user action can touch several
 * kinds (creating a symbol changes `structure` AND `symbols`); `kind` reports the
 * most structural one so pre-batching subscribers keep working, while `kinds`
 * carries the whole truth. Anything absent here sorts last.
 */
const KIND_ORDER: readonly ChangeKind[] = [
  "replace",
  "page",
  "symbols",
  "structure",
  "class",
  "props",
  "theme",
  "library",
  "active",
  "selection",
];

/** Which `ChangeKind` an incoming op represents, so a remote batch reports the
 *  same kinds a local edit would have. */
function kindForOp(op: Op): ChangeKind {
  if (op.kind === "site.replace") return "replace";
  if (op.kind === "theme.set") return "theme";
  if (op.kind === "savedThemes.set") return "library";
  if (op.kind.startsWith("page.")) return "page";
  if (op.kind.startsWith("symbol.")) return "symbols";
  if (op.kind === "node.setClass") return "class";
  if (op.kind === "node.insert" || op.kind === "node.remove" || op.kind === "node.move") return "structure";
  if (op.kind === "frame.setEditable") return "structure";
  return "props";
}

/** The most structural kind in a batch — the value `ChangeEvent.kind` reports. */
function primaryKind(kinds: readonly ChangeKind[]): ChangeKind {
  let best = kinds[0]!;
  let bestRank = KIND_ORDER.indexOf(best);
  if (bestRank < 0) bestRank = KIND_ORDER.length;
  for (const k of kinds) {
    let rank = KIND_ORDER.indexOf(k);
    if (rank < 0) rank = KIND_ORDER.length;
    if (rank < bestRank) {
      best = k;
      bestRank = rank;
    }
  }
  return best;
}

export interface ChangeEvent {
  /**
   * The most structural kind this action touched — see `KIND_ORDER`. Kept as the
   * headline field so a subscriber written before batching still reads sensibly,
   * but it is LOSSY: an action that changes several kinds reports only the
   * strongest. Filter on `kinds`, not this.
   */
  kind: ChangeKind;
  /**
   * Every kind this action touched, deduped, in the order the engine recorded
   * them. One user action fires exactly one event — creating a symbol reports
   * `["structure", "symbols", "selection"]` in a single emit rather than two
   * events with a third trailing behind. This is the field to filter on.
   */
  kinds: readonly ChangeKind[];
  /**
   * The semantic operations this action performed, in causal order — what the
   * author DID, as opposed to what the document now is. A host relays these
   * instead of overwriting with the whole `Site`, so two authors editing one
   * site don't erase each other. Empty only for a purely view-level action
   * (selection, page switch), which changes no stored state.
   */
  ops: readonly Op[];
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

/** A node that can hold children (everything but an outlet and a host leaf). */
function isContainer(node: Node): node is Container {
  return node.kind !== "outlet" && node.kind !== "host";
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
  // A host node is a LEAF — a live host widget, never a drop-into target. An
  // insertion lands BESIDE it (a sibling), never inside.
  if (node.kind === "host") return false;
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
  // ── open-action (transaction) state ────────────────────────────────────────
  // One USER action = one emit, however many internal mutations it makes. These
  // three fields track the currently-open action; nested `transact` calls join
  // the outermost one rather than emitting on their own, so `createSymbol`
  // (which mutates the tree, adds a symbol, and moves the selection) fires a
  // single event instead of three.
  private txDepth = 0;
  private txKinds: ChangeKind[] = [];
  private txHistory = false;
  // Ops recorded by the open action, in causal order.
  private txOps: Op[] = [];
  // Depth of remote application. While non-zero, `record` is suppressed: an op
  // arriving from another author must not be re-emitted as a local edit, or the
  // host would receive its own broadcast straight back.
  private remote = 0;
  // When set, undo/redo are the host's job — see `setHistoryDelegate`.
  private historyDelegate: HistoryDelegate | undefined;
  // The host sequence number this client last had applied. Rides out on every
  // batch as `meta.baseSeq` so the host can tell whether we were behind when we
  // produced these ops, and send back whatever we missed.
  private seq = 0;
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
    // The site's own saved-theme library ("This site" in the Themes panel), as
    // opposed to the shipped `THEME_PRESETS`. A site that doesn't have one yet
    // (new site, or one saved before this field existed) starts with just its
    // current theme, same as the library's prior in-memory default.
    this.site.savedThemes ??= [structuredClone(this.site.theme)];
    this.activePageId = this.site.pages[0]!.id;
    // Backfill sibling ordering keys on every tree. A site authored before `ord`
    // existed arrives without them; this threads keys through in current array
    // order, so nothing moves. Load-time normalization, deliberately not an op —
    // it precedes any op stream and can't change render order, so a peer running
    // the same backfill on the same site lands in the same place.
    this.forEachTree(assignOrds);
    this.syncPages();
    this.syncSymbols();
  }

  /** Subscribe to committed edits; returns an unsubscribe. */
  subscribe(cb: (e: ChangeEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Record `kind` against the open action. Outside a transaction this is a
   * complete action on its own, so it opens and closes one immediately — which
   * is why a bare `emit` still behaves exactly like it always did.
   */
  private emit(kind: ChangeKind): void {
    if (this.txDepth === 0) {
      this.transact([kind], false, () => {});
      return;
    }
    if (!this.txKinds.includes(kind)) this.txKinds.push(kind);
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
   * Run `body` as ONE user action: snapshot history at most once, accumulate every
   * kind it touches, and emit a single event when the outermost call returns.
   *
   * This is the engine's sole mutation chokepoint. Every method that changes
   * stored state runs through it — including the page/symbol ops that used to
   * call `pushHistory` by hand and emit twice, and the theme ops that skip
   * history. That matters beyond tidiness: it is the one place a semantic-op
   * recorder can hook to see every mutation exactly once, in causal order,
   * grouped by the action that caused it.
   *
   * Nesting collapses — an inner `transact` joins the open action rather than
   * emitting on its own. `history` is honored the first time any level asks for
   * it, so an action whose root declares `history: false` but which internally
   * runs a history-taking op still gets exactly one snapshot, taken before that
   * op mutates anything.
   */
  private transact<T>(kinds: readonly ChangeKind[], history: boolean, body: () => T): T {
    if (this.txDepth === 0) {
      this.txKinds = [];
      this.txHistory = false;
      this.txOps = [];
    }
    this.txDepth++;
    try {
      if (history && !this.txHistory) {
        this.pushHistory();
        this.txHistory = true;
      }
      for (const k of kinds) if (!this.txKinds.includes(k)) this.txKinds.push(k);
      return body();
    } finally {
      this.txDepth--;
      if (this.txDepth === 0) {
        const batch = this.txKinds;
        const ops = this.txOps;
        this.txKinds = [];
        this.txOps = [];
        this.txHistory = false;
        // A `transact` that recorded nothing changed nothing — stay silent rather
        // than waking every subscriber (and the host's onChange) for a no-op.
        if (batch.length) {
          const event: ChangeEvent = { kind: primaryKind(batch), kinds: batch, ops };
          for (const l of this.listeners) l(event);
        }
      }
    }
  }

  /**
   * Run a node mutation against the ACTIVE tree, snapshotting the whole site first
   * so it can be undone. The mutator edits the live tree in place; `locate` returns
   * references INTO that live tree, so callers capture + mutate directly.
   * (Snapshotting the whole site means undo restores every page + the frame
   * together, whichever one the edit touched.)
   */
  private commit(kind: ChangeKind, mutate: () => void): void {
    this.transact([kind], true, mutate);
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
    this.transact(["active"], false, () => {
      this.active = which;
      this.editingSymbolId = undefined; // leaving symbol mode drops the master pointer
      this.select(undefined);
    });
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
    // The instance takes over the original's slot, so it inherits its key —
    // a replacement in place is not a reorder.
    instance.ord = found.node.ord;
    const originalId = found.node.id!;
    return this.transact(["structure", "symbols"], true, () => {
      (this.site.symbols ??= {})[symId] = { id: symId, name: label, root: master };
      found.parent!.children![found.index] = instance;
      this.syncSymbols();
      // Causal order matters: the symbol must exist before an instance can
      // reference it, and the original must go before its replacement arrives.
      const target = this.activeTarget();
      this.record({ target: { scope: "site" }, kind: "symbol.set", symbol: this.site.symbols![symId]! });
      this.record({ target, kind: "node.remove", nodeId: originalId });
      if (instance.ord) {
        this.record({ target, kind: "node.insert", parentId: found.parent!.id!, ord: instance.ord, node: instance });
      }
      if (instance.id) this.select(instance.id);
      return symId;
    });
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
    return this.transact(["symbols", "active"], true, () => {
      (this.site.symbols ??= {})[symId] = { id: symId, name: label, root: master };
      this.editingSymbolId = symId;
      this.active = "symbol";
      this.select(undefined);
      this.syncSymbols();
      this.record({ target: { scope: "site" }, kind: "symbol.set", symbol: this.site.symbols![symId]! });
      return symId;
    });
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
    this.transact(["active"], false, () => {
      this.editingSymbolId = symbolId;
      this.active = "symbol";
      this.select(undefined);
    });
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
      this.record({
        target: this.activeTarget(),
        kind: "node.setOverride",
        nodeId: instanceId,
        masterNodeId,
        override: overrides[masterNodeId] ?? null,
      });
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
    // Detach replaces the instance in its own slot — same position, so same key.
    if (copy.kind !== "outlet") copy.ord = found.node.ord;
    return this.transact(["structure"], true, () => {
      found.parent!.children![found.index] = copy;
      // A swap in place, expressed as remove-then-insert at the same key. Two
      // ops rather than a bespoke "replace": it composes from the vocabulary
      // that already exists, and the shared `ord` keeps the slot.
      const target = this.activeTarget();
      this.record({ target, kind: "node.remove", nodeId: id });
      if (copy.kind !== "outlet" && copy.ord && found.parent!.id) {
        this.record({ target, kind: "node.insert", parentId: found.parent!.id, ord: copy.ord, node: copy });
      }
      if (newId) this.select(newId);
      return newId;
    });
  }

  /** Rename a symbol (and refresh the Navigator label its instances carry). Undoable. */
  renameSymbol(symbolId: string, name: string): void {
    const sym = this.site.symbols?.[symbolId];
    const value = name.trim();
    if (!sym || !value || value === sym.name) return;
    this.transact(["symbols", "structure"], true, () => {
      sym.name = value;
      this.record({ target: { scope: "site" }, kind: "symbol.set", symbol: sym });
      // The rename propagates to every instance's Navigator label, across every
      // tree. Each is a real node mutation, so each gets its own op — a peer
      // must not have to re-derive which nodes were touched.
      this.forEachTree((root, target) =>
        walk(root, (n) => {
          if (n.kind !== "outlet" && n.instanceOf === symbolId) {
            n.label = value;
            if (n.id) this.record({ target, kind: "node.rename", nodeId: n.id, name: value });
          }
        }),
      );
      this.syncSymbols();
    });
  }

  /** Delete a symbol, detaching every instance of it (across all pages, the frame,
   *  and other masters) into an independent clone so no dangling ref remains. Undoable. */
  deleteSymbol(symbolId: string): void {
    const sym = this.site.symbols?.[symbolId];
    if (!sym) return;
    const master = sym.root;
    this.transact(["structure", "symbols"], true, () => {
      // The detached replacements carry freshly-minted ids, so they travel WITH
      // the op. A peer replaying "detach every instance" on its own would mint
      // different ids for the same content and the documents would diverge while
      // looking identical.
      const detachments: SymbolDetachment[] = [];
      this.forEachTree((root, target) =>
        walk(root, (n) => {
          const kids = n.kind !== "outlet" ? n.children : undefined;
          if (!kids) return;
          for (let i = 0; i < kids.length; i++) {
            const c = kids[i];
            if (c && typeof c !== "string" && c.kind !== "outlet" && c.instanceOf === symbolId) {
              const detached = stampTree(applyOverrides(structuredClone(master), c.overrides));
              // Cascade detach is a swap in place — each replacement keeps the
              // slot (and key) of the instance it stands in for.
              if (detached.kind !== "outlet") detached.ord = c.ord;
              if (c.id) detachments.push({ target, nodeId: c.id, node: detached });
              kids[i] = detached;
            }
          }
        }),
      );
      delete this.site.symbols![symbolId];
      this.record({ target: { scope: "site" }, kind: "symbol.delete", symbolId, detach: detachments });
      if (this.editingSymbolId === symbolId) {
        this.active = "page";
        this.editingSymbolId = undefined;
      }
      this.select(undefined);
      this.syncSymbols();
    });
  }

  /** Run a fn over every editable tree in the site (pages, frame, symbol masters). */
  private forEachTree(fn: (root: Node, target: OpTarget) => void): void {
    for (const p of this.site.pages) fn(p.root, { scope: "page", id: p.id });
    if (this.site.frame) fn(this.site.frame.root, { scope: "frame" });
    for (const s of Object.values(this.site.symbols ?? {})) fn(s.root, { scope: "symbol", id: s.id });
  }

  // ── semantic operations ────────────────────────────────────────────────────
  /**
   * Record one op against the open action. Ops accumulate in causal order and
   * ship with the action's single `ChangeEvent`.
   *
   * Every op is deep-cloned on the way in. The engine mutates its trees in
   * place, so an op holding a live reference would keep changing under the host
   * after it was handed over — and a later undo would rewrite history that had
   * already been sent.
   */
  private record(op: Op): void {
    if (this.remote > 0) return; // applying someone else's edit — nothing to send back
    this.txOps.push(structuredClone(op));
  }

  /** The tree the editing spine is currently pointed at — the target for any op
   *  produced by a node edit, since every node edit runs against `activeRoot`. */
  private activeTarget(): OpTarget {
    if (this.active === "frame" && this.site.frame) return { scope: "frame" };
    if (this.active === "symbol" && this.editingSymbolId && this.site.symbols?.[this.editingSymbolId]) {
      return { scope: "symbol", id: this.editingSymbolId };
    }
    return { scope: "page", id: this.currentPage().id };
  }

  /** The whole-document escape hatch — see `SiteReplaceOp`. */
  private recordReplace(): void {
    this.record({
      target: { scope: "site" },
      kind: "site.replace",
      pages: this.site.pages,
      frame: this.site.frame,
      symbols: this.site.symbols ?? {},
      theme: this.site.theme,
      savedThemes: this.site.savedThemes ?? [],
    });
  }

  /** The host sequence number this client last had applied (`meta.baseSeq`). */
  get baseSeq(): number {
    return this.seq;
  }

  /** The tree an op addresses, or undefined if it names one that's gone. */
  private rootFor(target: OpTarget): Node | undefined {
    if (target.scope === "page") return this.site.pages.find((p) => p.id === target.id)?.root;
    if (target.scope === "frame") return this.site.frame?.root;
    if (target.scope === "symbol") return this.site.symbols?.[target.id]?.root;
    return undefined; // "site" addresses no tree
  }

  /**
   * Insert `node` among `children` at the position its `ord` implies — before
   * the first keyed sibling that sorts above it. This is what makes a remote
   * insert land in the same place on every peer regardless of arrival order.
   *
   * Ties are broken by node id, and they are not hypothetical: `ordAt` is
   * deterministic, so two authors inserting into the SAME slot from the same
   * base state compute the SAME key. Equal keys have no inherent order, and
   * without a tie-break each peer would keep its own edit first and the two
   * documents would silently diverge. Ids are globally unique and identical on
   * both sides, so comparing them yields one total order everywhere — no
   * randomness, no coordination.
   */
  private static insertByOrd(children: Child[], node: Node, ord: string): void {
    if (node.kind !== "outlet") node.ord = ord;
    const id = node.kind === "outlet" ? "" : node.id ?? "";
    let at = children.length;
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (c === undefined || typeof c === "string" || c.kind === "outlet" || c.ord === undefined) continue;
      if (c.ord > ord || (c.ord === ord && (c.id ?? "") > id)) {
        at = i;
        break;
      }
    }
    children.splice(at, 0, node);
  }

  /**
   * Apply one remote op. Returns false when the op can't be applied — its target
   * tree or node is gone (an intervening edit removed it), or it would create a
   * cycle. A false here is a DROP, not an error: ops commute, so an op whose
   * subject no longer exists is simply moot.
   */
  private applyOp(op: Op): boolean {
    // ── site-scoped ops ──────────────────────────────────────────────────────
    switch (op.kind) {
      case "site.replace":
        this.site.pages = structuredClone(op.pages) as Page[];
        this.site.frame = op.frame ? (structuredClone(op.frame) as Frame) : undefined;
        this.site.symbols = structuredClone(op.symbols);
        this.site.theme = structuredClone(op.theme);
        this.site.savedThemes = structuredClone(op.savedThemes);
        return true;
      case "theme.set":
        this.site.theme = structuredClone(op.theme);
        return true;
      case "savedThemes.set":
        this.site.savedThemes = structuredClone(op.savedThemes);
        return true;
      case "frame.setEditable":
        if (!this.site.frame) return false;
        this.site.frame.editable = op.editable;
        return true;
      case "symbol.set":
        (this.site.symbols ??= {})[op.symbol.id] = structuredClone(op.symbol);
        return true;
      case "symbol.delete": {
        if (!this.site.symbols?.[op.symbolId]) return false;
        delete this.site.symbols[op.symbolId];
        // The detached replacements travel with the op — see `SymbolDeleteOp`.
        for (const d of op.detach) {
          const root = this.rootFor(d.target);
          const found = root ? locate(root, d.nodeId) : undefined;
          if (!found?.parent) continue;
          found.parent.children![found.index] = structuredClone(d.node) as Node;
        }
        return true;
      }
      case "page.create":
        if (this.site.pages.some((p) => p.id === op.page.id)) return false; // already here
        this.site.pages.push(structuredClone(op.page) as Page);
        return true;
      case "page.delete": {
        if (this.site.pages.length <= 1) return false; // a site needs ≥1 page
        const idx = this.site.pages.findIndex((p) => p.id === op.pageId);
        if (idx < 0) return false;
        this.site.pages.splice(idx, 1);
        return true;
      }
      case "page.rename": {
        const page = this.site.pages.find((p) => p.id === op.pageId);
        if (!page) return false;
        page.name = op.name;
        return true;
      }
      case "page.setSlug": {
        const page = this.site.pages.find((p) => p.id === op.pageId);
        if (!page) return false;
        page.slug = op.slug;
        return true;
      }
      case "page.reorder": {
        const byId = new Map(this.site.pages.map((p) => [p.id, p]));
        const next: Page[] = [];
        for (const id of op.pageIds) {
          const p = byId.get(id);
          if (p && !next.includes(p)) next.push(p);
        }
        for (const p of this.site.pages) if (!next.includes(p)) next.push(p);
        if (next.length !== this.site.pages.length) return false;
        this.site.pages = next;
        return true;
      }
      default:
        break;
    }

    // ── node-scoped ops ──────────────────────────────────────────────────────
    const root = this.rootFor(op.target);
    if (!root) return false;

    if (op.kind === "node.insert") {
      const parent = locate(root, op.parentId);
      if (!parent || !isContainer(parent.node)) return false;
      const incoming = structuredClone(op.node) as Node;
      const id = incoming.kind === "outlet" ? undefined : incoming.id;
      // Idempotent: a re-delivered insert must not duplicate the subtree.
      if (id && locate(root, id)) return false;
      Editor.insertByOrd((parent.node.children ??= []), incoming, op.ord);
      return true;
    }

    const found = locate(root, op.nodeId);
    if (!found) return false; // dropped — an intervening op removed it
    const node = found.node;

    switch (op.kind) {
      case "node.remove":
        if (!found.parent) return false; // never the tree root
        found.parent.children!.splice(found.index, 1);
        return true;
      case "node.move": {
        const parent = locate(root, op.parentId);
        if (!parent || !isContainer(parent.node) || !found.parent) return false;
        if (op.nodeId === op.parentId) return false;
        if (contains(root, op.nodeId, op.parentId)) return false; // would orphan the subtree
        const [moved] = found.parent.children!.splice(found.index, 1);
        if (moved === undefined || typeof moved === "string") return false;
        Editor.insertByOrd((parent.node.children ??= []), moved, op.ord);
        return true;
      }
      case "node.setClass":
        if (op.class) node.class = op.class;
        else delete node.class;
        return true;
      case "node.setProps": {
        if (node.kind !== "component" && node.kind !== "host") return false;
        const props = { ...(node.props ?? {}) };
        for (const [k, v] of Object.entries(op.patch)) {
          if (v === null) delete props[k];
          else props[k] = v;
        }
        node.props = props;
        return true;
      }
      case "node.setAttrs": {
        if (node.kind !== "element") return false;
        const attrs = { ...(node.attrs ?? {}) };
        for (const [k, v] of Object.entries(op.patch)) {
          if (v === null) delete attrs[k];
          else attrs[k] = v;
        }
        node.attrs = attrs;
        return true;
      }
      case "node.setText":
        // Same resolution the local `setText` performs — the op states intent,
        // the receiver decides where the text physically lands.
        if (node.kind === "element") {
          node.children = [op.text];
        } else {
          const props = { ...(node.props ?? {}) };
          if ("label" in props) props.label = op.text;
          else props.text = op.text;
          node.props = props;
        }
        return true;
      case "node.setTag":
        if (node.kind !== "element") return false;
        node.tag = op.tag;
        return true;
      case "node.setBinding":
        if (op.binding) node.data = structuredClone(op.binding);
        else delete node.data;
        return true;
      case "node.setBehavior":
        if (op.behavior) node.behavior = structuredClone(op.behavior);
        else delete node.behavior;
        return true;
      case "node.setLocked":
        if (op.locked) node.locked = op.locked;
        else delete node.locked;
        return true;
      case "node.rename":
        if (op.name) node.label = op.name;
        else delete node.label;
        return true;
      case "node.setOverride": {
        const overrides = { ...(node.overrides ?? {}) };
        if (op.override) overrides[op.masterNodeId] = structuredClone(op.override);
        else delete overrides[op.masterNodeId];
        if (Object.keys(overrides).length) node.overrides = overrides;
        else delete node.overrides;
        return true;
      }
      default:
        return false;
    }
  }

  /**
   * Apply another author's operations to this session's document, in order.
   *
   * Deliberately NOT undoable and NOT re-emitted: a remote op must not land on
   * the local undo stack (undoing it would revert someone else's work — the
   * exact data loss this contract exists to remove), and it must not come back
   * out of `onChange` as a local edit (which would echo it straight back to the
   * host). `record` is suppressed for the duration, so the resulting event
   * carries no ops and the relay stays quiet.
   *
   * Ops whose subject is already gone are DROPPED rather than treated as
   * errors — that's what makes them commute — but they're reported rather than
   * swallowed, so a host can tell a benign race from a real divergence.
   */
  applyRemoteOps(ops: readonly Op[]): { applied: number; dropped: Op[] } {
    if (!ops.length) return { applied: 0, dropped: [] };
    const dropped: Op[] = [];
    let applied = 0;
    const kinds = new Set<ChangeKind>();
    // INVALIDATE local history. The stack holds whole-document snapshots, and a
    // snapshot is only a truthful "before" while this client is the document's
    // only writer. Once another author's edit lands, every existing snapshot
    // predates work this client didn't do — so undoing one would silently revert
    // that work. Refusing to undo is a far smaller harm than eating a
    // collaborator's edit, and a host that wants working undo in a shared
    // session supplies a `HistoryDelegate`, which owns an authoritative
    // per-author history and is left alone here.
    if (!this.historyDelegate) {
      this.past = [];
      this.future = [];
    }
    this.remote++;
    try {
      this.transact(["replace"], false, () => {
        for (const op of ops) {
          if (this.applyOp(op)) {
            applied++;
            kinds.add(kindForOp(op));
          } else {
            dropped.push(op);
          }
        }
        // Report what actually changed, not just "replace" — a batch that only
        // touched the theme shouldn't read to a subscriber like a structural edit.
        for (const k of kinds) this.emit(k);
        this.clampActivePage();
        this.clampSymbol();
        this.clampSelection();
        this.syncPages();
        this.syncSymbols();
      });
    } finally {
      this.remote--;
    }
    return { applied, dropped };
  }

  /**
   * Force this session's document to `site` at sequence `seq` — the resync path
   * when a client has drifted too far to reconcile with a delta.
   *
   * Clears undo/redo: the stacks describe a document lineage that no longer
   * applies, and offering an undo that would restore pre-resync state is worse
   * than offering none. Like `applyRemoteOps`, it emits no ops.
   */
  replaceState(site: Site, seq: number): void {
    this.remote++;
    try {
      this.transact(["replace"], false, () => {
        this.site = structuredClone(site);
        this.site.symbols ??= {};
        this.site.savedThemes ??= [structuredClone(this.site.theme)];
        if (this.site.pages.length === 0) {
          this.site.pages = [makePage("Home", "/", stampTree(newPageRoot()))];
        }
        this.forEachTree(assignOrds);
        this.past = [];
        this.future = [];
        this.seq = seq;
        this.clampActivePage();
        this.clampSymbol();
        this.clampSelection();
        this.syncPages();
        this.syncSymbols();
      });
    } finally {
      this.remote--;
    }
  }

  /** Record the sequence number the host assigned to our last batch. */
  ackSeq(seq: number): void {
    if (seq > this.seq) this.seq = seq;
  }

  /** The whole site with every instance inlined + symbols dropped — ready for
   *  `toHtml` (output is always plain markup; symbols are an authoring concept). */
  exportSite(): Site {
    const site = structuredClone(this.site);
    const syms = site.symbols ?? {};
    // Ordering keys are an authoring concern — output is a flat tree in final
    // order, with nothing left to merge — so they're stripped here alongside the
    // symbol indirection.
    const flat = (root: Node): Node => stripOrds(flattenSymbols(root, syms));
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
    this.transact(["active"], false, () => {
      this.activePageId = id;
      this.select(undefined);
      this.syncPages();
    });
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
    return this.transact(["page"], true, () => {
      this.site.pages.push(page);
      this.activePageId = page.id;
      this.select(undefined);
      this.syncPages();
      this.record({ target: { scope: "site" }, kind: "page.create", page });
      return page.id;
    });
  }

  /** Remove a page. Refuses to remove the last one (a site needs ≥1 page). If it
   *  was active, falls back to the previous page. Undoable. */
  removePage(id: string): void {
    if (this.site.pages.length <= 1) return;
    const idx = this.site.pages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    this.transact(["page"], true, () => {
      this.site.pages.splice(idx, 1);
      this.record({ target: { scope: "site" }, kind: "page.delete", pageId: id });
      if (this.activePageId === id) {
        this.activePageId = (this.site.pages[idx - 1] ?? this.site.pages[0]!).id;
        this.select(undefined);
      }
      this.syncPages();
    });
  }

  /** Rename a page's label (no-op on empty/unchanged). Undoable. */
  renamePage(id: string, name: string): void {
    const page = this.site.pages.find((p) => p.id === id);
    if (!page) return;
    const value = name.trim();
    if (!value || value === page.name) return;
    this.transact(["page"], true, () => {
      page.name = value;
      this.syncPages();
      this.record({ target: { scope: "site" }, kind: "page.rename", pageId: id, name: value });
    });
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
    this.transact(["page"], true, () => {
      page.slug = value;
      this.syncPages();
      this.record({ target: { scope: "site" }, kind: "page.setSlug", pageId: id, slug: value });
    });
  }

  /**
   * Reorder the page roster to `pageIds` (authoring order — what the switcher
   * lists). Ids not named keep their relative order at the end; unknown ids are
   * ignored. Undoable.
   *
   * Position carries NO routing meaning — a route resolves by slug — so this can
   * never change what a visitor receives. API-only for now: no chrome drags the
   * page list yet, but the roster is real site state and was previously the one
   * part of it the engine couldn't touch.
   */
  reorderPages(pageIds: readonly string[]): void {
    const byId = new Map(this.site.pages.map((p) => [p.id, p]));
    const next: Page[] = [];
    for (const id of pageIds) {
      const page = byId.get(id);
      if (page && !next.includes(page)) next.push(page);
    }
    for (const p of this.site.pages) if (!next.includes(p)) next.push(p);
    if (next.length !== this.site.pages.length) return; // defensive: never drop a page
    if (next.every((p, i) => p === this.site.pages[i])) return; // already in this order
    this.transact(["page"], true, () => {
      this.site.pages = next;
      this.syncPages();
      this.record({ target: { scope: "site" }, kind: "page.reorder", pageIds: next.map((p) => p.id) });
    });
  }

  /**
   * Set whether the shared frame (site shell) is author-editable. Undoable.
   * API-only, like `reorderPages` — `Frame.editable` is persisted site state
   * that no engine method could previously write.
   */
  setFrameEditable(editable: boolean): void {
    const frame = this.site.frame;
    if (!frame || frame.editable === editable) return;
    this.transact(["structure"], true, () => {
      frame.editable = editable;
      this.record({ target: { scope: "frame" }, kind: "frame.setEditable", editable });
    });
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
      this.record({ target: this.activeTarget(), kind: "node.setClass", nodeId: id, class: value || null });
    });
    return { ok: true };
  }

  /** The path from (excl.) root to (excl.) `id` within the ACTIVE tree — for a
   *  host-supplied binding picker's ancestor-based scope narrowing (`scopeAt`). */
  ancestorsOf(id: string): Node[] {
    return ancestorPath(this.activeRoot(), id);
  }

  /** Set (or clear, with undefined) a component OR host node's typed prop. */
  setProp(id: string, key: string, value: unknown): void {
    const found = locate(this.activeRoot(), id);
    if (!found || (found.node.kind !== "component" && found.node.kind !== "host")) return;
    const node = found.node;
    this.commit("props", () => {
      const props = { ...(node.props ?? {}) };
      if (value === undefined) delete props[key];
      else props[key] = value;
      node.props = props;
      // A one-key patch, not the whole prop bag: that's what lets a second
      // author change a DIFFERENT prop on this node without clobbering this one.
      this.record({
        target: this.activeTarget(),
        kind: "node.setProps",
        nodeId: id,
        patch: { [key]: value === undefined ? null : value },
      });
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
      this.record({
        target: this.activeTarget(),
        kind: "node.setAttrs",
        nodeId: id,
        patch: { [key]: value === undefined ? null : value },
      });
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
      // One op for both shapes. Where the text physically lands (a string child
      // vs a label/text prop) is the receiver's business — the op states the
      // intent, and the receiver resolves it the same way the engine just did.
      this.record({ target: this.activeTarget(), kind: "node.setText", nodeId: id, text });
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
      this.record({ target: this.activeTarget(), kind: "node.rename", nodeId: id, name: value || null });
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
      this.record({ target: this.activeTarget(), kind: "node.setTag", nodeId: id, tag: value });
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
      this.record({ target: this.activeTarget(), kind: "node.setBinding", nodeId: id, binding: binding ?? null });
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
      this.record({ target: this.activeTarget(), kind: "node.setBehavior", nodeId: id, behavior: marker ?? null });
    });
  }

  /**
   * Set (or clear, with `undefined`) a node's lock + its owner (host-nodes spec
   * §B.2). This is the LOW-LEVEL primitive — it always succeeds; the tier policy
   * (an author may clear only an `"author"` lock, never a `"host"` one) lives in
   * the UI that calls it, so a host is never boxed out of un-pinning its own
   * region. Undoable. No-op on a missing node.
   */
  setLocked(id: string, owner: "host" | "author" | undefined): void {
    const found = locate(this.activeRoot(), id);
    if (!found) return;
    const node = found.node;
    this.commit("props", () => {
      if (owner) node.locked = owner;
      else delete node.locked;
      this.record({ target: this.activeTarget(), kind: "node.setLocked", nodeId: id, locked: owner ?? null });
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
    return this.transact(["structure"], true, () => {
      const parent = parentLoc.node;
      const children = (parent.children ??= []);
      const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
      // Key BEFORE splicing — `ordAt` brackets the slot using the neighbors as
      // they stand, which requires the array not to contain the node yet.
      if (stamped.kind !== "outlet") stamped.ord = ordAt(children, at);
      children.splice(at, 0, stamped);
      if (stamped.kind !== "outlet" && stamped.ord) {
        this.record({
          target: this.activeTarget(),
          kind: "node.insert",
          parentId,
          ord: stamped.ord,
          node: stamped,
        });
      }
      // Inside the action, so selecting the new node rides the SAME event as the
      // insert rather than firing a second one behind it.
      if (newId) this.select(newId);
      return newId;
    });
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

  /** Remove a node (never the root, never a locked node). Selects its parent if
   *  it was selected. A locked node — author- or host-owned — is refused here, so
   *  every remove path (Navigator, delete key, host) honors the lock at once. */
  remove(id: string): void {
    const found = locate(this.activeRoot(), id);
    if (!found || !found.parent) return; // missing or root
    if (found.node.locked) return; // locked — non-deletable (host-nodes spec §B.2)
    const parentId = found.parent.id;
    this.transact(["structure"], true, () => {
      found.parent!.children!.splice(found.index, 1);
      this.record({ target: this.activeTarget(), kind: "node.remove", nodeId: id });
      if (this.selectedId === id) this.select(parentId);
    });
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
    if (found.node.locked) return; // locked — non-movable (host-nodes spec §B.2)
    if (contains(this.activeRoot(), id, parentId)) return; // cycle guard
    this.commit("structure", () => {
      const from = found.parent!.children!;
      const [moved] = from.splice(found.index, 1);
      if (moved === undefined) return;
      const to = (parentLoc.node.children ??= []);
      // Same-parent moves shift indices left when the source sat before the target.
      const shift = found.parent === parentLoc.node && found.index < index ? 1 : 0;
      const at = Math.max(0, Math.min(index - shift, to.length));
      // `moved` is already spliced out, so `to` holds exactly the neighbors that
      // will bracket it — including in the same-parent case.
      if (typeof moved !== "string" && moved.kind !== "outlet") moved.ord = ordAt(to, at);
      to.splice(at, 0, moved);
      if (typeof moved !== "string" && moved.kind !== "outlet" && moved.ord) {
        this.record({ target: this.activeTarget(), kind: "node.move", nodeId: id, parentId, ord: moved.ord });
      }
    });
  }

  /** Duplicate a node in place (fresh ids), inserting the copy right after it.
   *  A locked node CAN be duplicated; the copy is author-owned, so its lock is
   *  cleared (host-nodes spec §B.2). */
  duplicate(id: string): string | undefined {
    const found = locate(this.activeRoot(), id);
    if (!found || !found.parent) return undefined; // can't duplicate the root
    const copy = stampTree(found.node);
    if (copy.kind !== "outlet") delete copy.locked;
    const newId = copy.kind === "outlet" ? undefined : copy.id;
    const parent = found.parent;
    const at = found.index + 1;
    return this.transact(["structure"], true, () => {
      if (copy.kind !== "outlet") copy.ord = ordAt(parent.children!, at);
      parent.children!.splice(at, 0, copy);
      // A duplicate IS an insert as far as a peer is concerned — the copy is new
      // content with fresh ids, not a reference to the original.
      if (parent.id && copy.kind !== "outlet" && copy.ord) {
        this.record({ target: this.activeTarget(), kind: "node.insert", parentId: parent.id, ord: copy.ord, node: copy });
      }
      if (newId) this.select(newId);
      return newId;
    });
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
  /**
   * Hand undo/redo to the host instead of running the local stack.
   *
   * A local undo stack is a whole-document snapshot with no author attribution,
   * so in a shared session "undo" reverts whatever else landed in between —
   * including other people's work, on pages the author never opened. That reads
   * as data loss, and it is. A collaborative host owns an authoritative,
   * per-author history and should drive undo from there, applying the result
   * back through `applyRemoteOps` or `replaceState`.
   *
   * Set both to delegate; leave unset (the default) and the local stack runs,
   * which stays correct for a single-author session. `canUndo`/`canRedo` report
   * the delegate's availability when delegated, so the toolbar reflects the
   * host's history rather than a local one that isn't being used.
   */
  setHistoryDelegate(delegate: HistoryDelegate | undefined): void {
    this.historyDelegate = delegate;
    // Availability may have changed under the toolbar; nothing stored changed,
    // so this carries no ops and won't relay.
    this.emit("replace");
  }

  /** True when undo/redo are the host's responsibility rather than the local stack. */
  get historyIsDelegated(): boolean {
    return this.historyDelegate !== undefined;
  }

  get canUndo(): boolean {
    return this.historyDelegate ? this.historyDelegate.canUndo() : this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.historyDelegate ? this.historyDelegate.canRedo() : this.future.length > 0;
  }

  /** Step back one edit (node or page structure). Theme/library edits aren't tracked. */
  undo(): void {
    if (this.historyDelegate) return this.historyDelegate.undo();
    const prev = this.past.pop();
    if (!prev) return;
    // `history: false` — undo is not itself an undoable edit; it moves the
    // existing snapshot between the two stacks by hand.
    this.transact(["replace"], false, () => {
      this.future.push(structuredClone(this.site));
      this.site = prev; // already an owned clone
      this.clampActivePage();
      this.clampSymbol();
      this.clampSelection();
      this.syncPages();
      this.syncSymbols();
      // Undo restores a whole-document snapshot, so there is no delta to send:
      // `site.replace` is the honest expression of what happened. This is the
      // main reason a COLLABORATIVE session should delegate undo to the host
      // (see `onUndo`) — a local undo in a shared editor reverts whatever else
      // landed in between, which reads to the other author as data loss.
      this.recordReplace();
    });
  }

  /** Re-apply the last undone edit. */
  redo(): void {
    if (this.historyDelegate) return this.historyDelegate.redo();
    const next = this.future.pop();
    if (!next) return;
    this.transact(["replace"], false, () => {
      this.past.push(structuredClone(this.site));
      this.site = next;
      this.clampActivePage();
      this.clampSymbol();
      this.clampSelection();
      this.syncPages();
      this.syncSymbols();
      // Undo restores a whole-document snapshot, so there is no delta to send:
      // `site.replace` is the honest expression of what happened. This is the
      // main reason a COLLABORATIVE session should delegate undo to the host
      // (see `onUndo`) — a local undo in a shared editor reverts whatever else
      // landed in between, which reads to the other author as data loss.
      this.recordReplace();
    });
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
      this.select(undefined);
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
    this.transact(["theme"], false, () => {
      this.site.theme = structuredClone(theme);
      this.record({ target: { scope: "site" }, kind: "theme.set", theme: this.site.theme });
    });
  }

  /** Flip the previewed light/dark mode without disturbing the token bags. */
  setThemeMode(mode: "light" | "dark"): void {
    this.transact(["theme"], false, () => {
      this.site.theme = { ...this.site.theme, mode };
      this.record({ target: { scope: "site" }, kind: "theme.set", theme: this.site.theme });
    });
  }

  // ── saved-theme library ──────────────────────────────────────────────────
  /** The site's saved themes (`site.savedThemes` — read-only snapshot, stable
   *  between mutations, persisted + relayed to the host like any other site data). */
  get savedThemes(): readonly Theme[] {
    return this.site.savedThemes ?? [];
  }

  /** Snapshot the current theme into the library (replacing any of the same name). */
  saveTheme(): void {
    const snap = structuredClone(this.site.theme);
    this.transact(["library"], false, () => {
      this.site.savedThemes = [snap, ...(this.site.savedThemes ?? []).filter((t) => t.name !== snap.name)];
      this.record({ target: { scope: "site" }, kind: "savedThemes.set", savedThemes: this.site.savedThemes });
    });
  }

  /** Apply a saved theme by name, preserving the previewed light/dark mode. */
  applySavedTheme(name: string): void {
    const found = this.site.savedThemes?.find((t) => t.name === name);
    if (!found) return;
    this.setTheme({ ...structuredClone(found), mode: this.site.theme.mode });
  }

  /** Remove a saved theme from the library. */
  deleteSavedTheme(name: string): void {
    if (!this.site.savedThemes?.some((t) => t.name === name)) return;
    this.transact(["library"], false, () => {
      this.site.savedThemes = this.site.savedThemes!.filter((t) => t.name !== name);
      this.record({ target: { scope: "site" }, kind: "savedThemes.set", savedThemes: this.site.savedThemes! });
    });
  }
}
