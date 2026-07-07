/**
 * Testimonial — single quote. One large, centered pull-quote with an avatar and
 * an attribution line. The avatar is an `Avatar` atom (a real <img>, so it reads
 * on the canvas). Container-query responsive typography.
 */
import { atom, block, el, slot } from "../kit";

export const testimonialQuote = block({
  key: "testimonial_quote",
  name: "Testimonial — single quote",
  category: "testimonial",
  version: "1.0.0",
  description: "A large centered customer quote with an avatar and attribution.",
  tags: ["testimonial", "social-proof", "quote"],
  colors: ["base-100", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("figure", "mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center", {
        children: [
          slot(
            el("blockquote", "text-2xl font-medium leading-relaxed text-base-content @2xl:text-3xl", {
              text: "“We shipped our storefront in a weekend and doubled conversions the first month. It genuinely changed how our team works.”",
            }),
            { name: "quote", type: "text", label: "Quote", required: true },
          ),
          el("figcaption", "flex items-center gap-4", {
            children: [
              atom("Avatar", "avatar w-12 rounded-full", { alt: "" }),
              el("div", "text-left", {
                children: [
                  slot(el("p", "font-semibold text-base-content", { text: "Dana Whitfield" }), {
                    name: "author",
                    type: "text",
                    label: "Author",
                  }),
                  slot(el("p", "text-sm text-base-content/60", { text: "Head of Growth, Meridian" }), {
                    name: "role",
                    type: "text",
                    label: "Role",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
});
