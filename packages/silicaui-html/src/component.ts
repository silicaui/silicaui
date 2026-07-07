/**
 * The component registry (architecture spec §4) — the SINGLE definition each
 * silicaui component derives from, and the spine that lets the catalog grow to
 * "lots more" without a renderer edit per component.
 *
 * A component is a MACRO: atomic in the node tree (you select the `Button`, not
 * its inner text), but at render time it EXPANDS to an element (sub)tree that
 * every projection — `toHtml` here, and the builder canvas — renders through its
 * normal ELEMENT path. So a brand-new component ships zero new renderer branches
 * anywhere; it only declares which elements it lowers to.
 *
 * `expand(node)` is pure (Node in, Node out). Its root MUST carry the source
 * node's class + system metadata (id/data/behavior/part), so the lowered element
 * emits the exact same classes + `data-sui-*` attributes the component would —
 * `lower()` does this correctly, so defs should always build through it.
 */
import type { Child, ComponentNode, ElementNode, Node } from "./schema";

export interface ComponentDef {
  /** The key as it appears in `ComponentNode.component` (e.g. 'Button'). */
  name: string;
  /** Palette grouping for hosts: 'layout' | 'content' | 'media' | 'form' | … */
  category: string;
  /** Human label for palette rows + the Navigator. */
  label: string;
  /** Icon NAME a host resolves to a glyph (the builder maps it to inline SVG). */
  icon: string;
  /**
   * Whether this component holds child nodes (a layout/wrapper) rather than being
   * a leaf. Drives a host's insert-INSIDE vs insert-BESIDE choice — the builder
   * derives its container set from this flag instead of hand-listing names, so a
   * new container component needs no engine edit. Render-neutral (no effect on
   * `expand()`/toHtml).
   */
  container?: boolean;
  /**
   * Lower this component node to an element (sub)tree. Pure. The returned root
   * carries the source node's class + system metadata so projections emit
   * identical markup — build it with `lower()`.
   */
  expand: (node: ComponentNode) => Node;
}

