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
import type { ComponentNode, Document, ElementNode, Node, Theme } from "silicaui-html";
import { stampTree, walk } from "silicaui-html";

/** A node that carries id/class/children — everything except an outlet. */
type Markable = ElementNode | ComponentNode;

export type ChangeKind =
  | "theme"
  | "library"
  | "structure"
  | "class"
  | "props"
  | "selection"
  | "replace";
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

export class Editor {
  private doc: Document;
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
  // Whole-document undo history. `past` holds snapshots taken BEFORE each node
  // edit; `future` holds snapshots undone past (for redo). Capped so a long
  // session can't grow the stack without bound.
  private past: Document[] = [];
  private future: Document[] = [];
  private static readonly HISTORY_LIMIT = 100;

  constructor(doc: Document) {
    this.doc = structuredClone(doc);
    this.saved = [structuredClone(doc.theme)];
  }

  /** Subscribe to committed edits; returns an unsubscribe. */
  subscribe(cb: (e: ChangeEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(kind: ChangeKind): void {
    for (const l of this.listeners) l({ kind });
  }

  /** A defensive clone of the current document. */
  extract(): Document {
    return structuredClone(this.doc);
  }

  get theme(): Theme {
    return this.doc.theme;
  }

  // ── history-aware commit ───────────────────────────────────────────────────
  /**
   * Run a node mutation against the live document, snapshotting first so it can be
   * undone. The mutator receives the live root and edits it in place; `find` +
   * `locate` return references INTO the live tree, so callers mutate directly.
   */
  private commit(kind: ChangeKind, mutate: (root: Node) => void): void {
    this.past.push(structuredClone(this.doc));
    if (this.past.length > Editor.HISTORY_LIMIT) this.past.shift();
    this.future = [];
    mutate(this.doc.root);
    this.emit(kind);
  }

  // ── selection ──────────────────────────────────────────────────────────────
  /** The selected node's id, or undefined. */
  get selection(): string | undefined {
    return this.selectedId;
  }

  /** The selected node itself, or undefined. */
  get selectedNode(): Node | undefined {
    return this.selectedId ? locate(this.doc.root, this.selectedId)?.node : undefined;
  }

  /** Select a node (or clear with undefined). No-op if already selected. */
  select(id: string | undefined): void {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this.emit("selection");
  }

  /** Look up a node by id (read-only clone-free reference into the live tree). */
  node(id: string): Node | undefined {
    return locate(this.doc.root, id)?.node;
  }

  // ── node edits ─────────────────────────────────────────────────────────────
  /** Replace a node's class string (the sole styling surface). */
  setClass(id: string, className: string): void {
    const found = locate(this.doc.root, id);
    if (!found) return;
    this.commit("class", () => {
      const value = className.trim();
      if (value) found.node.class = value;
      else delete found.node.class;
    });
  }

  /** Set (or clear, with undefined) a component node's typed prop. */
  setProp(id: string, key: string, value: unknown): void {
    const found = locate(this.doc.root, id);
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
    const found = locate(this.doc.root, id);
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
    const found = locate(this.doc.root, id);
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
    const found = locate(this.doc.root, id);
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
    const parentLoc = locate(this.doc.root, parentId);
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

  /** Remove a node (never the root). Selects its parent if it was selected. */
  remove(id: string): void {
    const found = locate(this.doc.root, id);
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
    const found = locate(this.doc.root, id);
    const parentLoc = locate(this.doc.root, parentId);
    if (!found || !found.parent || !parentLoc || !isContainer(parentLoc.node)) return;
    if (contains(this.doc.root, id, parentId)) return; // cycle guard
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
    const found = locate(this.doc.root, id);
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

  // ── undo / redo ────────────────────────────────────────────────────────────
  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Step back one node edit. Theme/library edits are not tracked. */
  undo(): void {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push(structuredClone(this.doc));
    this.doc = prev; // already an owned clone
    this.clampSelection();
    this.emit("replace");
  }

  /** Re-apply the last undone node edit. */
  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(structuredClone(this.doc));
    this.doc = next;
    this.clampSelection();
    this.emit("replace");
  }

  /** Drop the selection if it points at a node the current tree no longer has. */
  private clampSelection(): void {
    if (this.selectedId && !locate(this.doc.root, this.selectedId)) {
      this.selectedId = undefined;
    }
  }

  // ── theme ──────────────────────────────────────────────────────────────────
  // Theme edits mutate the live doc IN PLACE and skip the undo stack: a token
  // drag would otherwise bury real structural undo steps. Mutating in place (not
  // replacing `doc`) keeps the current theme in every later history snapshot, so
  // undoing a node edit never silently reverts the theme.

  /** Replace the whole theme (the canvas + board repaint from the new tokens). */
  setTheme(theme: Theme): void {
    this.doc.theme = structuredClone(theme);
    this.emit("theme");
  }

  /** Flip the previewed light/dark mode without disturbing the token bags. */
  setThemeMode(mode: "light" | "dark"): void {
    this.doc.theme = { ...this.doc.theme, mode };
    this.emit("theme");
  }

  // ── saved-theme library ──────────────────────────────────────────────────
  /** The site's saved themes (read-only snapshot; stable between mutations). */
  get savedThemes(): readonly Theme[] {
    return this.saved;
  }

  /** Snapshot the current theme into the library (replacing any of the same name). */
  saveTheme(): void {
    const snap = structuredClone(this.doc.theme);
    this.saved = [snap, ...this.saved.filter((t) => t.name !== snap.name)];
    this.emit("library");
  }

  /** Apply a saved theme by name, preserving the previewed light/dark mode. */
  applySavedTheme(name: string): void {
    const found = this.saved.find((t) => t.name === name);
    if (!found) return;
    this.setTheme({ ...structuredClone(found), mode: this.doc.theme.mode });
  }

  /** Remove a saved theme from the library. */
  deleteSavedTheme(name: string): void {
    if (!this.saved.some((t) => t.name === name)) return;
    this.saved = this.saved.filter((t) => t.name !== name);
    this.emit("library");
  }
}
