/**
 * Shared parts for the TESTIMONIAL FAMILY — five ways to show proof, built from
 * one set of quote / attribution / wordmark primitives, so a fix to the
 * attribution line lands in all five instead of drifting across five copies.
 *
 * Not a block: `listBlocks()` never sees this file, it just holds the pieces the
 * five block modules assemble.
 *
 * THREE THINGS HERE ARE LOAD-BEARING — read before editing:
 *
 * 1. Every helper builds FRESH nodes on every call. `slot()` MUTATES the node it
 *    is handed (kit.ts), so a shared node constant would put one object into two
 *    blocks' trees and cross-contaminate both slot indexes — and the grid and
 *    carousel call `quoteCard` three times inside ONE block.
 *
 * 2. Every class is a LITERAL string. The builder harness and apps/site
 *    `@source`-scan this directory to safelist block utilities; a class composed
 *    at runtime (`` `gap-${n}` ``) is invisible to that scan and never generates.
 *
 * 3. The five layouts SHARE slot names. The single-quote layouts use `quote`,
 *    `author`, `role`; the multi-quote ones number them `quote{n}` / `author{n}` /
 *    `role{n}` from 1, so the FIRST testimonial's copy survives a swap from a
 *    grid to a single pull-quote — which is the swap people actually make.
 *
 * MARKUP IS `figure` / `blockquote` / `figcaption`, ALWAYS. A quote in a `<div>`
 * with a `<p>` under it is visually identical and semantically nothing: the
 * figure/figcaption pairing is what ties the attribution to the words, and it is
 * the only reason a screen reader can say who said this.
 */
import { atom, el, slot } from "../kit";
import type { Child, ComponentNode, ElementNode } from "../schema";

/** One testimonial, as the card builders take it. */
export interface Quote {
    /** 1-based position. `undefined` uses the unnumbered `quote`/`author`/`role`
     *  slot names — for the layouts that carry exactly one testimonial. */
    index?: number;
    quote: string;
    author: string;
    role: string;
}

const suffix = (q: Quote) => (q.index == null ? "" : String(q.index));

/** The section heading. An `<h2>` — proof never opens the page. */
export function heading(cls: string, text: string): ElementNode {
    return slot(el("h2", cls, { text }), {
        name: "heading",
        type: "text",
        label: "Heading",
        required: true,
    });
}

/**
 * THE BARE-`<blockquote>` TRAP. `typography.js` gives every unstyled
 * `<blockquote>` a 0.25rem `primary` rule and 1.25rem of inline-start padding
 * (`[data-theme] :where(blockquote)`), which is a good default and exactly wrong
 * for a CENTERED pull-quote: the padding shifts the text block off-centre and
 * the rule hangs down one side of it. The v1 single-quote block shipped like
 * that. Because the rule is `:where()` (zero specificity) a plain utility beats
 * it, so every quote in this family states which one it wants.
 */
const QUOTE_RULE = "border-s-4 border-primary ps-5";
const QUOTE_PLAIN = "border-0 ps-0";

/**
 * The quoted words. A real `<blockquote>` (see the header note).
 *
 * `rule` opts into the left bar — right for a long left-aligned quote with no
 * card around it, wrong for anything centered. The two states are complete
 * literal class strings that are only JOINED, never interpolated, so every token
 * is still visible to the `@source` safelist scan.
 */
export function quoteBody(cls: string, q: Quote, rule = false): ElementNode {
    return slot(el("blockquote", [rule ? QUOTE_RULE : QUOTE_PLAIN, cls].join(" "), { text: q.quote }), {
        name: `quote${suffix(q)}`,
        type: "text",
        label: "Quote",
        required: true,
    });
}

/**
 * Who said it. A `<figcaption>` holding the avatar and two lines — the caption
 * element is what binds the attribution to the blockquote above it, so this is
 * never just a flex row of text.
 */
export function attribution(cls: string, q: Quote, avatarCls = "avatar w-12 rounded-full"): ElementNode {
    return el("figcaption", cls, {
        children: [
            atom("Avatar", avatarCls, { alt: "" }),
            el("div", "flex flex-col", {
                children: [
                    slot(el("p", "font-semibold text-base-content", { text: q.author }), {
                        name: `author${suffix(q)}`,
                        type: "text",
                        label: "Author",
                    }),
                    slot(el("p", "text-sm text-base-content", { text: q.role }), {
                        name: `role${suffix(q)}`,
                        type: "text",
                        label: "Role",
                    }),
                ],
            }),
        ],
    });
}

/** A bordered testimonial card — quote over attribution. */
export function quoteCard(q: Quote, cls = "flex flex-col gap-4 rounded-box border border-base-200 bg-base-100 p-6"): ElementNode {
    return el("figure", cls, {
        children: [
            quoteBody("text-base-content", q),
            attribution("mt-auto flex items-center gap-3", q, "avatar w-10 rounded-full"),
        ],
    });
}

/**
 * A customer wordmark for a logo wall. A plain styled `<span>` stand-in the
 * author swaps for a real mark — full ink, because recognizing it is the whole
 * job (the same call hero-kit.ts and logo-cloud.ts make).
 *
 * Slotted as `logo{n}` so a host can at least write the right company name
 * before anyone has exported an SVG.
 */
export function logoMark(name: string, index: number): ElementNode {
    return slot(
        el("span", "text-lg font-semibold tracking-tight text-base-content", { text: name }),
        { name: `logo${index}`, type: "text", label: "Customer name" },
    );
}

/**
 * The outcome line — the number the quote is really about. Slot `metric`.
 * Full ink and large: it is the most-read thing in the section, and fading it
 * would be exactly the habit house RULE #3 exists to stop.
 */
export function metric(value: string, label: string): ElementNode {
    return el("div", "flex flex-col gap-1", {
        children: [
            slot(el("p", "text-4xl font-semibold text-base-content", { text: value }), {
                name: "metric",
                type: "text",
                label: "Outcome figure",
            }),
            slot(el("p", "text-sm text-base-content", { text: label }), {
                name: "metricLabel",
                type: "text",
                label: "Outcome label",
            }),
        ],
    });
}

/** The portrait for the layouts built around a face. Slot `image`. */
export function portrait(cls: string, alt: string): ComponentNode {
    return slot(atom("Image", cls, { alt, ratio: "portrait" }), {
        name: "image",
        type: "image",
        label: "Portrait",
    });
}

/** Convenience for the layouts that assemble their own figure children. */
export function figure(cls: string, children: Child[]): ElementNode {
    return el("figure", cls, { children });
}
