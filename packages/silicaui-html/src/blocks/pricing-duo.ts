/**
 * Pricing — Two Plans. Two wide cards, side by side, each with room for a real
 * feature list in two columns. Reach for it when there genuinely are two
 * answers — free vs paid, self-serve vs enterprise — instead of padding the
 * page to three because three-column pricing is what pricing pages look like.
 *
 * The cards are WIDE on purpose: at two-up each gets roughly half of `max-w-5xl`,
 * which is enough for a two-column feature list. That is the whole reason to
 * pick this over Tiers — you can say more per plan.
 */
import { block, el } from "../kit";
import { heading, planCard, subhead } from "./pricing-kit";

export const pricingDuo = block({
    key: "pricing_duo",
    name: "Pricing — Two Plans",
    category: "pricing",
    version: "1.0.0",
    description: "Two wide plan cards with room for a two-column feature list each.",
    tags: ["pricing", "plans", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-5xl px-6 py-16 @3xl:py-20", {
                children: [
                    el("div", "mb-12 flex flex-col items-center gap-3 text-center", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "Two plans, no calculator"),
                            subhead(
                                "max-w-xl text-base-content",
                                "Free while you're building. One price once you're selling — everything included, no per-seat maths.",
                            ),
                        ],
                    }),
                    el("div", "grid grid-cols-1 items-start gap-6 @2xl:grid-cols-2", {
                        children: [
                            planCard(
                                {
                                    index: 1,
                                    name: "Free",
                                    price: "$0",
                                    cadence: "forever",
                                    blurb: "Build the whole store and publish it. Upgrade when you take your first order.",
                                    features: [
                                        "Unlimited pages",
                                        "SilicaUI subdomain",
                                        "Community support",
                                        "Basic analytics",
                                        "Up to 10 products",
                                        "Standard checkout",
                                    ],
                                    cta: "Start building",
                                },
                                "grid grid-cols-1 gap-2 @sm:grid-cols-2",
                            ),
                            planCard(
                                {
                                    index: 2,
                                    name: "Growth",
                                    price: "$49",
                                    cadence: "/month",
                                    blurb: "Everything, for every store you run. No seat counting, no feature gates.",
                                    features: [
                                        "Everything in Free",
                                        "Custom domain",
                                        "Unlimited products",
                                        "Abandoned-cart recovery",
                                        "Priority support",
                                        "Advanced analytics",
                                        "Unlimited team seats",
                                        "SSO and audit logs",
                                    ],
                                    cta: "Start 14-day trial",
                                    featured: true,
                                },
                                "grid grid-cols-1 gap-2 @sm:grid-cols-2",
                            ),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
