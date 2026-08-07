/**
 * Pure display helpers for a node — the layer glyph, the layer name, and a short
 * text hint. Shared by the Navigator (tree rows) and the Inspector (identity
 * header) so both name a node the same way. No JSX here — callers wrap the
 * IconName in <Icon>.
 *
 * One node kind can't be named from the document alone: a `host` node carries
 * only the host's allowlist key (`site.map`), and what it should READ as lives
 * in that host's `HostComponentDef`. So every helper here takes an optional
 * lookup into those defs. It stays a parameter rather than a module-level
 * registry because a shell can hold several editors on several hosts at once —
 * `useHostDisplay()` (host-context) is the React binding.
 */
import type { Node } from "@wizeworks/silicaui-html";
import { getComponent } from "@wizeworks/silicaui-html";
import { isIconName, typeIcon } from "../shared/icons";
import type { IconName } from "../shared/icons";

/** What a host declared about one of its components, narrowed to the fields the
 *  display layer reads (`HostComponentDef` structurally satisfies it). */
export interface HostNodeDisplay {
  label?: string;
  icon?: string;
}

/** Resolve a `host` node's component key to what the host registered for it. */
export type HostDisplayLookup = (component: string) => HostNodeDisplay | undefined;

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
  picture: "image",
  figure: "image",
  video: "video",
  audio: "play",
  iframe: "monitor",
  svg: "star",
  ul: "list",
  ol: "list",
  dl: "list",
  li: "item",
  dt: "item",
  dd: "item",
  form: "form",
  input: "input",
  textarea: "textarea",
  select: "select",
  label: "label",
  button: "button",
  fieldset: "form",
  table: "table",
  thead: "table",
  tbody: "table",
  tfoot: "table",
  tr: "columns",
  th: "item",
  td: "item",
  blockquote: "quote",
  hr: "divider",
  pre: "code",
  code: "code",
  details: "collapse",
  summary: "label",
  p: "text",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
};

/**
 * A bare `div` is the most common node in any document, so leaning on one glyph
 * for all of them turns the tree into a wall of identical cubes. The node's own
 * classes already say what it does — read them rather than guess.
 */
function layoutIcon(node: Node): IconName | undefined {
  if (node.kind === "outlet") return undefined;
  const classes = (node.class ?? "").split(/\s+/);
  if (classes.includes("grid")) return "grid";
  if (classes.includes("flex-col")) return "stack";
  if (classes.includes("flex")) return "columns";
  return undefined;
}

/** The glyph representing a node's type. */
export function nodeIconName(node: Node, hostDisplay?: HostDisplayLookup): IconName {
  if (node.kind === "outlet") return "outlet";
  if (node.kind === "host") {
    // The plug is the FALLBACK, not the answer: a host that picked a glyph for
    // its component gets it here as well as in the palette, or the row it just
    // inserted stops looking like the row it inserted it from.
    const declared = hostDisplay?.(node.component)?.icon;
    return declared && isIconName(declared) ? declared : "plug";
  }
  if (node.kind === "component") {
    // The registry already declares a glyph per component; `typeIcon` only
    // matches when the component name IS an icon name, so it misses anything
    // compound (`ClickableCard`, `AppShellSidebar` → "box").
    const declared = getComponent(node.component)?.icon;
    return declared && isIconName(declared) ? declared : typeIcon(node.component);
  }
  return TAG_ICON[node.tag] ?? layoutIcon(node) ?? "box";
}

/**
 * Element-tag → the word a non-technical author would use. Structure only —
 * the vocabulary stays domain-blind (no "product", "cart", "post"), because a
 * site builder that names things after one industry stops fitting every other.
 */
