/**
 * The email editor engine — framework-neutral document state + a tiny
 * subscription model, mirroring the site engine's shape (`commit`/history,
 * `locate`, `insertRelative`, undo/redo) but over the CLOSED email schema
 * instead of an open element tree. No pages, no frame, no symbols — an email is
 * one canvas, not a multi-page site, so those site concepts don't apply here.
 */
import { defaultMakeId } from "@wizeworks/silicaui-html";
import type {
  ColumnNode,
  ColumnsNode,
  ContentNode,
  EmailBody,
  EmailColorDefaults,
  EmailDocument,
  EmailNode,
  EmailProject,
  EmailTemplate,
  SectionNode,
} from "./schema";
import { DEFAULT_EMAIL_COLORS, emptyEmailDocument, isContentKind } from "./schema";

export type ChangeKind = "structure" | "props" | "selection" | "meta" | "replace" | "template" | "active";

/** Lightweight template descriptor for the template switcher (no tree — just identity). */
export interface TemplateMeta {
  id: string;
  name: string;
}

/** The current template roster + which one is active — a referentially-stable
 *  view for the switcher (rebuilt only when the roster or active id change). */
export interface TemplatesView {
  templates: readonly TemplateMeta[];
  activeId: string;
}

export interface ChangeEvent {
  kind: ChangeKind;
}

/** A node that can hold children — everything but the leaf content kinds. */
type Container = EmailBody | SectionNode | ColumnsNode | ColumnNode;

function isContainer(node: EmailNode): node is Container {
  return node.kind === "body" || node.kind === "section" || node.kind === "columns" || node.kind === "column";
}

/** The structural rule table (keep in sync with schema.ts's type comments). */
function canHold(parent: EmailNode, child: EmailNode): boolean {
  switch (parent.kind) {
    case "body":
      return child.kind === "section";
    case "section":
      return child.kind === "columns" || isContentKind(child.kind);
    case "columns":
      return child.kind === "column";
    case "column":
      // A column holds bare content OR a nested columns row (the "2x2 grid"
      // pattern) — `LayoutChild`. Nesting depth is unbounded by the schema
      // (real email tables nest fine); the Palette just has no reason to
      // encourage going deeper than one level in practice.
      return child.kind === "columns" || isContentKind(child.kind);
    default:
      return false;
  }
}

function childrenOf(node: EmailNode): EmailNode[] | undefined {
  return isContainer(node) ? (node.children as EmailNode[]) : undefined;
}

/** Redistribute a columns row's widths evenly (used after add/remove-column). */
function rebalanceColumns(row: ColumnsNode): void {
  const share = Math.round((100 / row.children.length) * 100) / 100;
  for (const c of row.children) c.widthPct = share;
}

interface Located {
  node: EmailNode;
  parent: Container | undefined;
  index: number;
}

/** Depth-first search for `id`, tracking parent + child index. */
function locate(root: EmailNode, id: string): Located | undefined {
  if (root.id === id) return { node: root, parent: undefined, index: -1 };
  const stack: Container[] = isContainer(root) ? [root] : [];
  while (stack.length) {
    const parent = stack.pop()!;
    const children = childrenOf(parent) ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      if (child.id === id) return { node: child, parent, index: i };
      if (isContainer(child)) stack.push(child);
    }
  }
  return undefined;
}

/** True when `ancestorId` is `id` or contains it — a cycle guard for moves. */
function contains(root: EmailNode, ancestorId: string, id: string): boolean {
  const found = locate(root, ancestorId);
  if (!found) return false;
  if (found.node.id === id) return true;
  let hit = false;
  const walk = (n: EmailNode) => {
    if (n.id === id) hit = true;
    for (const c of childrenOf(n) ?? []) walk(c);
  };
  walk(found.node);
  return hit;
}

/** Recursively assign fresh ids to a node + its subtree (for insert/duplicate/paste). */
function stampIds(node: EmailNode, makeId: () => string): EmailNode {
  const copy: EmailNode = { ...node, id: makeId() };
  const kids = childrenOf(copy);
  if (kids) (copy as { children: EmailNode[] }).children = kids.map((c) => stampIds(c, makeId));
  return copy;
}

