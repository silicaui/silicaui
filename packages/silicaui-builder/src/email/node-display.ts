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
  link: "link",
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
  link: "Link",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  social: "Social",
  html: "Custom HTML",
  video: "Video",
};

/** Row labels are one line in a narrow rail — keep them scannable. Same 32
 *  characters the site Navigator uses, so the two rails truncate alike. */
function truncate(raw: string): string {
  return raw.length > 32 ? `${raw.slice(0, 32)}…` : raw;
}

/**
 * A short display name — the author's own name for the layer if they set one,
 * else the content the node actually holds, else the kind label.
 *
 * CONTENT LEADS, and images were the hole in that. The site Navigator states
 * the rule in as many words — "the words the node actually holds, else the name
 * it declares, else its type… Content leads because that is what a person
 * recognizes when scanning" — and reads an element's `aria-label` for controls
 * that hold no text, noting that it "IS this element's name, to a screen reader
 * and now to the author too."
 *
 * `alt` is precisely that for an image, and this function never used it. P04's
 * newsletter has five images — a masthead, a lead cover and three staff picks —
 * and the Layers rail showed FIVE rows reading `Image`, one distinct name
 * between them, while every one carried alt text written specifically to say
 * which book it was. See P04/issues 069.
 */
export function nodeName(node: EmailNode): string {
  if (node.name) return node.name;
  if (node.kind === "text") {
    const plain = node.html.replace(/<[^>]+>/g, "").trim();
    return plain ? truncate(plain) : "Text";
  }
  if (node.kind === "button") return node.label ? truncate(node.label) : "Button";
  if (node.kind === "image") return node.alt.trim() ? truncate(node.alt.trim()) : "Image";
  // A link group holds no words of its own — its destination is the only thing
  // that distinguishes one from the next, and a column of "Link" rows is the
  // same defect as a column of "Image" ones. The scheme is dropped because it
  // is the same on every row and costs eight characters of a 32-character line.
  if (node.kind === "link") {
    const href = node.href?.trim().replace(/^https?:\/\//, "") ?? "";
    return href ? truncate(href) : "Link";
  }
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
