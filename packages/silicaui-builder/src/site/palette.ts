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
import type { IconName } from "../shared/icons";

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
    {
        key: "card",
        label: "Card",
        icon: "box",
        make: () =>
            atom("Card", "card bg-base-100", undefined, [
                el("div", "card-body", {
                    children: [
                        el("div", "card-title", { text: "Card title" }),
                        el("p", "text-base-content/70", { text: "Supporting copy for this card." }),
                        el("div", "card-actions", { children: [atom("Button", "btn btn-primary btn-sm", { label: "Action" })] }),
                    ],
                }),
            ]),
    },
    {
        key: "clickable-card",
        label: "Clickable Card",
        icon: "box",
        hint: "The whole surface is a link",
        make: () =>
            atom("ClickableCard", "card card-clickable bg-base-100", { href: "#" }, [
                el("div", "card-body", {
                    children: [
                        el("div", "card-title", { text: "Clickable card" }),
                        el("p", "text-base-content/70", { text: "The whole surface is a link." }),
                    ],
                }),
            ]),
    },
    {
        key: "hero",
        label: "Hero",
        icon: "layout",
        hint: "A simpler raw hero primitive — see also the Hero Split CTA section",
        make: () =>
            atom("Hero", "hero min-h-96 bg-base-200 rounded-box", undefined, [
                el("div", "hero-content text-center", {
                    children: [
                        el("div", "flex flex-col gap-4 max-w-md", {
                            children: [
                                el("h1", "text-4xl font-bold", { text: "Hero headline" }),
                                el("p", "text-base-content/70", { text: "A short supporting sentence." }),
                                atom("Button", "btn btn-primary", { label: "Get started" }),
                            ],
                        }),
                    ],
                }),
            ]),
    },
    {
        key: "footer-primitive",
        label: "Footer",
        icon: "footer",
        hint: "A simpler raw footer primitive — see also the Footer section",
        make: () =>
            atom("Footer", "footer bg-base-200 p-10", undefined, [
                el("nav", undefined, {
                    children: [
                        atom("FooterTitle", undefined, { text: "Services" }),
                        el("a", "link link-hover", { text: "Branding" }),
                        el("a", "link link-hover", { text: "Design" }),
                    ],
                }),
                el("nav", undefined, {
                    children: [
                        atom("FooterTitle", undefined, { text: "Company" }),
                        el("a", "link link-hover", { text: "About us" }),
                        el("a", "link link-hover", { text: "Contact" }),
                    ],
                }),
            ]),
    },
    {
        key: "app-shell",
        label: "App Shell",
        icon: "layout",
        hint: "A full page skeleton — sidebar + header + main + footer",
        make: () =>
            atom("AppShell", "app-shell h-[32rem] rounded-box border border-base-200 overflow-hidden", undefined, [
                atom("AppShellSidebar", "app-shell-sidebar w-56 border-r border-base-200 p-4", undefined, [
                    atom("Wordmark", "wordmark", { text: "SilicaUI" }),
                ]),
                atom("AppShellHeader", "app-shell-header navbar bg-base-100 border-b border-base-200", undefined, [
                    el("div", "navbar-end", { children: [atom("Button", "btn btn-primary btn-sm", { label: "Sign in" })] }),
                ]),
                atom("AppShellMain", "app-shell-main p-6", undefined, [el("p", "text-base-content/70", { text: "Main content area" })]),
                atom("AppShellFooter", "app-shell-footer border-t border-base-200 p-4 text-sm text-base-content/60", undefined, [
                    el("p", undefined, { text: "© 2026 SilicaUI" }),
                ]),
            ]),
    },
    {
        key: "scroll-area",
        label: "Scroll Area",
        icon: "box",
        make: () =>
            atom("ScrollArea", "scroll-area h-48 rounded-box border border-base-200", undefined, [
                el("div", "scroll-area-content flex flex-col gap-3 p-4", { children: [el("p", undefined, { text: "Long content that scrolls…" })] }),
            ]),
    },
    {
        key: "overflow-list",
        label: "Overflow List",
        icon: "box",
        make: () =>
            atom("OverflowList", "overflow-list gap-2", undefined, [
                atom("OverflowListItem", undefined, undefined, [atom("Badge", "badge badge-outline", { text: "Design" })]),
                atom("OverflowListItem", undefined, undefined, [atom("Badge", "badge badge-outline", { text: "Engineering" })]),
                atom("OverflowListItem", undefined, undefined, [atom("Badge", "badge badge-outline", { text: "Marketing" })]),
            ]),
    },
    {
        key: "join",
        label: "Join",
        icon: "box",
        make: () =>
            atom("Join", "join", undefined, [
                atom("Button", "btn join-item", { label: "One" }),
                atom("Button", "btn join-item", { label: "Two" }),
                atom("Button", "btn join-item", { label: "Three" }),
            ]),
    },
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
    {
        key: "icon",
        label: "Icon",
        icon: "box",
        hint: "Renders as a placeholder on canvas until a host wires an icon resolver",
        make: () => atom("Icon", "text-base-content", { name: "star" }),
    },
    {
        key: "prose",
        label: "Prose",
        icon: "article",
        hint: "Typographic defaults for long-form content",
        make: () =>
            atom("Prose", "prose", undefined, [
                el("h2", undefined, { text: "About this article" }),
                el("p", undefined, {
                    text: "Prose gives long-form content considered typographic defaults — headings, lists, and quotes just work.",
                }),
            ]),
    },
    {
        key: "blockquote",
        label: "Blockquote",
        icon: "quote",
        make: () =>
            atom("Blockquote", undefined, undefined, [
                el("p", undefined, { text: "Great design is invisible until it's missing." }),
                atom("BlockquoteCite", undefined, { text: "— Design team" }),
            ]),
    },
    {
        key: "display",
        label: "Display",
        icon: "heading",
        hint: "An oversized hero-scale heading",
        make: () => atom("Display", "display", { level: 1, text: "Big statement" }),
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
    // ── richer standalone form atoms (each generates its whole structure from
    //    props at expand time — no authored children, same as Select) ──────────
    {
        key: "combobox",
        label: "Combobox",
        icon: "select",
        hint: "A searchable, filtered select",
        make: () =>
            atom("Combobox", "combobox-control", {
                items: [{ value: "1", label: "Option 1" }, { value: "2", label: "Option 2" }, { value: "3", label: "Option 3" }],
                placeholder: "Search…",
            }),
    },
    {
        key: "autocomplete",
        label: "Autocomplete",
        icon: "select",
        hint: "A free-text field with filtered suggestions",
        make: () =>
            atom("Autocomplete", "combobox-control", {
                items: [{ value: "1", label: "Option 1" }, { value: "2", label: "Option 2" }, { value: "3", label: "Option 3" }],
                placeholder: "Type to search…",
            }),
    },
    {
        key: "multi-select",
        label: "Multi Select",
        icon: "select",
        hint: "A searchable, multi-value listbox",
        make: () =>
            atom("MultiSelect", "multi-select", {
                items: [{ value: "1", label: "Option 1" }, { value: "2", label: "Option 2" }, { value: "3", label: "Option 3" }],
                value: ["1"],
            }),
    },
    { key: "number-field", label: "Number Field", icon: "input", hint: "A stepper input", make: () => atom("NumberField", "number-field", { name: "quantity", min: 0, max: 10, value: 1 }) },
    { key: "range", label: "Range", icon: "sliders", hint: "A single native-feeling slider", make: () => atom("Range", "range", { min: 0, max: 100, value: 50 }) },
    { key: "slider", label: "Slider", icon: "sliders", hint: "A rich slider with a value readout", make: () => atom("Slider", "slider", { min: 0, max: 100, value: 50, showValue: true }) },
    { key: "switch", label: "Switch", icon: "toggle", make: () => atom("Switch", "switch", { name: "switch" }) },
    { key: "rating", label: "Rating", icon: "star", make: () => atom("Rating", "rating", { max: 5, value: 3, name: "rating" }) },
    {
        key: "phone-input",
        label: "Phone Input",
        icon: "input",
        hint: "A country-code select joined with a number field",
        make: () => atom("PhoneInput", "join", { name: "phone", placeholder: "555 123 4567" }),
    },
    { key: "search-input", label: "Search Input", icon: "search", make: () => atom("SearchInput", "input", { name: "search", placeholder: "Search…" }) },
    { key: "password-input", label: "Password Input", icon: "lock", make: () => atom("PasswordInput", "input", { name: "password", placeholder: "Password" }) },
    { key: "pin-input", label: "PIN Input", icon: "input", hint: "A row of single-character verification-code cells", make: () => atom("PinInput", "pin-input", { length: 6 }) },
    { key: "label-atom", label: "Label", icon: "label", hint: "A static caption for a control", make: () => atom("Label", "label", { text: "Label" }) },
    { key: "date-input", label: "Date Input", icon: "calendar", make: () => atom("DateInput", "segment-field", { name: "date" }) },
    { key: "date-range-input", label: "Date Range Input", icon: "calendar", make: () => atom("DateRangeInput", "date-range-input", { name: "date-range" }) },
    { key: "date-time-input", label: "Date & Time Input", icon: "calendar", make: () => atom("DateTimeInput", "segment-field", { name: "datetime" }) },
    { key: "time-input", label: "Time Input", icon: "clock", make: () => atom("TimeInput", "segment-field", { name: "time" }) },
    { key: "calendar", label: "Calendar", icon: "calendar", hint: "A standalone month-grid date picker (not in a popover)", make: () => atom("Calendar", "calendar", { value: "2026-07-08" }) },
    {
        key: "theme-controller",
        label: "Theme Controller",
        icon: "theme",
        hint: "A button that cycles the page theme",
        make: () => atom("ThemeController", "btn btn-ghost btn-sm", { text: "Toggle theme", themes: ["light", "dark"] }),
    },
    // ── composites (authored children — trigger/content or repeated-option groups) ──
    {
        key: "checkbox-group",
        label: "Checkbox Group",
        icon: "checkbox",
        hint: "A stack of checkboxes sharing one array value",
        make: () =>
            atom("CheckboxGroup", "checkbox-group", undefined, [
                atom("CheckboxOption", "checkbox-option", { name: "plan", value: "starter" }, ["Starter"]),
                atom("CheckboxOption", "checkbox-option", { name: "plan", value: "pro", checked: true }, ["Pro"]),
                atom("CheckboxOption", "checkbox-option", { name: "plan", value: "enterprise" }, ["Enterprise"]),
            ]),
    },
    {
        key: "radio-group",
        label: "Radio Group",
        icon: "radio",
        hint: "A stack of radios sharing one value",
        make: () =>
            atom("RadioGroup", "radio-group", undefined, [
                atom("RadioOption", "radio-option", { name: "plan-radio", value: "starter" }, ["Starter"]),
                atom("RadioOption", "radio-option", { name: "plan-radio", value: "pro", checked: true }, ["Pro"]),
                atom("RadioOption", "radio-option", { name: "plan-radio", value: "enterprise" }, ["Enterprise"]),
            ]),
    },
    {
        key: "toggle-group",
        label: "Toggle Group",
        icon: "toggle",
        hint: "A segmented control of toggle buttons",
        make: () =>
            atom("ToggleGroup", "toggle-group", undefined, [
                atom("ToggleGroupItem", "toggle-group-item", { pressed: true }, ["Day"]),
                atom("ToggleGroupItem", "toggle-group-item", undefined, ["Week"]),
                atom("ToggleGroupItem", "toggle-group-item", undefined, ["Month"]),
            ]),
    },
    {
        key: "input-group",
        label: "Input Group",
        icon: "input",
        hint: "An input with a leading/trailing icon or button",
        make: () =>
            atom("InputGroup", "input-group", undefined, [
                atom("Input", "input input-affix-end", { type: "search", placeholder: "Search…" }),
                el("div", "input-group-end", {
                    children: [atom("InputGroupButton", "input-group-btn", { "aria-label": "Clear" }, ["×"])],
                }),
            ]),
    },
    {
        key: "fieldset",
        label: "Fieldset",
        icon: "label",
        hint: "A labeled group of fields",
        make: () =>
            atom("Fieldset", "fieldset", undefined, [
                atom("FieldsetLegend", "fieldset-legend", { text: "Profile" }),
                atom("Field", "field", undefined, [
                    el("label", "field-label", { text: "Name" }),
                    atom("Input", "input", { type: "text", placeholder: "Enter your name…" }),
                ]),
            ]),
    },
    {
        key: "date-picker",
        label: "Date Picker",
        icon: "calendar",
        hint: "A text field that opens a calendar popover",
        make: () =>
            atom("DatePicker", "relative inline-block", undefined, [
                atom("DatePickerTrigger", "input date-field", undefined, [el("span", "date-field-value", { text: "Select date" })]),
                atom("DatePickerContent", "calendar-popup", { weekStartsOn: 0 }),
            ]),
    },
    {
        key: "date-range-picker",
        label: "Date Range Picker",
        icon: "calendar",
        hint: "A text field that opens a range-selecting calendar popover",
        make: () =>
            atom("DateRangePicker", "relative inline-block", undefined, [
                atom("DateRangePickerTrigger", "input date-field", undefined, [el("span", "date-field-value", { text: "Select dates" })]),
                atom("DateRangePickerContent", "calendar-popup"),
            ]),
    },
    {
        key: "dropzone",
        label: "Dropzone",
        icon: "upload",
        hint: "A drag-and-drop / click-to-browse file target",
        make: () => atom("Dropzone", "dropzone", { title: "Drop files here, or click to browse", hint: "PNG, JPG up to 5MB" }),
    },
    {
        key: "file-upload",
        label: "File Upload",
        icon: "upload",
        hint: "A dropzone with a managed accepted-file list",
        make: () => atom("FileUpload", "dropzone", { title: "Drop files here, or click to browse", hint: "PNG, JPG up to 5MB" }),
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
    {
        key: "toolbar",
        label: "Toolbar",
        icon: "sliders",
        hint: "A control bar with roving focus",
        make: () =>
            atom("Toolbar", "toolbar", undefined, [
                atom("ToolbarButton", "toolbar-button", undefined, ["Bold"]),
                atom("ToolbarButton", "toolbar-button", undefined, ["Italic"]),
                atom("ToolbarSeparator", "toolbar-separator"),
                atom("ToolbarLink", "toolbar-link", { href: "#" }, ["Help"]),
            ]),
    },
    {
        key: "dock",
        label: "Dock",
        icon: "sidebar",
        hint: "An icon/label bottom-nav dock",
        make: () =>
            atom("Dock", "dock", undefined, [
                atom("DockItem", "dock-item dock-item-active", undefined, [el("span", "dock-label", { text: "Home" })]),
                atom("DockItem", "dock-item", undefined, [el("span", "dock-label", { text: "Search" })]),
                atom("DockItem", "dock-item", undefined, [el("span", "dock-label", { text: "Profile" })]),
            ]),
    },
    {
        key: "menubar",
        label: "Menubar",
        icon: "nav",
        hint: "A desktop-app-style menu bar (each menu opens independently)",
        make: () =>
            atom("Menubar", "menubar", undefined, [
                atom("MenubarMenu", undefined, undefined, [
                    atom("MenubarTrigger", "menubar-trigger", undefined, ["File"]),
                    atom(
                        "MenubarContent",
                        "menu absolute mt-2 w-52 p-2 z-10 bg-base-100 rounded-box border border-base-200 shadow-lg",
                        undefined,
                        [
                            atom("MenubarItem", "block w-full text-left px-3 py-2 rounded-btn text-base-content hover:bg-base-200", undefined, ["New file"]),
                            atom("MenubarItem", "block w-full text-left px-3 py-2 rounded-btn text-base-content hover:bg-base-200", undefined, ["Open…"]),
                        ],
                    ),
                ]),
                atom("MenubarMenu", undefined, undefined, [
                    atom("MenubarTrigger", "menubar-trigger", undefined, ["Edit"]),
                    atom(
                        "MenubarContent",
                        "menu absolute mt-2 w-52 p-2 z-10 bg-base-100 rounded-box border border-base-200 shadow-lg",
                        undefined,
                        [
                            atom("MenubarItem", "block w-full text-left px-3 py-2 rounded-btn text-base-content hover:bg-base-200", undefined, ["Undo"]),
                            atom("MenubarItem", "block w-full text-left px-3 py-2 rounded-btn text-base-content hover:bg-base-200", undefined, ["Redo"]),
                        ],
                    ),
                ]),
            ]),
    },
    {
        key: "navigation-menu",
        label: "Navigation Menu",
        icon: "nav",
        hint: "A site nav bar with hover-opened mega-menu panels",
        make: () =>
            atom("NavigationMenu", "navigation-menu", undefined, [
                el("ul", "navigation-menu-list", {
                    children: [
                        atom("NavigationMenuItem", undefined, undefined, [
                            atom("NavigationMenuTrigger", "navigation-menu-trigger", undefined, ["Products"]),
                            atom("NavigationMenuContent", "navigation-menu-popup", undefined, [
                                atom("NavigationMenuLink", "navigation-menu-link", { href: "#" }, ["Overview"]),
                                atom("NavigationMenuLink", "navigation-menu-link", { href: "#" }, ["Pricing"]),
                            ]),
                        ]),
                        atom("NavigationMenuLink", "navigation-menu-link", { href: "#" }, ["Docs"]),
                    ],
                }),
            ]),
    },
    {
        key: "outline",
        label: "Outline",
        icon: "nav",
        hint: "A scroll-spy table of contents",
        make: () =>
            atom("Outline", "outline", {
                items: [
                    { id: "overview", label: "Overview" },
                    { id: "features", label: "Features" },
                    { id: "pricing", label: "Pricing" },
                ],
            }),
    },
    // DropdownMenu deliberately omitted: structurally identical to the existing
    // "Dropdown" block (same `menu` behavior, same trigger/panel/item shape) —
    // a raw registry entry here would be a pure duplicate, not additive.
];

/**
 * Overlay composites — floating/modal UI, all behavior-driven (Trigger +
 * Backdrop/Content parts wired to a real `behavior` marker). Each entry is
 * fully pre-wired (trigger + panel + close), not exposed as broken standalone
 * parts — dropping just a `DialogTrigger` with no `DialogContent` nearby would
 * render a button that does nothing.
 */
const OVERLAY: PaletteItem[] = [
    {
        key: "dialog",
        label: "Dialog",
        icon: "box",
        hint: "A confirm/destructive-action modal with a trigger button",
        make: () =>
            atom("Dialog", undefined, undefined, [
                // DialogTrigger itself lowers to a real <button> — nesting a Button atom
                // inside would produce invalid <button><button> markup, so it carries the
                // button LOOK directly on its own class with a plain text child.
                atom("DialogTrigger", "btn btn-primary btn-sm", undefined, ["Open dialog"]),
                atom("DialogBackdrop", "dialog-backdrop"),
                atom("DialogContent", "dialog-popup", undefined, [
                    atom("DialogTitle", "dialog-title", { text: "Dialog title" }),
                    atom("DialogDescription", "dialog-description", { text: "A short description of what happens next." }),
                    // DialogClose ALSO lowers to a real <button> — same trap as the trigger.
                    el("div", "mt-4 flex justify-end gap-2", {
                        children: [
                            atom("DialogClose", "btn btn-ghost btn-sm", undefined, ["Cancel"]),
                            atom("DialogClose", "btn btn-primary btn-sm", undefined, ["Confirm"]),
                        ],
                    }),
                ]),
            ]),
    },
    {
        key: "drawer",
        label: "Drawer",
        icon: "sidebar",
        hint: "A slide-in panel from the edge of the screen, with a trigger button",
        make: () =>
            atom("Drawer", undefined, undefined, [
                // Same button-in-button trap as Dialog — DrawerTrigger lowers to <button>.
                atom("DrawerTrigger", "btn btn-primary btn-sm", undefined, ["Open drawer"]),
                atom("DrawerBackdrop", "drawer-backdrop"),
                atom("DrawerContent", "drawer-popup", { side: "right" }, [
                    atom("DrawerTitle", "drawer-title", { text: "Drawer title" }),
                    atom("DrawerDescription", "drawer-description", { text: "A short description of what's in this panel." }),
                    // DrawerClose also lowers to a real <button> — same trap.
                    el("div", "mt-4 flex justify-end gap-2", {
                        children: [atom("DrawerClose", "btn btn-ghost btn-sm", undefined, ["Close"])],
                    }),
                ]),
            ]),
    },
    {
        key: "alert-dialog",
        label: "Alert Dialog",
        icon: "warning",
        hint: "A destructive-action confirmation that can't be dismissed by clicking outside",
        make: () =>
            atom("AlertDialog", undefined, undefined, [
                // Same button-in-button trap — AlertDialogTrigger lowers to <button>.
                atom("AlertDialogTrigger", "btn btn-error btn-sm", undefined, ["Delete account"]),
                atom("AlertDialogBackdrop", "dialog-backdrop"),
                atom("AlertDialogContent", "dialog-popup", undefined, [
                    atom("AlertDialogTitle", "dialog-title", { text: "Delete your account?" }),
                    atom("AlertDialogDescription", "dialog-description", {
                        text: "This action cannot be undone. This will permanently delete your account and remove your data.",
                    }),
                    // AlertDialogCancel/Action ALSO lower to a real <button> — same trap.
                    el("div", "mt-4 flex justify-end gap-2", {
                        children: [
                            atom("AlertDialogCancel", "btn btn-ghost btn-sm", undefined, ["Cancel"]),
                            atom("AlertDialogAction", "btn btn-error btn-sm", undefined, ["Delete"]),
                        ],
                    }),
                ]),
            ]),
    },
    {
        key: "popover",
        label: "Popover",
        icon: "box",
        hint: "A click-triggered floating panel anchored to its trigger",
        make: () =>
            atom("Popover", undefined, undefined, [
                // Same button-in-button trap — PopoverTrigger lowers to <button>.
                atom("PopoverTrigger", "btn btn-secondary btn-sm", undefined, ["Open popover"]),
                atom("PopoverContent", "popover", undefined, [
                    atom("PopoverTitle", "popover-title", { text: "Popover title" }),
                    atom("PopoverDescription", "popover-description", { text: "A short bit of extra detail, anchored to the trigger." }),
                ]),
            ]),
    },
    {
        key: "tooltip",
        label: "Tooltip",
        icon: "box",
        hint: "A short hover/focus label anchored to its trigger",
        make: () =>
            atom("Tooltip", undefined, undefined, [
                atom("TooltipTrigger", undefined, undefined, [atom("Button", "btn btn-ghost btn-sm", { label: "Hover me" })]),
                atom("TooltipContent", "tooltip", undefined, ["Helpful tooltip text"]),
            ]),
    },
    {
        key: "command-palette",
        label: "Command Palette",
        icon: "search",
        hint: "A ⌘K-style launcher — opens via hotkey, not a click trigger",
        make: () =>
            atom("CommandPalette", undefined, undefined, [
                atom("CommandPaletteBackdrop", "command-palette-backdrop"),
                atom("CommandPaletteContent", "command-palette-popup", undefined, [
                    el("div", "command-palette-search", {
                        children: [atom("CommandPaletteInput", "command-palette-input", { placeholder: "Type a command or search…" })],
                    }),
                    el("div", "command-palette-list", {
                        children: [
                            atom("CommandPaletteItem", "command-palette-item", undefined, [
                                el("span", "command-palette-item-label", { text: "Go to dashboard" }),
                            ]),
                            atom("CommandPaletteItem", "command-palette-item", undefined, [
                                el("span", "command-palette-item-label", { text: "Create new project" }),
                            ]),
                        ],
                    }),
                ]),
            ]),
    },
    {
        key: "preview-card",
        label: "Preview Card",
        icon: "box",
        hint: "A hover-triggered rich preview (link hovercard)",
        make: () =>
            atom("PreviewCard", undefined, undefined, [
                atom("PreviewCardTrigger", undefined, undefined, [el("a", "outline-link", { text: "@silicaui", attrs: { href: "#" } })]),
                atom("PreviewCardContent", "preview-card", undefined, [
                    el("div", "flex items-center gap-3", {
                        children: [
                            atom("Avatar", "avatar w-10 rounded-full", { alt: "" }),
                            el("div", "flex flex-col", {
                                children: [
                                    el("span", "font-semibold text-base-content", { text: "SilicaUI" }),
                                    el("span", "text-sm text-base-content/70", { text: "Design system & component kit" }),
                                ],
                            }),
                        ],
                    }),
                ]),
            ]),
    },
    // ContextMenu deliberately omitted: no `context-menu.js` CSS exists yet, and
    // Menu's item classes assume an <li> wrapper ContextMenuItem doesn't produce
    // (it lowers to a bare button[role=menuitem]) — a "real" entry here would
    // silently render unstyled. Revisit once the component has real CSS.
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
    {
        key: "empty-state",
        label: "Empty State",
        icon: "box",
        make: () =>
            atom(
                "EmptyState",
                "empty-state",
                { icon: "🗂️", title: "No projects yet", description: "Create your first project to get started." },
                [atom("Button", "btn btn-primary btn-sm", { label: "New project" })],
            ),
    },
    { key: "meter", label: "Meter", icon: "progress", make: () => atom("Meter", "meter", { value: 60 }) },
    { key: "radial-progress", label: "Radial Progress", icon: "progress", make: () => atom("RadialProgress", "radial-progress text-primary", { value: 70 }) },
    {
        key: "indicator",
        label: "Indicator",
        icon: "dot",
        make: () =>
            atom("Indicator", "indicator", undefined, [
                atom("Avatar", "avatar w-12 rounded-full", { alt: "" }),
                el("span", "indicator-item badge badge-primary badge-sm", { text: "3" }),
            ]),
    },
    {
        key: "swap",
        label: "Swap",
        icon: "box",
        hint: "A toggled icon/state swap",
        make: () =>
            atom("Swap", "swap swap-rotate text-3xl", { name: "swap-demo" }, [
                el("div", "swap-on", { text: "😀" }),
                el("div", "swap-off", { text: "😐" }),
            ]),
    },
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
    {
        key: "tree-view",
        label: "Tree View",
        icon: "list",
        hint: "A hierarchical, keyboard-navigable tree",
        make: () =>
            atom("TreeView", "tree", undefined, [
                atom("TreeNode", "tree-item", undefined, [
                    el("div", "tree-node", {
                        children: [el("span", "tree-toggle-spacer"), el("span", "tree-node-label", { text: "Overview" })],
                    }),
                ]),
                atom("TreeNode", "tree-item", undefined, [
                    el("div", "tree-node", {
                        children: [atom("TreeToggle", "tree-toggle"), el("span", "tree-node-label", { text: "Components" })],
                    }),
                    atom("TreeGroup", "tree-group", { defaultExpanded: true }, [
                        atom("TreeNode", "tree-item", undefined, [
                            el("div", "tree-node", {
                                children: [el("span", "tree-toggle-spacer"), el("span", "tree-node-label", { text: "Button" })],
                            }),
                        ]),
                        atom("TreeNode", "tree-item", undefined, [
                            el("div", "tree-node", {
                                children: [el("span", "tree-toggle-spacer"), el("span", "tree-node-label", { text: "Card" })],
                            }),
                        ]),
                    ]),
                ]),
            ]),
    },
    {
        key: "wizard",
        label: "Wizard",
        icon: "steps",
        hint: "A multi-step flow with a Back/Next footer",
        make: () =>
            atom("Wizard", "wizard", undefined, [
                el("div", "wizard-steps", {
                    children: [
                        atom("WizardStep", "wizard-step", undefined, [
                            el("span", "wizard-step-marker", { text: "1" }),
                            el("span", "wizard-step-label", { text: "Account" }),
                        ]),
                        atom("WizardStep", "wizard-step", undefined, [
                            el("span", "wizard-step-marker", { text: "2" }),
                            el("span", "wizard-step-label", { text: "Plan" }),
                        ]),
                        atom("WizardStep", "wizard-step", undefined, [
                            el("span", "wizard-step-marker", { text: "3" }),
                            el("span", "wizard-step-label", { text: "Confirm" }),
                        ]),
                    ],
                }),
                atom("WizardPanel", "wizard-content", undefined, [el("p", "text-base-content/70", { text: "Step content goes here." })]),
                el("div", "wizard-footer", {
                    // WizardBack/Next DO default their own text ("Back"/"Next")
                    // when childless, but the canvas's empty-container check
                    // looks at the AUTHORED node (before that macro fallback
                    // runs), so a childless one shows an "Empty" placeholder
                    // instead — pass the text explicitly, like every other entry.
                    children: [
                        atom("WizardBack", "btn btn-ghost btn-sm", undefined, ["Back"]),
                        atom("WizardNext", "btn btn-primary btn-sm", undefined, ["Next"]),
                    ],
                }),
            ]),
    },
    {
        key: "collapsible",
        label: "Collapsible",
        icon: "collapse",
        hint: "A single animated show/hide disclosure (Base-UI-driven, distinct from the native Collapse above)",
        make: () =>
            atom("Collapsible", "collapsible", undefined, [
                atom("CollapsibleTrigger", "collapsible-trigger", undefined, ["Advanced settings"]),
                atom("CollapsiblePanel", "collapsible-panel", undefined, [
                    el("div", "collapsible-content", { text: "Extra options revealed when expanded." }),
                ]),
            ]),
    },
    {
        key: "stats",
        label: "Stats",
        icon: "stat",
        hint: "Multiple metrics grouped in one bar",
        make: () =>
            atom("Stats", "stats bg-base-100 border border-base-200", undefined, [
                atom("Stat", undefined, { title: "Total Users", value: "1,204", desc: "↗ 12% this month" }),
                atom("Stat", undefined, { title: "Revenue", value: "$48.2k", desc: "↗ 8% this month" }),
                atom("Stat", undefined, { title: "Churn", value: "2.4%", desc: "↘ 0.3% this month" }),
            ]),
    },
    {
        key: "timestamp",
        label: "Timestamp",
        icon: "clock",
        hint: "Intl-formatted date text, no live client JS required",
        make: () => atom("Timestamp", "timestamp", { value: "2026-07-01T12:00:00Z", format: "relative" }),
    },
    {
        key: "metadata-list",
        label: "Metadata List",
        icon: "columns",
        hint: "A key/value property list",
        make: () =>
            atom("MetadataList", "metadata-list", undefined, [
                el("dt", "metadata-list-label", { text: "Status" }),
                el("dd", "metadata-list-value", { text: "Active" }),
                el("dt", "metadata-list-label", { text: "Created" }),
                el("dd", "metadata-list-value", { text: "Jan 3, 2026" }),
                el("dt", "metadata-list-label", { text: "Owner" }),
                el("dd", "metadata-list-value", { text: "Ada Lovelace" }),
            ]),
    },
    {
        key: "list",
        label: "List",
        icon: "list",
        hint: "A vertical list of rows",
        make: () =>
            atom("List", "list border border-base-200", undefined, [
                el("div", "list-row", { children: [el("span", "list-col-grow", { text: "Invoice #1042" })] }),
                el("div", "list-row", { children: [el("span", "list-col-grow", { text: "Invoice #1041" })] }),
                el("div", "list-row", { children: [el("span", "list-col-grow", { text: "Invoice #1040" })] }),
            ]),
    },
    {
        key: "avatar-group",
        label: "Avatar Group",
        icon: "avatar",
        hint: "An overlapping stack of avatars",
        make: () =>
            atom("AvatarGroup", "avatar-group", undefined, [
                atom("Avatar", "avatar w-10 rounded-full avatar-primary", { alt: "" }),
                atom("Avatar", "avatar w-10 rounded-full avatar-secondary", { alt: "" }),
                atom("Avatar", "avatar w-10 rounded-full avatar-accent", { alt: "" }),
            ]),
    },
];

/** Media primitives — carousels, lightboxes, device mockups, and image effects. */
const MEDIA: PaletteItem[] = [
    {
        key: "carousel",
        label: "Carousel",
        icon: "box",
        hint: "A scroll-snapping strip with prev/next + dot navigation",
        make: () =>
            atom("Carousel", "carousel-root", undefined, [
                atom("CarouselItem", "carousel-item w-full shrink-0", undefined, [
                    atom("Image", "h-64 w-full object-cover", { ratio: "wide", alt: "Slide 1" }),
                ]),
                atom("CarouselItem", "carousel-item w-full shrink-0", undefined, [
                    atom("Image", "h-64 w-full object-cover", { ratio: "wide", alt: "Slide 2" }),
                ]),
                atom("CarouselItem", "carousel-item w-full shrink-0", undefined, [
                    atom("Image", "h-64 w-full object-cover", { ratio: "wide", alt: "Slide 3" }),
                ]),
            ]),
    },
    {
        key: "lightbox",
        label: "Lightbox",
        icon: "image",
        hint: "A full-viewport image viewer opened from a thumbnail",
        make: () =>
            atom("Lightbox", undefined, undefined, [
                atom("LightboxTrigger", undefined, undefined, [
                    atom("Image", "h-32 w-32 rounded-box object-cover", { ratio: "square", alt: "Open image" }),
                ]),
                atom("LightboxBackdrop", "lightbox-backdrop"),
                atom("LightboxContent", "lightbox-popup", undefined, [
                    atom("LightboxSlide", undefined, undefined, [atom("Image", "lightbox-image", { alt: "Preview" })]),
                    atom("LightboxClose", "lightbox-close", undefined, ["✕"]),
                    atom("LightboxPrev", "lightbox-nav lightbox-nav-prev"),
                    atom("LightboxNext", "lightbox-nav lightbox-nav-next"),
                    atom("LightboxCounter", "lightbox-counter"),
                ]),
            ]),
    },
    {
        key: "mockup-window",
        label: "Mockup Window",
        icon: "layout",
        make: () =>
            atom("MockupWindow", "mockup-window border border-base-300", undefined, [
                el("div", "flex justify-center px-4 py-16", { text: "Your content here" }),
            ]),
    },
    {
        key: "mockup-browser",
        label: "Mockup Browser",
        icon: "layout",
        make: () =>
            atom("MockupBrowser", "mockup-browser border border-base-300", undefined, [
                el("div", "mockup-browser-toolbar", { children: [el("div", "mockup-browser-input", { text: "https://example.com" })] }),
                el("div", "flex justify-center px-4 py-16", { text: "Page content" }),
            ]),
    },
    {
        key: "mockup-code",
        label: "Mockup Code",
        icon: "code",
        make: () =>
            atom("MockupCode", "mockup-code", undefined, [
                el("pre", undefined, { text: "npm install @wizeworks/silicaui", attrs: { "data-prefix": "$" } }),
                el("pre", undefined, { text: "Done in 1.2s", attrs: { "data-prefix": ">" } }),
            ]),
    },
    {
        key: "mockup-phone",
        label: "Mockup Phone",
        icon: "smartphone",
        make: () =>
            atom("MockupPhone", "mockup-phone", undefined, [
                el("div", "mockup-phone-display", { children: [atom("Image", "h-full w-full object-cover", { alt: "App screen" })] }),
            ]),
    },
    {
        key: "mask",
        label: "Mask",
        icon: "box",
        hint: "Clips an image to a shape (hexagon, circle, squircle, …)",
        make: () =>
            atom("Mask", "mask mask-hexagon w-32 h-32", undefined, [atom("Image", "h-full w-full object-cover", { ratio: "square", alt: "" })]),
    },
    {
        key: "diff",
        label: "Diff",
        icon: "columns",
        hint: "A before/after image comparison",
        make: () =>
            atom("Diff", "diff aspect-video", undefined, [
                el("div", "diff-item-1", { children: [atom("Image", "h-full w-full object-cover", { alt: "Before" })] }),
                el("div", "diff-item-2", { children: [atom("Image", "h-full w-full object-cover", { alt: "After" })] }),
                el("div", "diff-resizer", { children: [el("div", "diff-grip")] }),
            ]),
    },
    {
        key: "overlay",
        label: "Overlay",
        icon: "image",
        hint: "A caption scrim over an image, revealed on hover",
        make: () =>
            atom("Overlay", "overlay rounded-box h-64", { reveal: "hover" }, [
                atom("Image", undefined, { ratio: "wide", alt: "Gallery photo" }),
                atom("OverlayScrim", "overlay-scrim", { placement: "bottom" }, [
                    el("h3", "text-lg font-semibold", { text: "Photo caption" }),
                    el("p", "text-sm text-white/80", { text: "A short description of the image." }),
                ]),
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
        { key: "overlay", label: "Overlay", items: OVERLAY },
        { key: "feedback", label: "Feedback", items: FEEDBACK },
        { key: "data", label: "Data", items: DATA },
        { key: "media", label: "Media", items: MEDIA },
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
