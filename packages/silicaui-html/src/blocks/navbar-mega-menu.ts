/**
 * Navbar — Mega Menu. For a site with more navigation than a row of links can
 * carry: one trigger opens a full-width shelf of grouped links, and a search
 * field with a `⌘K` hint sits beside it.
 *
 * ── Why this is a `disclosure` and not a `menu` ──────────────────────────────
 *
 * ONE `disclosure` root drives TWO trigger/panel pairs. The handler correlates
 * `triggers[i] ↔ panels[i]` by DOCUMENT ORDER, so the ordering below is load-
 * bearing and not cosmetic:
 *
 *   pair 1  shelf trigger (in the desktop nav)  ↔  the shelf (header child #2)
 *   pair 2  hamburger     (in the action group) ↔  mobile panel (header child #3)
 *
 * The obvious alternative — nesting a `menu` root for the shelf — does work
 * (`ownParts` stops at nested behavior boundaries, so the two roots can't steal
 * each other's parts). It was rejected for two reasons:
 *
 *   1. `menu` needs an absolutely-positioned panel, and the builder canvas has no
 *      runtime so it force-reveals every `panel` part. An absolute shelf would
 *      permanently blanket whatever sits below the header — in a block that is a
 *      frame candidate, that means the top of the page is un-editable. This
 *      shelf is in normal flow: it PUSHES instead of covering.
 *   2. `menu` is the wrong semantics anyway. It sets `aria-haspopup="menu"` and
 *      roves with arrow keys, which is for application menus of COMMANDS. A shelf
 *      of links is WAI-ARIA APG's Disclosure Navigation Menu — a button with
 *      `aria-expanded` revealing a group of links, which is what `disclosure`
 *      already syncs.
 *
 * The trade is no outside-click dismiss on the shelf; re-clicking the trigger
 * closes it and the trigger keeps focus. If dismiss is ever wanted, the nested-
 * `menu` variant is a drop-in — accept the canvas overlap as its cost.
 *
 * The shelf carries `hidden` (attribute — closed until hydration) AND `hidden
 * @md:block` (classes), so a shelf opened on desktop can't survive a resize into
 * the mobile layout, where its content is reachable through the stacked panel.
 */
import { atom, behave, block, el, part, slot } from "../kit";
import type { Child } from "../schema";
import { brand, ctaButton, hamburger, mobilePanel, navLink, signInLink, themeToggle } from "./navbar-kit";

const LINKS = [
    ["Pricing", "link1"],
    ["Docs", "link2"],
] as const;

/** One column of the shelf: a group heading over its links. Not an eyebrow — it
 *  is the heading OF the list beneath it, not a label introducing a heading. */
function shelfColumn(title: string, titleSlot: string, items: readonly Child[][]): Child {
    return el("div", "flex flex-col gap-3", {
        children: [
            slot(el("p", "text-sm font-semibold text-base-content", { text: title }), {
                name: titleSlot,
                type: "text",
                label: `${title} column`,
            }),
            el("ul", "flex flex-col gap-2", {
                children: items.map((children) => el("li", undefined, { children })),
            }),
        ],
    });
}

/** A shelf link. */
const shelfLink = (label: string): Child[] => [
    el("a", "text-sm text-base-content hover:text-primary", { text: label, attrs: { href: "#" } }),
];

/** A shelf link wearing a state badge — a Badge on a THING, not a decorative
 *  label. This is the one place the family shows the badge in its real role. */
const shelfLinkNew = (label: string): Child[] => [
    el("span", "flex items-center gap-2", {
        children: [
            el("a", "text-sm text-base-content hover:text-primary", { text: label, attrs: { href: "#" } }),
            atom("Badge", "badge badge-primary badge-sm", { text: "New" }),
        ],
    }),
];

