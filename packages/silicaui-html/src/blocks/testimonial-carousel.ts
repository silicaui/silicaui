/**
 * Testimonials — Carousel. Three quotes, one at a time, with arrows and dots.
 * Reach for it when the proof is long — full paragraphs from named customers
 * that a three-up grid would either truncate or turn into a wall.
 *
 * IT IS THE FIRST BLOCK TO USE THE `carousel` BEHAVIOR. The type has been in the
 * closed vocabulary since the runtime shipped and nothing exercised it, which
 * meant the marker contract had no coverage outside its own unit tests.
 *
 * BUILT FROM THE `Carousel` MACRO, NOT HAND-ROLLED PARTS. The macro
 * (silicaui-html/src/component.ts) expands to the `track`, `prev`, `next`, and
 * one `dot` per slide, and self-applies the behavior marker — so the parts stay
 * correct by construction and a dot is never missing for a slide. The navbar
 * family hand-rolls its disclosure parts because it needs them in specific
 * places in the header; there is no such reason here.
 *
 * NO `autoplay`. A carousel that advances on a timer moves the words someone is
 * reading, and the runtime suppresses it under `prefers-reduced-motion` anyway —
 * so switching it on ships a section that behaves differently for different
 * readers, which is worse than one that behaves the same for everyone.
 */
import { atom, block, el } from "../kit";
import { attribution, heading, quoteBody } from "./testimonial-kit";
import type { Quote } from "./testimonial-kit";

const slide = (q: Quote) =>
    atom("CarouselItem", "carousel-item w-full shrink-0", undefined, [
        el("figure", "mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center", {
            children: [
                quoteBody("text-xl font-medium leading-relaxed text-base-content @2xl:text-2xl", q),
                attribution("flex items-center gap-4 text-left", q),
            ],
        }),
    ]);

export const testimonialCarousel = block({
    key: "testimonial_carousel",
    name: "Testimonials — Carousel",
    category: "testimonial",
    version: "1.0.0",
    description: "Long-form customer quotes one at a time, with arrows and dots.",
    tags: ["testimonial", "social-proof", "interactive", "carousel"],
    colors: ["base-100", "base-200", "base-content"],
    behaviors: ["carousel"],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-5xl px-6 py-16 @3xl:py-20", {
                children: [
                    heading("mb-10 text-center text-3xl font-semibold text-base-content @2xl:text-4xl", "In their words"),
                    atom("Carousel", "carousel-root", undefined, [
                        slide({
                            index: 1,
                            quote: "“We moved eleven country storefronts across in six weeks. The part I still can't quite believe is that we did it without a developer on the project — the team who owns the copy owns the pages now, and nothing goes through us to ship.”",
                            author: "Dana Whitfield",
                            role: "Head of Growth, Meridian",
                        }),
                        slide({
                            index: 2,
                            quote: "“Our old stack needed a build, a preview URL, and a Slack thread to change a price. Now it's an edit and a publish. That sounds small until you count how many prices we change in a week.”",
                            author: "Marcus Reed",
                            role: "Design Lead, Halcyon",
                        }),
                        slide({
                            index: 3,
                            quote: "“The export is what sold us. We can take the HTML and walk at any point, so committing didn't feel like a bet — and eighteen months in we've never needed to.”",
                            author: "Sofia Álvarez",
                            role: "COO, Brightline",
                        }),
                    ]),
                ],
            }),
        ],
    }),
});
