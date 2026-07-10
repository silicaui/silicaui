import { useState } from "react";
import { TreeView } from "@wizeworks/silicaui-react";
import type { TreeDropEdge, TreeNode } from "@wizeworks/silicaui-react";
import { Section } from "../lib/Section";

const FolderIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
);
const FileIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </svg>
);

const TREE_ITEMS: TreeNode[] = [
    {
        id: "pages",
        label: "Pages",
        icon: FolderIcon,
        children: [
            { id: "home", label: "Home", icon: FileIcon },
            { id: "about", label: "About", icon: FileIcon },
            { id: "pricing", label: "Pricing", icon: FileIcon },
        ],
    },
    {
        id: "shop",
        label: "Shop",
        icon: FolderIcon,
        children: [
            {
                id: "products",
                label: "Products",
                icon: FolderIcon,
                children: [
                    { id: "product-list", label: "All products", icon: FileIcon },
                    { id: "product-new", label: "New product", icon: FileIcon },
                ],
            },
            { id: "collections", label: "Collections", icon: FileIcon },
            { id: "checkout", label: "Checkout (locked)", icon: FileIcon, disabled: true },
        ],
    },
    { id: "blog", label: "Blog", icon: FileIcon },
    { id: "settings", label: "Settings", icon: FileIcon },
];

/** Remove `id` from the forest, returning the pruned tree + the removed node. */
function removeById(nodes: TreeNode[], id: string): [TreeNode[], TreeNode | undefined] {
    let removed: TreeNode | undefined;
    const next = nodes.flatMap((n) => {
        if (n.id === id) {
            removed = n;
            return [];
        }
        if (!n.children) return [n];
        const [children, found] = removeById(n.children, id);
        if (found) removed = found;
        return [{ ...n, children }];
    });
    return [next, removed];
}

/** Insert `node` before/after/inside `targetId`, wherever it lives in the forest. */
function insertRelative(nodes: TreeNode[], targetId: string, edge: TreeDropEdge, node: TreeNode): TreeNode[] {
    const idx = nodes.findIndex((n) => n.id === targetId);
    if (idx === -1) {
        return nodes.map((n) => (n.children ? { ...n, children: insertRelative(n.children, targetId, edge, node) } : n));
    }
    if (edge === "inside") {
        const target = nodes[idx]!;
        const updated = { ...target, children: [...(target.children ?? []), node] };
        return [...nodes.slice(0, idx), updated, ...nodes.slice(idx + 1)];
    }
    const at = edge === "before" ? idx : idx + 1;
    return [...nodes.slice(0, at), node, ...nodes.slice(at)];
}

function moveNode(nodes: TreeNode[], id: string, targetId: string, edge: TreeDropEdge): TreeNode[] {
    const [without, removed] = removeById(nodes, id);
    return removed ? insertRelative(without, targetId, edge, removed) : nodes;
}

export function TreeViewDemo() {
    const [selected, setSelected] = useState("about");
    const [expanded, setExpanded] = useState<string[]>(["pages", "shop"]);
    const [items, setItems] = useState(TREE_ITEMS);

    return (
        <Section title="Real use · site page tree — drag a row to reorder or reparent it">
            <TreeView
                items={items}
                selected={selected}
                onSelectedChange={setSelected}
                expanded={expanded}
                onExpandedChange={setExpanded}
                onMove={(id, targetId, edge) => setItems((prev) => moveNode(prev, id, targetId, edge))}
                className="max-w-xs"
            />
        </Section>
    );
}
