/**
 * The email insert catalog — every block the Palette can add to the canvas. Each
 * entry is a pure factory returning a fresh `EmailNode` (the `id` is a
 * placeholder; `EmailEditor.insert` stamps a real one). Unlike the site
 * palette, this catalog is small and CLOSED — it mirrors `schema.ts`'s fixed
 * vocabulary exactly, one entry per insertable kind, plus the few presets where
 * the bare kind isn't useful to insert on its own: 2/3/4 columns (a "columns"
 * block with zero columns), the outline button, and the linked card (a `link`
 * group already holding the image/title/price it exists to link).
 * `make` takes the current brand color defaults (`editor.colorDefaults`)
 * so a newly-inserted Button/Text/Divider lands on-brand rather than on a
 * generic neutral gray.
 */
import type { IconName } from "../shared/icons";
import { DEFAULT_EMAIL_COLORS } from "./schema";
import type { ColumnNode, ColumnsNode, EmailColorDefaults, EmailNode } from "./schema";

export interface EmailPaletteItem {
  key: string;
  label: string;
  hint: string;
  icon: IconName;
  make: (colors?: EmailColorDefaults) => EmailNode;
}

function column(widthPct: number): ColumnNode {
  return { id: "x", kind: "column", widthPct, children: [] };
}

function columns(widths: number[]): ColumnsNode {
  return { id: "x", kind: "columns", stackOnMobile: true, children: widths.map(column) };
}

