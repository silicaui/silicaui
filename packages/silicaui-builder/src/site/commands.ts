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

const idOf = (node: Node | undefined): string | undefined => (node && node.kind !== "outlet" ? node.id : undefined);

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
