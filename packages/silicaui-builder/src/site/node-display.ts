/**
 * Pure display helpers for a node — the layer glyph, the layer name, and a short
 * text hint. Shared by the Navigator (tree rows) and the Inspector (identity
 * header) so both name a node the same way. No JSX here — callers wrap the
 * IconName in <Icon>.
 */
import type { Node } from "@wizeworks/silicaui-html";
import { typeIcon } from "../shared/icons";
import type { IconName } from "../shared/icons";

/** Element-tag → glyph (component atoms resolve through `typeIcon`). */
const TAG_ICON: Record<string, IconName> = {
  section: "section",
  nav: "nav",
  header: "header",
  footer: "footer",
  main: "main",
  article: "article",
  aside: "aside",
  a: "link",
  img: "image",
  ul: "list",
  ol: "list",
  li: "item",
  form: "form",
  input: "input",
  label: "label",
  p: "text",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
};

/** The glyph representing a node's type. */
export function nodeIconName(node: Node): IconName {
  if (node.kind === "outlet") return "outlet";
  if (node.kind === "component") return typeIcon(node.component);
  return TAG_ICON[node.tag] ?? "box";
}

/** The row/header label: an explicit layer name, else the tag/component. */
export function nodeName(node: Node): string {
  if (node.kind === "outlet") return "Outlet";
  if (node.label) return node.label;
  return node.kind === "component" ? node.component : node.tag;
}

/** The node's editable text, if any: an element's string child or a component's label/text. */
export function editableText(node: Node): string | undefined {
  if (node.kind === "outlet") return undefined;
  if (node.kind === "element") {
    const child = node.children?.find((c): c is string => typeof c === "string");
    return child;
  }
  const label = node.props?.label ?? node.props?.text;
  return typeof label === "string" ? label : undefined;
}

/**
 * Whether a node can be edited in place on the canvas: it holds editable text
 * (an element string child, or a component label/text prop) AND has no element
 * children — so typing replaces plain text, never structure. Voids (img/hr/…)
 * hold no text and so never qualify.
 */
export function inlineEditable(node: Node): boolean {
  if (node.kind === "outlet") return false;
  if ((node.children ?? []).some((c) => typeof c !== "string")) return false;
  return editableText(node) !== undefined;
}

/** First bit of text content, truncated — a subtle hint of what a leaf holds. */
export function textHint(node: Node): string | undefined {
  const raw = editableText(node);
  if (!raw) return undefined;
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
}
