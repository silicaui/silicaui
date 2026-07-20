/**
 * The email editor engine — framework-neutral document state + a tiny
 * subscription model, mirroring the site engine's shape (`commit`/history,
 * `locate`, `insertRelative`, undo/redo) but over the CLOSED email schema
 * instead of an open element tree. No pages, no frame, no symbols — an email is
 * one canvas, not a multi-page site, so those site concepts don't apply here.
 */
import { defaultMakeId, generateKeyBetween } from "@wizeworks/silicaui-html";
import type { DataBinding } from "@wizeworks/silicaui-html";
import type { Op, OpTarget } from "./ops";
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

/**
 * Kind precedence, most structural first — mirrors the site engine. A single
 * user action can touch several kinds; `kind` reports the strongest so a
 * pre-batching subscriber still reads sensibly, `kinds` carries the whole truth.
 */
const KIND_ORDER: readonly ChangeKind[] = ["replace", "template", "structure", "props", "meta", "active", "selection"];

/** Which `ChangeKind` an incoming op represents, so a remote batch reports the
 *  same kinds a local edit would have. */
function kindForOp(op: Op): ChangeKind {
  if (op.kind === "project.replace") return "replace";
  if (op.kind === "template.setMeta") return "meta";
  if (op.kind.startsWith("template.")) return "template";
  if (op.kind === "node.insert" || op.kind === "node.remove" || op.kind === "node.move") return "structure";
  if (op.kind === "columns.rebalance") return "structure";
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
   * The most structural kind this action touched. Kept as the headline field for
   * subscribers written before batching, but LOSSY: an action touching several
   * kinds reports only the strongest. Filter on `kinds`.
   */
  kind: ChangeKind;
  /**
   * Every kind this action touched, deduped, in the order recorded. One user
   * action fires exactly one event — inserting a block reports
   * `["structure", "selection"]` in a single emit rather than two events.
   */
  kinds: readonly ChangeKind[];
  /**
   * The semantic operations this action performed, in causal order — what the
   * author DID, as opposed to what the document now is. A host relays these
   * instead of overwriting with the whole project. Empty only for a purely
   * view-level action (selection, template switch).
   */
  ops: readonly Op[];
}

/**
 * Host-owned undo/redo, for a collaborative session — see `setHistoryDelegate`.
 * The engine calls these instead of touching its own snapshot stack.
 */
export interface HistoryDelegate {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
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

/** Which literal color field(s) each node kind can live-track, and which
 *  `EmailColorDefaults` role each one follows — keep in sync with the
 *  `*Auto` fields declared on the corresponding node type in `schema.ts` and
 *  the `autoRole`s wired in `email/react/Inspector.tsx`'s `ColorField` call
 *  sites. A field only repaints when its own `<field>Auto` flag is `true` —
 *  the moment a user picks a custom color it's cleared and that field is
 *  frozen, exactly like a fresh insert's default before this ever runs. */
const AUTO_COLOR_FIELDS: Partial<Record<EmailNode["kind"], ReadonlyArray<{
  field: string;
  autoField: string;
  role: keyof EmailColorDefaults;
}>>> = {
  text: [{ field: "color", autoField: "colorAuto", role: "baseContent" }],
  button: [
    { field: "bg", autoField: "bgAuto", role: "primary" },
    { field: "color", autoField: "colorAuto", role: "primaryContent" },
  ],
  divider: [{ field: "color", autoField: "colorAuto", role: "base300" }],
  section: [{ field: "bg", autoField: "bgAuto", role: "base100" }],
  body: [
    { field: "bg", autoField: "bgAuto", role: "base200" },
    { field: "contentBg", autoField: "contentBgAuto", role: "base100" },
  ],
};

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

/**
 * The ordering key for a slot among `children`, skipping any sibling not yet
 * backfilled. `children` must NOT already contain the node being placed.
 */
function ordAt(children: readonly EmailNode[], index: number): string {
  let before: string | null = null;
  for (let i = index - 1; i >= 0; i--) {
    const o = children[i]?.ord;
    if (o) {
      before = o;
      break;
    }
  }
  let after: string | null = null;
  for (let i = index; i < children.length; i++) {
    const o = children[i]?.ord;
    if (o) {
      after = o;
      break;
    }
  }
  // A backfilled tree is always ascending, but a partially-merged one may not
  // be. Ordering between a non-ascending pair is undefined, so drop the lower
  // bound and land before `after` rather than throw.
  if (before !== null && after !== null && before >= after) before = null;
  return generateKeyBetween(before, after);
}

/**
 * Backfill `ord` on every node in a tree that lacks one, in current array order,
 * so a document authored before ordering keys existed becomes orderable without
 * changing how it renders. Idempotent.
 *
 * Load-time normalization, deliberately NOT an op: it precedes any op stream and
 * cannot change render order, so a peer running it on the same document lands in
 * the same place.
 */
function assignOrds(node: EmailNode): void {
  const children = childrenOf(node);
  if (!children?.length) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    // `i + 1` brackets the node's OWN slot: backward from `i` (skipping self,
    // which has no key yet) and forward from `i + 1`, so a run of key-less
    // children threads between the keys around it instead of colliding.
    if (!child.ord) child.ord = ordAt(children, i + 1);
    assignOrds(child);
  }
}

