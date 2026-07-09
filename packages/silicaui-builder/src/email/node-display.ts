/**
 * Pure display helpers for an email node — the layer glyph and a short label.
 * Shared by the Canvas (selection label) and the Inspector (breadcrumb + header).
 */
import type { IconName } from "../shared/icons";
import type { EmailNode } from "./schema";

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
