/** Shared tree traversal. Kept dependency-free so kit + lint both use it. */
import type { Child, Node } from "./schema";

/** Depth-first walk, visiting every node (strings are text, not nodes). */
export function walk(node: Node, visit: (n: Node) => void): void {
  visit(node);
  if (node.kind === "outlet") return;
  for (const child of node.children ?? []) {
    if (typeof child !== "string") walk(child, visit);
  }
}

/**
 * Compose a Frame's tree with a page body by substituting the single `Outlet`
 * with the page's root — the shared shell (header/footer/nav) wrapping the page.
 * This is what a projection composes to render the FULL page a visitor sees.
 *
 * Returns a NEW tree, but only the spine down to the outlet is rebuilt; every
 * untouched branch (and the whole page tree) is shared by reference, since the
 * result is meant to be projected read-only immediately. A frame with no outlet
 * is returned unchanged (nothing to fill).
 */
export function composeFrame(frameRoot: Node, pageRoot: Node): Node {
  if (frameRoot.kind === "outlet") return pageRoot;
  const children = frameRoot.children;
  if (!children || children.length === 0) return frameRoot;
  let changed = false;
  const next: Child[] = children.map((c) => {
    if (typeof c === "string") return c;
    const replaced = composeFrame(c, pageRoot);
    if (replaced !== c) changed = true;
    return replaced;
  });
  return changed ? { ...frameRoot, children: next } : frameRoot;
}