export class EmailEditor {
  // The whole project — one or more templates. The builder edits ONE template
  // at a time (`activeTemplateId`); `doc` resolves to just that template's
  // document so the rest of the editing spine (locate/commit/insert/…) reads
  // exactly as it did before templates existed.
  private project: EmailProject;
  private activeTemplateId: string;
  // Cached switcher view — swapped (never mutated) only when the roster or the
  // active template changes, so `useSyncExternalStore` stays referentially stable.
  private templatesViewCache: TemplatesView = { templates: [], activeId: "" };
  private listeners = new Set<(e: ChangeEvent) => void>();
  private selectedId: string | undefined;
  private clipboard: EmailNode | undefined;
  // Whole-PROJECT undo history (mirrors the site engine's whole-site snapshots) —
  // a node edit on any template, and template add/remove/rename, all undo together.
  private past: EmailProject[] = [];
  private future: EmailProject[] = [];
  private static readonly HISTORY_LIMIT = 100;
  private readonly colors: EmailColorDefaults;

  /**
   * `colorDefaults` seeds a brand-new document's colors AND is what new
   * palette inserts (Button/Text/Divider) pick up — plain hex (see
   * `EmailColorDefaults`'s doc comment for why). Omit it for the built-in
   * neutral fallback; the React `EmailBuilder` resolves an actual brand
   * `Theme` down to this shape before constructing the editor.
   *
   * Accepts a legacy single-template `EmailDocument` (wrapped as a one-template
   * project) or a full multi-template `EmailProject` — same shape-sniffing
   * pattern as the site engine's `Document | Site` union.
   */
  constructor(input?: EmailDocument | EmailProject, colorDefaults: EmailColorDefaults = DEFAULT_EMAIL_COLORS) {
    this.colors = colorDefaults;
    if (input && "templates" in input) {
      this.project = structuredClone(input);
    } else {
      const document = input ? structuredClone(input) : emptyEmailDocument(defaultMakeId, colorDefaults);
      this.project = { version: "1", templates: [{ id: defaultMakeId(), name: "Email 1", document }] };
    }
    // A project always has at least one template.
    if (this.project.templates.length === 0) {
      this.project.templates = [
        { id: defaultMakeId(), name: "Email 1", document: emptyEmailDocument(defaultMakeId, colorDefaults) },
      ];
    }
    this.activeTemplateId = this.project.templates[0]!.id;
    this.syncTemplates();
  }

  /** The resolved brand color defaults — the Palette/Canvas use this for new
   *  block inserts (`item.make(editor.colorDefaults)`) so a Button/Text/Divider
   *  a user adds lands on-brand instead of a generic neutral default. */
  get colorDefaults(): EmailColorDefaults {
    return this.colors;
  }

