/**
 * Structural editor COMMANDS — the tree moves a keyboard shortcut (or a host's
 * own toolbar/context menu) performs, as plain functions over a live `Editor`.
 *
 * They live here rather than inside the React key handler for two reasons. They
 * are testable without a DOM, which matters most for `moveSibling`: `move`'s
 * index is a pre-removal GAP index, so "down one" is `index + 2` and not the
 * `index + 1` that reads correctly and silently does nothing. And a host
 * building its own chrome gets the same verbs the built-in keys use, instead of
 * re-deriving that arithmetic against an engine method whose contract is
 * written for the drag-and-drop model.
 *
 * Each returns whether it did anything, so a caller can decide whether to
 * `preventDefault` on a key it ultimately ignored.
 */
import { el } from "@wizeworks/silicaui-html";
import type { Node } from "@wizeworks/silicaui-html";
import type { Editor } from "./engine";

/** Element children only — a text child is not separately selectable. */
export const childNodes = (node: Node | undefined): Node[] =>
  node && node.kind !== "outlet" ? (node.children ?? []).filter((c): c is Node => typeof c !== "string") : [];

export const idOf = (node: Node | undefined): string | undefined => (node && node.kind !== "outlet" ? node.id : undefined);

/** Where `id` sits: its parent, that parent's selectable children, and `id`'s
 *  index among them. `undefined` for the root, which has no parent. */
export function placeOf(
  editor: Editor,
  id: string,
): { parent: Node; parentId: string; siblings: Node[]; index: number } | undefined {
  const ancestors = editor.ancestorsOf(id);
  const parent = ancestors[ancestors.length - 1];
  const parentId = idOf(parent);
  if (!parent || !parentId) return undefined;
  const siblings = childNodes(parent);
  const index = siblings.findIndex((n) => idOf(n) === id);
  return index < 0 ? undefined : { parent, parentId, siblings, index };
}

/** Select the sibling `delta` away. No wrap-around: running off either end is a
 *  no-op, so holding the key parks at the boundary instead of cycling. */
export function selectSibling(editor: Editor, id: string, delta: number): boolean {
  const place = placeOf(editor, id);
  const next = place && idOf(place.siblings[place.index + delta]);
  if (!next) return false;
  editor.select(next);
  return true;
}

/** Select the parent. False at the root. */
export function selectParent(editor: Editor, id: string): boolean {
  const parentId = idOf(editor.ancestorsOf(id).at(-1));
  if (!parentId) return false;
  editor.select(parentId);
  return true;
}

/** Select the first selectable child. False for a leaf. */
export function selectFirstChild(editor: Editor, id: string): boolean {
  const first = idOf(childNodes(editor.node(id))[0]);
  if (!first) return false;
  editor.select(first);
  return true;
}

/**
 * Reorder `id` one slot up or down among its siblings.
 *
 * THE INDEX. `Editor.move` takes a PRE-removal gap index: the slot in the
 * children array as it stands right now, before the node is spliced out. Moving
 * up one is therefore `index - 1`, but moving DOWN one is `index + 2` — because
 * `index + 1` names the gap the node already occupies, and the move resolves to
 * where it already was. Pinned by probe-shortcuts.
 */
export function moveSibling(editor: Editor, id: string, delta: 1 | -1): boolean {
  const place = placeOf(editor, id);
  if (!place) return false;
  const landing = place.index + delta;
  if (landing < 0 || landing >= place.siblings.length) return false;
  editor.move(id, place.parentId, delta < 0 ? place.index - 1 : place.index + 2);
  return true;
}

/**
 * Wrap `id` in a fresh container, in its place, and select the wrapper — the
 * "group" gesture. One action, so a single undo unwraps it.
 *
 * The wrapper's class is a LITERAL string: the harness's `@source` scan is what
 * safelists canvas utilities, and a composed class name is invisible to it.
 */
export function groupNode(editor: Editor, id: string): string | undefined {
  const place = placeOf(editor, id);
  if (!place) return undefined; // the root has nowhere to be wrapped into
  return editor.batch(() => {
    const wrapperId = editor.insert(el("div", "flex flex-col"), place.parentId, place.index);
    if (!wrapperId) return undefined;
    editor.move(id, wrapperId, 0);
    editor.select(wrapperId);
    return wrapperId;
  });
}

/**
 * Cut: the clipboard fills and the node leaves as ONE action, so a single undo
 * puts it back rather than leaving a half-done cut on the stack.
 */
export function cutNode(editor: Editor, id: string): void {
  editor.batch(() => {
    editor.copy(id);
    editor.remove(id);
  });
}

// ── set-aware verbs ──────────────────────────────────────────────────────────
// Every engine mutation is single-id by design (that's what makes ops commute),
// so a multi-node gesture is N calls. These wrap the N in one `batch`, which is
// what makes it ONE user action: one undo step, one change event, one ops batch.
// Without that, deleting six selected nodes costs the author six presses of undo
// to take back — the editor looks like it lost track of what they did.

/** Remove every selected node, as one action. Removes deepest-first so removing
 *  a parent can't strand a child id mid-batch. */
export function removeMany(editor: Editor, ids: readonly string[]): void {
  if (ids.length === 0) return;
  editor.batch(() => {
    for (const id of orderByDepth(editor, ids)) editor.remove(id);
  });
}

/** A node's HTML tag, or `undefined` for an outlet. */
const tagOf = (node: Node | undefined): string | undefined =>
  node && node.kind === "element" ? node.tag : undefined;

const ROW_GROUPS = new Set(["thead", "tbody", "tfoot"]);

