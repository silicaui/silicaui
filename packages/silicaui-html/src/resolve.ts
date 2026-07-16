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
 * `toHtml(resolveTree(root, host))`) and a canvas's own React walk (via
 * `{ editing: true }`) — one resolution primitive, so preview == production is
 * structural, not hoped-for.
 *
 * HONEST BY CONSTRUCTION: the hooks distinguish "I don't know this ref"
 * (`undefined`) from "I know it and it's empty" (`{ value: undefined }`). The
 * former keeps the node's authored content and reports a diagnostic; only the
 * latter renders empty. See data-resolution-and-brand-mark.md §A.
 */
import { getComponent } from "./component";
import type { Child, ComponentNode, DataBinding, ElementNode, Node } from "./schema";

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

/**
 * A structured report of something the walk could not do. Emitted through
 * `ResolveHost.onDiagnostic`; the core NEVER writes to `console` itself (it is a
 * pure, synchronous walker that may run per-render on a server — a warn-per-node
 * would be a log-noise and perf hazard we could never take back). Loudness is
 * the consumer's call: the builder badges the node, a publish pipeline can throw.
 */
export interface ResolveDiagnostic {
  /** `unknown-ref` — the host returned `undefined` for a ref it was asked about
   *  (a typo, a stale document, a catalog entry its resolver doesn't implement).
   *  `hidden` — an `editing` walk kept a `visible: false` node that production
   *  would have dropped, so an editor can render it ghosted.
   *  Additive union; new codes are non-breaking. */
  code: "unknown-ref" | "hidden";
  ref: string;
  /** The bound node's id, so an editor can badge / jump to the exact node. */
  nodeId?: string;
  kind: DataBinding["kind"];
}

export interface ResolveHost {
  /** Resolve `ref` to a value. Return `undefined` — NOT `{ value: undefined }` —
   *  when the ref is UNKNOWN to this host. The two are different states and the
   *  walk treats them differently: an unknown ref keeps the node's AUTHORED
   *  content and reports a diagnostic; a KNOWN ref whose value is empty renders
   *  empty, which is a legitimate result. Without that distinction the walk
   *  cannot be honest — it blanks the node either way. */
  resolveBinding?(ref: string, scope: DataScope): Resolved | undefined;
  /** `undefined` = unknown ref (authored children stay, diagnostic fires). An
   *  empty array = a KNOWN, legitimately-empty collection (the placeholder
   *  convention / `omitWhenEmpty` apply). */
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[] | undefined;
  /** Absent → the walk is silent (pure; a static publish path pays nothing). */
  onDiagnostic?(d: ResolveDiagnostic): void;
}

export interface ResolveOptions {
  /**
   * EDIT-MODE policy. The canvas resolves the same refs through the same host,
   * but never destroys authorability: a `visible: false` node is ANNOTATED via
   * `onDiagnostic` rather than dropped, because a dropped node cannot be
   * selected, inspected, or un-bound — it just vanishes on the author.
   *
   * This is a DESTRUCTION policy, not a second resolver: same walker, same
   * hooks, same refs. It diverges only where production's answer is "show
   * nothing", which is not an answer an editor can render.
   *
   * Absent/false → production policy, byte-identical to a pre-`editing` walk.
   */
  editing?: boolean;
}

const EMPTY_SCOPE: DataScope = {};
const NO_OPTS: ResolveOptions = {};

/**
 * Walk `tree`, substituting `data:'value'` nodes with resolved values and
 * expanding `data:'collection'` nodes into one cloned child-set per resolved
 * item. Absent BOTH hooks → returns `tree` UNCHANGED (a static host never has
 * a reason to call this — zero cost). `action` nodes are never touched; they
 * stay inert markers for a host's own client-side wiring (§2 of the roadmap doc).
 */
export function resolveTree(
  tree: Node,
  host: ResolveHost,
  scope: DataScope = EMPTY_SCOPE,
  opts: ResolveOptions = NO_OPTS,
): Node {
  if (!host.resolveBinding && !host.resolveCollection) return tree;
  return resolveNode(tree, host, scope, opts) ?? tree;
}

/**
 * An UNKNOWN ref (host returned `undefined`): keep the node exactly as authored
 * — marker included, so a downstream runtime or a re-resolve against a fixed
 * catalog still sees the bind — and report. The authored content IS the
 * fallback; that is why no `DataBinding.fallback` field exists.
 *
 * This is the same thing `resolveTree` already does when a host supplies no
 * hooks at all (see above): we extend a tested behavior from all-or-nothing to
 * per-ref, rather than inventing a policy. Crucially it never DROPS the node —
 * "I don't know this ref" and "hide this node" are different answers and must
 * not collide.
 */
function unknownRef<T extends ElementNode | ComponentNode>(
  node: T,
  host: ResolveHost,
  ref: string,
  kind: DataBinding["kind"],
): T {
  host.onDiagnostic?.({ code: "unknown-ref", ref, nodeId: node.id, kind });
  return node;
}

/** Returns `undefined` when the node should be dropped (a `visible: false` bind
 *  under production policy; an `editing` walk never drops). */
