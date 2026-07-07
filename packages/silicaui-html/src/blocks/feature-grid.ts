/**
 * Feature grid — data-bound. Exercises the data primitives: a `collection`
 * repeat over `features`, with per-item `value` binds inside. Statically it
 * renders one card with default copy (+ data-sui-repeat / data-sui-bind attrs a
 * host/runtime hydrates); with a resolver it repeats per item. Container-query
 * responsive (collapses to one column on narrow containers).
 */
import { atom, bind, block, el, repeat, slot } from "../kit";

const card = el("div", "flex flex-col gap-3 p-6 bg-base-200 rounded-box", {
  children: [
    atom("Icon", "text-primary text-2xl", { name: "sparkles" }),
    bind(
      el("h3", "text-lg font-semibold text-base-content", {
        text: "Fast by default",
      }),
      "feature.title",
    ),
    bind(
      el("p", "text-base-content/70", {
        text: "Every page ships lean, so your store feels instant.",
      }),
      "feature.body",
    ),
  ],
});

export const featureGrid = block({
  key: "feature_grid",
  name: "Feature grid — data-bound",
  category: "features",
  version: "1.0.0",
  description:
    "A responsive grid that repeats over a collection, binding each item's fields.",
  tags: ["features", "grid", "dynamic"],
  colors: ["base-100", "base-200", "base-content", "primary"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "bg-base-100 @container p-8", {
    children: [
      slot(
        el("h2", "text-2xl font-semibold text-base-content mb-6", {
          text: "Everything you need",
        }),
        { name: "heading", type: "text", label: "Heading" },
      ),
      repeat(
        el("div", "grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 gap-6", {
          children: [card],
        }),
        "features",
      ),
    ],
  }),
});
