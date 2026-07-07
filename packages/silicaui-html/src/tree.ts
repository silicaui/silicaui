/** Shared tree traversal. Kept dependency-free so kit + lint both use it. */
import type { Node } from "./schema";

/** Depth-first walk, visiting every node (strings are text, not nodes). */
export function walk(node: Node, visit: (n: Node) => void): void {
  visit(node);
  if (node.kind === "outlet") return;
  for (const child of node.children ?? []) {
    if (typeof child !== "string") walk(child, visit);
  }
}
