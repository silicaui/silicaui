/**
 * Testimonials — grid. Three customer cards, each a quote plus an avatar and
 * attribution. Container-query responsive: one column on a narrow container,
 * three past `@3xl`.
 */
import { atom, block, el, slot } from "../kit";

const card = (quote: string, name: string, role: string) =>
  el("figure", "flex flex-col gap-4 rounded-box border border-base-200 bg-base-100 p-6", {
    children: [
      el("blockquote", "text-base-content/80", { text: quote }),
      el("figcaption", "mt-auto flex items-center gap-3", {
        children: [
          atom("Avatar", "avatar w-10 rounded-full", { alt: "" }),
          el("div", undefined, {
            children: [
              el("p", "text-sm font-semibold text-base-content", { text: name }),
              el("p", "text-xs text-base-content/60", { text: role }),
            ],
          }),
        ],
      }),
    ],
  });

export const testimonialsGrid = block({
  key: "testimonials_grid",
  name: "Testimonials — grid of three",
  category: "testimonial",
  version: "1.0.0",
  description: "A three-up grid of customer testimonial cards.",
  tags: ["testimonial", "social-proof", "grid"],
  colors: ["base-100", "base-200", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-200/40", {
    children: [
      el("div", "mx-auto w-full max-w-6xl px-6 py-16", {
        children: [
          slot(
            el("h2", "mb-10 text-center text-3xl font-semibold text-base-content", {
              text: "Loved by teams everywhere",
            }),
            { name: "heading", type: "text", label: "Heading" },
          ),
          el("div", "grid grid-cols-1 gap-6 @xl:grid-cols-2 @3xl:grid-cols-3", {
            children: [
              card(
                "“Setup took an afternoon and support has been outstanding ever since.”",
                "Priya Nair",
                "Founder, Loom & Co",
              ),
              card(
                "“The editor is fast enough that our whole team actually uses it.”",
                "Marcus Reed",
                "Design Lead, Halcyon",
              ),
              card(
                "“We replaced three tools with this and never looked back.”",
                "Sofia Álvarez",
                "COO, Brightline",
              ),
            ],
          }),
        ],
      }),
    ],
  }),
});
