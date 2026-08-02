/**
 * Navbar — Brand Left. The everyday site header: brand on the left with the nav
 * links clustered BESIDE it, and the actions pushed to the far right.
 *
 * The link cluster is the whole point of this variant. It used to be a
 * `justify-between` row, which optically centered the links and made this
 * indistinguishable from `navbar_center_links` — one of the two reasons the
 * navbar entries read as interchangeable. `gap-8` + `ml-auto` on the action
 * group is what separates them now.
 *
 * Fully editable: every link, label, and button is a real child node (not a
 * prop), so a builder edits them in place. Container-query responsive in three
 * tiers — narrow is brand + theme + hamburger, `@sm:` reveals the sign-in link,
 * `@md:` is the full desktop bar — with a `disclosure`-driven mobile menu
 * correlated to the root by document order (no ids).
 *
 * The first child `<div>` keeps `px-6 py-4`: it is the node the builder's
 * Layout-mode repaint test selects and asserts computed padding on.
 */
import { behave, block, el } from "../kit";
import { brand, ctaButton, hamburger, mobilePanel, navLink, signInLink, themeToggle } from "./navbar-kit";

const LINKS = [
    ["Product", "link1"],
    ["Pricing", "link2"],
    ["Docs", "link3"],
    ["Company", "link4"],
] as const;

export const navbar = block({
    key: "navbar",
    name: "Navbar — Brand Left",
    category: "nav",
    version: "1.1.0",
    description: "Brand on the left with links beside it, sign-in, theme toggle, and a primary action.",
    tags: ["nav", "header", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["disclosure", "theme-toggle"],
    emailEligible: false,
    root: behave(
        el("header", "@container bg-base-100 border-b border-base-200", {
            children: [
                el("div", "mx-auto flex w-full max-w-6xl items-center gap-8 px-6 py-4", {
                    children: [
                        brand("wordmark shrink-0"),
                        el("nav", "hidden items-center gap-6 @md:flex", {
                            children: LINKS.map(([label, name]) => navLink(label, name)),
                        }),
                        el("div", "ml-auto flex items-center gap-3", {
                            children: [
                                signInLink("hidden text-sm font-medium text-base-content hover:text-primary @sm:inline"),
                                themeToggle("btn btn-ghost btn-square btn-sm"),
                                ctaButton("btn btn-primary btn-sm hidden @md:inline-block"),
                                hamburger("btn btn-ghost btn-square btn-sm @md:hidden"),
                            ],
                        }),
                    ],
                }),
                mobilePanel(
                    "flex flex-col gap-1 border-t border-base-200 px-6 py-3 @md:hidden",
                    LINKS,
                    { secondary: "Sign in", cta: "Get started" },
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
