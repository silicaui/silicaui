/**
 * The HTML projection (architecture spec §4). Walks the one authored tree and
 * emits framework-free markup — the production renderer, and (by design) the
 * exact path the builder canvas renders through, so preview == production is
 * structural.
 *
 * System metadata is lowered here: `behavior`/`part`/`data` markers become
 * `data-sui-*` attributes a runtime (silicaui-behaviors) wires. `slot` markers
 * are builder metadata and stay inert in HTML (defaults render). With `ids: true`
 * each node's id is emitted as `data-sui-id` so the builder canvas can map DOM
 * back to nodes — off by default, so production output stays clean.
 */
import type {
  Child,
  ComponentNode,
  Document,
  ElementNode,
  Node,
  Template,
} from "./schema";
import { applyPrefix, attr, esc, VOID_ELEMENTS } from "./class-utils";
import { expandComponent } from "./component";

export interface ToHtmlOptions {
  /** Applied to silicaui component classes only (`btn` → `st-btn`). */
  prefix?: string;
  /** Emit `data-sui-id` for nodes that carry an id (builder canvas mapping). */
  ids?: boolean;
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
function metaAttrs(node: ElementNode | ComponentNode, opts: ToHtmlOptions): string {
  let out = "";
  if (opts.ids && node.id != null) out += attr("data-sui-id", node.id);
  const d = node.data;
  if (d) {
    if (d.kind === "value") out += attr("data-sui-bind", d.ref);
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
    return "<!--silicaui:outlet-->";
  }

  // A component is a macro: expand it to its element (sub)tree and render THAT
  // through the element path below. The expansion carries the source node's class
  // + system metadata, so preview == production and new components cost no branch.
  if (node.kind === "component") {
    return renderNode(expandComponent(node), opts);
  }

  // element
  const cls = node.class ? applyPrefix(node.class, opts.prefix ?? "") : "";
  const classAttr = cls ? ` class="${cls}"` : "";
  const attrsHtml = renderAttrs(node.attrs);
  const meta = metaAttrs(node, opts);
  if (VOID_ELEMENTS.has(node.tag)) {
    return `<${node.tag}${classAttr}${attrsHtml}${meta}/>`;
  }
  const childrenHtml = renderChildren(node.children, opts);
  return `<${node.tag}${classAttr}${attrsHtml}${meta}>${childrenHtml}</${node.tag}>`;
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