export const EMAIL_PALETTE: EmailPaletteItem[] = [
  {
    key: "section",
    label: "Section",
    hint: "A full-width row — the top-level building block",
    icon: "section",
    make: (c = DEFAULT_EMAIL_COLORS) => ({ id: "x", kind: "section", bg: c.base100, bgAuto: true, paddingX: 24, paddingY: 24, children: [] }),
  },
  {
    key: "columns-2",
    label: "2 columns",
    hint: "An even two-column row",
    icon: "columns",
    make: () => columns([50, 50]),
  },
  {
    key: "columns-3",
    label: "3 columns",
    hint: "An even three-column row",
    icon: "columns",
    make: () => columns([33.33, 33.33, 33.34]),
  },
  {
    key: "columns-4",
    label: "4 columns",
    hint: "An even four-column row",
    icon: "columns",
    make: () => columns([25, 25, 25, 25]),
  },
  {
    key: "link",
    label: "Link group",
    hint: "One destination for the blocks inside — bind it per item to link a repeated card",
    icon: "link",
    make: () => ({ id: "x", kind: "link", href: "", children: [] }),
  },
  {
    key: "link-card",
    label: "Linked card",
    hint: "Image + title + price, all pointing at one URL — the product/article card",
    icon: "link",
    // The shape a `link` group exists for, pre-assembled. Inserting the bare
    // group and then three children in the right order is the same document,
    // four steps later — and getting the nesting wrong (children as SIBLINGS of
    // the link rather than inside it) is the one mistake that produces an
    // unlinked card with no visible symptom on canvas.
    make: (c = DEFAULT_EMAIL_COLORS) => ({
      id: "x",
      kind: "link",
      href: "",
      children: [
        { id: "x", kind: "image", src: "", alt: "", width: 240, align: "left" },
        {
          id: "x",
          kind: "text",
          html: "Product name",
          align: "left",
          color: c.baseContent,
          colorAuto: true,
          fontSize: 16,
          fontWeight: "semibold",
          lineHeight: 24,
        },
        {
          id: "x",
          kind: "text",
          html: "$00.00",
          align: "left",
          color: c.baseContent,
          colorAuto: true,
          fontSize: 14,
          fontWeight: "normal",
          lineHeight: 20,
        },
      ],
    }),
  },
  {
    key: "text",
    label: "Text",
    hint: "A paragraph of copy",
    icon: "text",
    make: (c = DEFAULT_EMAIL_COLORS) => ({
      id: "x",
      kind: "text",
      html: "Write something…",
      align: "left",
      color: c.baseContent,
      colorAuto: true,
      fontSize: 16,
      fontWeight: "normal",
      lineHeight: 24,
    }),
  },
  {
    key: "image",
    label: "Image",
    hint: "A hosted image, optionally linked",
    icon: "image",
    make: () => ({ id: "x", kind: "image", src: "", alt: "", width: 300, align: "center" }),
  },
  {
    key: "button",
    label: "Button",
    hint: "A bulletproof call-to-action link",
    icon: "button",
    make: (c = DEFAULT_EMAIL_COLORS) => ({
      id: "x",
      kind: "button",
      label: "Shop now",
      href: "",
      bg: c.primary,
      bgAuto: true,
      color: c.primaryContent,
      colorAuto: true,
      radius: 8,
      align: "center",
      paddingX: 16,
      paddingY: 8,
    }),
  },
  {
    key: "button-outline",
    label: "Outline button",
    hint: "A secondary call-to-action that won't compete with the primary",
    icon: "button",
    make: (c = DEFAULT_EMAIL_COLORS) => ({
      id: "x",
      kind: "button",
      label: "Learn more",
      href: "",
      variant: "outline",
      // `bg` is still the brand color even though nothing paints with it: it's
      // the documented fallback for `borderColor`, and it's what the button
      // reverts to if an author switches this back to filled.
      bg: c.primary,
      bgAuto: true,
      color: c.primary,
      colorAuto: true,
      colorRole: "primary",
      borderColor: c.primary,
      borderColorAuto: true,
      borderWidth: 1,
      radius: 8,
      align: "center",
      paddingX: 16,
      paddingY: 8,
    }),
  },
  {
    key: "divider",
    label: "Divider",
    hint: "A thin horizontal rule",
    icon: "divider",
    make: (c = DEFAULT_EMAIL_COLORS) => ({ id: "x", kind: "divider", color: c.base300, colorAuto: true, thickness: 1 }),
  },
  {
    key: "spacer",
    label: "Spacer",
    hint: "Vertical breathing room",
    icon: "spacer",
    make: () => ({ id: "x", kind: "spacer", height: 24 }),
  },
  {
    key: "social",
    label: "Social icons",
    hint: "A row of linked platform badges",
    icon: "share",
    make: () => ({
      id: "x",
      kind: "social",
      links: [
        { platform: "facebook", url: "" },
        { platform: "instagram", url: "" },
        { platform: "x", url: "" },
      ],
      align: "center",
      iconSize: 32,
      gap: 12,
    }),
  },
  {
    key: "video",
    label: "Video",
    hint: "A linked thumbnail — email clients can't embed real video",
    icon: "video",
    make: () => ({ id: "x", kind: "video", href: "", thumbnail: "", width: 400, align: "center", showPlayButton: true }),
  },
  {
    key: "html",
    label: "Custom HTML",
    hint: "Raw HTML passthrough — for merge tags or hand-authored markup",
    icon: "code",
    make: () => ({ id: "x", kind: "html", html: "<p>Custom HTML…</p>" }),
  },
];

export function emailPaletteItemByKey(key: string, items: readonly EmailPaletteItem[] = EMAIL_PALETTE): EmailPaletteItem | undefined {
  return items.find((i) => i.key === key);
}

/**
 * Merge a host's catalog additions/hides (`EmailBuilderHost.catalog()`) over
 * the default `EMAIL_PALETTE` index — additive, never a flat replace, mirroring
 * the site palette's `mergeCatalog`. A host item whose key matches a default
 * one REPLACES it (the default is dropped, the host's version is appended);
 * any other host item is simply appended as a new entry.
 */
export function mergeEmailCatalog(base: readonly EmailPaletteItem[], host?: { extend?: EmailPaletteItem[]; hide?: string[] }): EmailPaletteItem[] {
  const hidden = new Set(host?.hide ?? []);
  const filtered = base.filter((i) => !hidden.has(i.key));
  if (!host?.extend?.length) return filtered;
  const merged = filtered.filter((i) => !host.extend!.some((e) => e.key === i.key));
  return [...merged, ...host.extend];
}