/** `ratio` prop → the aspect utility an Image wears. */
const RATIO_CLASS: Record<string, string> = {
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

interface LowerOpts {
  /** Class override. When omitted, the source node's own class is inherited;
   *  when the key is present (even `""`), it REPLACES it (Image needs this). */
  class?: string;
  attrs?: ElementNode["attrs"];
  children?: Child[];
}

/**
 * Build a component's expansion root: an element that inherits the source node's
 * class + every system-metadata marker, so the lowered element is byte-for-byte
 * indistinguishable from a hand-authored one (same class tokens for the prefixer,
 * same `data-sui-*` lowering). This is what makes "component = element subtree"
 * transparent to the projections.
 */
function lower(node: ComponentNode, tag: string, opts: LowerOpts = {}): ElementNode {
  const out: ElementNode = { kind: "element", tag };
  const cls = "class" in opts ? opts.class : node.class;
  if (cls) out.class = cls;
  if (opts.attrs) out.attrs = opts.attrs;
  if (opts.children && opts.children.length) out.children = opts.children;
  // Carry identity + system metadata verbatim (HTML lowering reads these).
  if (node.id != null) out.id = node.id;
  if (node.label != null) out.label = node.label;
  if (node.slot) out.slot = node.slot;
  if (node.data) out.data = node.data;
  if (node.behavior) out.behavior = node.behavior;
  if (node.part) out.part = node.part;
  return out;
}

/**
 * Children for a text-bearing atom: its real children if any, else its text-like
 * prop lowered to a lone string child (the element path escapes it, matching the
 * old atom's `esc(text)`). Mirrors `childrenHtml || text` for every real input.
 */
function textChildren(node: ComponentNode, key: string): Child[] | undefined {
  if (node.children && node.children.length) return node.children;
  const text = node.props?.[key];
  return text != null ? [String(text)] : undefined;
}

/**
 * Pull the whitelisted form attributes a control carries from its props onto a
 * base attr set. Values pass RAW (cast) so `attr()`'s boolean/omit semantics match
 * a hand-authored element exactly. The whitelist is intentionally the lowercase
 * HTML attribute names the inspector/palette set — casing that React also accepts
 * (`name`/`required`/`disabled`/`rows`), so the same attrs render clean on the
 * builder canvas without a DOM-property warning.
 */
function formAttrs(
  node: ComponentNode,
  base: NonNullable<ElementNode["attrs"]>,
  keys: readonly string[],
): NonNullable<ElementNode["attrs"]> {
  const out: NonNullable<ElementNode["attrs"]> = { ...base };
  const props = node.props ?? {};
  for (const k of keys) {
    const v = props[k];
    if (v != null) out[k] = v as string | number | boolean;
  }
  return out;
}

/** Text-bearing form controls (value optional; canvas lowers value→defaultValue). */
const FIELD_KEYS = ["name", "placeholder", "value", "required", "disabled"] as const;
/** Selectable controls — checkbox/radio/toggle. */
const CHECK_KEYS = ["name", "value", "checked", "required", "disabled"] as const;

/** One `props.options` entry → an `<option>` element child of a Select. */
function toOption(opt: unknown): Child {
  if (opt != null && typeof opt === "object") {
    const o = opt as { value?: unknown; label?: unknown };
    const label = o.label != null ? String(o.label) : String(o.value ?? "");
    const node: ElementNode = { kind: "element", tag: "option", children: [label] };
    if (o.value != null) node.attrs = { value: String(o.value) };
    return node;
  }
  const s = String(opt);
  return { kind: "element", tag: "option", children: [s] };
}

/** A plain element atom: one tag carrying class + (children | text prop). */
function elementDef(
  name: string,
  category: string,
  icon: string,
  tag: string,
  container = false,
): ComponentDef {
  return {
    name,
    category,
    label: name,
    icon,
    container,
    expand: (n) => lower(n, tag, { children: textChildren(n, "text") }),
  };
}

/** The built-in components — the 12 original atoms, now registry-driven. */
export const BUILTIN_COMPONENTS: ComponentDef[] = [
  // Button — a <button>, or an <a> when it carries an href; label is text sugar.
  {
    name: "Button",
    category: "content",
    label: "Button",
    icon: "button",
    expand: (n) => {
      const children =
        n.children && n.children.length
          ? n.children
          : n.props?.label != null
            ? [String(n.props.label)]
            : undefined;
      const href = n.props?.href;
      if (href != null) return lower(n, "a", { attrs: { href: href as string }, children });
      const type = (n.props?.type ?? "button") as string;
      return lower(n, "button", { attrs: { type }, children });
    },
  },
  // Image — a self-closing <img>; `ratio` maps to an aspect utility appended to
  // the class, then the whole string is prefixed as normal.
  {
    name: "Image",
    category: "media",
    label: "Image",
    icon: "image",
    expand: (n) => {
      const ratio = n.props?.ratio;
      const ratioClass = typeof ratio === "string" ? RATIO_CLASS[ratio] ?? "" : "";
      const full = [n.class, ratioClass].filter(Boolean).join(" ");
      const attrs: NonNullable<ElementNode["attrs"]> = {};
      if (n.props?.src != null) attrs.src = n.props.src as string;
      attrs.alt = (n.props?.alt ?? "") as string;
      attrs.loading = "lazy";
      return lower(n, "img", { class: full, attrs });
    },
  },
  // Heading — <h1>…<h6> from props.level (default 2, clamped).
  {
    name: "Heading",
    category: "content",
    label: "Heading",
    icon: "heading",
    expand: (n) => {
      const raw = Number(n.props?.level ?? 2);
      const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 2;
      return lower(n, `h${level}`, { children: textChildren(n, "text") });
    },
  },
  // Icon — an inline <span> carrying its name for a runtime/icon font to resolve.
  {
    name: "Icon",
    category: "content",
    label: "Icon",
    icon: "box",
    expand: (n) => {
      const attrs: NonNullable<ElementNode["attrs"]> = { "aria-hidden": "true" };
      if (n.props?.name != null) attrs["data-icon"] = n.props.name as string;
      return lower(n, "span", { attrs });
    },
  },
  // Divider — a void <hr>.
  { name: "Divider", category: "content", label: "Divider", icon: "box", expand: (n) => lower(n, "hr") },

  // ── form controls ─────────────────────────────────────────────────────────
  // Each lowers to a native form element, so the browser's built-in behavior +
  // accessibility come for free and the Phase 2 form contract wires the same tags.
  // Input — a single-line <input>; props.type picks the mode (default 'text').
  {
    name: "Input",
    category: "form",
    label: "Input",
    icon: "input",
    expand: (n) =>
      lower(n, "input", {
        attrs: formAttrs(n, { type: (n.props?.type ?? "text") as string }, FIELD_KEYS),
      }),
  },
  // Textarea — a multi-line <textarea>; text/children are its value.
  {
    name: "Textarea",
    category: "form",
    label: "Textarea",
    icon: "textarea",
    expand: (n) =>
      lower(n, "textarea", {
        attrs: formAttrs(n, {}, [...FIELD_KEYS, "rows"]),
        children: textChildren(n, "text"),
      }),
  },
  // Select — a native <select>; options come from props.options (or child nodes).
  {
    name: "Select",
    category: "form",
    label: "Select",
    icon: "select",
    expand: (n) => {
      const raw = n.props?.options;
      const opts = Array.isArray(raw) ? raw.map(toOption) : [];
      const children = n.children && n.children.length ? n.children : opts;
      return lower(n, "select", {
        attrs: formAttrs(n, {}, ["name", "required", "disabled"]),
        children,
      });
    },
  },
  // Checkbox / Radio / Toggle — native <input>s of the matching type. Toggle shares
  // checkbox semantics; only its class (`toggle`) makes it a switch.
  {
    name: "Checkbox",
    category: "form",
    label: "Checkbox",
    icon: "checkbox",
    expand: (n) => lower(n, "input", { attrs: formAttrs(n, { type: "checkbox" }, CHECK_KEYS) }),
  },
  {
    name: "Radio",
    category: "form",
    label: "Radio",
    icon: "radio",
    expand: (n) => lower(n, "input", { attrs: formAttrs(n, { type: "radio" }, CHECK_KEYS) }),
  },
  {
    name: "Toggle",
    category: "form",
    label: "Toggle",
    icon: "toggle",
    expand: (n) => lower(n, "input", { attrs: formAttrs(n, { type: "checkbox" }, CHECK_KEYS) }),
  },

  // Simple element atoms.
  elementDef("Text", "content", "text", "p"),
  elementDef("Badge", "content", "label", "span"),
  elementDef("Card", "layout", "box", "div", true),
  elementDef("Section", "layout", "section", "section", true),
  elementDef("Container", "layout", "box", "div", true),
  elementDef("Grid", "layout", "grid", "div", true),
  elementDef("Stack", "layout", "stack", "div", true),
  // Field / Form — form containers (hold label+control / fields+submit as children).
  elementDef("Field", "form", "label", "div", true),
  elementDef("Form", "form", "form", "form", true),
];

// ── registry ────────────────────────────────────────────────────────────────

const registry = new Map<string, ComponentDef>();

/** Register (or replace) a component definition. Built-ins register at load. */
export function registerComponent(def: ComponentDef): void {
  registry.set(def.name, def);
}

/** Look up a component definition by name. */
export function getComponent(name: string): ComponentDef | undefined {
  return registry.get(name);
}

/** Every registered component, in registration order. */
export function listComponents(): ComponentDef[] {
  return [...registry.values()];
}

/**
 * Lower a component node to its element expansion. Throws (with the atom-registry
 * message projections have always used) if the component is unregistered.
 */
export function expandComponent(node: ComponentNode): Node {
  const def = registry.get(node.component);
  if (!def) {
    throw new Error(
      `Unknown silicaui atom: "${node.component}". Register it in the atom registry.`,
    );
  }
  return def.expand(node);
}

for (const def of BUILTIN_COMPONENTS) registerComponent(def);
