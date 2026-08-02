/**
 * Testimonials — Grid. Three customer cards, side by side. Reach for it when the
 * argument is breadth — different industries, different sizes, the same result —
 * which a single pull-quote cannot make no matter how good the quote is.
 *
 * The quotes are NUMBERED slots (`quote1`…`quote3`), and `quote1`'s triplet is
 * the same content a swap down to the single pull-quote layout will read.
 */
import { block, el } from "../kit";
import { heading, quoteCard } from "./testimonial-kit";

export const testimonialsGrid = block({
    key: "testimonials_grid",
    name: "Testimonials — Grid",
    category: "testimonial",
    version: "2.0.0",
    description: "A three-up grid of customer testimonial cards.",
    tags: ["testimonial", "social-proof", "grid"],
    colors: ["base-100", "base-200", "base-content"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                children: [
                    heading("mb-10 text-center text-3xl font-semibold text-base-content @2xl:text-4xl", "Loved by teams everywhere"),
                    el("div", "grid grid-cols-1 items-stretch gap-6 @xl:grid-cols-2 @3xl:grid-cols-3", {
                        children: [
                            quoteCard({
                                index: 1,
                                quote: "“Setup took an afternoon and support has been outstanding ever since.”",
                                author: "Priya Nair",
                                role: "Founder, Loom & Co",
                            }),
                            quoteCard({
                                index: 2,
                                quote: "“The editor is fast enough that our whole team actually uses it, which was never true of the last one.”",
                                author: "Marcus Reed",
                                role: "Design Lead, Halcyon",
                            }),
                            quoteCard({
                                index: 3,
                                quote: "“We replaced three tools with this and never looked back.”",
                                author: "Sofia Álvarez",
                                role: "COO, Brightline",
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
