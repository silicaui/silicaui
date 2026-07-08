import { useState } from "react";
import { TreeView } from "@wizeworks/silicaui-react";
import type { TreeNode } from "@wizeworks/silicaui-react";
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

export function TreeViewDemo() {
    const [selected, setSelected] = useState("about");
    const [expanded, setExpanded] = useState<string[]>(["pages", "shop"]);

    return (
        <Section title="Real use · site page tree">
            <TreeView
                items={TREE_ITEMS}
                selected={selected}
                onSelectedChange={setSelected}
                expanded={expanded}
                onExpandedChange={setExpanded}
                className="max-w-xs"
            />
        </Section>
    );
}
