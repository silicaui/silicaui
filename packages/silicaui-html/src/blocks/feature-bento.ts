/**
 * Features — Bento. An asymmetric grid: one wide lead cell, two squares, and a
 * tall one. Reach for it when the features are NOT equals — the bento's whole
 * argument is that the big cell matters more, which is information a uniform
 * three-up grid throws away.
 *
 * EVERY SPAN IS A LITERAL CLASS. `@3xl:col-span-2` is written out per cell, never
 * composed from a number: the builder harness and apps/site `@source`-scan this
 * directory to safelist block utilities, and a computed `` `col-span-${n}` `` is
 * invisible to that scan, so the CSS never generates and the bento silently
 * collapses to a plain stack. This is the single most likely way this block
 * breaks, and it looks fine in the editor when it does.
 *
 * The grid is 1 column on a phone, 2 at `@xl`, and 3 past `@3xl` where the spans
 * finally apply — below that every cell is full width and the asymmetry is off,
 * which is correct: a bento at 380px is just a stack with extra rules.
 */
import { block, el } from "../kit";
import { featureCard, heading, subhead } from "./feature-kit";

export const featureBento = block({
    key: "feature_bento",
    name: "Features — Bento",
    category: "features",
    version: "1.0.0",
    description: "An asymmetric grid where the lead feature gets the biggest cell.",
    tags: ["features", "grid", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                children: [
                    el("div", "mb-10 flex max-w-2xl flex-col gap-3", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "One platform, four fewer subscriptions"),
                            subhead("text-base-content", "The parts you were paying separately for, working together by default."),
                        ],
                    }),
                    el("div", "grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3", {
                        children: [
                            featureCard(
                                {
                                    index: 1,
                                    title: "A storefront that stays fast",
                                    body: "Static output, inlined icons, no client runtime to boot before the page paints. Your slowest page is still under a second.",
                                    icon: "layout",
                                },
                                "flex flex-col gap-3 rounded-box border border-base-200 bg-base-100 p-8 @xl:col-span-2",
                            ),
                            featureCard(
                                {
                                    index: 2,
                                    title: "Analytics without a tag manager",
                                    body: "Traffic, funnel, and revenue in one view.",
                                    icon: "stat",
                                },
                                "flex flex-col gap-3 rounded-box border border-base-200 bg-base-100 p-6 @3xl:row-span-2",
                            ),
                            featureCard(
                                {
                                    index: 3,
                                    title: "Checkout that already works",
                                    body: "Cards, wallets, and tax handled before you write a line.",
                                    icon: "pricing",
                                },
                                "flex flex-col gap-3 rounded-box border border-base-200 bg-base-100 p-6",
                            ),
                            featureCard(
                                {
                                    index: 4,
                                    title: "Search your customers expect",
                                    body: "Typo-tolerant, synonym-aware, and indexed as you publish.",
                                    icon: "search",
                                },
                                "flex flex-col gap-3 rounded-box border border-base-200 bg-base-100 p-6",
                            ),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
