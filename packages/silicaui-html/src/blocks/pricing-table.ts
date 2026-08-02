/**
 * Pricing — Comparison. The feature matrix: plans across the top, capabilities
 * down the side, a tick or a dash in every cell. Reach for it when the question
 * on the page is "what's the difference?" rather than "how much?" — three cards
 * with three different-length bullet lists cannot answer that, because the reader
 * has to hold all three in their head at once.
 *
 * A REAL `<table>`, not a grid of divs. The relationship between "SSO" and the
 * Team column is a data relationship, and only a table exposes it: `scope="col"`
 * and `scope="row"` are what let a screen reader announce "Team, SSO, included"
 * instead of reading a wall of unattached ticks. `.table` supplies the chrome.
 *
 * The tick is an `Icon`; the "not included" cell is an em dash with an
 * `aria-label`, because an unlabelled dash is announced as nothing at all and
 * the row then sounds like the feature is simply missing from that plan.
 *
 * `overflow-x-auto` on the wrapper: five columns will not fit a phone, and a
 * table that overflows its section pushes the whole page sideways.
 */
import { atom, block, el, slot } from "../kit";
import { heading, subhead } from "./pricing-kit";
import type { Child, ElementNode } from "../schema";

const PLANS = [
    ["Starter", "$0", "plan1", "price1"],
    ["Pro", "$29", "plan2", "price2"],
    ["Team", "$99", "plan3", "price3"],
] as const;

/** A column header: plan name over its price. */
const planHead = ([name, price, nameSlot, priceSlot]: (typeof PLANS)[number]) =>
    el("th", "px-4 py-4 text-center", {
        attrs: { scope: "col" },
        children: [
            slot(el("p", "text-sm font-semibold text-base-content", { text: name }), {
                name: nameSlot,
                type: "text",
                label: "Plan name",
            }),
            slot(el("p", "text-2xl font-semibold text-base-content", { text: price }), {
                name: priceSlot,
                type: "text",
                label: "Price",
            }),
        ],
    });

/**
 * An included cell. The tick carries the meaning visually and `sr-only` text
 * carries it to everyone else — the `Icon` macro hard-codes `aria-hidden="true"`
 * and drops any prop it doesn't know (component.ts), so an `aria-label` passed
 * to it is silently discarded and the cell announces as empty. Every yes/no cell
 * in this table is therefore a glyph PLUS a text twin.
 */
const yes = () =>
    el("td", "px-4 py-3 text-center", {
        children: [
            atom("Icon", "inline-block text-primary", { name: "check" }),
            el("span", "sr-only", { text: "Included" }),
        ],
    });

const no = () =>
    el("td", "px-4 py-3 text-center text-base-content", {
        children: [
            el("span", undefined, { text: "—", attrs: { "aria-hidden": "true" } }),
            el("span", "sr-only", { text: "Not included" }),
        ],
    });

/** One capability row: the feature name, then a cell per plan. */
const row = (feature: string, included: readonly [boolean, boolean, boolean]) =>
    el("tr", undefined, {
        children: [
            el("th", "px-4 py-3 text-left text-sm font-normal text-base-content", {
                attrs: { scope: "row" },
                text: feature,
            }),
            ...included.map((on) => (on ? yes() : no())),
        ],
    });

/** The closing action row — one button per column. */
const ctaRow = (): ElementNode => {
    const cells: Child[] = [el("td", undefined, {})];
    const labels = ["Get started", "Start trial", "Contact sales"] as const;
    labels.forEach((label, i) => {
        cells.push(
            el("td", "px-4 pt-6 text-center", {
                children: [
                    slot(
                        atom("Button", i === 1 ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm", { label, href: "#" }),
                        { name: `cta${i + 1}`, type: "link", label: "Plan action" },
                    ),
                ],
            }),
        );
    });
    return el("tr", undefined, { children: cells });
};

export const pricingTable = block({
    key: "pricing_table",
    name: "Pricing — Comparison",
    category: "pricing",
    version: "1.0.0",
    description: "A feature matrix comparing every plan row by row.",
    tags: ["pricing", "plans", "comparison"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-5xl px-6 py-16 @3xl:py-20", {
                children: [
                    el("div", "mb-12 flex flex-col items-center gap-3 text-center", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "Compare every plan"),
                            subhead("max-w-xl text-base-content", "Everything each plan includes, side by side."),
                        ],
                    }),
                    el("div", "overflow-x-auto", {
                        children: [
                            el("table", "table w-full", {
                                children: [
                                    el("caption", "sr-only", { text: "Feature comparison across SilicaUI plans" }),
                                    el("thead", undefined, {
                                        children: [
                                            el("tr", undefined, {
                                                children: [
                                                    // The empty corner cell. `<td>`, not `<th>`: a header
                                                    // cell with no content is announced as a blank column
                                                    // header on every row that follows it.
                                                    el("td", undefined, {}),
                                                    ...PLANS.map(planHead),
                                                ],
                                            }),
                                        ],
                                    }),
                                    el("tbody", undefined, {
                                        children: [
                                            row("Projects", [true, true, true]),
                                            row("Custom domain", [false, true, true]),
                                            row("Advanced analytics", [false, true, true]),
                                            row("Abandoned-cart recovery", [false, true, true]),
                                            row("Team seats", [false, false, true]),
                                            row("SSO and audit logs", [false, false, true]),
                                            row("Sandbox environments", [false, false, true]),
                                            row("Priority support", [false, true, true]),
                                        ],
                                    }),
                                    el("tfoot", undefined, { children: [ctaRow()] }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
