/**
 * The email insert catalog — every block the Palette can add to the canvas. Each
 * entry is a pure factory returning a fresh `EmailNode` (the `id` is a
 * placeholder; `EmailEditor.insert` stamps a real one). Unlike the site
 * palette, this catalog is small and CLOSED — it mirrors `schema.ts`'s fixed
 * vocabulary exactly, one entry per insertable kind (plus 2/3-column presets,
 * since a bare "columns" block with zero columns isn't useful to insert).
 */
import type { IconName } from "../shared/icons";
import type { ColumnNode, ColumnsNode, EmailNode } from "./schema";

export interface EmailPaletteItem {
  key: string;
  label: string;
  hint: string;
  icon: IconName;
  make: () => EmailNode;
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
    make: () => ({ id: "x", kind: "section", bg: "#ffffff", paddingX: 24, paddingY: 24, children: [] }),
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
    key: "text",
    label: "Text",
    hint: "A paragraph of copy",
    icon: "text",
    make: () => ({
      id: "x",
      kind: "text",
      html: "Write something…",
      align: "left",
      color: "#18181b",
      fontSize: 16,
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
    make: () => ({
      id: "x",
      kind: "button",
      label: "Shop now",
      href: "",
      bg: "#111827",
      color: "#ffffff",
      radius: 6,
      align: "center",
      paddingX: 20,
      paddingY: 12,
    }),
  },
  {
    key: "divider",
    label: "Divider",
    hint: "A thin horizontal rule",
    icon: "divider",
    make: () => ({ id: "x", kind: "divider", color: "#e4e4e7", thickness: 1 }),
  },
  {
    key: "spacer",
    label: "Spacer",
    hint: "Vertical breathing room",
    icon: "spacer",
    make: () => ({ id: "x", kind: "spacer", height: 24 }),
  },
];

export function emailPaletteItemByKey(key: string): EmailPaletteItem | undefined {
  return EMAIL_PALETTE.find((i) => i.key === key);
}
