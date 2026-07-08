/**
 * The insert catalog — what the Insert palette can add to the canvas. Two tiers:
 * PRIMITIVES (bare elements/atoms authored with the @wizeworks/silicaui-html kit) and BLOCKS
 * (composed, validated templates from `@wizeworks/silicaui-html/blocks`). Each entry is a
 * pure factory returning an id-free `Node`; the engine stamps fresh ids on insert,
 * so returning a shared block root is safe (it's deep-cloned first).
 *
 * STYLING RULE (hard): every class here is a LITERAL string so the harness's
 * `@source` scan safelists the utilities a freshly-inserted node wears — same rule
 * as the Inspector and Canvas. A class assembled at runtime would never generate.
 */
import type { Node } from "@wizeworks/silicaui-html";
import { atom, el } from "@wizeworks/silicaui-html";
import { listBlocks } from "@wizeworks/silicaui-html/blocks";
import type { IconName } from "./icons";

export interface PaletteItem {
    /** Stable identity for the row (and the drag payload). */
    key: string;
    label: string;
    icon: IconName;
    /** A one-line description, shown under blocks. */
    hint?: string;
    /** Build a fresh, id-free node to insert. */
    make: () => Node;
}

export interface PaletteGroup {
    key: string;
    label: string;
    items: PaletteItem[];
}

/** Structural primitives — the containers a layout is built from. */
const LAYOUT: PaletteItem[] = [
    { key: "section", label: "Section", icon: "section", make: () => el("section", "@container px-6 py-12") },
    { key: "container", label: "Container", icon: "box", make: () => el("div", "mx-auto w-full max-w-5xl px-4") },
    { key: "stack", label: "Stack", icon: "stack", make: () => el("div", "flex flex-col gap-4") },
    { key: "row", label: "Row", icon: "layout", make: () => el("div", "flex flex-row items-center gap-4") },
    { key: "grid", label: "Grid", icon: "grid", make: () => el("div", "grid grid-cols-1 @2xl:grid-cols-3 gap-6") },
];

/** Content primitives — the leaves that carry copy, media, and actions. */
const CONTENT: PaletteItem[] = [
    {
        key: "heading",
        label: "Heading",
        icon: "heading",
        make: () => el("h2", "text-2xl font-semibold text-base-content", { text: "Heading" }),
    },
    {
        key: "text",
        label: "Text",
        icon: "text",
        make: () => el("p", "text-base text-base-content/70", { text: "Body text. Edit me in the inspector." }),
    },
    { key: "button", label: "Button", icon: "button", make: () => atom("Button", "btn btn-primary", { label: "Button" }) },
    {
        key: "image",
        label: "Image",
        icon: "image",
        make: () => atom("Image", "rounded-box w-full", { ratio: "wide", alt: "" }),
    },
    { key: "badge", label: "Badge", icon: "label", make: () => atom("Badge", "badge badge-primary", { text: "Badge" }) },
    { key: "link", label: "Link", icon: "link", make: () => el("a", "link link-primary", { text: "Link", attrs: { href: "#" } }) },
    { key: "divider", label: "Divider", icon: "box", make: () => atom("Divider", "divider") },
    {
        key: "wordmark",
        label: "Wordmark",
        icon: "wordmark",
        hint: "A styled brand/product logotype",
        make: () => atom("Wordmark", "wordmark", { text: "SilicaUI" }),
    },
];

/**
 * Form primitives — native controls (Input/Select/Checkbox/…) as component atoms,
 * so they carry the form-contract wiring the runtime hydrates. Every class is a
 * LITERAL @wizeworks/silicaui component class (`input`, `field`, …) for the `@source` safelist.
 */
