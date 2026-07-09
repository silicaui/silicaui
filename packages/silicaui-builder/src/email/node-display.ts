/**
 * Pure display helpers for an email node — the layer glyph and a short label.
 * Shared by the Canvas (selection label) and the Inspector (breadcrumb + header).
 */
import type { IconName } from "../shared/icons";
import type { EmailNode, SocialPlatform } from "./schema";

/** Per-platform badge color + short label — a self-contained text badge (no
 *  hotlinked icon image, so a Social block never depends on an external asset
 *  host staying up). Shared by the projector (real output) and the Canvas
 *  (live preview), so what you see while editing IS what ships. */
export const SOCIAL_PLATFORM: Record<SocialPlatform, { color: string; label: string }> = {
  facebook: { color: "#1877f2", label: "f" },
  instagram: { color: "#e1306c", label: "IG" },
  x: { color: "#000000", label: "X" },
  linkedin: { color: "#0a66c2", label: "in" },
  youtube: { color: "#ff0000", label: "▶" },
  tiktok: { color: "#000000", label: "TT" },
  pinterest: { color: "#e60023", label: "P" },
};

const KIND_ICON: Record<EmailNode["kind"], IconName> = {
  body: "page",
  section: "section",
  columns: "columns",
  column: "stack",
  text: "text",
  image: "image",
  button: "button",
  divider: "divider",
  spacer: "spacer",
  social: "share",
  html: "code",
  video: "video",
};

export function nodeIcon(node: EmailNode): IconName {
  return KIND_ICON[node.kind];
}

const KIND_LABEL: Record<EmailNode["kind"], string> = {
  body: "Email",
  section: "Section",
  columns: "Columns",
  column: "Column",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  social: "Social",
  html: "Custom HTML",
  video: "Video",
};

/** A short display name — the text content for a text node, else the kind label. */
export function nodeName(node: EmailNode): string {
  if (node.kind === "text") {
    const plain = node.html.replace(/<[^>]+>/g, "").trim();
    return plain || "Text";
  }
  if (node.kind === "button") return node.label || "Button";
  return KIND_LABEL[node.kind];
}

/** The path from the root down to `id` (inclusive), or undefined if not found —
 *  drives the Inspector's ancestor breadcrumb. */
export function ancestorPath(root: EmailNode, id: string): EmailNode[] | undefined {
  if (root.id === id) return [root];
  const kids = "children" in root ? (root.children as EmailNode[]) : undefined;
  for (const child of kids ?? []) {
    const rest = ancestorPath(child, id);
    if (rest) return [root, ...rest];
  }
  return undefined;
}
