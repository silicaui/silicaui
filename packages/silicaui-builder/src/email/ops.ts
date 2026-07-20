/**
 * The email editor's semantic operation vocabulary — the twin of
 * `site/ops.ts`, over the CLOSED email schema.
 *
 * Same contract, same reasoning: `onChange` hands the host what the author
 * *did*, not only what the document now *is*, so a server can apply two authors'
 * edits to one project without either erasing the other. Ops address nodes by
 * id, carry a fractional `ord` rather than an index, and merge rather than
 * replace — which is what lets them commute without an operational-transform
 * layer.
 *
 * The vocabulary is SMALLER than the site's, and deliberately so. Email nodes
 * carry typed fields instead of a class string and a props bag, so there is one
 * `node.update` where the site needs `setClass` / `setProps` / `setAttrs` /
 * `setTag`. There are no symbols, no frame, and no pages — an email is one
 * canvas, so those scopes don't exist here rather than being stubbed out.
 *
 * The same rule governs payloads: anything randomly minted must travel, anything
 * computable must not. `node.insert` and `template.create` carry their subtrees
 * because ids are minted client-side and cannot be re-derived; nothing carries a
 * sibling list or a roster for the receiver's convenience.
 */
import type { DataBinding } from "@wizeworks/silicaui-html";
import type { EmailColorDefaults, EmailNode, EmailTemplate } from "./schema";

/**
 * Which tree an op addresses. A project is a flat roster of templates, so a
 * node op names its template and a roster op targets the project.
 */
export type OpTarget = { scope: "template"; id: string } | { scope: "project" };

interface OpBase {
  target: OpTarget;
}

// ── tree ops ─────────────────────────────────────────────────────────────────

/** Add a subtree. `node` arrives fully stamped — ids and child `ord`s minted,
 *  the root's `ord` equal to `ord`. The receiver stores it verbatim. */
export interface NodeInsertOp extends OpBase {
  kind: "node.insert";
  parentId: string;
  ord: string;
  node: EmailNode;
}

export interface NodeRemoveOp extends OpBase {
  kind: "node.remove";
  nodeId: string;
}

export interface NodeMoveOp extends OpBase {
  kind: "node.move";
  nodeId: string;
  parentId: string;
  ord: string;
}

/**
 * SHALLOW MERGE over a node's typed fields — the single property-write op,
 * because email nodes have exactly one property surface.
 *
 * A patch, never the whole node: that is what lets two authors change different
 * fields of one block without conflict (one rewrites a button's `label` while
 * the other restyles its `bg`). `null` deletes a key — the wire-safe spelling of
 * `undefined`, which JSON drops. `id` and `kind` are not patchable.
 */
export interface NodeUpdateOp extends OpBase {
  kind: "node.update";
  nodeId: string;
  patch: Record<string, unknown | null>;
}

/** Set or clear the dynamic-content binding. The union is "at most one" by
 *  construction, so this replaces wholesale rather than merging. */
export interface NodeSetBindingOp extends OpBase {
  kind: "node.setBinding";
  nodeId: string;
  binding: DataBinding | null;
}

/**
 * Rebalance a columns row's widths in one op.
 *
 * Add/remove/duplicate-column each rewrite EVERY sibling column's `widthPct` so
 * the row still sums to 100. Emitting that as N separate `node.update`s would
 * let a peer observe a row that briefly doesn't sum to 100, and would race badly
 * against a concurrent column edit. One op keeps the row's invariant atomic.
 */
export interface ColumnsRebalanceOp extends OpBase {
  kind: "columns.rebalance";
  columnsId: string;
  /** Column id → its share of the row. */
  widths: Record<string, number>;
}

// ── template + project ops ───────────────────────────────────────────────────

/** `template` carries its whole document, for the same reason `node.insert`
 *  carries a subtree. */
export interface TemplateCreateOp extends OpBase {
  kind: "template.create";
  template: EmailTemplate;
}

export interface TemplateDeleteOp extends OpBase {
  kind: "template.delete";
  templateId: string;
}

export interface TemplateRenameOp extends OpBase {
  kind: "template.rename";
  templateId: string;
  name: string;
}

/** Authoring order of the template roster — what the switcher lists. */
export interface TemplateReorderOp extends OpBase {
  kind: "template.reorder";
  templateIds: string[];
}

/** Subject and/or preview text. A shallow patch over the two, so a peer editing
 *  the preheader doesn't clobber a concurrent subject change. */
export interface TemplateSetMetaOp extends OpBase {
  kind: "template.setMeta";
  subject?: string;
  preheader?: string;
}

/**
 * The brand color defaults were re-resolved, repainting every node still on a
 * default (`<field>Auto === true`).
 *
 * `repaint` carries the resulting literal colors per node. They ARE derivable
 * from `colors` in principle — but only by a receiver that reimplements
 * `AUTO_COLOR_FIELDS` exactly, and a drift between the two would silently paint
 * two authors' canvases differently. The repaint is small, bounded by the nodes
 * actually on defaults, and it makes the op self-contained.
 */
export interface ColorsSetOp extends OpBase {
  kind: "colors.set";
  colors: EmailColorDefaults;
  repaint: Array<{ target: OpTarget; nodeId: string; patch: Record<string, unknown> }>;
}

/**
 * The escape hatch: replace the whole project. Semantically identical to the old
 * whole-`EmailProject` contract, and emitted only where an edit genuinely has no
 * delta — today, undo/redo restoring a snapshot, and a host-forced resync.
 *
 * Its FREQUENCY is the signal that the vocabulary has a gap, not a shortcut.
 */
export interface ProjectReplaceOp extends OpBase {
  kind: "project.replace";
  templates: EmailTemplate[];
}

export type Op =
  | NodeInsertOp
  | NodeRemoveOp
  | NodeMoveOp
  | NodeUpdateOp
  | NodeSetBindingOp
  | ColumnsRebalanceOp
  | TemplateCreateOp
  | TemplateDeleteOp
  | TemplateRenameOp
  | TemplateReorderOp
  | TemplateSetMetaOp
  | ColorsSetOp
  | ProjectReplaceOp;

export type OpKind = Op["kind"];

/** Metadata accompanying a batch of ops on `onChange`. */
export interface OpMeta {
  /** The sequence number this client last had applied when it produced these
   *  ops — the host's `newSeq` from the previous round trip, or 0 before the
   *  first. */
  baseSeq: number;
}