const FORM: PaletteItem[] = [
    {
        key: "field",
        label: "Field",
        icon: "label",
        hint: "Label + input, wired together",
        make: () =>
            atom("Field", "field", undefined, [
                el("label", "field-label", { text: "Label" }),
                atom("Input", "input", { type: "text", placeholder: "Enter a value…" }),
            ]),
    },
    { key: "input", label: "Input", icon: "input", make: () => atom("Input", "input", { type: "text", placeholder: "Enter text…" }) },
    { key: "textarea", label: "Textarea", icon: "textarea", make: () => atom("Textarea", "textarea", { placeholder: "Enter text…", rows: 3 }) },
    {
        key: "select",
        label: "Select",
        icon: "select",
        make: () =>
            atom("Select", "select", {
                options: [
                    { value: "1", label: "Option 1" },
                    { value: "2", label: "Option 2" },
                    { value: "3", label: "Option 3" },
                ],
            }),
    },
    { key: "checkbox", label: "Checkbox", icon: "checkbox", make: () => atom("Checkbox", "checkbox", { name: "checkbox" }) },
    { key: "radio", label: "Radio", icon: "radio", make: () => atom("Radio", "radio", { name: "radio" }) },
    { key: "toggle", label: "Toggle", icon: "toggle", make: () => atom("Toggle", "toggle", { name: "toggle" }) },
    {
        key: "selection-list",
        label: "Selection List",
        icon: "selectionList",
        hint: "A single- or multi-select list",
        make: () =>
            atom("SelectionList", "selection-list", {
                items: [
                    { id: "free", label: "Free", description: "For trying things out" },
                    { id: "pro", label: "Pro", description: "For growing teams" },
                    { id: "enterprise", label: "Enterprise", description: "Custom limits & support" },
                ],
                selected: ["pro"],
            }),
    },
    {
        key: "form",
        label: "Form",
        icon: "form",
        hint: "A field + submit button",
        make: () =>
            atom("Form", "flex flex-col gap-4", undefined, [
                atom("Field", "field", undefined, [
                    el("label", "field-label", { text: "Email" }),
                    atom("Input", "input", { type: "email", name: "email", placeholder: "you@example.com" }),
                ]),
                atom("Button", "btn btn-primary", { label: "Submit", type: "submit" }),
            ]),
    },
];

/**
 * Navigation primitives — trails, lists, and page controls. List-shaped atoms
 * (Breadcrumb/Menu/Steps) carry their items as `props.items` (edited in the
 * Inspector); Navbar is a container whose slots are authored in the tree.
 */
const NAV: PaletteItem[] = [
    {
        key: "breadcrumb",
        label: "Breadcrumb",
        icon: "breadcrumb",
        make: () => atom("Breadcrumb", "breadcrumb", { items: ["Home", "Library", "Data"] }),
    },
    {
        key: "menu",
        label: "Menu",
        icon: "nav",
        make: () => atom("Menu", "menu w-56", { items: ["Dashboard", "Settings", "Profile"] }),
    },
    {
        key: "steps",
        label: "Steps",
        icon: "steps",
        make: () => atom("Steps", "steps", { items: ["Register", "Choose plan", "Purchase"], current: 1 }),
    },
    {
        key: "pagination",
        label: "Pagination",
        icon: "pagination",
        make: () => atom("Pagination", "join", { pages: 3 }),
    },
    {
        key: "navbar",
        label: "Navbar",
        icon: "header",
        hint: "A top bar with start/end slots",
        make: () =>
            atom("Navbar", "navbar bg-base-100 rounded-box", undefined, [
                el("div", "navbar-start", {
                    children: [el("a", "text-xl font-semibold text-base-content", { text: "SilicaUI", attrs: { href: "#" } })],
                }),
                el("div", "navbar-end", { children: [atom("Button", "btn btn-primary btn-sm", { label: "Sign in" })] }),
            ]),
    },
    {
        key: "sidebar",
        label: "Sidebar",
        icon: "sidebar",
        hint: "A collapsible nav panel — comes with a working header trigger",
        make: () =>
            atom("Sidebar", "sidebar", undefined, [
                el("div", "sidebar-header", {
                    children: [
                        el("div", "sidebar-header-brand", {
                            children: [atom("Wordmark", "wordmark", { text: "SilicaUI" })],
                        }),
                        atom("SidebarTrigger", "sidebar-trigger"),
                    ],
                }),
                el("div", "sidebar-content", {
                    children: [
                        el("div", "sidebar-group", {
                            children: [
                                el("div", "sidebar-group-label", { text: "Menu" }),
                                el("button", "sidebar-item", { text: "Dashboard", attrs: { type: "button" } }),
                                el("button", "sidebar-item", { text: "Settings", attrs: { type: "button" } }),
                            ],
                        }),
                    ],
                }),
            ]),
    },
    {
        key: "sidebar-trigger",
        label: "Sidebar Toggle",
        icon: "sidebarTrigger",
        hint: "Drop inside a Sidebar to collapse/expand it",
        make: () => atom("SidebarTrigger", "sidebar-trigger"),
    },
];

/** Feedback primitives — status/loading surfaces the app shows the user. */
const FEEDBACK: PaletteItem[] = [
    {
        key: "alert",
        label: "Alert",
        icon: "warning",
        make: () => atom("Alert", "alert alert-info", { text: "New updates are available." }),
    },
    {
        key: "progress",
        label: "Progress",
        icon: "progress",
        make: () => atom("Progress", "progress w-56", { value: 60 }),
    },
    { key: "loading", label: "Loading", icon: "loading", make: () => atom("Loading", "loading loading-md") },
    { key: "skeleton", label: "Skeleton", icon: "box", make: () => atom("Skeleton", "skeleton h-24 w-full") },
    { key: "status", label: "Status", icon: "dot", make: () => atom("Status", "status status-success status-lg") },
    { key: "kbd", label: "Kbd", icon: "kbd", make: () => atom("Kbd", "kbd", { text: "Ctrl" }) },
];