/**
 * Every `<tr>` of the table that contains `cellId`, in document order — across
 * `thead`, `tbody` and `tfoot`, because a column spans all three.
 *
 * Found by walking UP from the row rather than by looking for a `table` tag: a
 * Table is a COMPONENT macro, so the real ancestry is `component > thead > tr`
 * and there is no `table` element in the tree at all. Searching for one found
 * nothing and silently fell back to duplicating the single cell, which is the
 * defect this exists to stop.
 */
function tableRowsFor(editor: Editor, cellId: string): Node[] | undefined {
  const ancestors = editor.ancestorsOf(cellId);
  // …root, container, [row group], <tr>
  let container = ancestors[ancestors.length - 2];
  if (container && ROW_GROUPS.has(tagOf(container) ?? "")) container = ancestors[ancestors.length - 3];
  if (!container) return undefined;
  const rows: Node[] = [];
  const walk = (n: Node): void => {
    for (const c of childNodes(n)) {
      if (tagOf(c) === "tr") rows.push(c);
      else walk(c);
    }
  };
  walk(container);
  return rows.length ? rows : undefined;
}

/**
 * Duplicate the COLUMN a table cell sits in — one new cell in every row.
 *
 * Duplicating a cell on its own is the generically correct thing to do and the
 * specifically wrong one: it widens that row alone, so a two-column table becomes
 * `[3,2,2,2,2]` and renders as a broken table with no warning anywhere. There is
 * no case where somebody wants one row wider than the others; the peer group of a
 * cell, in a table, is its column.
 *
 * Found by P03 (docs/personas/issues/052) building an eleven-row timetable that
 * needed four columns from a table that arrives with two.
 *
 * Cells are matched BY INDEX rather than by any column identity, because the
 * schema has none — a table is `tr`s of `td`s. A row that is already short is
 * clamped to its last cell rather than skipped, so this makes a ragged table less
 * ragged and never more.
 */
export function duplicateColumn(editor: Editor, cellId: string): string[] | undefined {
  const place = placeOf(editor, cellId);
  if (!place || tagOf(place.parent) !== "tr") return undefined;
  const rows = tableRowsFor(editor, cellId);
  if (!rows) return undefined;
  const column = place.index;
  return editor.batch(() => {
    const copies: string[] = [];
    let beside: string | undefined;
    for (const row of rows) {
      const cells = childNodes(row);
      if (!cells.length) continue;
      const id = idOf(cells[Math.min(column, cells.length - 1)]);
      if (!id) continue;
      const copy = editor.duplicate(id);
      if (!copy) continue;
      copies.push(copy);
      if (id === cellId) beside = copy;
    }
    // Select ONLY the new cell in her own row, not all N of them.
    //
    // Selecting the whole new column reads as helpful and is not: the next
    // Ctrl+D then sees a multi-node selection, takes the generic path, and
    // duplicates every one of them — two columns became 3, 6, 12, 24 in four
    // presses. One cell is also what she is looking at, so the Inspector shows
    // something she can act on.
    if (beside) editor.select(beside);
    else if (copies.length) editor.select(copies[0]);
    return copies;
  });
}

/** Duplicate every selected node, as one action; the copies become the new
 *  selection, so the obvious next gesture (drag them, restyle them) works.
 *
 *  A single table cell duplicates its whole COLUMN — see `duplicateColumn`. */
export function duplicateMany(editor: Editor, ids: readonly string[]): string[] {
  if (ids.length === 0) return [];
  if (ids.length === 1) {
    const column = duplicateColumn(editor, ids[0]!);
    if (column) return column;
  }
  return editor.batch(() => {
    const copies: string[] = [];
    for (const id of ids) {
      const copy = editor.duplicate(id);
      if (copy) copies.push(copy);
    }
    if (copies.length) editor.selectMany(copies);
    return copies;
  });
}

/** Set a class token across a whole selection at one breakpoint, as one action.
 *  What the Inspector calls when more than one node is selected. */
export function setClassTokenMany(
  editor: Editor,
  ids: readonly string[],
  group: readonly string[],
  value: string,
  prefix = "",
): { ok: true } | { ok: false; reason: string } {
  if (ids.length === 0) return { ok: true };
  // The first rejection is RETURNED rather than swallowed. A host policy can now
  // refuse a class on one node (`ClassValidator`'s node argument), and without
  // this every Design-tab control on such a node was a live-looking button that
  // did nothing at all when pressed — the same defect as the Delete button two
  // files away. Found by P05 act 2 (issues/081).
  let refusal: { ok: false; reason: string } | undefined;
  editor.batch(() => {
    for (const id of ids) {
      const result = editor.setClassToken(id, group, value, prefix);
      if (!result.ok && !refusal) refusal = result;
    }
  });
  return refusal ?? { ok: true };
}

/**
 * "Select all" — every SIBLING of the current selection, i.e. everything at the
 * same level of the tree.
 *
 * Not every node in the document: a flat select-all in a nested tree hands back
 * a set whose members are each other's ancestors, and every structural verb on
 * it (delete, duplicate, group) then has to decide what that means. Siblings are
 * the level the author is looking at, and match what a canvas tool means by
 * select-all.
 *
 * With nothing selected it takes the tree root's children — the top level, which
 * is the same rule with the same answer.
 */
export function selectSiblings(editor: Editor): boolean {
  const sel = editor.selection;
  const parent = sel ? placeOf(editor, sel)?.parent : editor.activeRootNode;
  const ids = childNodes(parent).map(idOf).filter((x): x is string => Boolean(x));
  if (ids.length === 0) return false;
  editor.selectMany(ids);
  return true;
}

/** Deepest-first, so a parent is never removed while a descendant of it is still
 *  queued — the queued id would already be gone and the call would no-op. */
function orderByDepth(editor: Editor, ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => editor.ancestorsOf(b).length - editor.ancestorsOf(a).length);
}
