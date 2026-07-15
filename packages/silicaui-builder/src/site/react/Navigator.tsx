/**
 * The Navigator (left rail in Page/Layout mode) — the layer tree. Dogfoods
 * @wizeworks/silicaui's `TreeView` (never a bespoke tree): the document node tree maps to
 * `TreeNode[]`, selection is two-way bound to the engine (click a row → select;
 * select on canvas → the row highlights), and each row gets a baked node-type
 * glyph. String (text) children are leaves' content, not their own rows, so the
 * tree shows structure, not prose.
 */
import * as React from "react";
import type { Node } from "@wizeworks/silicaui-html";
import { walk } from "@wizeworks/silicaui-html";
import { TreeView } from "@wizeworks/silicaui-react";
import type { TreeDropEdge, TreeNode } from "@wizeworks/silicaui-react";
import { useActiveRoot, useActiveTree, useEditor, useSelection } from "./editor-context";
import { Icon } from "../../shared/react/Icon";
import { nodeIconName, nodeName, textHint } from "../node-display";

/** The tree's own root row has no useful ancestor context, so an unlabeled
 *  frame root (just a plain wrapper `div`) reads as "Site root" instead of
 *  its bare tag. Pages already carry an explicit `label: "Page"` (`pageBody`
 *  in silicaui-html), so this only ever kicks in for Layout mode. */
function rootFallbackLabel(which: "page" | "frame" | "symbol"): string | undefined {
  return which === "frame" ? "Site root" : undefined;
}

function toTreeNode(node: Node, rootLabel?: string): TreeNode {
  const childNodes = node.kind === "outlet" ? [] : (node.children ?? []).filter((c): c is Node => typeof c !== "string");
  const hint = textHint(node);
  const label = (node.kind !== "outlet" && !node.label && rootLabel) || nodeName(node);
  // A locked node carries a trailing glyph: a padlock for an author lock, a
  // shield for a host lock (host-owned, author can't clear it) — see the
  // host-nodes spec §B.3.
  const locked = node.kind !== "outlet" ? node.locked : undefined;
  return {
    id: (node.kind !== "outlet" && node.id) || nodeName(node),
    icon: <Icon name={nodeIconName(node)} className="text-base-content/55" />,
    label: (
      <span className="inline-flex items-baseline gap-1.5">
        <span>{label}</span>
        {hint && <span className="text-xs text-base-content/40 truncate">{hint}</span>}
        {locked && (
          <Icon
            name={locked === "host" ? "shield" : "lock"}
            className="self-center text-base-content/40"
          />
        )}
      </span>
    ),
    children: childNodes.length ? childNodes.map((c) => toTreeNode(c)) : undefined,
  };
}

/** Every container node id — the default-expanded set (whole tree open). */
function containerIds(root: Node): string[] {
  const ids: string[] = [];
  walk(root, (n) => {
    if (n.kind !== "outlet" && n.id && (n.children ?? []).some((c) => typeof c !== "string")) {
      ids.push(n.id);
    }
  });
  return ids;
}

/** Depth-first search for `id`'s parent + position, for resolving a Navigator
 *  drop into the (parentId, index) shape `editor.move` expects. Mirrors the
 *  Canvas's own placement logic — indices count the REAL children array
 *  (string children included) so they line up with what `editor.move` splices. */
function locateInfo(root: Node, id: string): { parentId: string; index: number } | undefined {
  if (root.kind === "outlet") return undefined;
  const stack: Node[] = [root];
  while (stack.length) {
    const parent = stack.pop()!;
    if (parent.kind === "outlet" || !parent.id) continue;
    const children = parent.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child === undefined || typeof child === "string" || child.kind === "outlet") continue;
      if (child.id === id) return { parentId: parent.id, index: i };
      stack.push(child);
    }
  }
  return undefined;
}

/** Resolve a Navigator drag release into a concrete (parentId, index) for
 *  `editor.move` — same before/after/inside → placement mapping the Canvas
 *  uses, so dropping a row "before" the root's first child, say, behaves the
 *  same regardless of which surface you dragged it on. */
function placement(root: Node, targetId: string, edge: TreeDropEdge): { parentId: string; index?: number } {
  if (edge === "inside") return { parentId: targetId };
  const info = locateInfo(root, targetId);
  if (!info) return { parentId: targetId }; // root has no siblings
  return { parentId: info.parentId, index: edge === "before" ? info.index : info.index + 1 };
}

export function Navigator() {
  const root = useActiveRoot();
  const which = useActiveTree();
  const editor = useEditor();
  const selectedId = useSelection();

  const items = React.useMemo(() => [toTreeNode(root, rootFallbackLabel(which))], [root, which]);
  // Expansion is controlled so a node inserted under a collapsed parent still
  // reveals itself; seed it open across the whole tree. (Builder remounts the
  // Navigator on a Page/Layout switch, so this reseeds for the new tree.)
  const [expanded, setExpanded] = React.useState<string[]>(() => containerIds(root));

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
        const place = placement(root, targetId, edge);
        const parent = editor.node(place.parentId);
        const childCount = parent && parent.kind !== "outlet" ? parent.children?.length ?? 0 : 0;
        editor.move(id, place.parentId, place.index ?? childCount);
      }}
    />
  );
}