  subscribe(cb: (e: ChangeEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(kind: ChangeKind): void {
    for (const l of this.listeners) l({ kind });
  }

  // ── active template + document ──────────────────────────────────────────────
  private currentTemplate(): EmailTemplate {
    return this.project.templates.find((t) => t.id === this.activeTemplateId) ?? this.project.templates[0]!;
  }

  /** The active template's document — every existing method below reads/writes
   *  through this unchanged, exactly as when there was only ever one document. */
  private get doc(): EmailDocument {
    return this.currentTemplate().document;
  }
  private set doc(value: EmailDocument) {
    this.currentTemplate().document = value;
  }

  /** A defensive clone of the ACTIVE template's document, for saving/preview —
   *  the shape every existing consumer (Canvas, Inspector, projector) expects. */
  extract(): EmailDocument {
    return structuredClone(this.doc);
  }

  /** A defensive clone of the WHOLE project — every template — for saving. */
  extractProject(): EmailProject {
    return structuredClone(this.project);
  }

  get root(): EmailBody {
    return this.doc.root;
  }

  get subject(): string {
    return this.doc.subject;
  }

  get preheader(): string {
    return this.doc.preheader;
  }

  setSubject(subject: string): void {
    this.doc.subject = subject;
    this.emit("meta");
  }

  setPreheader(preheader: string): void {
    this.doc.preheader = preheader;
    this.emit("meta");
  }

  // ── templates (multi-template project) ──────────────────────────────────────
  /** Rebuild the cached switcher view (roster + active id). Called after any
   *  template change and after undo/redo, so `templatesView` swaps only when
   *  it truly changes. */
  private syncTemplates(): void {
    this.templatesViewCache = {
      templates: this.project.templates.map((t) => ({ id: t.id, name: t.name })),
      activeId: this.activeTemplateId,
    };
  }

  /** The current template roster + active id — a stable snapshot for the switcher. */
  get templatesView(): TemplatesView {
    return this.templatesViewCache;
  }

  /** The active template's id. */
  get activeTemplate(): string {
    return this.activeTemplateId;
  }

  /**
   * Switch which template the builder edits. A view concern (like selection) —
   * NOT history — so it never lands on the undo stack. Selection is
   * template-scoped (an id in one template means nothing in another), so it
   * clears.
   */
  setActiveTemplate(id: string): void {
    if (id === this.activeTemplateId) return;
    if (!this.project.templates.some((t) => t.id === id)) return;
    this.activeTemplateId = id;
    this.selectedId = undefined;
    this.syncTemplates();
    this.emit("active");
  }

  /** Add a fresh, empty template (auto-named "Email N") and switch to it.
   *  Undoable. Returns the new template's id. */
  addTemplate(name?: string): string {
    const label = name?.trim() || `Email ${this.project.templates.length + 1}`;
    const template: EmailTemplate = {
      id: defaultMakeId(),
      name: label,
      document: emptyEmailDocument(defaultMakeId, this.colors),
    };
    this.pushHistory();
    this.project.templates.push(template);
    this.activeTemplateId = template.id;
    this.selectedId = undefined;
    this.syncTemplates();
    this.emit("template");
    return template.id;
  }

  /** Remove a template. Refuses to remove the last one (a project needs ≥1
   *  template). If it was active, falls back to the previous template. Undoable. */
  removeTemplate(id: string): void {
    if (this.project.templates.length <= 1) return;
    const idx = this.project.templates.findIndex((t) => t.id === id);
    if (idx < 0) return;
    this.pushHistory();
    this.project.templates.splice(idx, 1);
    if (this.activeTemplateId === id) {
      this.activeTemplateId = (this.project.templates[idx - 1] ?? this.project.templates[0]!).id;
      this.selectedId = undefined;
    }
    this.syncTemplates();
    this.emit("template");
  }

  /** Rename a template's label (no-op on empty/unchanged). Undoable. */
  renameTemplate(id: string, name: string): void {
    const template = this.project.templates.find((t) => t.id === id);
    if (!template) return;
    const value = name.trim();
    if (!value || value === template.name) return;
    this.pushHistory();
    template.name = value;
    this.syncTemplates();
    this.emit("template");
  }

  // ── history-aware commit ───────────────────────────────────────────────────
  private pushHistory(): void {
    this.past.push(structuredClone(this.project));
    if (this.past.length > EmailEditor.HISTORY_LIMIT) this.past.shift();
    this.future = [];
  }

  private commit(kind: ChangeKind, mutate: () => void): void {
    this.pushHistory();
    mutate();
    this.emit(kind);
  }

  // ── selection ──────────────────────────────────────────────────────────────
  get selection(): string | undefined {
    return this.selectedId;
  }

  get selectedNode(): EmailNode | undefined {
    return this.selectedId ? locate(this.doc.root, this.selectedId)?.node : undefined;
  }

  select(id: string | undefined): void {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this.emit("selection");
  }

  node(id: string): EmailNode | undefined {
    return locate(this.doc.root, id)?.node;
  }

  /** True when `node` can accept an inserted/dropped child (of any kind — the
   *  actual kind is checked separately via `canHold`). */
  acceptsChildren(node: EmailNode): boolean {
    return isContainer(node);
  }

  // ── node edits ─────────────────────────────────────────────────────────────
  /** Shallow-patch a node's typed fields (the sole editing surface — email nodes
   *  carry typed props, not a class string). No-op if the patch would change `id`
   *  or `kind`, or the node is missing. */
  update<T extends EmailNode>(id: string, patch: Partial<Omit<T, "id" | "kind" | "children">>): void {
    const found = locate(this.doc.root, id);
    if (!found) return;
    this.commit("props", () => {
      Object.assign(found.node, patch);
    });
  }

  // ── structure ──────────────────────────────────────────────────────────────
  /** Insert a subtree under `parentId` at `index` (default: append). Fresh ids are
   *  stamped first. No-op if the parent can't hold this kind of child. */
  insert(node: EmailNode, parentId: string, index?: number): string | undefined {
    const parentLoc = locate(this.doc.root, parentId);
    if (!parentLoc || !isContainer(parentLoc.node) || !canHold(parentLoc.node, node)) return undefined;
    const stamped = stampIds(node, defaultMakeId);
    this.commit("structure", () => {
      const parent = parentLoc.node as Container;
      const children = childrenOf(parent) as EmailNode[];
      const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
      children.splice(at, 0, stamped);
    });
    this.select(stamped.id);
    return stamped.id;
  }

  /** The body's own children can't hold this — fall back to its LAST section
   *  (append-to-end), since a bare content block or columns row has nowhere else
   *  sensible to land. Undefined if the body holds no section yet. Public: the
   *  Canvas reuses this for a margin drop of an EXISTING node (a `move`, not an
   *  `insert`, so it can't go through `insertRelative`). */
  fallbackParent(node: EmailNode): string | undefined {
    if (canHold(this.doc.root, node)) return this.doc.root.id;
    const last = this.doc.root.children[this.doc.root.children.length - 1];
    return last && canHold(last, node) ? last.id : undefined;
  }

  /** Insert `node` relative to a target (default: the current selection): inside
   *  it if it's a compatible container, else as its next sibling. With no valid
   *  target it falls back to the body (for a Section) or the last section (for
   *  everything else) — this is the palette's click-to-insert path. */
  insertRelative(node: EmailNode, targetId?: string): string | undefined {
    const target = targetId ?? this.selectedId;
    const fallback = () => {
      const parentId = this.fallbackParent(node);
      return parentId ? this.insert(node, parentId) : undefined;
    };
    if (!target) return fallback();

    const found = locate(this.doc.root, target);
    if (!found) return fallback();
    if (isContainer(found.node) && canHold(found.node, node)) return this.insert(node, found.node.id);
    if (found.parent && canHold(found.parent, node)) return this.insert(node, found.parent.id, found.index + 1);
    return fallback();
  }

  /** Remove a node (never the root). Selects its parent if it was selected. */
  remove(id: string): void {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent) return;
    const parentId = found.parent.id;
    this.commit("structure", () => {
      const children = childrenOf(found.parent as Container) as EmailNode[];
      children.splice(found.index, 1);
    });
    if (this.selectedId === id) this.select(parentId);
  }

  /** Move a node under `parentId` at `index`. Refuses cycles or a kind mismatch. */
  move(id: string, parentId: string, index: number): void {
    if (id === parentId) return;
    const found = locate(this.doc.root, id);
    const parentLoc = locate(this.doc.root, parentId);
    if (!found || !found.parent || !parentLoc || !isContainer(parentLoc.node)) return;
    if (!canHold(parentLoc.node, found.node)) return;
    if (contains(this.doc.root, id, parentId)) return;
    this.commit("structure", () => {
      const from = childrenOf(found.parent as Container) as EmailNode[];
      const [moved] = from.splice(found.index, 1);
      if (moved === undefined) return;
      const to = childrenOf(parentLoc.node as Container) as EmailNode[];
      const shift = found.parent === parentLoc.node && found.index < index ? 1 : 0;
      const at = Math.max(0, Math.min(index - shift, to.length));
      to.splice(at, 0, moved);
    });
  }

  /** Append a new, evenly-shared column to a columns row (rebalances every
   *  column's `widthPct` so they still sum to 100). No-op past 6 columns —
   *  more than that stops being a usable email layout at any real width. */
  addColumn(columnsId: string): void {
    const found = locate(this.doc.root, columnsId);
    if (!found || found.node.kind !== "columns") return;
    const node = found.node;
    if (node.children.length >= 6) return;
    this.commit("structure", () => {
      node.children.push({ id: defaultMakeId(), kind: "column", widthPct: 0, children: [] });
      rebalanceColumns(node);
    });
  }

  /** Remove a column from its row (rebalancing the rest). Refuses to drop the
   *  last column in a row — remove the `columns` node itself instead. */
  removeColumn(columnId: string): void {
    const found = locate(this.doc.root, columnId);
    if (!found || !found.parent || found.parent.kind !== "columns") return;
    const row = found.parent;
    if (row.children.length <= 1) return;
    this.commit("structure", () => {
      row.children.splice(found.index, 1);
      rebalanceColumns(row);
    });
    if (this.selectedId === columnId) this.select(row.id);
  }

  /** Duplicate a column within its row and rebalance widths (a plain
   *  `duplicate()` would leave the row's `widthPct`s summing past 100). No-op
   *  past 6 columns. */
  duplicateColumn(columnId: string): string | undefined {
    const found = locate(this.doc.root, columnId);
    if (!found || !found.parent || found.parent.kind !== "columns" || found.node.kind !== "column") return undefined;
    const row = found.parent;
    if (row.children.length >= 6) return undefined;
    const copy = stampIds(found.node, defaultMakeId) as ColumnNode;
    this.commit("structure", () => {
      row.children.splice(found.index + 1, 0, copy);
      rebalanceColumns(row);
    });
    this.select(copy.id);
    return copy.id;
  }

  /** This node's position among its siblings — for the Inspector's move
   *  buttons (disable "up" at index 0, "down" at the last index). Undefined for
   *  the root (it has no siblings) or a missing node. */
  siblingInfo(id: string): { index: number; count: number } | undefined {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent) return undefined;
    const count = (childrenOf(found.parent) as EmailNode[]).length;
    return { index: found.index, count };
  }