/** Data-display primitives — metrics, media, tables, and disclosure. */
const DATA: PaletteItem[] = [
    {
        key: "stat",
        label: "Stat",
        icon: "stat",
        make: () =>
            atom("Stat", "stats bg-base-100 border border-base-200", {
                title: "Total Users",
                value: "1,204",
                desc: "↗ 12% this month",
            }),
    },
    {
        key: "avatar",
        label: "Avatar",
        icon: "avatar",
        make: () => atom("Avatar", "avatar w-12 rounded-full", { alt: "" }),
    },
    {
        key: "collapse",
        label: "Collapse",
        icon: "collapse",
        hint: "A native disclosure panel",
        make: () =>
            // Class is `details`, not `collapse` — Tailwind v4's built-in `.collapse`
            // utility sets `visibility: collapse` and wins over this component's own
            // rule, silently hiding it (see collapse.js's doc comment).
            atom("Collapse", "details bg-base-100 border border-base-200", {
                title: "Click to expand",
                content: "Hidden content revealed on toggle.",
            }),
    },
    {
        key: "timeline",
        label: "Timeline",
        icon: "timeline",
        make: () => atom("Timeline", "timeline", { items: ["Founded 2021", "Series A 2022", "Launched 2024"] }),
    },
    {
        key: "table",
        label: "Table",
        icon: "table",
        hint: "A styled data table",
        make: () =>
            atom("Table", "table", undefined, [
                el("thead", undefined, {
                    children: [
                        el("tr", undefined, {
                            children: [el("th", undefined, { text: "Name" }), el("th", undefined, { text: "Role" })],
                        }),
                    ],
                }),
                el("tbody", undefined, {
                    children: [
                        el("tr", undefined, {
                            children: [el("td", undefined, { text: "Ada" }), el("td", undefined, { text: "Engineer" })],
                        }),
                        el("tr", undefined, {
                            children: [el("td", undefined, { text: "Grace" }), el("td", undefined, { text: "Admiral" })],
                        }),
                    ],
                }),
            ]),
    },
];

/** Block category → the palette glyph representing it. */
const BLOCK_ICON: Record<string, IconName> = {
    hero: "layout",
    features: "grid",
    faq: "list",
    nav: "header",
    footer: "footer",
    cta: "cta",
    testimonial: "quote",
    pricing: "pricing",
    stats: "stat",
    logos: "gallery",
    team: "team",
    contact: "contact",
    content: "article",
    tabs: "tabs",
    accordion: "collapse",
    dropdown: "dropdown",
};

/**
 * Categories that are behavior-driven INTERACTIVE composites (tabs/accordion/
 * dropdown) rather than marketing SECTIONS — they get their own palette group so
 * a long block list stays legible. Everything else is a section.
 */
const INTERACTIVE_CATEGORIES: ReadonlySet<string> = new Set(["tabs", "accordion", "dropdown"]);

/** One palette item from a validated block Template. */
function blockItem(b: ReturnType<typeof listBlocks>[number]): PaletteItem {
    return {
        key: `block:${b.key}`,
        // Block names read "Short — long description"; keep the short half for the row.
        label: b.name.split(" — ")[0] ?? b.name,
        icon: BLOCK_ICON[b.category] ?? "box",
        hint: b.description,
        make: () => b.root, // shared root; the engine deep-clones + stamps on insert
    };
}

/** The composed marketing sections, read live from the validated catalog. */
function sectionItems(): PaletteItem[] {
    return listBlocks()
        .filter((b) => !INTERACTIVE_CATEGORIES.has(b.category))
        .map(blockItem);
}

/** The behavior-driven interactive composites. */
function interactiveItems(): PaletteItem[] {
    return listBlocks()
        .filter((b) => INTERACTIVE_CATEGORIES.has(b.category))
        .map(blockItem);
}

/** The full grouped catalog for the Insert panel. */
export function paletteGroups(): PaletteGroup[] {
    return [
        { key: "layout", label: "Layout", items: LAYOUT },
        { key: "content", label: "Content", items: CONTENT },
        { key: "form", label: "Form", items: FORM },
        { key: "nav", label: "Navigation", items: NAV },
        { key: "feedback", label: "Feedback", items: FEEDBACK },
        { key: "data", label: "Data", items: DATA },
        { key: "interactive", label: "Interactive", items: interactiveItems() },
        { key: "blocks", label: "Sections", items: sectionItems() },
    ];
}

/** Resolve a palette item by its key — the drop target decodes a drag this way. */
export function paletteItemByKey(key: string): PaletteItem | undefined {
    for (const group of paletteGroups()) {
        const hit = group.items.find((i) => i.key === key);
        if (hit) return hit;
    }
    return undefined;
}
