/**
 * Footer — Columns. The everyday closer: a brand column with a blurb and the
 * social row, three columns of links beside it, and a legal bar underneath.
 * Reach for it on a normal marketing site; the other four are for when the page
 * ends differently.
 *
 * Container-query responsive in three tiers — one column on a phone, two at
 * `@md`, and the brand column widens to two of five tracks past `@3xl` so the
 * blurb sets on two lines instead of five.
 *
 * WHAT CHANGED FROM v1: the block had exactly TWO slots (`brand`, `blurb`), so a
 * host could fill the wordmark and nothing else — twelve links and three column
 * headings were hard-coded past the reach of `fillSlots`. Everything readable is
 * a slot now, and the mark is a real `Wordmark` so a logo can be assigned
 * through the Inspector instead of retyped as text.
 */
import { block, el } from "../kit";
import { SOCIAL, blurb, brandMark, legalBar, linkColumn, linkRow, socialRow } from "./footer-kit";

export const footer = block({
    key: "footer",
    name: "Footer — Columns",
    category: "footer",
    version: "2.0.0",
    description: "Brand blurb and social beside three link columns, over a legal bar.",
    tags: ["footer", "nav", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("footer", "@container bg-base-100 border-t border-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-14", {
                children: [
                    el("div", "grid grid-cols-1 gap-10 @md:grid-cols-2 @3xl:grid-cols-5", {
                        children: [
                            el("div", "flex flex-col gap-4 @3xl:col-span-2", {
                                children: [
                                    brandMark("wordmark self-start"),
                                    blurb(
                                        "max-w-xs text-sm text-base-content",
                                        "The fastest way to launch and grow your online store.",
                                    ),
                                    socialRow("mt-2 flex items-center gap-5", SOCIAL),
                                ],
                            }),
                            linkColumn("Product", "col1", [
                                ["Features", "link1"],
                                ["Pricing", "link2"],
                                ["Integrations", "link3"],
                                ["Changelog", "link4"],
                            ]),
                            linkColumn("Company", "col2", [
                                ["About", "link5"],
                                ["Careers", "link6"],
                                ["Blog", "link7"],
                                ["Contact", "link8"],
                            ]),
                            linkColumn("Resources", "col3", [
                                ["Documentation", "link9"],
                                ["Help center", "link10"],
                                ["Status", "link11"],
                                ["Community", "link12"],
                            ]),
                        ],
                    }),
                    legalBar(
                        "mt-12 flex flex-col gap-4 border-t border-base-200 pt-6 @2xl:flex-row @2xl:items-center @2xl:justify-between",
                        [
                            linkRow("flex flex-wrap items-center gap-x-6 gap-y-2", [
                                ["Privacy", "link13"],
                                ["Terms", "link14"],
                                ["Security", "link15"],
                            ]),
                        ],
                    ),
                ],
            }),
        ],
    }),
});