  /** Swap a node with its previous sibling. No-op if it's already first (or root). */
  moveUp(id: string): void {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent || found.index <= 0) return;
    this.commit("structure", () => {
      const children = childrenOf(found.parent as Container) as EmailNode[];
      const i = found.index;
      [children[i - 1], children[i]] = [children[i]!, children[i - 1]!];
    });
  }

  /** Swap a node with its next sibling. No-op if it's already last (or root). */
  moveDown(id: string): void {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent) return;
    const children = childrenOf(found.parent) as EmailNode[];
    const i = found.index;
    if (i >= children.length - 1) return;
    this.commit("structure", () => {
      const kids = childrenOf(found.parent as Container) as EmailNode[];
      [kids[i], kids[i + 1]] = [kids[i + 1]!, kids[i]!];
    });
  }

  /** Duplicate a node in place (fresh ids), inserting the copy right after it. */
  duplicate(id: string): string | undefined {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent) return undefined;
    const copy = stampIds(found.node, defaultMakeId);
    const parent = found.parent;
    const at = found.index + 1;
    this.commit("structure", () => {
      const children = childrenOf(parent) as EmailNode[];
      children.splice(at, 0, copy);
    });
    this.select(copy.id);
    return copy.id;
  }

  // ── clipboard (copy / paste) ───────────────────────────────────────────────
  get canPaste(): boolean {
    return this.clipboard !== undefined;
  }

  copy(id?: string): void {
    const target = id ?? this.selectedId;
    if (!target) return;
    const found = locate(this.doc.root, target);
    if (!found) return;
    this.clipboard = structuredClone(found.node);
  }

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

  undo(): void {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push(structuredClone(this.project));
    this.project = prev;
    this.clampActiveTemplate();
    this.clampSelection();
    this.emit("replace");
  }

  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(structuredClone(this.project));
    this.project = next;
    this.clampActiveTemplate();
    this.clampSelection();
    this.emit("replace");
  }

  /** After undo/redo restores a project snapshot, the active template id may no
   *  longer exist (a template add/remove was itself undone/redone) — fall back
   *  to the first template, same fallback `currentTemplate()` already has. */
  private clampActiveTemplate(): void {
    if (!this.project.templates.some((t) => t.id === this.activeTemplateId)) {
      this.activeTemplateId = this.project.templates[0]!.id;
    }
    this.syncTemplates();
  }

  private clampSelection(): void {
    if (this.selectedId && !locate(this.doc.root, this.selectedId)) {
      this.selectedId = undefined;
    }
  }
}

export { canHold };
export type { Container, ContentNode };
