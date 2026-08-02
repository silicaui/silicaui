/**
 * Navbar — Center Links. A symmetrical marketing header: brand left, navigation
 * optically centered, and the sign-in / sign-up pair on the right.
 *
 * The centering is real, not `justify-between`. Both flanks are `flex-1`
 * (`flex: 1 1 0%` ⇒ EQUAL widths, not "whatever's left"), so the nav sits dead
 * centre whether the brand is one word or three and whether the right side holds
 * one action or two. A `justify-between` row only looks centered when the two
 * ends happen to balance.
 *
 * This is the variant that showcases the auth pair — a ghost `Sign in` beside a
 * primary `Sign up`, which is the shape most SaaS headers actually ship. Sticky
 * and a notch taller (`py-5`) so it reads as a different header at a glance, not
 * a re-arrangement of the same one.
 */
import { behave, block, el } from "../kit";
import { brand, ctaButton, hamburger, mobilePanel, navLink, signInButton, themeToggle } from "./navbar-kit";

const LINKS = [
    ["Product", "link1"],
    ["Pricing", "link2"],
    ["Docs", "link3"],
    ["Company", "link4"],
] as const;

export const navbarCenterLinks = block({
    key: "navbar_center_links",
    name: "Navbar — Center Links",
    category: "nav",
    version: "1.0.0",
    description: "Brand left, navigation centered, sign in + sign up right — a balanced marketing header.",
    tags: ["nav", "header", "marketing", "sticky"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["disclosure", "theme-toggle"],
    emailEligible: false,
    root: behave(
        el("header", "@container sticky top-0 z-20 bg-base-100 border-b border-base-200", {
            children: [
                el("div", "mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-5", {
                    children: [
                        el("div", "flex flex-1 items-center", {
                            children: [brand("wordmark shrink-0")],
                        }),
                        el("nav", "hidden items-center justify-center gap-8 @md:flex", {
                            children: LINKS.map(([label, name]) => navLink(label, name)),
                        }),
                        el("div", "flex flex-1 items-center justify-end gap-2", {
                            children: [
                                themeToggle("btn btn-ghost btn-square btn-sm"),
                                signInButton("btn btn-ghost btn-sm hidden @sm:inline-block"),
                                ctaButton("btn btn-primary btn-sm hidden @md:inline-block", "Sign up"),
                                hamburger("btn btn-ghost btn-square btn-sm @md:hidden"),
                            ],
                        }),
                    ],
                }),
                mobilePanel(
                    "flex flex-col gap-1 border-t border-base-200 px-6 py-3 @md:hidden",
                    LINKS,
                    { secondary: "Sign in", cta: "Sign up" },
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
