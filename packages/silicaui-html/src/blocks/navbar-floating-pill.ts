/**
 * Navbar — Floating Pill. A frosted capsule that floats above the page and
 * sticks as you scroll. The signed-in flavour of the family: an account avatar
 * where the others put a sign-in link and a CTA.
 *
 * `sticky top-4`, never `fixed` — `fixed` is a hard block-lint error (it's the
 * full-viewport overlay vector), and sticky gives the identical floating effect
 * while staying inside the document, which is also why it works on the builder
 * canvas (a scrolling board with no transform on it).
 *
 * `glass` is doing real work here, and it does NOT violate the faded-ink rule:
 * the ink stays `--color-base-content` at full strength and only the SURFACE is
 * translucent, which the linter permits explicitly ("only INK is checked"). The
 * blur is what makes the ink readable over arbitrary content, and both degraded
 * paths — `@supports not (backdrop-filter)` and `prefers-reduced-transparency:
 * reduce` — fall back to a NEAR-SOLID tint, so the accessibility fallback raises
 * contrast rather than lowering it. A solid bar here would just be Brand Left
 * with rounded corners.
 *
 * Three links, not five: a capsule stops reading as a pill once it spans the
 * page. The mobile menu is a separate rounded card BENEATH the capsule rather
 * than a panel inside it — a stacked list inside a `rounded-full` container
 * reads as a mistake.
 */
import { atom, behave, block, el, slot } from "../kit";
import { brand, hamburger, mobilePanel, navLink, themeToggle } from "./navbar-kit";

const LINKS = [
    ["Product", "link1"],
    ["Pricing", "link2"],
    ["Docs", "link3"],
] as const;

export const navbarFloatingPill = block({
    key: "navbar_floating_pill",
    name: "Navbar — Floating Pill",
    category: "nav",
    version: "1.0.0",
    description: "A rounded, frosted capsule that sticks as you scroll, with an account avatar.",
    tags: ["nav", "header", "glass", "sticky", "app"],
    colors: ["base-100", "base-content", "base-300", "primary"],
    behaviors: ["disclosure", "theme-toggle"],
    emailEligible: false,
    root: behave(
        el("header", "@container sticky top-4 z-30 px-4", {
            children: [
                el(
                    "div",
                    "mx-auto flex w-full max-w-4xl items-center gap-6 rounded-full border glass px-3 py-2 shadow-lg",
                    {
                        children: [
                            brand("wordmark wordmark-sm shrink-0 pl-3"),
                            el("nav", "hidden items-center gap-6 @md:flex", {
                                children: LINKS.map(([label, name]) => navLink(label, name)),
                            }),
                            el("div", "ml-auto flex items-center gap-1", {
                                children: [
                                    themeToggle("btn btn-ghost btn-circle btn-sm"),
                                    // The slot sits on the AVATAR (type "image" →
                                    // fills src/alt), not on the wrapping <a>. A
                                    // "link" slot writes a node's text by replacing
                                    // its children wholesale, which on the anchor
                                    // would delete the avatar it wraps.
                                    el("a", "hidden @md:inline-block", {
                                        attrs: { href: "#", "aria-label": "Your account" },
                                        children: [
                                            slot(atom("Avatar", "avatar h-8 w-8", { alt: "" }), {
                                                name: "avatar",
                                                type: "image",
                                                label: "Account avatar",
                                            }),
                                        ],
                                    }),
                                    hamburger("btn btn-ghost btn-circle btn-sm @md:hidden"),
                                ],
                            }),
                        ],
                    },
                ),
                mobilePanel(
                    "mx-auto mt-2 flex w-full max-w-4xl flex-col gap-1 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg @md:hidden",
                    LINKS,
                    { secondary: "Account" },
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
