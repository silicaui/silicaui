/**
 * Content — prose section. A titled long-form block: an eyebrow, a heading, and
 * two readable body columns. For "About", policy, or docs-style copy. Container-
 * query responsive: the body collapses to one column on a narrow container.
 */
import { block, el, slot } from "../kit";

export const contentProse = block({
  key: "content_prose",
  name: "Content — prose section",
  category: "content",
  version: "1.0.0",
  description: "A titled long-form section with an eyebrow, heading, and two body columns.",
  tags: ["content", "about", "prose"],
  colors: ["base-100", "base-content", "primary"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("div", "mx-auto w-full max-w-4xl px-6 py-16", {
        children: [
          slot(
            el("p", "mb-2 text-sm font-semibold uppercase tracking-wide text-primary", { text: "Our story" }),
            { name: "eyebrow", type: "text", label: "Eyebrow" },
          ),
          slot(
            el("h2", "mb-6 text-3xl font-semibold text-base-content @2xl:text-4xl", {
              text: "Built for people who make things",
            }),
            { name: "heading", type: "text", label: "Heading", required: true },
          ),
          el("div", "grid grid-cols-1 gap-6 text-base-content/70 @2xl:grid-cols-2", {
            children: [
              slot(
                el("p", undefined, {
                  text: "We started with a simple belief: building for the web should feel as direct as sketching on paper. Every decision since has followed from that — fewer layers, faster feedback, no lock-in.",
                }),
                { name: "body1", type: "text", label: "Body — first column" },
              ),
              slot(
                el("p", undefined, {
                  text: "Today thousands of teams use our tools to launch stores, sites, and docs in an afternoon. We're still small, still obsessed with the details, and still shipping every week.",
                }),
                { name: "body2", type: "text", label: "Body — second column" },
              ),
            ],
          }),
        ],
      }),
    ],
  }),
});
