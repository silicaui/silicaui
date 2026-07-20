/**
 * The one translation in the system (architecture spec §1, §9.6): template →
 * document, minting a globally-unique id on every node. `stampTree` is the
 * reusable transform behind stamp/duplicate/paste; `stripIds` is its inverse
 * (document subtree → id-free template, for "save selection as component").
 */
import type { Document, Node, Template, Theme } from "./schema";
import { assignOrds } from "./ord";

export type MakeId = () => string;

/** Default id generator — globally-unique via crypto.randomUUID when available. */
export function defaultMakeId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID
    ? c.randomUUID()
    : `n_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

function assignIds(node: Node, makeId: MakeId): void {
  if (node.kind === "outlet") return;
  node.id = makeId();
  for (const child of node.children ?? []) {
    if (typeof child !== "string") assignIds(child, makeId);
  }
}

function removeIds(node: Node): void {
  if (node.kind === "outlet") return;
  delete node.id;
  delete node.ord; // a template has no siblings, so it has no position
  for (const child of node.children ?? []) {
    if (typeof child !== "string") removeIds(child);
  }
}

/**
 * Deep-clone a subtree, minting a fresh id on every node (stamp/duplicate/paste)
 * and giving its children ordering keys.
 *
 * The subtree ROOT is deliberately left without an `ord`: its position is a
 * property of where it's being placed, which only the caller knows. Dropping any
 * inherited key (a duplicate would otherwise carry its source's) means a missed
 * assignment surfaces as a missing key rather than as two siblings claiming the
 * same position.
 */
export function stampTree(node: Node, makeId: MakeId = defaultMakeId): Node {
  const clone = structuredClone(node) as Node;
  assignIds(clone, makeId);
  if (clone.kind !== "outlet") delete clone.ord;
  assignOrds(clone);
  return clone;
}

/** Deep-clone a subtree with every id removed (document → template). */
export function stripIds(node: Node): Node {
  const clone = structuredClone(node) as Node;
  removeIds(clone);
  return clone;
}

/** Stamp a template into a live document: a fresh-id tree + a theme. */
export function stamp(
  template: Template,
  theme: Theme,
  makeId: MakeId = defaultMakeId,
): Document {
  return {
    version: template.version,
    root: stampTree(template.root, makeId),
    theme,
  };
}
