/**
 * The email Navigator (left rail "Layers" tab) — the layer tree, mirroring the
 * site builder's Navigator (dogfoods @wizeworks/silicaui's `TreeView`, never a bespoke
 * tree): the document tree maps to `TreeNode[]`, selection is two-way bound to
 * the editor (click a row → select; select on canvas → the row highlights),
 * and each row gets the same kind glyph the breadcrumb and canvas use.
 */
import * as React from "react";
import { TreeView } from "@wizeworks/silicaui-react";
import type { TreeDropEdge, TreeNode } from "@wizeworks/silicaui-react";
import type { EmailNode } from "../schema";
import { useEmailDocument, useEmailEditor, useEmailSelection } from "./editor-context";
import { Icon } from "../../shared/react/Icon";
import { nodeIcon, nodeName } from "../node-display";

function childrenOf(node: EmailNode): EmailNode[] {
  return "children" in node ? (node.children as EmailNode[]) : [];
}

function toTreeNode(node: EmailNode): TreeNode {
  const kids = childrenOf(node);
  return {
    id: node.id,
    icon: <Icon name={nodeIcon(node)} className="text-base-content/55" />,
    label: <span className="truncate">{nodeName(node)}</span>,
    children: kids.length ? kids.map(toTreeNode) : undefined,
  };
}

/** Every container node id — the default-expanded set (whole tree open). */
function containerIds(root: EmailNode): string[] {
  const ids: string[] = [];
  const visit = (n: EmailNode) => {
    const kids = childrenOf(n);
    if (kids.length) {
      ids.push(n.id);
      kids.forEach(visit);
    }
  };
  visit(root);
  return ids;
}

/** Depth-first search for `id`'s parent + position, for resolving a Navigator
 *  drop into the (parentId, index) shape `editor.move` expects. */
function locateInfo(root: EmailNode, id: string): { parentId: string; index: number } | undefined {
  const stack: EmailNode[] = [root];
  while (stack.length) {
    const parent = stack.pop()!;
    const children = childrenOf(parent);
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      if (child.id === id) return { parentId: parent.id, index: i };
      stack.push(child);
    }
  }
  return undefined;
}

/** Resolve a Navigator drag release into a concrete (parentId, index) for
 *  `editor.move` — mirrors the email Canvas's own before/after/inside → placement mapping. */
function placement(root: EmailNode, targetId: string, edge: TreeDropEdge): { parentId: string; index?: number } {
  if (edge === "inside") return { parentId: targetId };
  const info = locateInfo(root, targetId);
  if (!info) return { parentId: targetId }; // root has no siblings
  return { parentId: info.parentId, index: edge === "before" ? info.index : info.index + 1 };
}

export function Navigator() {
  const doc = useEmailDocument();
  const editor = useEmailEditor();
  const selectedId = useEmailSelection();

  const items = React.useMemo(() => [toTreeNode(doc.root)], [doc.root]);
  const [expanded, setExpanded] = React.useState<string[]>(() => containerIds(doc.root));
  // The site Navigator reseeds `expanded` by remounting on every page/mode
  // switch; an email has no such switch (one document, mounted once), so a
  // leaf that only later gains its first child (e.g. an "Add column" column
  // before content lands in it) would otherwise start — and stay — collapsed.
  // Track which ids were already known as containers and auto-open ONLY the
  // ones that just became one, leaving any container the user deliberately
  // collapsed alone.
  const knownContainers = React.useRef<Set<string>>(new Set(expanded));
  React.useEffect(() => {
    const current = containerIds(doc.root);
    const fresh = current.filter((id) => !knownContainers.current.has(id));
    knownContainers.current = new Set(current);
    if (fresh.length) setExpanded((prev) => [...prev, ...fresh]);
  }, [doc.root]);

  return (
    <TreeView
      className="px-1 py-1.5"
      items={items}
      expanded={expanded}
      onExpandedChange={setExpanded}
      selected={selectedId}
      onSelectedChange={(id) => editor.select(id)}
      onMove={(id, targetId, edge) => {
        if (id === targetId) return;
        const place = placement(doc.root, targetId, edge);
        const parent = editor.node(place.parentId);
        const childCount = parent ? childrenOf(parent).length : 0;
        editor.move(id, place.parentId, place.index ?? childCount);
      }}
    />
  );
}
