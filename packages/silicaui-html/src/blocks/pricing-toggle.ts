/**
 * Pricing — Billing Toggle. Monthly and annual prices behind a two-tab switch.
 * Reach for it when the annual discount is part of the pitch: showing "$29/mo
 * billed annually" in small print under a monthly price is the version of this
 * that nobody reads.
 *
 * IT IS THE `tabs` BEHAVIOR, NOT A BESPOKE SWITCH. Two `tab` parts pair
 * positionally with two `panel` parts, and the runtime supplies exclusivity,
 * `aria-selected`, and arrow-key roving for free. A `Toggle` or `Switch` would
 * have looked closer to the reference designs and shipped with none of that.
 *
 * NON-ACTIVE PANELS SHIP `hidden`, following tabs.ts. The `TabsPanel` macro
 * deliberately leaves panels visible pre-hydration (progressive enhancement: a
 * no-JS reader gets all the content), which is right for prose and wrong here —
 * two complete price grids stacked on a no-JS page reads as two contradictory
 * prices, not as fallback content. The builder canvas force-reveals both so they
 * stay editable, which is why the class matters as well as the attribute.
 */
import { behave, block, el, part } from "../kit";
import { heading, planCard, subhead } from "./pricing-kit";
import type { Child } from "../schema";

/**
 * A segment of the billing switch. The active one is filled with `primary`
 * rather than raised with a shadow: the switch sits on `base-200` and a
 * `bg-base-100` thumb on `base-200` is a two-step contrast that disappears
 * entirely in dark mode, where those two tokens sit much closer together.
 */
const tab = (label: string, selected: boolean) =>
    part(
        el(
            "button",
            selected
                ? "rounded-btn px-5 py-2 text-sm font-medium bg-primary text-primary-content"
                : "rounded-btn px-5 py-2 text-sm font-medium text-base-content",
            {
                text: label,
                attrs: {
                    type: "button",
                    role: "tab",
                    "aria-selected": selected ? "true" : "false",
                    tabindex: selected ? 0 : -1,
                },
            },
        ),
        "tab",
    );

const PANEL_CLS = "grid grid-cols-1 items-start gap-6 @xl:grid-cols-2 @3xl:grid-cols-3";

const panel = (children: Child[], open: boolean) =>
    part(
        el("div", PANEL_CLS, {
            attrs: open ? { role: "tabpanel" } : { role: "tabpanel", hidden: true },
            children,
        }),
        "panel",
    );

export const pricingToggle = block({
    key: "pricing_toggle",
    name: "Pricing — Billing Toggle",
    category: "pricing",
    version: "1.0.0",
    description: "Monthly and annual plan prices behind a two-tab billing switch.",
    tags: ["pricing", "plans", "interactive", "tabs"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["tabs"],
    emailEligible: false,
    root: behave(
        el("section", "@container bg-base-200", {
            children: [
                el("div", "mx-auto w-full max-w-6xl px-6 py-16 @3xl:py-20", {
                    children: [
                        el("div", "mb-8 flex flex-col items-center gap-3 text-center", {
                            children: [
                                heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "Pay monthly, or save with annual"),
                                subhead("max-w-xl text-base-content", "Two months free on every annual plan. Switch billing whenever you like."),
                            ],
                        }),
                        el("div", "mb-10 flex justify-center", {
                            children: [
                                el("div", "inline-flex gap-1 rounded-box border border-base-200 bg-base-100 p-1", {
                                    attrs: { role: "tablist" },
                                    children: [tab("Monthly", true), tab("Annual", false)],
                                }),
                            ],
                        }),
                        panel(
                            [
                                planCard({
                                    index: 1,
                                    name: "Starter",
                                    price: "$0",
                                    cadence: "/month",
                                    features: ["1 project", "Community support", "Basic analytics"],
                                    cta: "Get started",
                                }),
                                planCard({
                                    index: 2,
                                    name: "Pro",
                                    price: "$29",
                                    cadence: "/month",
                                    features: ["Unlimited projects", "Priority support", "Advanced analytics", "Custom domain"],
                                    cta: "Start Pro trial",
                                    featured: true,
                                }),
                                planCard({
                                    index: 3,
                                    name: "Team",
                                    price: "$99",
                                    cadence: "/month",
                                    features: ["Everything in Pro", "5 seats included", "SSO and audit logs"],
                                    cta: "Contact sales",
                                }),
                            ],
                            true,
                        ),
                        panel(
                            [
                                planCard({
                                    index: 4,
                                    name: "Starter",
                                    price: "$0",
                                    cadence: "/year",
                                    features: ["1 project", "Community support", "Basic analytics"],
                                    cta: "Get started",
                                }),
                                planCard({
                                    index: 5,
                                    name: "Pro",
                                    price: "$290",
                                    cadence: "/year",
                                    features: ["Unlimited projects", "Priority support", "Advanced analytics", "Custom domain"],
                                    cta: "Start Pro trial",
                                    featured: true,
                                }),
                                planCard({
                                    index: 6,
                                    name: "Team",
                                    price: "$990",
                                    cadence: "/year",
                                    features: ["Everything in Pro", "5 seats included", "SSO and audit logs"],
                                    cta: "Contact sales",
                                }),
                            ],
                            false,
                        ),
                    ],
                }),
            ],
        }),
        { type: "tabs" },
    ),
});
