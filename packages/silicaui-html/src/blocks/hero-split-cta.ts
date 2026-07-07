/**
 * Hero — split with CTA. The proof block: authored once as a neutral tree,
 * consumable three ways (HTML / React / block.json). Uses only already-shipping
 * silicaui classes so it doesn't depend on in-flight vocabulary work.
 *
 * Responsive via container queries (`@container` on the section establishes the
 * container; `@3xl:` collapses the two-column grid on narrow containers) — never
 * viewport variants, per the builder's element-canvas model.
 */
import { atom, block, el, slot } from "../kit";

export const heroSplitCta = block({
  key: "hero_split_cta",
  name: "Hero — split with CTA",
  category: "hero",
  version: "1.0.0",
  description:
    "Two-column hero: copy + primary action on the left, image on the right.",
  tags: ["hero", "marketing", "cta"],
  colors: ["primary", "base-100", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "bg-base-100 @container", {
    children: [
      el("div", "grid grid-cols-1 @3xl:grid-cols-2 gap-8 items-center p-8", {
        children: [
          el("div", "flex flex-col gap-4", {
            children: [
              slot(
                el(
                  "h1",
                  "text-4xl @3xl:text-5xl font-semibold text-base-content",
                  { text: "Ship your store in an afternoon" },
                ),
                { name: "headline", type: "text", label: "Headline", required: true },
              ),
              slot(
                el("p", "text-lg text-base-content/70", {
                  text: "Everything you need to sell online — no code, no wrangling.",
                }),
                { name: "subhead", type: "text", label: "Subheadline" },
              ),
              slot(
                atom("Button", "btn btn-primary btn-lg", { label: "Start free" }),
                { name: "cta", type: "link", label: "Primary button" },
              ),
            ],
          }),
          slot(
            atom("Image", "rounded-box w-full", {
              ratio: "wide",
              alt: "Product preview",
            }),
            { name: "image", type: "image", label: "Hero image" },
          ),
        ],
      }),
    ],
  }),
});
