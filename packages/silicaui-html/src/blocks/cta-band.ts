/**
 * CTA band — a centered call to action on a filled primary surface: headline,
 * one line of support copy, and a pair of actions. A high-contrast closer for a
 * marketing page. Container-query responsive: the actions sit inline past `@sm`.
 */
import { atom, block, el, slot } from "../kit";

export const ctaBand = block({
  key: "cta_band",
  name: "CTA — centered band",
  category: "cta",
  version: "1.0.0",
  description: "A centered call-to-action band with a headline and primary/secondary actions.",
  tags: ["cta", "marketing", "conversion"],
  colors: ["primary", "primary-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-primary text-primary-content", {
    children: [
      el("div", "mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center", {
        children: [
          slot(
            el("h2", "text-3xl font-semibold @2xl:text-4xl", { text: "Ready to build something great?" }),
            { name: "headline", type: "text", label: "Headline", required: true },
          ),
          slot(
            el("p", "text-lg text-primary-content/80", {
              text: "Start free today — no credit card, no setup, no lock-in.",
            }),
            { name: "subhead", type: "text", label: "Subheadline" },
          ),
          el("div", "flex flex-col gap-3 @sm:flex-row", {
            children: [
              slot(atom("Button", "btn btn-lg", { label: "Start free" }), {
                name: "primary",
                type: "link",
                label: "Primary action",
              }),
              slot(atom("Button", "btn btn-lg btn-ghost", { label: "Talk to sales" }), {
                name: "secondary",
                type: "link",
                label: "Secondary action",
              }),
            ],
          }),
        ],
      }),
    ],
  }),
});
