/**
 * Pricing — Single Plan. One price, argued for. The copy and the included list
 * take the left column and the card sits on the right, so the page spends its
 * space explaining the value rather than drawing two more cards nobody will pick.
 *
 * Reach for it when there is exactly one product at exactly one price — a tool,
 * a course, a lifetime licence. A one-card three-column grid with two empty
 * tracks is the alternative, and it looks like something is missing.
 *
 * The card is `@3xl:sticky top-8`, not `fixed`: `fixed` is banned outright by the
 * block linter (a full-viewport overlay vector) and would be wrong anyway — the
 * price should follow the list past the section, not float over the whole page.
 */
import { block, el } from "../kit";
import { featureList, heading, planCard, subhead } from "./pricing-kit";

export const pricingSingle = block({
    key: "pricing_single",
    name: "Pricing — Single Plan",
    category: "pricing",
    version: "1.0.0",
    description: "One plan card beside the copy and checklist that justify it.",
    tags: ["pricing", "plans", "marketing"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-12 px-6 py-16 @3xl:grid-cols-2 @3xl:py-20", {
                children: [
                    el("div", "flex flex-col gap-5", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "One price. Everything in it."),
                            subhead(
                                "max-w-lg text-base-content",
                                "No tiers to compare, no feature held back for a plan you'll be upgraded into later. You get the product.",
                            ),
                            featureList("mt-2 grid grid-cols-1 gap-3 @sm:grid-cols-2", [
                                "Unlimited projects and pages",
                                "Custom domains on every site",
                                "Version history and rollback",
                                "Team seats at no extra cost",
                                "Priority support, same day",
                                "Export your HTML at any time",
                            ]),
                        ],
                    }),
                    el("div", "@3xl:sticky @3xl:top-8", {
                        children: [
                            planCard({
                                index: 1,
                                name: "Complete",
                                price: "$49",
                                cadence: "/month",
                                blurb: "Billed monthly. Cancel any time and keep everything you've published.",
                                features: ["14-day free trial", "No card to start", "Cancel in one click"],
                                cta: "Start free trial",
                                featured: true,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