function resolveNode(node: Node, host: ResolveHost, scope: DataScope, opts: ResolveOptions): Node | undefined {
  if (node.kind === "outlet") return node;
  // A host node is an opaque leaf: its props are static (v1) and it has no
  // children, so there is nothing to resolve — pass it through untouched.
  if (node.kind === "host") return node;

  if (node.data?.kind === "value" && host.resolveBinding) {
    const resolved = host.resolveBinding(node.data.ref, scope);
    if (!resolved) return unknownRef(node, host, node.data.ref, "value");
    if (resolved.visible === false) {
      if (!opts.editing) return undefined;
      host.onDiagnostic?.({ code: "hidden", ref: node.data.ref, nodeId: node.id, kind: "value" });
      return node;
    }
    const filled = fillValue(node, resolved.value, node.data.attr);
    const { data: _data, ...rest } = filled; // consumed — the resolved output carries no residual marker
    return { ...rest } as Node;
  }

  // A TRUSTED-HTML bind (rich text / CMS long-form). The resolved value — which
  // the HOST sanitizes at its data boundary — becomes `rawHtml`, emitted unescaped
  // by `toHtml` in place of any authored children. (Outlets already returned
  // above.) A component node keeps the marker on itself and `lower()` carries
  // `rawHtml` to its expansion element.
  if (node.data?.kind === "html" && host.resolveBinding) {
    const resolved = host.resolveBinding(node.data.ref, scope);
    // Never emit `rawHtml: ""` for a ref we couldn't resolve — that would blank
    // the node AND consume the marker, destroying the authored children twice over.
    if (!resolved) return unknownRef(node, host, node.data.ref, "html");
    if (resolved.visible === false) {
      if (!opts.editing) return undefined;
      host.onDiagnostic?.({ code: "hidden", ref: node.data.ref, nodeId: node.id, kind: "html" });
      return node;
    }
    const { data: _data, children: _children, ...rest } = node;
    return { ...rest, rawHtml: String(resolved.value ?? "") } as Node;
  }

  if (node.data?.kind === "collection" && host.resolveCollection) {
    const items = host.resolveCollection(node.data.ref, scope);
    if (!items) return unknownRef(node, host, node.data.ref, "collection");
    if (opts.editing) {
      // Editing: report, then hand back the AUTHORED template untouched — no
      // expansion, and deliberately no resolution of the subtree either.
      //
      // No expansion, because cloning children clones their `id`s, and an editor
      // keys selection (and React) off those — ten products would mean ten nodes
      // claiming one id. That wants the per-item identity design symbol instances
      // already solved, not a parallel one invented here.
      //
      // No subtree resolution, because without an item there IS no scope: a
      // nested `product.title` would resolve against `{}`, come back
      // legitimately empty, and blank the very placeholder the author is trying
      // to lay out. Leaving the template authored is the honest answer — the
      // same one the Inspector's preview row already gives ("no preview — this
      // is nested inside a repeat, one per item").
      if (items.length === 0 && node.data.omitWhenEmpty) {
        // Production would drop this entirely; say so, so the editor can ghost it.
        host.onDiagnostic?.({ code: "hidden", ref: node.data.ref, nodeId: node.id, kind: "collection" });
      }
      return node;
    }
    // `omitWhenEmpty` deliberately does NOT apply to an unknown ref (handled
    // above): it means "this collection is legitimately empty, render nothing" —
    // a claim only a host that KNOWS the ref is in a position to make.
    if (items.length === 0 && node.data.omitWhenEmpty) return undefined;
    const { data: _data, ...rest } = node;
    const children =
      items.length === 0
        ? // No items: the authored children render once, as the editor's own
          // "one placeholder item" convention (builder-contract.md §3) — unless
          // `omitWhenEmpty` opted out above, dropping the node entirely instead.
          resolveChildren(node.children, host, scope, opts)
        : items.flatMap((item, index) => resolveChildren(node.children, host, { item, index }, opts));
    return { ...rest, children } as Node;
  }

  if (node.children) {
    return { ...node, children: resolveChildren(node.children, host, scope, opts) };
  }
  return node;
}

function resolveChildren(
  children: Child[] | undefined,
  host: ResolveHost,
  scope: DataScope,
  opts: ResolveOptions,
): Child[] {
  if (!children) return [];
  const out: Child[] = [];
  for (const child of children) {
    if (typeof child === "string") {
      out.push(child);
      continue;
    }
    const resolved = resolveNode(child, host, scope, opts);
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
 * attribute (its children never render — see below).
 *
 * For a COMPONENT node the target is the def's declared `ComponentDef.primary`
 * — the component says what its primary content is, rather than this function
 * sniffing for a `src` prop and guessing. That sniff was actively harmful: any
 * component with an optional `src` (a Wordmark carrying a logo, say) would take
 * a bound NAME into its image URL. Absent a declaration, `label` then `text`.
 *
 * Element auto-detection stays tag-driven (principled: an `img` IS its `src`).
 * `attr` remains the escape hatch for anything undeclared.
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
  const primary = getComponent(node.component)?.primary;
  if (primary) {
    // A declared primary of `src` (Image/Avatar) takes a string URL as-is;
    // anything else is text-shaped and stringifies, matching the fallbacks.
    props[primary] = primary === "src" && typeof value === "string" ? value : String(value ?? "");
  } else if ("label" in props) {
    props.label = String(value ?? "");
  } else {
    props.text = String(value ?? "");
  }
  return { ...node, props };
}
