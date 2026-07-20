/**
 * The semantic operation vocabulary — what the engine emits ALONGSIDE the state
 * on every edit.
 *
 * Handing a host the whole `Site` on every keystroke makes every save a
 * full-document overwrite, which is fine for one author and lossy for two: both
 * hold a complete `Site`, so whoever saves last silently reverts the other's
 * work on pages they never opened. An op says what the author *did* rather than
 * what the document now *is*, so a server can apply two authors' edits to one
 * site without either erasing the other.
 *
 * Three properties make these ops commute, which is what removes the need for an
 * operational-transform layer:
 *
 *   1. Nodes are addressed by ID, never by array index or tree path. An id still
 *      means the same node after someone else inserts above it.
 *   2. Position is a fractional key (`ord`), not an index — see `Node.ord`. An
 *      insert touches only the inserted node, so concurrent inserts into one
 *      parent can't collide.
 *   3. Property writes are SHALLOW MERGES, not replacements. Two authors editing
 *      different props of one node — copy and image, the common case — don't
 *      conflict.
 *
 * Ops carry INTENT, never ambient state. An op says what changed, not what the
 * document looked like around it: a sender's view of the rest of the document is
 * stale by definition under concurrent edit, so shipping it invites both false
 * conflicts and missed ones. The receiver's own state is authoritative.
 *
 * The one apparent exception is `node.insert`, which carries a whole subtree,
 * and the detach cascades in `symbol.delete` / `symbol.detach`. Those aren't
 * context — they're content the receiver cannot derive, because node ids are
 * randomly minted on the client that created them. Replaying "detach every
 * instance" independently would mint DIFFERENT ids on every peer.
 */
import type { BehaviorMarker, DataBinding, Frame, Node, NodeOverride, Page, SymbolDef, Theme } from "@wizeworks/silicaui-html";

/**
 * Which tree an op addresses.
 *
 * `frame` carries no id: a `Site` has exactly ONE shared frame (`site.frame`),
 * not a keyed collection, so there is nothing to disambiguate.
 */
export type OpTarget =
  | { scope: "page"; id: string }
  | { scope: "frame" }
  | { scope: "symbol"; id: string }
  | { scope: "site" };

interface OpBase {
  target: OpTarget;
}

// ── tree ops — every one addressed by node id ────────────────────────────────

/** Add a subtree. `node` arrives fully stamped: ids and child `ord`s are already
 *  minted, and the root's `ord` is `ord`. The receiver stores it verbatim. */
export interface NodeInsertOp extends OpBase {
  kind: "node.insert";
  parentId: string;
  /** Fractional position among `parentId`'s children. */
  ord: string;
  node: Node;
}

export interface NodeRemoveOp extends OpBase {
  kind: "node.remove";
  nodeId: string;
}

/** Reparent and/or reposition. `parentId` may be the node's current parent. */
export interface NodeMoveOp extends OpBase {
  kind: "node.move";
  nodeId: string;
  parentId: string;
  ord: string;
}

/** SHALLOW MERGE over a component/host node's `props`. A `null` value deletes
 *  the key — the wire-safe spelling of `undefined`, which JSON drops. */
export interface NodeSetPropsOp extends OpBase {
  kind: "node.setProps";
  nodeId: string;
  patch: Record<string, unknown | null>;
}

/** SHALLOW MERGE over an ELEMENT node's HTML `attrs`. A separate op from
 *  `setProps` because attrs and props are separate namespaces on separate node
 *  kinds — an element has no props, a component has no attrs — and collapsing
 *  them would make a merge ambiguous. `null` deletes. */
export interface NodeSetAttrsOp extends OpBase {
  kind: "node.setAttrs";
  nodeId: string;
  patch: Record<string, string | number | boolean | null>;
}

export interface NodeSetClassOp extends OpBase {
  kind: "node.setClass";
  nodeId: string;
  /** `null` clears the class string entirely. */
  class: string | null;
}

/**
 * Replace a node's primary text.
 *
 * Text needs its own op because a text child is a BARE STRING with no id (see
 * `Child`), so an id-addressed vocabulary cannot reach it. This is therefore
 * last-write-wins on the whole string: two authors typing in the same paragraph
 * do not merge per-character. That's a deliberate limit — per-character merge
 * needs a text CRDT, which is out of scope.
 */
export interface NodeSetTextOp extends OpBase {
  kind: "node.setText";
  nodeId: string;
  text: string;
}

/** Retag an element (h1→h2, div→section). Pure semantics; style rides on class. */
export interface NodeSetTagOp extends OpBase {
  kind: "node.setTag";
  nodeId: string;
  tag: string;
}

/** Set or clear the dynamic-content binding. The union is "at most one" by
 *  construction, so this replaces wholesale rather than merging. */
export interface NodeSetBindingOp extends OpBase {
  kind: "node.setBinding";
  nodeId: string;
  binding: DataBinding | null;
}

/** Set or clear the behavior marker (the vanilla-runtime hydration root). */
export interface NodeSetBehaviorOp extends OpBase {
  kind: "node.setBehavior";
  nodeId: string;
  behavior: BehaviorMarker | null;
}

