/**
 * Navbar — Center Logo. An editorial header: the links split either side of a
 * centered wordmark, the way a masthead sits above a magazine's sections.
 *
 * THE COLLAPSE FALLS OUT OF DOM ORDER — there is no second brand node and no
 * special-casing, which is worth understanding before editing the class strings:
 *
 *   wide (≥@md)  left nav `flex-1` | brand `shrink-0` | right group `flex-1`
 *                → equal flanks, so the brand is centered by arithmetic, not by
 *                  `justify-center` and a hope that both sides balance.
 *   narrow       the left nav is `hidden`, so it occupies ZERO layout space and
 *                the brand becomes the first laid-out child (flush left). The
 *                right group is still `flex-1 justify-end` but now holds only the
 *                theme toggle and the hamburger (flush right). That is exactly a
 *                normal mobile header, reached by deleting nothing.
 *
 * No `secondary` slot: the symmetry IS this layout, and a fifth item on the
 * right pulls the wordmark off centre. The sign-in lives in the mobile panel
 * only — on desktop this header's job is navigation, not conversion.
 */
import { behave, block, el } from "../kit";
import { brand, ctaButton, hamburger, mobilePanel, navLink, themeToggle } from "./navbar-kit";

const LEFT = [
    ["Product", "link1"],
    ["Pricing", "link2"],
] as const;

const RIGHT = [
    ["Docs", "link3"],
    ["Company", "link4"],
] as const;

export const navbarCenterLogo = block({
    key: "navbar_center_logo",
    name: "Navbar — Center Logo",
    category: "nav",
    version: "1.0.0",
    description: "Links split either side of a centered wordmark — an editorial, magazine-style header.",
    tags: ["nav", "header", "marketing", "editorial"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["disclosure", "theme-toggle"],
    emailEligible: false,
    root: behave(
        el("header", "@container bg-base-100 border-b border-base-200", {
            children: [
                el("div", "mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-5", {
                    children: [
                        el("nav", "hidden flex-1 items-center gap-6 @md:flex", {
                            children: LEFT.map(([label, name]) => navLink(label, name)),
                        }),
                        brand("wordmark wordmark-lg shrink-0"),
                        el("div", "flex flex-1 items-center justify-end gap-4", {
                            children: [
                                el("nav", "hidden items-center gap-6 @md:flex", {
                                    children: RIGHT.map(([label, name]) => navLink(label, name)),
                                }),
                                themeToggle("btn btn-ghost btn-square btn-sm"),
                                ctaButton("btn btn-primary btn-sm hidden @md:inline-block"),
                                hamburger("btn btn-ghost btn-square btn-sm @md:hidden"),
                            ],
                        }),
                    ],
                }),
                mobilePanel(
                    "flex flex-col gap-1 border-t border-base-200 px-6 py-3 @md:hidden",
                    [...LEFT, ...RIGHT],
                    { cta: "Get started" },
                ),
            ],
        }),
        { type: "disclosure" },
    ),
});
