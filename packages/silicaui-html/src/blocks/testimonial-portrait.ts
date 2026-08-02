/**
 * Testimonial — Portrait. One customer, photographed, with the quote and the
 * number it produced beside them. Reach for it for a case-study callout — the
 * strongest single piece of proof a marketing page can carry, because it has a
 * face, a claim, and a figure in one glance.
 *
 * THE METRIC IS THE POINT. A quote alone is an opinion; "cut time-to-publish by
 * 80%" beside it is the evidence. It sits under the attribution rather than
 * above the quote, because above the quote it would be an eyebrow (house
 * RULE #2) and below it, it reads as the result of what was just said.
 *
 * Portrait ratio on the image, not square: a face in a square crop next to a
 * three-line quote leaves the column short, and `ratio: "portrait"` makes the
 * two columns finish at roughly the same height without a fixed `h-*`.
 */
import { block, el } from "../kit";
import { attribution, metric, portrait, quoteBody } from "./testimonial-kit";

const QUOTE = {
    quote: "“We used to plan a campaign page three weeks out because that's how long the build took. Now the marketing team writes it on Monday and it's live on Monday. The three weeks didn't get faster — they stopped existing.”",
    author: "Dana Whitfield",
    role: "Head of Growth, Meridian",
} as const;

export const testimonialPortrait = block({
    key: "testimonial_portrait",
    name: "Testimonial — Portrait",
    category: "testimonial",
    version: "1.0.0",
    description: "A photographed customer beside their quote and the outcome it produced.",
    tags: ["testimonial", "social-proof", "media"],
    colors: ["base-100", "base-200", "base-content"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 @3xl:grid-cols-5 @3xl:py-20", {
                children: [
                    portrait("w-full rounded-box @3xl:col-span-2", "Dana Whitfield, Head of Growth at Meridian"),
                    el("figure", "flex flex-col gap-6 @3xl:col-span-3", {
                        children: [
                            // The left rule earns its place here: a long, left-aligned
                            // quote with no card around it, so the bar is what marks
                            // where the quotation starts.
                            quoteBody("text-xl font-medium leading-relaxed text-base-content @2xl:text-2xl", QUOTE, true),
                            attribution("flex items-center gap-4", QUOTE),
                            el("div", "flex flex-wrap gap-10 border-t border-base-200 pt-6", {
                                children: [metric("80%", "less time from brief to published page")],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
