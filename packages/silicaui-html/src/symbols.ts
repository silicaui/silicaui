/**
 * Symbol flattening (architecture: symbols are an AUTHORING-time reuse mechanism;
 * OUTPUT is always plain markup). An INSTANCE node (`instanceOf`) references a
 * `SymbolDef` master; `flattenSymbols` inlines every instance into a fresh clone
 * of its master, recursively, so the result is an ordinary instance-free tree the
 * projection (`toHtml`) renders with zero symbol awareness. Nested symbols expand
 * too; a self-referential cycle is broken (rendered as an empty element) rather
 * than recursing forever.
 */
import type { Child, Node, NodeOverride, SymbolDef } from "./schema";
import { defaultMakeId, stampTree, type MakeId } from "./stamp";
import { walk } from "./tree";

/** Resolve a symbol id to its master tree. */
export type SymbolResolver = (id: string) => Node | undefined;

/** Accept either a plain map or a resolver function. */
function asResolver(symbols: Record<string, SymbolDef> | SymbolResolver): SymbolResolver {
  return typeof symbols === "function" ? symbols : (id) => symbols[id]?.root;
}

/** An empty stand-in for a missing or cyclic instance (keeps the instance's id/class). */
function placeholder(node: Node): Node {
  const out: Node = { kind: "element", tag: "div" };
  if (node.kind !== "outlet") {
    if (node.id != null) out.id = node.id;
    if (node.class) out.class = node.class;
  }
  return out;
}

/** Write a node's primary text — an element's single string child, or a
 *  component's `label` (if it has one) else its `text` prop (mirrors the editor). */
function setNodeText(node: Node, text: string): void {
  if (node.kind === "element") {
    node.children = [text];
  } else if (node.kind === "component") {
    const props = { ...(node.props ?? {}) };
    if ("label" in props) props.label = text;
    else props.text = text;
    node.props = props;
  }
}

/**
 * Apply an instance's overrides (keyed by master node id) onto an expanded master
 * clone, IN PLACE. Call BEFORE re-minting ids (the keys are the master's stable
 * ids). An override for a missing id is silently ignored (a benign orphan).
 */
export function applyOverrides(root: Node, overrides: Record<string, NodeOverride> | undefined): Node {
  if (!overrides) return root;
  walk(root, (n) => {
    if (n.kind === "outlet" || n.id == null) return;
    const ov = overrides[n.id];
    if (!ov) return;
    if (ov.text !== undefined) setNodeText(n, ov.text);
    if (ov.props && n.kind === "component") n.props = { ...(n.props ?? {}), ...ov.props };
  });
  return root;
}

function expand(node: Node, resolve: SymbolResolver, seen: ReadonlySet<string>, makeId: MakeId): Node {
  if (node.kind === "outlet") return node;

  // An instance → a fresh clone of its master (with this instance's overrides
  // baked in), itself flattened (nested symbols). Overrides are keyed by the
  // master's stable ids, so they're applied to the clone BEFORE ids are re-minted.
  if (node.instanceOf) {
    const symbolId = node.instanceOf;
    if (seen.has(symbolId)) return placeholder(node); // cycle guard
    const master = resolve(symbolId);
    if (!master) return placeholder(node); // dangling ref → empty, never a broken tree
    const next = new Set(seen);
    next.add(symbolId);
    const overridden = applyOverrides(structuredClone(master), node.overrides);
    return expand(stampTree(overridden, makeId), resolve, next, makeId);
  }

  const children = node.children;
  if (!children || children.length === 0) return node;
  const flattened: Child[] = children.map((c) => (typeof c === "string" ? c : expand(c, resolve, seen, makeId)));
  return { ...node, children: flattened };
}

/**
 * Return a new tree with every instance node inlined to a fresh clone of its
 * symbol master. `symbols` is a map (`Site.symbols`) or a resolver. The input is
 * never mutated. Pass a deterministic `makeId` for reproducible output (tests).
 */
export function flattenSymbols(
  root: Node,
  symbols: Record<string, SymbolDef> | SymbolResolver,
  makeId: MakeId = defaultMakeId,
): Node {
  return expand(root, asResolver(symbols), new Set(), makeId);
}

/** True if the tree contains at least one instance node (worth flattening). */
export function hasInstances(root: Node): boolean {
  if (root.kind === "outlet") return false;
  if (root.instanceOf) return true;
  for (const c of root.children ?? []) {
    if (typeof c !== "string" && hasInstances(c)) return true;
  }
  return false;
}
