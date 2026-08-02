/**
 * CTA — Boxed Card. The ask as a bordered card floated on the page rather than a
 * full-bleed band. Reach for it mid-article or between two content sections,
 * where a `bg-primary` band edge-to-edge would read as the end of the page and
 * stop people reading.
 *
 * That restraint IS the design. The card earns attention from its border, its
 * radius, and the whitespace around it — not from a saturated fill — which is
 * why it can sit inside a flow of prose without hijacking it.
 */
import { block, el } from "../kit";
import { actions, headline, note, subhead } from "./cta-kit";

export const ctaCard = block({
    key: "cta_card",
    name: "CTA — Boxed Card",
    category: "cta",
    version: "1.0.0",
    description: "A bordered card ask that sits inside a page instead of interrupting it.",
    tags: ["cta", "marketing", "conversion"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-4xl px-6 py-14", {
                children: [
                    el("div", "flex flex-col items-start gap-5 rounded-box border border-base-200 bg-base-100 p-8 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:p-10", {
                        children: [
                            el("div", "flex flex-col gap-2", {
                                children: [
                                    headline("text-2xl font-semibold text-base-content", "Still deciding?"),
                                    subhead(
                                        "max-w-md text-base-content",
                                        "Book twenty minutes with someone who has migrated a store like yours. No pitch deck.",
                                    ),
                                    note("text-sm text-base-content", "Usually available same week."),
                                ],
                            }),
                            actions(
                                "flex w-full flex-col gap-3 @sm:flex-row @2xl:w-auto @2xl:shrink-0",
                                { label: "Book a call", cls: "btn btn-primary" },
                                { label: "Read the guide", cls: "btn btn-ghost" },
                            ),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
