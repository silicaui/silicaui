/**
 * The HTML projection (architecture spec §4). Walks the one authored tree and
 * emits framework-free markup — the production renderer, and (by design) the
 * exact path the builder canvas renders through, so preview == production is
 * structural.
 *
 * System metadata is lowered here: `behavior`/`part`/`data` markers become
 * `data-sui-*` attributes a runtime (@wizeworks/silicaui-behaviors) wires. `slot` markers
 * are builder metadata and stay inert in HTML (defaults render). With `ids: true`
 * each node's id is emitted as `data-sui-id` so the builder canvas can map DOM
 * back to nodes — off by default, so production output stays clean.
 */
import type {
  Child,
  ComponentNode,
  Document,
  ElementNode,
  HostNode,
  Node,
  Template,
} from "./schema";
import { applyPrefix, attr, esc, VOID_ELEMENTS } from "./class-utils";
import { expandComponent } from "./component";
import { sanitizeElement } from "./element";
import { type IconResolver, iconSvg } from "./icons";

export interface ToHtmlOptions {
  /** Applied to @wizeworks/silicaui component classes only (`btn` → `st-btn`). */
  prefix?: string;
  /** Emit `data-sui-id` for nodes that carry an id (builder canvas mapping). */
  ids?: boolean;
  /**
   * How `Icon` (`data-icon`) spans resolve to inline SVG on the published page.
   * Omitted → the bundled Lucide set (self-contained, no runtime/font needed).
   * A `Record<name, innerMarkup>` / resolver fn overrides it; `false` disables
   * inlining entirely, leaving the bare `<span data-icon>` for a host that
   * resolves icons its own way. Keeps the core icon-agnostic while defaulting
   * to preview == production.
   */
  icons?: IconResolver | false;
}

/** Render a node, template, or document to an HTML string. */
export function toHtml(
  input: Node | Template | Document,
  opts: ToHtmlOptions = {},
): string {
  const root: Node = "kind" in input ? input : input.root;
  return renderNode(root, opts);
}

/** Lower system metadata (ids, data bindings, behavior markers) to attributes. */
function metaAttrs(node: ElementNode | ComponentNode | HostNode, opts: ToHtmlOptions): string {
  let out = "";
  if (opts.ids && node.id != null) out += attr("data-sui-id", node.id);
  const d = node.data;
  if (d) {
    if (d.kind === "value") out += attr("data-sui-bind", d.ref);
    else if (d.kind === "html") out += attr("data-sui-html", d.ref);
    else if (d.kind === "collection") out += attr("data-sui-repeat", d.ref);
    else {
      out += attr("data-sui-action", d.ref);
      if (d.href != null) out += attr("href", d.href);
    }
  }
  if (node.behavior) {
    out += attr("data-sui-behavior", node.behavior.type);
    if (node.behavior.params) {
      out += attr("data-sui-behavior-params", JSON.stringify(node.behavior.params));
    }
  }
  if (node.part) out += attr("data-sui-part", node.part);
  return out;
}

function renderNode(node: Node, opts: ToHtmlOptions): string {
  if (node.kind === "outlet") {
    // Composed by a Frame (a builder concern). In a bare tree it's an inert marker.
    return "<!--@wizeworks/silicaui:outlet-->";
  }

  // A host node is a live-widget MOUNT POINT: emit an empty `<div data-sui-host>`
  // carrying the component key + author props (JSON). Never live framework code —
  // a host mounts its real component into this hook (client or SSR), the same
  // posture as `rawHtml`/behavior markers, so the projection stays framework-free.
  if (node.kind === "host") {
    const cls = node.class ? applyPrefix(node.class, opts.prefix ?? "") : "";
    const classAttr = cls ? ` class="${cls}"` : "";
    const hostAttr = attr("data-sui-host", node.component);
    const propsAttr =
      node.props && Object.keys(node.props).length
        ? attr("data-sui-host-props", JSON.stringify(node.props))
        : "";
    // `metaAttrs` last so a host node still maps to a canvas id / can carry its
    // own data/behavior marker if ever needed.
    return `<div${classAttr}${hostAttr}${propsAttr}${metaAttrs(node, opts)}></div>`;
  }

  // A component is a macro: expand it to its element (sub)tree and render THAT
  // through the element path below. The expansion carries the source node's class
  // + system metadata, so preview == production and new components cost no branch.
  if (node.kind === "component") {
    return renderNode(expandComponent(node), opts);
  }

  // element — sanitized against the raw-element/attribute floor (security
  // §, builder-contract.md §9) UNCONDITIONALLY, before anything else touches
  // tag/attrs. Not a host-optional policy.
  const { tag, attrs: safeAttrs } = sanitizeElement(node.tag, node.attrs);
  const cls = node.class ? applyPrefix(node.class, opts.prefix ?? "") : "";
  const classAttr = cls ? ` class="${cls}"` : "";
  const attrsHtml = renderAttrs(safeAttrs);
  const meta = metaAttrs(node, opts);
  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${classAttr}${attrsHtml}${meta}/>`;
  }
  // Trusted rich-text bind (`resolveTree` filled `rawHtml` from an `html` data
  // binding): emit it UNESCAPED as the inner content, replacing any children.
  // The host sanitized this at its data boundary — see NodeBase.rawHtml.
  if (node.rawHtml != null) {
    return `<${tag}${classAttr}${attrsHtml}${meta}>${node.rawHtml}</${tag}>`;
  }
  // Icon inlining: an empty `data-icon` span gets its glyph inlined from the
  // resolver, so a static page needs no icon runtime/font (`icons: false` opts
  // out). The SVG is trusted markup from our own/host-supplied map — emitted raw.
  const iconName =
    opts.icons !== false && !(node.children && node.children.length) && typeof safeAttrs?.["data-icon"] === "string"
      ? (safeAttrs["data-icon"] as string)
      : undefined;
  const iconMarkup = iconName != null ? iconSvg(iconName, opts.icons || undefined) : undefined;
  const childrenHtml = iconMarkup ?? renderChildren(node.children, opts);
  return `<${tag}${classAttr}${attrsHtml}${meta}>${childrenHtml}</${tag}>`;
}

function renderChildren(children: Child[] | undefined, opts: ToHtmlOptions): string {
  if (!children) return "";
  return children
    .map((c) => (typeof c === "string" ? esc(c) : renderNode(c, opts)))
    .join("");
}

function renderAttrs(
  attrs: Record<string, string | number | boolean> | undefined,
): string {
  if (!attrs) return "";
  return Object.entries(attrs)
    .map(([k, v]) => attr(k, v))
    .join("");
}
