/**
 * Navbar — site header. A brand on the left, inline nav links in the middle, and
 * a primary action on the right. Fully editable: every link/label/button is a
 * real child node (not a prop), so a builder edits them in place. Container-query
 * responsive — the link row hides on a narrow container (`@md:` reveals it) in
 * favor of a `disclosure`-driven mobile menu: a trigger button toggles a stacked
 * link panel beneath the bar, correlated to the root by document order (no ids).
 */
import { atom, behave, block, el, part, slot } from "../kit";

const link = (label: string) =>
    el("a", "text-sm font-medium text-base-content/70 hover:text-base-content", {
        text: label,
        attrs: { href: "#" },
    });

const mobileLink = (label: string) =>
    el(
        "a",
        "block rounded-btn px-3 py-2 text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content",
        { text: label, attrs: { href: "#" } },
    );

// Desktop + mobile share one slot name per link so `fillSlots` (label + href)
// updates both copies from a single content key — a consumer shouldn't have
// to know the block renders each link twice for the responsive breakpoint.
const navLink = (label: string, slotName: string) =>
    slot(link(label), { name: slotName, type: "link", label });
const navLinkMobile = (label: string, slotName: string) =>
    slot(mobileLink(label), { name: slotName, type: "link", label });

export const navbar = block({
    key: "navbar",
    name: "Navbar — brand, links, action",
    category: "nav",
    version: "1.0.0",
    description: "A site header: brand, inline navigation links, and a primary action.",
    tags: ["nav", "header", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["disclosure"],
    emailEligible: false,
    root: behave(
        el("header", "@container bg-base-100 border-b border-base-200", {
            children: [
                el("div", "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4", {
                    children: [
                        slot(
                            el("a", "text-lg font-semibold text-base-content", { text: "SilicaUI", attrs: { href: "#" } }),
                            { name: "brand", type: "text", label: "SilicaUI" },
                        ),
                        el("nav", "hidden items-center gap-6 @md:flex", {
                            children: [
                                navLink("Product", "link1"),
                                navLink("Pricing", "link2"),
                                navLink("Docs", "link3"),
                                navLink("Company", "link4"),
                            ],
                        }),
                        el("div", "flex items-center gap-3", {
                            children: [
                                slot(
                                    el(
                                        "a",
                                        "hidden text-sm font-medium text-base-content/70 hover:text-base-content @sm:inline",
                                        { text: "Sign in", attrs: { href: "#" } },
                                    ),
                                    { name: "secondary", type: "link", label: "Secondary link" },
                                ),
                                slot(
                                    atom("Button", "btn btn-primary btn-sm hidden @md:inline-block", { label: "Get started" }),
                                    { name: "cta", type: "link", label: "Primary action" },
                                ),
                                part(
                                    el("button", "btn btn-ghost btn-square btn-sm @md:hidden", {
                                        attrs: { type: "button", "aria-label": "Toggle navigation menu" },
                                        children: [atom("Icon", undefined, { name: "menu" })],
                                    }),
                                    "trigger",
                                ),
                            ],
                        }),
                    ],
                }),
                part(
                    el("nav", "flex flex-col gap-1 border-t border-base-200 px-6 py-3 @md:hidden", {
                        attrs: { hidden: true },
                        children: [
                            navLinkMobile("Product", "link1"),
                            navLinkMobile("Pricing", "link2"),
                            navLinkMobile("Docs", "link3"),
                            navLinkMobile("Company", "link4"),
                        ],
                    }),
                    "panel",
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
