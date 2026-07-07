/**
 * The insert catalog — what the Insert palette can add to the canvas. Two tiers:
 * PRIMITIVES (bare elements/atoms authored with the silicaui-html kit) and BLOCKS
 * (composed, validated templates from `silicaui-html/blocks`). Each entry is a
 * pure factory returning an id-free `Node`; the engine stamps fresh ids on insert,
 * so returning a shared block root is safe (it's deep-cloned first).
 *
 * STYLING RULE (hard): every class here is a LITERAL string so the harness's
 * `@source` scan safelists the utilities a freshly-inserted node wears — same rule
 * as the Inspector and Canvas. A class assembled at runtime would never generate.
 */
import type { Node } from "silicaui-html";
import { atom, el } from "silicaui-html";
import { listBlocks } from "silicaui-html/blocks";
import type { IconName } from "./icons";

export interface PaletteItem {
  /** Stable identity for the row (and the drag payload). */
  key: string;
  label: string;
  icon: IconName;
  /** A one-line description, shown under blocks. */
  hint?: string;
  /** Build a fresh, id-free node to insert. */
  make: () => Node;
}

export interface PaletteGroup {
  key: string;
  label: string;
  items: PaletteItem[];
}

/** Structural primitives — the containers a layout is built from. */
const LAYOUT: PaletteItem[] = [
  { key: "section", label: "Section", icon: "section", make: () => el("section", "@container px-6 py-12") },
  { key: "container", label: "Container", icon: "box", make: () => el("div", "mx-auto w-full max-w-5xl px-4") },
  { key: "stack", label: "Stack", icon: "stack", make: () => el("div", "flex flex-col gap-4") },
  { key: "row", label: "Row", icon: "layout", make: () => el("div", "flex flex-row items-center gap-4") },
  { key: "grid", label: "Grid", icon: "grid", make: () => el("div", "grid grid-cols-1 @2xl:grid-cols-3 gap-6") },
];

/** Content primitives — the leaves that carry copy, media, and actions. */
const CONTENT: PaletteItem[] = [
  {
    key: "heading",
    label: "Heading",
    icon: "heading",
    make: () => el("h2", "text-2xl font-semibold text-base-content", { text: "Heading" }),
  },
  {
    key: "text",
    label: "Text",
    icon: "text",
    make: () => el("p", "text-base text-base-content/70", { text: "Body text. Edit me in the inspector." }),
  },
  { key: "button", label: "Button", icon: "button", make: () => atom("Button", "btn btn-primary", { label: "Button" }) },
  {
    key: "image",
    label: "Image",
    icon: "image",
    make: () => atom("Image", "rounded-box w-full", { ratio: "wide", alt: "" }),
  },
  { key: "badge", label: "Badge", icon: "label", make: () => atom("Badge", "badge badge-primary", { text: "Badge" }) },
  { key: "link", label: "Link", icon: "link", make: () => el("a", "link link-primary", { text: "Link", attrs: { href: "#" } }) },
  { key: "divider", label: "Divider", icon: "box", make: () => atom("Divider", "divider") },
];

/**
 * Form primitives — native controls (Input/Select/Checkbox/…) as component atoms,
 * so they carry the form-contract wiring the runtime hydrates. Every class is a
 * LITERAL silicaui component class (`input`, `field`, …) for the `@source` safelist.
 */
const FORM: PaletteItem[] = [
  {
    key: "field",
    label: "Field",
    icon: "label",
    hint: "Label + input, wired together",
    make: () =>
      atom("Field", "field", undefined, [
        el("label", "field-label", { text: "Label" }),
        atom("Input", "input", { type: "text", placeholder: "Enter a value…" }),
      ]),
  },
  { key: "input", label: "Input", icon: "input", make: () => atom("Input", "input", { type: "text", placeholder: "Enter text…" }) },
  { key: "textarea", label: "Textarea", icon: "textarea", make: () => atom("Textarea", "textarea", { placeholder: "Enter text…", rows: 3 }) },
  {
    key: "select",
    label: "Select",
    icon: "select",
    make: () =>
      atom("Select", "select", {
        options: [
          { value: "1", label: "Option 1" },
          { value: "2", label: "Option 2" },
          { value: "3", label: "Option 3" },
        ],
      }),
  },
  { key: "checkbox", label: "Checkbox", icon: "checkbox", make: () => atom("Checkbox", "checkbox", { name: "checkbox" }) },
  { key: "radio", label: "Radio", icon: "radio", make: () => atom("Radio", "radio", { name: "radio" }) },
  { key: "toggle", label: "Toggle", icon: "toggle", make: () => atom("Toggle", "toggle", { name: "toggle" }) },
  {
    key: "form",
    label: "Form",
    icon: "form",
    hint: "A field + submit button",
    make: () =>
      atom("Form", "flex flex-col gap-4", undefined, [
        atom("Field", "field", undefined, [
          el("label", "field-label", { text: "Email" }),
          atom("Input", "input", { type: "email", name: "email", placeholder: "you@example.com" }),
        ]),
        atom("Button", "btn btn-primary", { label: "Submit", type: "submit" }),
      ]),
  },
];

/** Block category → the palette glyph representing it. */
const BLOCK_ICON: Record<string, IconName> = {
  hero: "layout",
  features: "grid",
  faq: "list",
};

/** The composed blocks, read live from the validated catalog. */
function blockItems(): PaletteItem[] {
  return listBlocks().map((b) => ({
    key: `block:${b.key}`,
    // Block names read "Short — long description"; keep the short half for the row.
    label: b.name.split(" — ")[0] ?? b.name,
    icon: BLOCK_ICON[b.category] ?? "box",
    hint: b.description,
    make: () => b.root, // shared root; the engine deep-clones + stamps on insert
  }));
}

/** The full grouped catalog for the Insert panel. */
export function paletteGroups(): PaletteGroup[] {
  return [
    { key: "layout", label: "Layout", items: LAYOUT },
    { key: "content", label: "Content", items: CONTENT },
    { key: "form", label: "Form", items: FORM },
    { key: "blocks", label: "Blocks", items: blockItems() },
  ];
}

/** Resolve a palette item by its key — the drop target decodes a drag this way. */
export function paletteItemByKey(key: string): PaletteItem | undefined {
  for (const group of paletteGroups()) {
    const hit = group.items.find((i) => i.key === key);
    if (hit) return hit;
  }
  return undefined;
}
