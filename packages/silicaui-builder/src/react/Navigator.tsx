/**
 * The Navigator (left rail in Page/Layout mode) — the layer tree. Dogfoods
 * silicaui's `TreeView` (never a bespoke tree): the document node tree maps to
 * `TreeNode[]`, selection is two-way bound to the engine (click a row → select;
 * select on canvas → the row highlights), and each row gets a baked node-type
 * glyph. String (text) children are leaves' content, not their own rows, so the
 * tree shows structure, not prose.
 */
import * as React from "react";
import type { Node } from "silicaui-html";
import { walk } from "silicaui-html";
import { TreeView } from "silicaui-react";
import type { TreeNode } from "silicaui-react";
import { useActiveRoot, useEditor, useSelection } from "./editor-context";
import { Icon } from "./Icon";
import { nodeIconName, nodeName, textHint } from "../node-display";

function toTreeNode(node: Node): TreeNode {
  const childNodes = node.kind === "outlet" ? [] : (node.children ?? []).filter((c): c is Node => typeof c !== "string");
  const hint = textHint(node);
  return {
    id: (node.kind !== "outlet" && node.id) || nodeName(node),
    icon: <Icon name={nodeIconName(node)} className="text-base-content/55" />,
    label: (
      <span className="inline-flex items-baseline gap-1.5">
        <span>{nodeName(node)}</span>
        {hint && <span className="text-xs text-base-content/40 truncate">{hint}</span>}
      </span>
    ),
    children: childNodes.length ? childNodes.map(toTreeNode) : undefined,
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

export function Navigator() {
  const root = useActiveRoot();
  const editor = useEditor();
  const selectedId = useSelection();

  const items = React.useMemo(() => [toTreeNode(root)], [root]);
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
    />
  );
}
