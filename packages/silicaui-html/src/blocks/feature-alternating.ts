/**
 * Features — Alternating. Three media rows that flip sides down the page. Reach
 * for it when three capabilities each need a picture and a paragraph — the zig
 * gives the eye a reason to keep going where three identical rows would not.
 *
 * THE FLIP IS AN `order-*` UTILITY, NOT `flex-row-reverse`. Source order stays
 * copy-then-image on every row, so the stacked narrow layout reads consistently
 * and a screen reader never hits the image before the heading it belongs to.
 * `mediaRow` in feature-kit.ts is where that lives.
 *
 * Three rows, not five. The alternation is legible at three and becomes a tic at
 * five — at which point the page wants a grid, which is the block next to this
 * one in the palette.
 */
import { block, el } from "../kit";
import { heading, mediaRow, subhead } from "./feature-kit";

export const featureAlternating = block({
    key: "feature_alternating",
    name: "Features — Alternating",
    category: "features",
    version: "1.0.0",
    description: "Three media rows that alternate sides down the page.",
    tags: ["features", "marketing", "media"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                children: [
                    el("div", "mb-14 flex max-w-2xl flex-col gap-3", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "Built for the whole job, not the demo"),
                            subhead(
                                "text-base-content",
                                "Three things every store needs after launch day, and none of them are an add-on.",
                            ),
                        ],
                    }),
                    el("div", "flex flex-col gap-16 @3xl:gap-24", {
                        children: [
                            mediaRow(
                                {
                                    index: 1,
                                    title: "Edit the live page, not a copy of it",
                                    body: "Change copy, prices, and layout against the real thing, then publish when it looks right. No staging drift and nothing to re-key.",
                                    icon: "layout",
                                },
                                ["Container-query previews at every width", "Publish or roll back in one click"],
                                false,
                            ),
                            mediaRow(
                                {
                                    index: 2,
                                    title: "Every change is reversible",
                                    body: "Full version history on every page, with a diff you can actually read and a rollback that takes a second.",
                                    icon: "undo",
                                },
                                ["Named restore points", "See who changed what, and when"],
                                true,
                            ),
                            mediaRow(
                                {
                                    index: 3,
                                    title: "Own the output",
                                    body: "Export clean, self-contained HTML whenever you like. No runtime to license, no lock-in to negotiate your way out of.",
                                    icon: "download",
                                },
                                ["Static HTML and CSS, no build step", "Your domain, your hosting, your call"],
                                false,
                            ),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
