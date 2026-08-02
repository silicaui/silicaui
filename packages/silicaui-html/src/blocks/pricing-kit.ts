/**
 * Shared parts for the PRICING FAMILY — five ways to present plans, built from
 * one set of heading / plan-card / feature-row primitives, so a fix to the price
 * line lands in all five instead of drifting across five copies.
 *
 * Not a block: `listBlocks()` never sees this file, it just holds the pieces the
 * five block modules assemble.
 *
 * THREE THINGS HERE ARE LOAD-BEARING — read before editing:
 *
 * 1. Every helper builds FRESH nodes on every call. `slot()` MUTATES the node it
 *    is handed (kit.ts), so a shared node constant would put one object into two
 *    blocks' trees and cross-contaminate both slot indexes — and this family
 *    calls `planCard` up to six times in ONE block, which would corrupt a single
 *    tree, never mind two.
 *
 * 2. Every class is a LITERAL string. The builder harness and apps/site
 *    `@source`-scan this directory to safelist block utilities; a class composed
 *    at runtime (`` `p-${n}` ``) is invisible to that scan and never generates.
 *    This is why `planCard` branches between two whole written-out class strings
 *    rather than concatenating a `border-2` on.
 *
 * 3. The five layouts SHARE slot names — `heading`, `subhead`, then `plan{n}`,
 *    `price{n}`, `cta{n}` numbered in reading order. Swapping one pricing layout
 *    for another is a normal edit, a host's fill writes BY NAME, so the plan
 *    names and prices survive a three-tier → comparison-table swap.
 *
 * THE "MOST POPULAR" PILL SITS BESIDE THE PLAN NAME, NEVER ABOVE IT. House
 * RULE #2 bans the eyebrow SLOT, not the badge markup — a pill stacked over a
 * heading is an eyebrow whatever component draws it. On the same line it reads
 * as what it is: state on a card, which is exactly what a badge is for.
 */
import { atom, el, slot } from "../kit";
import type { Child, ComponentNode, ElementNode } from "../schema";

/** One plan, as the card builders take it. */
export interface Plan {
    /** 1-based position in reading order — drives the `plan{n}` slot names. */
    index: number;
    name: string;
    price: string;
    cadence: string;
    blurb?: string;
    features: readonly string[];
    cta: string;
    /** Accents the card and adds the "Most popular" pill. */
    featured?: boolean;
}

/** The section heading. An `<h2>` — a pricing section is never the page's opener. */
export function heading(cls: string, text: string): ElementNode {
    return slot(el("h2", cls, { text }), {
        name: "heading",
        type: "text",
        label: "Heading",
        required: true,
    });
}

/** The line under the heading — what the plans have in common. */
export function subhead(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "subhead",
        type: "text",
        label: "Subheadline",
    });
}

/**
 * One included feature. A `check` glyph rather than a bullet dot: the list is a
 * claim about what you GET, and a tick says that where a dot only separates.
 * `check` exists in both the html icon set and the builder's baked copy, so it
 * renders identically on the canvas and in published output.
 */
export function checkItem(label: string): ElementNode {
    return el("li", "flex items-start gap-2 text-sm text-base-content", {
        children: [
            atom("Icon", "mt-0.5 shrink-0 text-primary", { name: "check" }),
            el("span", undefined, { text: label }),
        ],
    });
}

/** The included-features list. */
export function featureList(cls: string, labels: readonly string[]): ElementNode {
    return el("ul", cls, { children: labels.map(checkItem) });
}

/** The plan's name. Slot `plan{n}`. */
export function planName(cls: string, plan: Plan): ElementNode {
    return slot(el("h3", cls, { text: plan.name }), {
        name: `plan${plan.index}`,
        type: "text",
        label: "Plan name",
    });
}

/** The "Most popular" pill — state on the card, on the plan name's line. */
export function popularPill(text = "Most popular"): ElementNode {
    return el("span", "badge badge-primary badge-sm", { text });
}

/**
 * The price and its cadence, baseline-aligned. Slot `price{n}` is the AMOUNT
 * only — a host swapping currency or running an experiment writes "$29", not
 * "$29/mo", so the cadence stays put and keeps its smaller size.
 */
export function priceLine(plan: Plan): ElementNode {
    return el("div", "flex items-baseline gap-1", {
        children: [
            slot(el("span", "text-4xl font-semibold text-base-content", { text: plan.price }), {
                name: `price${plan.index}`,
                type: "text",
                label: "Price",
            }),
            el("span", "text-sm text-base-content", { text: plan.cadence }),
        ],
    });
}

/** The plan's action. `href` lowers it to an `<a>` — picking a plan navigates. */
export function planCta(plan: Plan): ComponentNode {
    return slot(
        atom("Button", plan.featured ? "btn btn-primary mt-auto w-full" : "btn btn-outline mt-auto w-full", {
            label: plan.cta,
            href: "#",
        }),
        { name: `cta${plan.index}`, type: "link", label: "Plan action" },
    );
}

/** The plan card's chrome — accented when featured (see note 2 on the literals). */
export function cardClass(featured?: boolean): string {
    return featured
        ? "flex flex-col gap-6 rounded-box border-2 border-primary bg-base-100 p-8 shadow-lg"
        : "flex flex-col gap-6 rounded-box border border-base-200 bg-base-100 p-8";
}

/** A complete plan card: name (+ pill), price, optional blurb, features, action. */
export function planCard(plan: Plan, featureListCls = "flex flex-col gap-2"): ElementNode {
    const nameRow: Child[] = [planName("text-sm font-semibold text-base-content", plan)];
    if (plan.featured) nameRow.push(popularPill());

    const children: Child[] = [
        el("div", "flex flex-col gap-2", {
            children: [
                el("div", "flex items-center justify-between gap-3", { children: nameRow }),
                priceLine(plan),
            ],
        }),
    ];
    if (plan.blurb) children.push(el("p", "text-sm text-base-content", { text: plan.blurb }));
    children.push(featureList(featureListCls, plan.features), planCta(plan));

    return el("div", cardClass(plan.featured), { children });
}