/**
 * Insert `node` among `children` at the position its `ord` implies.
 *
 * Ties break by node id, and they are not hypothetical: `ordAt` is
 * deterministic, so two authors inserting into the SAME slot from the same base
 * compute the SAME key. Equal keys have no inherent order, so without a
 * tie-break each peer would keep its own edit first and the documents would
 * silently diverge. Ids are unique and identical on both sides, giving one total
 * order everywhere with no randomness and no coordination.
 */
function insertByOrd(children: EmailNode[], node: EmailNode, ord: string): void {
  node.ord = ord;
  let at = children.length;
  for (let i = 0; i < children.length; i++) {
    const c = children[i]!;
    if (c.ord === undefined) continue;
    if (c.ord > ord || (c.ord === ord && c.id > node.id)) {
      at = i;
      break;
    }
  }
  children.splice(at, 0, node);
}

/** Recursively assign fresh ids to a node + its subtree (for insert/duplicate/paste).
 *  The subtree ROOT is left without an `ord` — its position belongs to wherever
 *  it's being placed, which only the caller knows. Dropping an inherited key
 *  means a missed assignment surfaces as a MISSING key rather than as two
 *  siblings claiming the same slot. */
function stampIds(node: EmailNode, makeId: () => string): EmailNode {
  const copy: EmailNode = { ...node, id: makeId() };
  delete copy.ord;
  const kids = childrenOf(copy);
  if (kids) (copy as { children: EmailNode[] }).children = kids.map((c) => stampIds(c, makeId));
  assignOrds(copy);
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
  private colors: EmailColorDefaults;
  // ── open-action (transaction) state ────────────────────────────────────────
  // One USER action = one emit, however many internal mutations it makes. These
  // track the currently-open action; nested `transact` calls join the outermost
  // rather than emitting on their own, so inserting a block (which mutates the
  // tree AND moves the selection) fires a single event instead of two.
  private txDepth = 0;
  private txKinds: ChangeKind[] = [];
  private txHistory = false;
  // Ops recorded by the open action, in causal order.
  private txOps: Op[] = [];
  // Depth of remote application. While non-zero, `record` is suppressed: an op
  // from another author must not be re-emitted as a local edit, or a host that
  // wires onChange to a broadcast would echo it straight back.
  private remote = 0;
  // The host sequence number this client last had applied.
  private seq = 0;
  // When set, undo/redo are the host's job — see `setHistoryDelegate`.
  private historyDelegate: HistoryDelegate | undefined;

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
    // Backfill sibling ordering keys on every template. A project authored
    // before `ord` existed arrives without them; this threads keys through in
    // current array order, so nothing moves.
    for (const t of this.project.templates) assignOrds(t.document.root);
    this.syncTemplates();
  }

  /** The resolved brand color defaults — the Palette/Canvas use this for new
   *  block inserts (`item.make(editor.colorDefaults)`) so a Button/Text/Divider
   *  a user adds lands on-brand instead of a generic neutral default. */
  get colorDefaults(): EmailColorDefaults {
    return this.colors;
  }

  /**
   * Re-resolve the brand color defaults live — the React layer calls this
   * whenever the host's `theme` prop changes (e.g. the site's theme was
   * edited elsewhere and the host synced the update down), so an open email
   * repaints to match instead of drifting from the brand. Repaints every
   * node across every template still on its default (`<field>Auto === true`)
   * with the newly-resolved hex; a node whose color a user explicitly picked
   * is never touched. Not undoable — this mirrors `setActiveTemplate`, an
   * external resync rather than a user edit, so it doesn't belong on the
   * undo stack. No-ops if `next` is identical to the current defaults.
   */
  setColorDefaults(next: EmailColorDefaults): void {
    const keys = Object.keys(next) as (keyof EmailColorDefaults)[];
    if (keys.every((k) => this.colors[k] === next[k])) return;
    this.transact(["props"], false, () => {
      this.colors = next;
      // The resulting literal colors travel with the op. They ARE derivable from
      // `colors` in principle — but only by a receiver that reimplements
      // AUTO_COLOR_FIELDS exactly, and any drift between the two would paint two
      // authors' canvases differently without either noticing.
      const touched: Array<{ target: OpTarget; nodeId: string; patch: Record<string, unknown> }> = [];
      const repaint = (node: EmailNode, target: OpTarget): void => {
        const rules = AUTO_COLOR_FIELDS[node.kind];
        if (rules) {
          const rec = node as unknown as Record<string, unknown>;
          const patch: Record<string, unknown> = {};
          for (const rule of rules) {
            if (rec[rule.autoField] === true) {
              rec[rule.field] = next[rule.role];
              patch[rule.field] = next[rule.role];
            }
          }
          if (Object.keys(patch).length) touched.push({ target, nodeId: node.id, patch });
        }
        for (const child of childrenOf(node) ?? []) repaint(child, target);
      };
      for (const template of this.project.templates) {
        repaint(template.document.root, { scope: "template", id: template.id });
      }
      this.record({ target: { scope: "project" }, kind: "colors.set", colors: next, repaint: touched });
    });
  }

  subscribe(cb: (e: ChangeEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Record `kind` against the open action. Outside a transaction this is a
   * complete action on its own, so it opens and closes one immediately — which
   * is why a bare `emit` still behaves exactly as it always did.
   */
  private emit(kind: ChangeKind): void {
    if (this.txDepth === 0) {
      this.transact([kind], false, () => {});
      return;
    }
    if (!this.txKinds.includes(kind)) this.txKinds.push(kind);
  }

  /**
   * Run `body` as ONE user action: snapshot history at most once, accumulate
   * every kind it touches, and emit a single event when the outermost call
   * returns. The engine's sole mutation chokepoint — including the template ops
   * that used to call `pushHistory` by hand.
   *
   * Nesting collapses; `history` is honored the first time any level asks for it.
   * (Mirrors the site engine's `transact`, deliberately — the two engines are
   * separate but their editing spines are the same shape, and a fix that lands
   * in one and not the other is how they drift.)
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
        // A transaction that recorded nothing changed nothing — stay silent
        // rather than waking every subscriber (and the host's onChange).
        if (batch.length) {
          const event: ChangeEvent = { kind: primaryKind(batch), kinds: batch, ops };
          for (const l of this.listeners) l(event);
        }
      }
    }
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

  /**
   * Set the email's subject line. Undoable, and no-op when unchanged.
   *
   * Both guards matter. Without history, a ctrl-z after typing a subject
   * reverted the previous STRUCTURAL edit instead — the editor appearing to eat
   * work at random. Without the unchanged check, merely tabbing THROUGH the
   * field would push a junk undo step, since every call site commits on blur.
   *
   * (The site engine skips history for theme edits deliberately — a token drag
   * would flood the stack. That reasoning doesn't transfer: these are
   * blur-committed text fields, one step per committed edit.)
   */
  setSubject(subject: string): void {
    if (subject === this.doc.subject) return;
    this.commit("meta", () => {
      this.doc.subject = subject;
      this.record({ target: this.activeTarget(), kind: "template.setMeta", subject });
    });
  }

  /** Set the preview text shown after the subject in an inbox. Undoable, and
   *  no-op when unchanged — same reasoning as `setSubject`. */
  setPreheader(preheader: string): void {
    if (preheader === this.doc.preheader) return;
    this.commit("meta", () => {
      this.doc.preheader = preheader;
      this.record({ target: this.activeTarget(), kind: "template.setMeta", preheader });
    });
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
    this.transact(["active"], false, () => {
      this.activeTemplateId = id;
      this.select(undefined);
      this.syncTemplates();
    });
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
    return this.transact(["template"], true, () => {
      this.project.templates.push(template);
      this.activeTemplateId = template.id;
      this.select(undefined);
      this.syncTemplates();
      this.record({ target: { scope: "project" }, kind: "template.create", template });
      return template.id;
    });
  }

  /** Remove a template. Refuses to remove the last one (a project needs ≥1
   *  template). If it was active, falls back to the previous template. Undoable. */
  removeTemplate(id: string): void {
    if (this.project.templates.length <= 1) return;
    const idx = this.project.templates.findIndex((t) => t.id === id);
    if (idx < 0) return;
    this.transact(["template"], true, () => {
      this.project.templates.splice(idx, 1);
      this.record({ target: { scope: "project" }, kind: "template.delete", templateId: id });
      if (this.activeTemplateId === id) {
        this.activeTemplateId = (this.project.templates[idx - 1] ?? this.project.templates[0]!).id;
        this.select(undefined);
      }
      this.syncTemplates();
    });
  }

  /** Rename a template's label (no-op on empty/unchanged). Undoable. */
  renameTemplate(id: string, name: string): void {
    const template = this.project.templates.find((t) => t.id === id);
    if (!template) return;
    const value = name.trim();
    if (!value || value === template.name) return;
    this.transact(["template"], true, () => {
      template.name = value;
      this.syncTemplates();
      this.record({ target: { scope: "project" }, kind: "template.rename", templateId: id, name: value });
    });
  }

  // ── history-aware commit ───────────────────────────────────────────────────
  private pushHistory(): void {
    this.past.push(structuredClone(this.project));
    if (this.past.length > EmailEditor.HISTORY_LIMIT) this.past.shift();
    this.future = [];
  }

  private commit(kind: ChangeKind, mutate: () => void): void {
    this.transact([kind], true, mutate);
  }

  // ── semantic operations ────────────────────────────────────────────────────
  /**
   * Record one op against the open action. Ops accumulate in causal order and
   * ship with the action's single `ChangeEvent`.
   *
   * Deep-cloned on the way in: the engine mutates its trees in place, so an op
   * holding a live reference would keep changing under the host after handover,
   * and a later undo would rewrite history that had already been sent.
   */
  private record(op: Op): void {
    if (this.remote > 0) return; // applying someone else's edit — nothing to send back
    this.txOps.push(structuredClone(op));
  }

  /** The template a node op addresses — every node edit runs against the active
   *  template's document. */
  private activeTarget(): OpTarget {
    return { scope: "template", id: this.currentTemplate().id };
  }

  /** The whole-project escape hatch — see `ProjectReplaceOp`. */
  private recordReplace(): void {
    this.record({ target: { scope: "project" }, kind: "project.replace", templates: this.project.templates });
  }

  /** The host sequence number this client last had applied (`meta.baseSeq`). */
  get baseSeq(): number {
    return this.seq;
  }

  /** Record the sequence number the host assigned to our last batch. */
  ackSeq(seq: number): void {
    if (seq > this.seq) this.seq = seq;
  }

  /** Emit a columns row's widths as ONE op. Add/remove/duplicate-column each
   *  rewrite every sibling's `widthPct`; sending N separate updates would let a
   *  peer observe a row that briefly doesn't sum to 100. */
  private recordRebalance(row: ColumnsNode): void {
    this.record({
      target: this.activeTarget(),
      kind: "columns.rebalance",
      columnsId: row.id,
      widths: Object.fromEntries(row.children.map((c) => [c.id, c.widthPct])),
    });
  }

  /**
   * After swapping two adjacent siblings in the array, re-key BOTH so the
   * ordering keys agree with the new order, and emit the moves.
   *
   * The Inspector's up/down buttons swap array positions directly rather than
   * going through `move`. Without re-keying, the array order and the key order
   * would disagree — which renders correctly here and lands wrong on every peer.
   */
  private rekeySwap(children: EmailNode[], lowIndex: number, parentId: string): void {
    const first = children[lowIndex];
    const second = children[lowIndex + 1];
    if (!first || !second) return;
    const target = this.activeTarget();
    for (const [i, node] of [
      [lowIndex, first],
      [lowIndex + 1, second],
    ] as const) {
      const rest = children.filter((c) => c !== node);
      node.ord = ordAt(rest, i);
      this.record({ target, kind: "node.move", nodeId: node.id, parentId, ord: node.ord });
    }
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

  /** `id`'s ancestors, root-first, NOT including `id` itself — powers the
   *  binding picker's collection-scope narrowing (`emailScopeAt`) and the
   *  Inspector's "nested under a repeat" check, mirroring the site engine's
   *  `ancestorsOf`. */
  ancestorsOf(id: string): EmailNode[] {
    const out: EmailNode[] = [];
    const walk = (node: EmailNode): boolean => {
      if (node.id === id) return true;
      for (const child of childrenOf(node) ?? []) {
        out.push(node);
        if (walk(child)) return true;
        out.pop();
      }
      return false;
    };
    walk(this.doc.root);
    return out;
  }

  /** True when `node` can accept an inserted/dropped child (of any kind — the
   *  actual kind is checked separately via `canHold`). */
  acceptsChildren(node: EmailNode): boolean {
    return isContainer(node);
  }

  // ── data binding ───────────────────────────────────────────────────────────
  /** Set (or clear) a node's dynamic-content marker — the sole editing surface
   *  for `data`, mirroring the site engine's `setData`. Lowers to nothing in
   *  `toEmailHtml` by default; a resolver passed to `toEmailHtml`/the canvas
   *  consumes it (see `email/resolve.ts`). */
  setData(id: string, binding: DataBinding | undefined): void {
    const found = locate(this.doc.root, id);
    if (!found) return;
    this.commit("props", () => {
      found.node.data = binding;
      this.record({ target: this.activeTarget(), kind: "node.setBinding", nodeId: id, binding: binding ?? null });
    });
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
      // A patch, not the whole node: that's what lets a second author change a
      // DIFFERENT field on this node without clobbering this one.
      this.record({
        target: this.activeTarget(),
        kind: "node.update",
        nodeId: id,
        patch: Object.fromEntries(Object.entries(patch as Record<string, unknown>).map(([k, v]) => [k, v === undefined ? null : v])),
      });
    });
  }

  // ── structure ──────────────────────────────────────────────────────────────
  /** Insert a subtree under `parentId` at `index` (default: append). Fresh ids are
   *  stamped first. No-op if the parent can't hold this kind of child. */
  insert(node: EmailNode, parentId: string, index?: number): string | undefined {
    const parentLoc = locate(this.doc.root, parentId);
    if (!parentLoc || !isContainer(parentLoc.node) || !canHold(parentLoc.node, node)) return undefined;
    const stamped = stampIds(node, defaultMakeId);
    return this.transact(["structure"], true, () => {
      const parent = parentLoc.node as Container;
      const children = childrenOf(parent) as EmailNode[];
      const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
      // Key BEFORE splicing — `ordAt` brackets the slot using the neighbors as
      // they stand, which requires the array not to contain the node yet.
      stamped.ord = ordAt(children, at);
      children.splice(at, 0, stamped);
      this.record({ target: this.activeTarget(), kind: "node.insert", parentId, ord: stamped.ord, node: stamped });
      // Inside the action, so selecting the new node rides the SAME event as
      // the insert rather than firing a second one behind it.
      this.select(stamped.id);
      return stamped.id;
    });
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
    this.transact(["structure"], true, () => {
      const children = childrenOf(found.parent as Container) as EmailNode[];
      children.splice(found.index, 1);
      this.record({ target: this.activeTarget(), kind: "node.remove", nodeId: id });
      if (this.selectedId === id) this.select(parentId);
    });
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
      // `moved` is already spliced out, so `to` holds exactly the neighbors that
      // will bracket it — including in the same-parent case.
      moved.ord = ordAt(to, at);
      to.splice(at, 0, moved);
      this.record({ target: this.activeTarget(), kind: "node.move", nodeId: id, parentId, ord: moved.ord });
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
      const col: ColumnNode = { id: defaultMakeId(), kind: "column", widthPct: 0, children: [] };
      col.ord = ordAt(node.children, node.children.length);
      node.children.push(col);
      rebalanceColumns(node);
      this.record({ target: this.activeTarget(), kind: "node.insert", parentId: columnsId, ord: col.ord, node: col });
      this.recordRebalance(node);
    });
  }

  /** Remove a column from its row (rebalancing the rest). Refuses to drop the
   *  last column in a row — remove the `columns` node itself instead. */
  removeColumn(columnId: string): void {
    const found = locate(this.doc.root, columnId);
    if (!found || !found.parent || found.parent.kind !== "columns") return;
    const row = found.parent;
    if (row.children.length <= 1) return;
    this.transact(["structure"], true, () => {
      row.children.splice(found.index, 1);
      rebalanceColumns(row);
      this.record({ target: this.activeTarget(), kind: "node.remove", nodeId: columnId });
      this.recordRebalance(row);
      if (this.selectedId === columnId) this.select(row.id);
    });
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
    return this.transact(["structure"], true, () => {
      copy.ord = ordAt(row.children, found.index + 1);
      row.children.splice(found.index + 1, 0, copy);
      rebalanceColumns(row);
      this.record({ target: this.activeTarget(), kind: "node.insert", parentId: row.id, ord: copy.ord, node: copy });
      this.recordRebalance(row);
      this.select(copy.id);
      return copy.id;
    });
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
      this.rekeySwap(children, i - 1, found.parent!.id);
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
      this.rekeySwap(kids, i, found.parent!.id);
    });
  }

  /** Duplicate a node in place (fresh ids), inserting the copy right after it. */
  duplicate(id: string): string | undefined {
    const found = locate(this.doc.root, id);
    if (!found || !found.parent) return undefined;
    const copy = stampIds(found.node, defaultMakeId);
    const parent = found.parent;
    const at = found.index + 1;
    return this.transact(["structure"], true, () => {
      const children = childrenOf(parent) as EmailNode[];
      copy.ord = ordAt(children, at);
      children.splice(at, 0, copy);
      // A duplicate IS an insert as far as a peer is concerned — the copy is new
      // content with fresh ids, not a reference to the original.
      this.record({ target: this.activeTarget(), kind: "node.insert", parentId: parent.id, ord: copy.ord, node: copy });
      this.select(copy.id);
      return copy.id;
    });
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

  // ── remote application ─────────────────────────────────────────────────────
  /** The document an op addresses, or undefined if it names a template that's gone. */
  private docFor(target: OpTarget): EmailDocument | undefined {
    if (target.scope !== "template") return undefined;
    return this.project.templates.find((t) => t.id === target.id)?.document;
  }

  /**
   * Apply one remote op. Returns false when it can't be applied — its template
   * or node is gone, a kind rule forbids it, or it would create a cycle. A false
   * is a DROP, not an error: ops commute, so an op whose subject no longer
   * exists is simply moot.
   */
  private applyOp(op: Op): boolean {
    switch (op.kind) {
      case "project.replace":
        this.project.templates = structuredClone(op.templates);
        return true;
      case "template.create":
        if (this.project.templates.some((t) => t.id === op.template.id)) return false;
        this.project.templates.push(structuredClone(op.template));
        return true;
      case "template.delete": {
        if (this.project.templates.length <= 1) return false; // a project needs ≥1
        const idx = this.project.templates.findIndex((t) => t.id === op.templateId);
        if (idx < 0) return false;
        this.project.templates.splice(idx, 1);
        return true;
      }
      case "template.rename": {
        const t = this.project.templates.find((x) => x.id === op.templateId);
        if (!t) return false;
        t.name = op.name;
        return true;
      }
      case "template.reorder": {
        const byId = new Map(this.project.templates.map((t) => [t.id, t]));
        const next: EmailTemplate[] = [];
        for (const id of op.templateIds) {
          const t = byId.get(id);
          if (t && !next.includes(t)) next.push(t);
        }
        for (const t of this.project.templates) if (!next.includes(t)) next.push(t);
        if (next.length !== this.project.templates.length) return false;
        this.project.templates = next;
        return true;
      }
      case "colors.set": {
        this.colors = structuredClone(op.colors);
        for (const r of op.repaint) {
          const doc = this.docFor(r.target);
          const found = doc ? locate(doc.root, r.nodeId) : undefined;
          if (found) Object.assign(found.node, r.patch);
        }
        return true;
      }
      case "template.setMeta": {
        const doc = this.docFor(op.target);
        if (!doc) return false;
        if (op.subject !== undefined) doc.subject = op.subject;
        if (op.preheader !== undefined) doc.preheader = op.preheader;
        return true;
      }
      default:
        break;
    }

    const doc = this.docFor(op.target);
    if (!doc) return false;

    if (op.kind === "node.insert") {
      const parent = locate(doc.root, op.parentId);
      if (!parent || !isContainer(parent.node)) return false;
      const incoming = structuredClone(op.node);
      if (!canHold(parent.node, incoming)) return false; // the closed schema still governs
      if (locate(doc.root, incoming.id)) return false; // idempotent: no duplicate subtree
      insertByOrd(childrenOf(parent.node) as EmailNode[], incoming, op.ord);
      return true;
    }
    if (op.kind === "columns.rebalance") {
      const found = locate(doc.root, op.columnsId);
      if (!found || found.node.kind !== "columns") return false;
      for (const col of found.node.children) {
        const w = op.widths[col.id];
        if (typeof w === "number") col.widthPct = w;
      }
      return true;
    }

    const found = locate(doc.root, op.nodeId);
    if (!found) return false; // dropped — an intervening op removed it

    switch (op.kind) {
      case "node.remove":
        if (!found.parent) return false; // never the body root
        (childrenOf(found.parent) as EmailNode[]).splice(found.index, 1);
        return true;
      case "node.move": {
        const parent = locate(doc.root, op.parentId);
        if (!parent || !isContainer(parent.node) || !found.parent) return false;
        if (op.nodeId === op.parentId) return false;
        if (!canHold(parent.node, found.node)) return false;
        if (contains(doc.root, op.nodeId, op.parentId)) return false; // would orphan the subtree
        const [moved] = (childrenOf(found.parent) as EmailNode[]).splice(found.index, 1);
        if (moved === undefined) return false;
        insertByOrd(childrenOf(parent.node) as EmailNode[], moved, op.ord);
        return true;
      }
      case "node.update": {
        const rec = found.node as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(op.patch)) {
          if (k === "id" || k === "kind" || k === "children") continue;
          if (v === null) delete rec[k];
          else rec[k] = v;
        }
        return true;
      }
      case "node.setBinding":
        if (op.binding) found.node.data = structuredClone(op.binding);
        else delete found.node.data;
        return true;
      default:
        return false;
    }
  }

  /**
   * Apply another author's operations to this session's project, in order.
   *
   * Not undoable and not re-emitted: a remote op must not land on the local undo
   * stack, and must not come back out of `onChange` as a local edit. Ops whose
   * subject is already gone are DROPPED rather than treated as errors — that's
   * what makes them commute — but reported, so a host can tell a benign race
   * from a real divergence.
   */
  applyRemoteOps(ops: readonly Op[]): { applied: number; dropped: Op[] } {
    if (!ops.length) return { applied: 0, dropped: [] };
    const dropped: Op[] = [];
    let applied = 0;
    const kinds = new Set<ChangeKind>();
    // INVALIDATE local history — the stack holds whole-project snapshots, and a
    // snapshot is only a truthful "before" while this client is the only writer.
    // Once another author's edit lands, undoing one would silently revert work
    // this client never did. A host that wants working undo in a shared session
    // supplies a `HistoryDelegate`, which is left alone here.
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
        // Report what actually changed, not just "replace".
        for (const k of kinds) this.emit(k);
        this.clampActiveTemplate();
        this.clampSelection();
      });
    } finally {
      this.remote--;
    }
    return { applied, dropped };
  }

  /**
   * Force this session's project to `project` at sequence `seq` — the resync
   * path when a client has drifted too far to reconcile with a delta. Clears
   * undo/redo: the stacks describe a lineage that no longer applies.
   */
  replaceState(project: EmailProject, seq: number): void {
    this.remote++;
    try {
      this.transact(["replace"], false, () => {
        this.project = structuredClone(project);
        if (this.project.templates.length === 0) {
          this.project.templates = [
            { id: defaultMakeId(), name: "Email 1", document: emptyEmailDocument(defaultMakeId, this.colors) },
          ];
        }
        for (const t of this.project.templates) assignOrds(t.document.root);
        this.past = [];
        this.future = [];
        this.seq = seq;
        this.clampActiveTemplate();
        this.clampSelection();
      });
    } finally {
      this.remote--;
    }
  }

  // ── undo / redo ────────────────────────────────────────────────────────────
  /**
   * Hand undo/redo to the host instead of running the local stack.
   *
   * A local undo stack is a whole-document snapshot with no author attribution,
   * so in a shared session "undo" reverts whatever else landed in between. Set a
   * delegate to drive the host's authoritative history instead; leave it unset
   * (the default) and the local stack runs, which stays correct for a single
   * author.
   */
  setHistoryDelegate(delegate: HistoryDelegate | undefined): void {
    this.historyDelegate = delegate;
    this.emit("replace"); // availability may have changed under the toolbar
  }

  /** True when undo/redo are the host's responsibility. */
  get historyIsDelegated(): boolean {
    return this.historyDelegate !== undefined;
  }

  get canUndo(): boolean {
    return this.historyDelegate ? this.historyDelegate.canUndo() : this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.historyDelegate ? this.historyDelegate.canRedo() : this.future.length > 0;
  }

  undo(): void {
    if (this.historyDelegate) return this.historyDelegate.undo();
    const prev = this.past.pop();
    if (!prev) return;
    // `history: false` — undo is not itself an undoable edit; it moves the
    // existing snapshot between the two stacks by hand.
    this.transact(["replace"], false, () => {
      this.future.push(structuredClone(this.project));
      this.project = prev;
      this.clampActiveTemplate();
      this.clampSelection();
      // Undo restores a whole-document snapshot, so there is no delta to send.
      this.recordReplace();
    });
  }

  redo(): void {
    if (this.historyDelegate) return this.historyDelegate.redo();
    const next = this.future.pop();
    if (!next) return;
    this.transact(["replace"], false, () => {
      this.past.push(structuredClone(this.project));
      this.project = next;
      this.clampActiveTemplate();
      this.clampSelection();
      this.recordReplace();
    });
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
      this.select(undefined);
    }
  }
}

export { canHold };
export type { Container, ContentNode };
