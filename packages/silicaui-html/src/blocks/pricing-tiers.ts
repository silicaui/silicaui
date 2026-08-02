/**
 * Pricing — Tiers. Three plan cards with the middle one accented. The default
 * shape of a SaaS pricing page, and the one to reach for unless the page needs
 * something the other four do better.
 *
 * Container-query responsive in three tiers: one column on a phone, two at
 * `@xl` (the featured card leads), three past `@3xl`.
 *
 * Every line is a real subtree, so a host fills plan names, prices, and actions
 * by slot (`plan1`/`price1`/`cta1` …) rather than being handed one opaque card.
 */
import { block, el } from "../kit";
import { heading, planCard, subhead } from "./pricing-kit";

export const pricingTiers = block({
    key: "pricing_tiers",
    name: "Pricing — Tiers",
    category: "pricing",
    version: "2.0.0",
    description: "Three plan cards with a featured middle plan.",
    tags: ["pricing", "plans", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                children: [
                    el("div", "mb-12 flex flex-col items-center gap-3 text-center", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "Simple, transparent pricing"),
                            subhead(
                                "max-w-xl text-base-content",
                                "Start free, then pick the plan that grows with you. Change or cancel at any time.",
                            ),
                        ],
                    }),
                    el("div", "grid grid-cols-1 items-start gap-6 @xl:grid-cols-2 @3xl:grid-cols-3", {
                        children: [
                            planCard({
                                index: 1,
                                name: "Starter",
                                price: "$0",
                                cadence: "/month",
                                blurb: "Everything you need to put a store online.",
                                features: ["1 project", "Community support", "Basic analytics", "SilicaUI subdomain"],
                                cta: "Get started",
                            }),
                            planCard({
                                index: 2,
                                name: "Pro",
                                price: "$29",
                                cadence: "/month",
                                blurb: "For a store that's already selling.",
                                features: [
                                    "Unlimited projects",
                                    "Priority support",
                                    "Advanced analytics",
                                    "Custom domain",
                                    "Abandoned-cart recovery",
                                ],
                                cta: "Start Pro trial",
                                featured: true,
                            }),
                            planCard({
                                index: 3,
                                name: "Team",
                                price: "$99",
                                cadence: "/month",
                                blurb: "For teams that publish together.",
                                features: ["Everything in Pro", "5 seats included", "SSO and audit logs", "Sandbox environments"],
                                cta: "Contact sales",
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