/**
 * Set or clear the structural lock and its owner. Replicated because a `host`
 * lock is how a host pins a region: if it didn't travel, one author would see a
 * pinned section that another could freely delete.
 */
export interface NodeSetLockedOp extends OpBase {
  kind: "node.setLocked";
  nodeId: string;
  locked: "host" | "author" | null;
}

/** Rename the Navigator layer label (`Node.label`). */
export interface NodeRenameOp extends OpBase {
  kind: "node.rename";
  nodeId: string;
  name: string | null;
}

/**
 * Set or clear one symbol-instance override, keyed by the MASTER node's id.
 * Two node ids in two different trees, so `setProps` can't express it.
 */
export interface NodeSetOverrideOp extends OpBase {
  kind: "node.setOverride";
  /** The instance node, in `target`'s tree. */
  nodeId: string;
  /** The node in the MASTER tree this override applies to. */
  masterNodeId: string;
  override: NodeOverride | null;
}

// ── page ops ─────────────────────────────────────────────────────────────────

/** `page` carries its stamped root, for the same reason `node.insert` does. */
export interface PageCreateOp extends OpBase {
  kind: "page.create";
  page: Page;
}

export interface PageDeleteOp extends OpBase {
  kind: "page.delete";
  pageId: string;
}

export interface PageRenameOp extends OpBase {
  kind: "page.rename";
  pageId: string;
  name: string;
}

export interface PageSetSlugOp extends OpBase {
  kind: "page.setSlug";
  pageId: string;
  slug: string;
}

/** Authoring order of the page roster — what the switcher lists. Carries no
 *  routing meaning (a route resolves by slug), so this can never change what a
 *  visitor receives. */
export interface PageReorderOp extends OpBase {
  kind: "page.reorder";
  pageIds: string[];
}

// ── symbol ops ───────────────────────────────────────────────────────────────

/** Create or replace a symbol master wholesale (create + rename both land here;
 *  a rename is a `set` whose `name` differs). */
export interface SymbolSetOp extends OpBase {
  kind: "symbol.set";
  symbol: SymbolDef;
}

/**
 * Delete a symbol. `detach` carries the replacement subtree for every instance
 * across every tree, because detaching mints fresh ids — a peer replaying the
 * cascade on its own would produce different ids for the same content, and the
 * two documents would diverge while looking identical.
 */
export interface SymbolDeleteOp extends OpBase {
  kind: "symbol.delete";
  symbolId: string;
  detach: SymbolDetachment[];
}

/** One instance replaced in place by an independent copy of the master. */
export interface SymbolDetachment {
  /** Which tree the instance lived in — a cascade spans pages, frame, masters. */
  target: OpTarget;
  /** The instance node being replaced. */
  nodeId: string;
  /** Its replacement, fully stamped, carrying the instance's `ord`. */
  node: Node;
}

// ── site-level ops ───────────────────────────────────────────────────────────

export interface ThemeSetOp extends OpBase {
  kind: "theme.set";
  theme: Theme;
}

export interface SavedThemesSetOp extends OpBase {
  kind: "savedThemes.set";
  savedThemes: Theme[];
}

/** The shared shell's editable flag. Its tree is reached by ordinary node ops
 *  under `{ scope: "frame" }`. */
export interface FrameSetEditableOp extends OpBase {
  kind: "frame.setEditable";
  editable: boolean;
}

/**
 * The escape hatch: replace everything. Semantically identical to the old
 * whole-`Site` contract, and emitted only where an edit genuinely cannot be
 * expressed as a delta — today that is undo/redo restoring a snapshot, and a
 * host-forced resync.
 *
 * Its FREQUENCY is the signal that the vocabulary has a gap. It is not a
 * shortcut: every ordinary mutation has a named op, and a new mutation should
 * get one rather than fall back here.
 */
export interface SiteReplaceOp extends OpBase {
  kind: "site.replace";
  pages: Page[];
  frame: Frame | undefined;
  symbols: Record<string, SymbolDef>;
  theme: Theme;
  savedThemes: Theme[];
}

export type Op =
  | NodeInsertOp
  | NodeRemoveOp
  | NodeMoveOp
  | NodeSetPropsOp
  | NodeSetAttrsOp
  | NodeSetClassOp
  | NodeSetTextOp
  | NodeSetTagOp
  | NodeSetBindingOp
  | NodeSetBehaviorOp
  | NodeSetLockedOp
  | NodeRenameOp
  | NodeSetOverrideOp
  | PageCreateOp
  | PageDeleteOp
  | PageRenameOp
  | PageSetSlugOp
  | PageReorderOp
  | SymbolSetOp
  | SymbolDeleteOp
  | ThemeSetOp
  | SavedThemesSetOp
  | FrameSetEditableOp
  | SiteReplaceOp;

export type OpKind = Op["kind"];

/** Metadata accompanying a batch of ops on `onChange`. */
export interface OpMeta {
  /**
   * The sequence number this client last had applied when it produced these ops
   * — the host's `newSeq` from the previous round trip, or 0 before the first.
   * The host compares it to its current seq to know whether the client was
   * behind, and reconciles by sending back whatever it missed.
   */
  baseSeq: number;
}