const TAG_LABEL: Record<string, string> = {
  header: "Header",
  footer: "Footer",
  nav: "Menu",
  main: "Content",
  section: "Section",
  article: "Article",
  aside: "Sidebar",
  div: "Group",
  span: "Text",
  p: "Text",
  strong: "Text",
  em: "Text",
  b: "Text",
  i: "Text",
  small: "Text",
  h1: "Heading",
  h2: "Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  h6: "Heading",
  a: "Link",
  button: "Button",
  img: "Image",
  picture: "Image",
  figure: "Figure",
  figcaption: "Caption",
  video: "Video",
  audio: "Audio",
  svg: "Icon",
  iframe: "Embed",
  ul: "List",
  ol: "List",
  dl: "List",
  li: "List item",
  dt: "List item",
  dd: "List item",
  table: "Table",
  thead: "Table",
  tbody: "Table",
  tfoot: "Table",
  tr: "Row",
  th: "Cell",
  td: "Cell",
  form: "Form",
  input: "Field",
  textarea: "Field",
  select: "Dropdown",
  label: "Field label",
  fieldset: "Field group",
  legend: "Field group label",
  blockquote: "Quote",
  hr: "Divider",
  pre: "Code",
  code: "Code",
  details: "Disclosure",
  summary: "Disclosure title",
};

/**
 * Turn a registry key into prose — `ProductGrid` → "Product grid",
 * `feature-media` → "Feature media". Runs of capitals stay together so an
 * acronym survives (`HTMLBlock` → "HTML block").
 *
 * The dot is a separator for the same reason the dash is: host allowlist keys
 * are conventionally namespaced (`site.map`), and treating the dot as prose
 * yields "Site.map" — visibly a key, in a rail that is meant to hold none.
 */
function humanize(key: string): string {
  const words = key
    .replace(/[-_.]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
    .split(/\s+/);
  return words
    .map((word, i) => {
      if (word === word.toUpperCase()) return word; // an acronym keeps its case
      return i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase();
    })
    .join(" ");
}

/**
 * The node's TYPE, in the words a business user would use — "Group", "Link",
 * "Menu", "List item" — never a raw tag or registry key. Components resolve
 * through the registry, whose `label` is documented as feeding exactly this.
 */
export function nodeTypeLabel(node: Node, hostDisplay?: HostDisplayLookup): string {
  if (node.kind === "outlet") return "Page content";
  if (node.kind === "host") {
    // The host's own registered label first: `site.map` is an allowlist key, and
    // no amount of prose-ing turns it into the words the host already wrote.
    // Nodes placed from the palette carry it as a `label` and never reach here;
    // ones a host authored programmatically do.
    return hostDisplay?.(node.component)?.label ?? humanize(node.component);
  }
  if (node.kind === "component") {
    return getComponent(node.component)?.label ?? humanize(node.component);
  }
  return TAG_LABEL[node.tag] ?? humanize(node.tag);
}

/** A node's identity: an explicit layer name, else what kind of thing it is. */
export function nodeName(node: Node, hostDisplay?: HostDisplayLookup): string {
  if (node.kind !== "outlet" && node.label) return node.label;
  return nodeTypeLabel(node, hostDisplay);
}

/**
 * The accessible name an element declares for itself. An icon-only control
 * holds no text, so without this a header's theme toggle and its menu toggle
 * are two rows both reading "Button" — and the markup already answers which is
 * which. Not a guess: `aria-label` IS this element's name, to a screen reader
 * and now to the author too.
 */
function declaredName(node: Node): string | undefined {
  if (node.kind !== "element") return undefined;
  const label = node.attrs?.["aria-label"];
  return typeof label === "string" && label.trim() ? label.trim() : undefined;
}

/**
 * The label for a Navigator row — the layer name if the author set one, else
 * the words the node actually holds, else the name it declares, else its type.
 * Content leads because that is what a person recognizes when scanning for "the
 * Pricing link"; the row's glyph already carries the type, so it is not
 * repeated as text.
 */
export function nodeRowLabel(node: Node, hostDisplay?: HostDisplayLookup): string {
  if (node.kind !== "outlet" && node.label) return node.label;
  return textHint(node) ?? truncate(declaredName(node)) ?? nodeTypeLabel(node, hostDisplay);
}

/** Row labels are one line in a narrow rail — keep them scannable. */
function truncate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.length > 32 ? `${raw.slice(0, 32)}…` : raw;
}

/** The node's editable text, if any: an element's string child or a component's label/text. */
export function editableText(node: Node): string | undefined {
  if (node.kind === "outlet") return undefined;
  // A host node's content IS its live component — never inline-editable text.
  if (node.kind === "host") return undefined;
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
  return truncate(editableText(node)?.trim());
}
