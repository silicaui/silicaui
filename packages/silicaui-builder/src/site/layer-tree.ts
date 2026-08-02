/**
 * Which nodes earn a row in the Navigator.
 *
 * A document is full of `div`s that exist only to hold a flex or grid — real
 * structure, but nothing an author ever means to select. Listing them at the
 * same weight as content is what makes the tree read like markup: the footer
 * shows three nested `div`s before a single word appears.
 *
 * "Simple" folds those wrappers away — the row is dropped and its children lift
 * into its parent's list. The node itself is untouched; this is a VIEW over the
 * real tree, so the wrapper is still there, still selectable on the canvas, and
 * still the parent every move resolves against. "All layers" shows everything.
 *
 * Pure: no React, no engine.
 */
import type { Node } from "@wizeworks/silicaui-html";

/** How much of the tree the Navigator lists. */
export type LayerDepth = "simple" | "all";

/** A node plus the rows beneath it — children lifted out of folded wrappers. */
export interface LayerRow {
  node: Node;
  children: LayerRow[];
}

/**
 * The only tags that ever fold. An ALLOWLIST, deliberately: a denylist would
 * hide any tag we forgot to think about, and hiding something unexpected is far
 * worse than showing one row too many.
 */
const WRAPPER_TAGS = new Set(["div", "span"]);

/** A node's element children (string children are content, not rows). */
function elementChildren(node: Node): Node[] {
  if (node.kind === "outlet") return [];
  return (node.children ?? []).filter((c): c is Node => typeof c !== "string");
}

/**
 * Whether this node is pure layout scaffolding — safe to fold away in Simple.
 *
 * Every disqualifier below is a way the wrapper carries meaning of its own: a
 * name the author chose, a data binding (the wrapper IS the repeat), a
 * behavior, a symbol instance, a lock, a slot. Fold one of those and the user
 * loses the only handle on it.
 */
export function isStructuralWrapper(node: Node, keep: ReadonlySet<string>): boolean {
  if (node.kind !== "element") return false;
  if (!WRAPPER_TAGS.has(node.tag)) return false;
  if (node.label) return false;
  if (node.data || node.behavior || node.instanceOf || node.locked) return false;
  if (node.slot || node.part) return false;
  if (node.id && keep.has(node.id)) return false;
  // A leaf has nothing to lift, so folding it would DELETE the row rather than
  // flatten it — the node would vanish from the tree entirely.
  return elementChildren(node).length > 0;
}

/** Rows for `node`'s children, folding wrappers when `depth` is "simple". */
function childRows(node: Node, depth: LayerDepth, keep: ReadonlySet<string>): LayerRow[] {
  const out: LayerRow[] = [];
  for (const child of elementChildren(node)) {
    if (depth === "simple" && isStructuralWrapper(child, keep)) {
      // Lift the wrapper's own rows in its place, recursively — a chain of
      // nested wrappers collapses to the first thing worth naming.
      out.push(...childRows(child, depth, keep));
    } else {
      out.push({ node: child, children: childRows(child, depth, keep) });
    }
  }
  return out;
}

/**
 * The forest the Navigator renders. `keep` holds ids that must always get a row
 * whatever the depth — the current selection, so a wrapper selected on the
 * canvas still has somewhere to highlight. The root always gets a row.
 */
export function layerRows(root: Node, depth: LayerDepth, keep: ReadonlySet<string> = new Set()): LayerRow[] {
  return [{ node: root, children: childRows(root, depth, keep) }];
}

/** Every listed row that has children — the Navigator's default-expanded set.
 *  Derived from the ROWS, not the raw tree, so a folded wrapper's id never
 *  lands in the expanded set (where it would just sit there, unmatched). */
export function expandableRowIds(rows: readonly LayerRow[]): string[] {
  const ids: string[] = [];
  const visit = (row: LayerRow) => {
    if (row.children.length && row.node.kind !== "outlet" && row.node.id) ids.push(row.node.id);
    row.children.forEach(visit);
  };
  rows.forEach(visit);
  return ids;
}
