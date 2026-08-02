/**
 * Hero — Centered Content. The symmetric opener: everything stacks down the
 * middle, and the product shot sits UNDER the claim rather than beside it, so
 * the image can run wide enough to actually read. A logo strip closes it.
 *
 * Reach for this over Split CTA when the screenshot needs width — a dashboard,
 * a table, a canvas — because a half-column crop of a dense UI shows nothing.
 *
 * The image carries a border and a shadow on purpose: a product shot with no
 * edge treatment dissolves into the page it is sitting on.
 */
import { block, el, slot } from "../kit";
import { actions, headline, heroImage, logoMark, subhead } from "./hero-kit";

export const heroCentered = block({
    key: "hero_centered",
    name: "Hero — Centered Content",
    category: "hero",
    version: "1.0.0",
    description: "Centered headline and actions over a full-width product shot, closed by a logo strip.",
    tags: ["hero", "marketing", "cta", "social-proof"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center @3xl:py-28", {
                children: [
                    headline("display-1 max-w-3xl", "Everything your team needs, on one canvas"),
                    subhead("lead max-w-2xl", "Design it, build it, and publish it without handing the work between four tools that disagree about everything."),
                    actions("flex flex-col gap-3 @sm:flex-row", "Start building", "Watch the tour"),
                    heroImage("mt-6 w-full rounded-box border border-base-200 shadow-lg", "A preview of the product interface", "wide"),
                    el("div", "mt-8 flex flex-col items-center gap-5", {
                        children: [
                            slot(el("p", "text-sm font-medium text-base-content", { text: "Already running on" }), {
                                name: "trust",
                                type: "text",
                                label: "Proof line",
                            }),
                            el("div", "flex flex-wrap items-center justify-center gap-x-10 gap-y-4", {
                                children: [
                                    logoMark("Meridian"),
                                    logoMark("Halcyon"),
                                    logoMark("Brightline"),
                                    logoMark("Northgate"),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
