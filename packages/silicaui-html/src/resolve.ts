/**
 * The data-resolution layer (builder-contract.md §3, the Q3/Q19 keystone). ONE
 * walker owns bind + repeat + action together — not just leaf rendering, the
 * way sparx's two-walker split does (see builder-engine-roadmap.md §1 for why
 * that's a residual seam worth closing, not copying).
 *
 * Pure and SYNCHRONOUS by design: a host with an async data source fetches
 * ONCE, up front, into whatever closure/cache its synchronous `resolveBinding`/
 * `resolveCollection` then reads from — this walker never awaits mid-tree. That
 * sidesteps the waterfalls an async-per-node API would create, and matches the
 * one production reference this is modeled on (sparx's `runtime.ts`, which
 * pre-loads all data before a fully synchronous render walk).
 *
 * `resolveTree(tree, host)` feeds BOTH `toHtml` (a host's live-render path:
 * `toHtml(resolveTree(root, host))`) and a canvas's own React walk — one
 * resolution primitive, so preview == production is structural, not hoped-for.
 */
import type { Child, ComponentNode, ElementNode, Node } from "./schema";

/** Threaded down through a `repeat` walk. Carries the ACTUAL resolved item —
 *  not a structural path — so a nested `bind` never has to re-derive "which
 *  item am I on" by re-resolving the collection. Opaque cargo; `resolveTree`
 *  never inspects `item`, same as it never parses `ref`. */
export interface DataScope {
  item?: unknown;
  index?: number;
}

export interface Resolved {
  value: unknown;
  /** Shown as a "bound" chip by an editor UI — never used by `resolveTree` itself. */
  label?: string;
  /** `false` drops this node (and its subtree) from the resolved output — the
   *  one conditional-visibility primitive the engine supports, with no
   *  expression language attached. Defaults to `true`. */
  visible?: boolean;
}

export interface ResolveHost {
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[];
}

const EMPTY_SCOPE: DataScope = {};

/**
 * Walk `tree`, substituting `data:'value'` nodes with resolved values and
 * expanding `data:'collection'` nodes into one cloned child-set per resolved
 * item. Absent BOTH hooks → returns `tree` UNCHANGED (a static host never has
 * a reason to call this — zero cost). `action` nodes are never touched; they
 * stay inert markers for a host's own client-side wiring (§2 of the roadmap doc).
 */
export function resolveTree(tree: Node, host: ResolveHost, scope: DataScope = EMPTY_SCOPE): Node {
  if (!host.resolveBinding && !host.resolveCollection) return tree;
  return resolveNode(tree, host, scope) ?? tree;
}

/** Returns `undefined` when the node should be dropped (a `visible: false` bind). */
function resolveNode(node: Node, host: ResolveHost, scope: DataScope): Node | undefined {
  if (node.kind === "outlet") return node;

  if (node.data?.kind === "value" && host.resolveBinding) {
    const resolved = host.resolveBinding(node.data.ref, scope);
    if (resolved.visible === false) return undefined;
    const filled = fillValue(node, resolved.value, node.data.attr);
    const { data: _data, ...rest } = filled; // consumed — the resolved output carries no residual marker
    return { ...rest } as Node;
  }

  if (node.data?.kind === "collection" && host.resolveCollection) {
    const items = host.resolveCollection(node.data.ref, scope);
    const { data: _data, ...rest } = node;
    const children =
      items.length === 0
        ? // No items: the authored children render once, as the editor's own
          // "one placeholder item" convention (builder-contract.md §3).
          resolveChildren(node.children, host, scope)
        : items.flatMap((item, index) => resolveChildren(node.children, host, { item, index }));
    return { ...rest, children } as Node;
  }

  if (node.children) {
    return { ...node, children: resolveChildren(node.children, host, scope) };
  }
  return node;
}

function resolveChildren(children: Child[] | undefined, host: ResolveHost, scope: DataScope): Child[] {
  if (!children) return [];
  const out: Child[] = [];
  for (const child of children) {
    if (typeof child === "string") {
      out.push(child);
      continue;
    }
    const resolved = resolveNode(child, host, scope);
    if (resolved) out.push(resolved);
  }
  return out;
}

/**
 * Fill a node's content with a resolved value. With an explicit `attr`, the
 * value is written to exactly that attribute (element) or prop (component) —
 * e.g. a product card's own `<a>` binding `href` — instead of guessing. Absent
 * `attr`, PRIMARY-content auto-detection applies: text is the dominant case
 * (element children, a component's `label`/`text` prop); an `img`/`source`
 * element or a component that already carries a `src` prop treats a string
 * value as a source URL instead, and an `input` treats it as its `value`
 * attribute (its children never render — see below). This auto-detection is a
 * pragmatic default for the common shapes, not an exhaustive per-component-type
 * registry — `attr` is the escape hatch for anything it doesn't guess right.
 */
function fillValue(node: ElementNode | ComponentNode, value: unknown, attr?: string): ElementNode | ComponentNode {
  if (node.kind === "element") {
    if (attr) {
      const attrValue =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? value
          : String(value ?? "");
      return { ...node, attrs: { ...(node.attrs ?? {}), [attr]: attrValue } };
    }
    if ((node.tag === "img" || node.tag === "source") && typeof value === "string") {
      return { ...node, attrs: { ...(node.attrs ?? {}), src: value } };
    }
    // A form control's primary content IS its value, not its children — and for
    // a void element (input) children never reach the output at all (toHtml
    // drops them unconditionally), so writing there would silently vanish.
    if (node.tag === "input") {
      return { ...node, attrs: { ...(node.attrs ?? {}), value: String(value ?? "") } };
    }
    return { ...node, children: [String(value ?? "")] };
  }
  if (attr) {
    return { ...node, props: { ...(node.props ?? {}), [attr]: value } };
  }
  const props = { ...(node.props ?? {}) };
  if (typeof value === "string" && ("src" in props || node.component === "Image" || node.component === "Avatar")) {
    props.src = value;
  } else if ("label" in props) {
    props.label = String(value ?? "");
  } else {
    props.text = String(value ?? "");
  }
  return { ...node, props };
}
