/**
 * The email insert catalog — every block the Palette can add to the canvas. Each
 * entry is a pure factory returning a fresh `EmailNode` (the `id` is a
 * placeholder; `EmailEditor.insert` stamps a real one). Unlike the site
 * palette, this catalog is small and CLOSED — it mirrors `schema.ts`'s fixed
 * vocabulary exactly, one entry per insertable kind (plus 2/3/4-column
 * presets, since a bare "columns" block with zero columns isn't useful to
 * insert). `make` takes the current brand color defaults (`editor.colorDefaults`)
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
    make: (c = DEFAULT_EMAIL_COLORS) => ({ id: "x", kind: "section", bg: c.base100, paddingX: 24, paddingY: 24, children: [] }),
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
      color: c.primaryContent,
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
    make: (c = DEFAULT_EMAIL_COLORS) => ({ id: "x", kind: "divider", color: c.base300, thickness: 1 }),
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

export function emailPaletteItemByKey(key: string): EmailPaletteItem | undefined {
  return EMAIL_PALETTE.find((i) => i.key === key);
}
