/**
 * Footer — Closing CTA. The last ask and the footer as ONE block: an oversized
 * closing headline with an action pair, then a hairline, then a slim link and
 * legal bar. Reach for it on a landing page whose whole job is the conversion.
 *
 * IT IS A DARK THEME ISLAND. `data-theme="dark"` on the root means every token
 * inside — `bg-base-100`, `text-base-content`, `btn-primary` — resolves against
 * the dark palette with no per-theme CSS and no hardcoded ink, so the section
 * reads as a deliberate full-bleed closer in a light page AND still inverts
 * correctly when the whole page is already dark. hero-spotlight.ts uses the same
 * mechanism; a `bg-neutral text-neutral-content` pair would have looked the same
 * on the one screen we tested and broken on the other.
 *
 * WHY IT LIVES IN THE FOOTER FAMILY AND NOT `cta`: it terminates the page. It
 * carries the mark, the links, and the copyright, and nothing follows it. The
 * `cta` family is for bands that interrupt a page mid-scroll — `cta_band` is the
 * one to reach for when a real footer comes after.
 *
 * `display-3` rather than a `text-4xl @2xl:text-5xl` chain: the display ramp is
 * fluid via `cqi` (silicaui/src/components/typography.js), so it scales against
 * the `@container` the root establishes — one class, honest under the builder's
 * device toggle.
 */
import { atom, block, el, slot } from "../kit";
import { SOCIAL, brandMark, legalBar, linkRow, socialRow } from "./footer-kit";

export const footerClosingCta = block({
    key: "footer_closing_cta",
    name: "Footer — Closing CTA",
    category: "footer",
    version: "1.0.0",
    description: "A dark full-bleed closing ask over a slim link and legal bar.",
    tags: ["footer", "cta", "conversion", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("footer", "@container bg-base-100", {
        attrs: { "data-theme": "dark" },
        children: [
            el("div", "mx-auto w-full max-w-5xl px-6", {
                children: [
                    el("div", "flex flex-col items-center gap-6 py-20 text-center @3xl:py-28", {
                        children: [
                            slot(el("h2", "display-3 max-w-3xl", { text: "Your store is one afternoon away" }), {
                                name: "headline",
                                type: "text",
                                label: "Headline",
                                required: true,
                            }),
                            slot(
                                el("p", "lead max-w-xl", {
                                    text: "Start free, publish today, and move to a paid plan only when you're selling.",
                                }),
                                { name: "subhead", type: "text", label: "Subheadline" },
                            ),
                            el("div", "mt-2 flex flex-col gap-3 @sm:flex-row", {
                                children: [
                                    slot(atom("Button", "btn btn-primary btn-lg", { label: "Start free", href: "#" }), {
                                        name: "primary",
                                        type: "link",
                                        label: "Primary action",
                                    }),
                                    slot(atom("Button", "btn btn-outline btn-lg", { label: "Talk to sales", href: "#" }), {
                                        name: "secondary",
                                        type: "link",
                                        label: "Secondary action",
                                    }),
                                ],
                            }),
                        ],
                    }),
                    el("div", "flex flex-col gap-5 border-t border-base-200 py-8 @2xl:flex-row @2xl:items-center @2xl:justify-between", {
                        children: [
                            brandMark("wordmark wordmark-sm"),
                            linkRow("flex flex-wrap items-center gap-x-6 gap-y-2", [
                                ["Product", "link1"],
                                ["Pricing", "link2"],
                                ["Docs", "link3"],
                                ["Careers", "link4"],
                            ]),
                            socialRow("flex items-center gap-5", SOCIAL),
                        ],
                    }),
                    legalBar("flex flex-col gap-4 border-t border-base-200 py-6 @2xl:flex-row @2xl:items-center @2xl:justify-between", [
                        linkRow("flex flex-wrap items-center gap-x-6 gap-y-2", [
                            ["Privacy", "link5"],
                            ["Terms", "link6"],
                        ]),
                    ]),
                ],
            }),
        ],
    }),
});
