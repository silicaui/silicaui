/**
 * Pricing — three tiers. Three plan cards, the middle one accented as the
 * "featured" plan. Each card is a real subtree (name, price, feature list,
 * action) so every line is editable in place. Container-query responsive:
 * stacks on a narrow container, three-wide past `@3xl`.
 */
import { atom, block, el, slot } from "../kit";

const feature = (label: string) =>
  el("li", "flex items-center gap-2 text-sm text-base-content/70", {
    children: [
      el("span", "inline-block size-1.5 rounded-full bg-primary", {}),
      el("span", undefined, { text: label }),
    ],
  });

const tier = (
  name: string,
  price: string,
  cadence: string,
  features: string[],
  cta: string,
  featured: boolean,
) =>
  el(
    "div",
    featured
      ? "flex flex-col gap-6 rounded-box border-2 border-primary bg-base-100 p-8 shadow-lg"
      : "flex flex-col gap-6 rounded-box border border-base-200 bg-base-100 p-8",
    {
      children: [
        el("div", "flex flex-col gap-1", {
          children: [
            el("p", "text-sm font-semibold text-base-content", { text: name }),
            el("div", "flex items-baseline gap-1", {
              children: [
                el("span", "text-4xl font-semibold text-base-content", { text: price }),
                el("span", "text-sm text-base-content/60", { text: cadence }),
              ],
            }),
          ],
        }),
        el("ul", "flex flex-col gap-2", { children: features.map(feature) }),
        atom("Button", featured ? "btn btn-primary mt-auto" : "btn btn-outline mt-auto", { label: cta }),
      ],
    },
  );

export const pricingTiers = block({
  key: "pricing_tiers",
  name: "Pricing — three tiers",
  category: "pricing",
  version: "1.0.0",
  description: "A three-column pricing table with a featured middle plan.",
  tags: ["pricing", "plans", "marketing"],
  colors: ["base-100", "base-200", "base-content", "primary"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-200/40", {
    children: [
      el("div", "mx-auto w-full max-w-6xl px-6 py-16", {
        children: [
          el("div", "mb-10 flex flex-col items-center gap-3 text-center", {
            children: [
              slot(
                el("h2", "text-3xl font-semibold text-base-content", { text: "Simple, transparent pricing" }),
                { name: "heading", type: "text", label: "Heading" },
              ),
              slot(
                el("p", "max-w-xl text-base-content/70", {
                  text: "Start free, then pick the plan that grows with you. Cancel anytime.",
                }),
                { name: "subhead", type: "text", label: "Subheadline" },
              ),
            ],
          }),
          el("div", "grid grid-cols-1 gap-6 @xl:grid-cols-2 @3xl:grid-cols-3", {
            children: [
              tier("Starter", "$0", "/mo", ["1 project", "Community support", "Basic analytics"], "Get started", false),
              tier(
                "Pro",
                "$29",
                "/mo",
                ["Unlimited projects", "Priority support", "Advanced analytics", "Custom domain"],
                "Start Pro trial",
                true,
              ),
              tier("Team", "$99", "/mo", ["Everything in Pro", "5 seats included", "SSO & audit logs"], "Contact us", false),
            ],
          }),
        ],
      }),
    ],
  }),
});
