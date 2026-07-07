/**
 * The atom registry — how each silicaui component atom (`type: 'component'`)
 * renders to markup + classes. The shared contract behind `toHtml` (here),
 * `toReact` (codegen), and the builder canvas, so all three agree on what a
 * `Button` or `Image` node becomes. Unknown atoms throw at render time.
 *
 * Each atom receives its resolved class (prefix applied), its already-rendered
 * children, and the lowered system-metadata attributes (`metaAttrs`, e.g.
 * `data-sui-bind`), which it places on its root element.
 */
import type { ComponentNode } from "./schema";
import { attr, esc } from "./class-utils";

export interface AtomContext {
  node: ComponentNode;
  /** The node's class, with any prefix already applied. */
  cls: string;
  /** The node's children, already rendered to HTML. */
  childrenHtml: string;
  /** Lowered system metadata (data-sui-*), placed on the root element. */
  metaAttrs: string;
}

export type AtomRenderer = (ctx: AtomContext) => string;

const classAttr = (cls: string): string => (cls ? ` class="${cls}"` : "");

/** A simple element atom: one tag carrying class + children (or props.text). */
function elementAtom(tag: string): AtomRenderer {
  return ({ node, cls, childrenHtml, metaAttrs }) => {
    const text = node.props?.text;
    const inner = childrenHtml || (text != null ? esc(text) : "");
    return `<${tag}${classAttr(cls)}${metaAttrs}>${inner}</${tag}>`;
  };
}

/** Button — a `<button>`, or an `<a>` when given an `href`. */
const Button: AtomRenderer = ({ node, cls, childrenHtml, metaAttrs }) => {
  const label = node.props?.label;
  const inner = childrenHtml || (label != null ? esc(label) : "");
  const href = node.props?.href;
  if (href != null) {
    return `<a${classAttr(cls)}${attr("href", href)}${metaAttrs}>${inner}</a>`;
  }
  const type = node.props?.type ?? "button";
  return `<button${classAttr(cls)}${attr("type", type)}${metaAttrs}>${inner}</button>`;
};

const RATIO_CLASS: Record<string, string> = {
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

/** Image — a self-closing `<img>`; `ratio` maps to an aspect utility. */
const Image: AtomRenderer = ({ node, cls, metaAttrs }) => {
  const ratio = node.props?.ratio;
  const ratioClass = typeof ratio === "string" ? (RATIO_CLASS[ratio] ?? "") : "";
  const full = [cls, ratioClass].filter(Boolean).join(" ");
  return `<img${classAttr(full)}${attr("src", node.props?.src)}${attr(
    "alt",
    node.props?.alt ?? "",
  )}${attr("loading", "lazy")}${metaAttrs}/>`;
};

/** Heading — `<h1>`…`<h6>` from `props.level` (default 2). */
const Heading: AtomRenderer = ({ node, cls, childrenHtml, metaAttrs }) => {
  const raw = Number(node.props?.level ?? 2);
  const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 2;
  const text = node.props?.text;
  const inner = childrenHtml || (text != null ? esc(text) : "");
  return `<h${level}${classAttr(cls)}${metaAttrs}>${inner}</h${level}>`;
};

/** Icon — an inline `<span>` carrying its name for a runtime/icon font to resolve. */
const Icon: AtomRenderer = ({ node, cls, metaAttrs }) =>
  `<span${classAttr(cls)} aria-hidden="true"${attr(
    "data-icon",
    node.props?.name,
  )}${metaAttrs}></span>`;

/** Divider — a void `<hr>`. */
const Divider: AtomRenderer = ({ cls, metaAttrs }) =>
  `<hr${classAttr(cls)}${metaAttrs}/>`;

export const atoms: Record<string, AtomRenderer> = {
  Button,
  Image,
  Heading,
  Text: elementAtom("p"),
  Badge: elementAtom("span"),
  Card: elementAtom("div"),
  Section: elementAtom("section"),
  Container: elementAtom("div"),
  Grid: elementAtom("div"),
  Stack: elementAtom("div"),
  Icon,
  Divider,
};