export const navbarMegaMenu = block({
    key: "navbar_mega_menu",
    name: "Navbar — Mega Menu",
    category: "nav",
    version: "1.0.0",
    description: "A trigger opens a full-width shelf of grouped links, with search — for deep navigation.",
    tags: ["nav", "header", "mega", "search", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["disclosure", "theme-toggle"],
    emailEligible: false,
    root: behave(
        el("header", "@container sticky top-0 z-20 bg-base-100 border-b border-base-200", {
            children: [
                el("div", "mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4", {
                    children: [
                        brand("wordmark shrink-0"),
                        el("nav", "hidden items-center gap-6 @md:flex", {
                            children: [
                                // PAIR 1 trigger — the FIRST `trigger` in document order.
                                // The label is a slotted <span>, not the button's own text:
                                // `fillSlots` replaces a node's children wholesale, which
                                // would drop the chevron if the button carried both.
                                part(
                                    el(
                                        "button",
                                        "inline-flex items-center gap-1 text-sm font-medium text-base-content hover:text-primary",
                                        {
                                            attrs: { type: "button" },
                                            children: [
                                                slot(el("span", undefined, { text: "Product" }), {
                                                    name: "menuLabel",
                                                    type: "text",
                                                    label: "Mega menu label",
                                                }),
                                                atom("Icon", "text-xs", { name: "chevronDown" }),
                                            ],
                                        },
                                    ),
                                    "trigger",
                                ),
                                ...LINKS.map(([label, name]) => navLink(label, name)),
                            ],
                        }),
                        el("div", "ml-auto flex items-center gap-3", {
                            children: [
                                el("div", "hidden w-56 @lg:block", {
                                    children: [
                                        atom("InputGroup", "input-group", undefined, [
                                            el("span", "input-group-start", {
                                                children: [atom("Icon", undefined, { name: "search" })],
                                            }),
                                            atom("SearchInput", "input input-sm input-affix-start input-affix-end", {
                                                placeholder: "Search docs",
                                            }),
                                            el("span", "input-group-end", {
                                                children: [atom("Kbd", "kbd kbd-sm", { text: "⌘K" })],
                                            }),
                                        ]),
                                    ],
                                }),
                                signInLink("hidden text-sm font-medium text-base-content hover:text-primary @sm:inline"),
                                themeToggle("btn btn-ghost btn-square btn-sm"),
                                ctaButton("btn btn-primary btn-sm hidden @md:inline-block"),
                                // PAIR 2 trigger.
                                hamburger("btn btn-ghost btn-square btn-sm @md:hidden"),
                            ],
                        }),
                    ],
                }),
                // PAIR 1 panel — the in-flow shelf.
                part(
                    el("div", "hidden border-t border-base-200 bg-base-200 @md:block", {
                        attrs: { hidden: true },
                        children: [
                            el("div", "mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-6 py-8 @2xl:grid-cols-3", {
                                children: [
                                    shelfColumn("Build", "col1", [
                                        shelfLink("Editor"),
                                        shelfLinkNew("Components"),
                                        shelfLink("Themes"),
                                    ]),
                                    shelfColumn("Ship", "col2", [
                                        shelfLink("Publishing"),
                                        shelfLink("Domains"),
                                        shelfLink("Analytics"),
                                    ]),
                                    shelfColumn("Learn", "col3", [
                                        shelfLink("Docs"),
                                        shelfLink("Guides"),
                                        shelfLink("Changelog"),
                                    ]),
                                ],
                            }),
                        ],
                    }),
                    "panel",
                ),
                // PAIR 2 panel. The one place in the family where a row does NOT
                // share its slot with a desktop twin: on mobile the shelf is gone,
                // so "Product" collapses to a single link to the product index
                // (`link0`) rather than a group trigger, and the desktop trigger's
                // `menuLabel` stays desktop-only. Sharing the name would put a
                // `text` slot and a `link` slot under one key, and a host filling
                // `{ label, href }` would silently update only one of them.
                mobilePanel(
                    "flex flex-col gap-1 border-t border-base-200 px-6 py-3 @md:hidden",
                    [["Product", "link0"], ...LINKS],
                    { secondary: "Sign in", cta: "Get started" },
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
