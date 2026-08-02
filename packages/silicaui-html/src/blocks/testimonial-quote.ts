/**
 * Testimonial — Quote. One large, centered pull-quote with an avatar and an
 * attribution line. Reach for it when there is a single quote worth the whole
 * section — a named customer everyone in the audience recognises.
 *
 * It uses the UNNUMBERED slot names (`quote`, `author`, `role`), which are also
 * the first triplet in the multi-quote layouts. Swapping a grid down to this
 * block keeps the first testimonial's copy instead of resetting it.
 */
import { block, el } from "../kit";
import { attribution, quoteBody } from "./testimonial-kit";

const QUOTE = {
    quote: "“We shipped our storefront in a weekend and doubled conversions in the first month. It genuinely changed how our team works.”",
    author: "Dana Whitfield",
    role: "Head of Growth, Meridian",
} as const;

export const testimonialQuote = block({
    key: "testimonial_quote",
    name: "Testimonial — Quote",
    category: "testimonial",
    version: "2.0.0",
    description: "One large centered customer quote with an avatar and attribution.",
    tags: ["testimonial", "social-proof", "quote"],
    colors: ["base-100", "base-content"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("figure", "mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center @3xl:py-20", {
                children: [
                    // No left rule: the quote is CENTERED, and `typography.js`'s
                    // default `<blockquote>` bar plus its inline-start padding would
                    // push the text block off-centre and hang a line down one side of
                    // it. v1 shipped exactly that. See `quoteBody` in the kit.
                    quoteBody("text-2xl font-medium leading-relaxed text-base-content @2xl:text-3xl", QUOTE),
                    attribution("flex items-center gap-4 text-left", QUOTE),
                ],
            }),
        ],
    }),
});
