/**
 * Testimonials — Logo Wall. A grid of customer wordmarks with one quote pinned
 * inside it, occupying two cells. Reach for it when the names are the proof and
 * the quote is the caption — an enterprise page, a "who uses this" section.
 *
 * IT IS NOT `logo_cloud` WITH A QUOTE BOLTED ON. The logo cloud is a strip that
 * says "these companies exist as customers"; this says "here is one of them
 * telling you why", with the wall as context. Different claim, different block.
 *
 * The marks are styled `<span>`s the author swaps for real SVGs — full ink,
 * because recognising them is the entire job, which is the case house RULE #3
 * reserves against fading things out.
 */
import { block, el } from "../kit";
import { attribution, heading, logoMark, quoteBody } from "./testimonial-kit";

const MARKS = ["Meridian", "Halcyon", "Brightline", "Loom & Co", "Northgate", "Ardent", "Cassiel", "Wexford"] as const;

const QUOTE = {
    index: 1,
    quote: "“Three of the names on this wall told us to try it. That's why we did, and it's why we're on it now.”",
    author: "Ines Okafor",
    role: "VP Digital, Northgate Retail",
} as const;

export const testimonialLogos = block({
    key: "testimonial_logos",
    name: "Testimonials — Logo Wall",
    category: "testimonial",
    version: "1.0.0",
    description: "A wall of customer wordmarks with one quote pinned inside it.",
    tags: ["testimonial", "social-proof", "logos"],
    colors: ["base-100", "base-200", "base-content"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                children: [
                    heading("mb-10 max-w-2xl text-3xl font-semibold text-base-content @2xl:text-4xl", "The teams you'd expect, already here"),
                    el("div", "grid grid-cols-2 gap-px overflow-hidden rounded-box bg-base-200 @3xl:grid-cols-4", {
                        children: [
                            el("figure", "col-span-2 flex flex-col justify-between gap-6 bg-base-100 p-8 @3xl:row-span-2", {
                                children: [
                                    quoteBody("text-lg font-medium leading-relaxed text-base-content", QUOTE, true),
                                    attribution("flex items-center gap-3", QUOTE, "avatar w-10 rounded-full"),
                                ],
                            }),
                            // EIGHT marks, and the count is arithmetic rather than
                            // taste. The `gap-px` over a `base-200` fill means an
                            // unfilled cell is not empty space, it is a visible hole
                            // in the wall. The quote occupies 2×1 cells at two
                            // columns and 2×2 at four, so eight is the only count
                            // that closes the grid at BOTH widths (10 and 12 cells).
                            ...MARKS.map((name, i) =>
                                el("div", "flex items-center justify-center bg-base-100 p-8", {
                                    children: [logoMark(name, i + 1)],
                                }),
                            ),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
