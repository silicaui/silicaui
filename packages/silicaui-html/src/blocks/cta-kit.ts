/**
 * Shared parts for the CTA FAMILY — five ways to ask, built from one set of
 * headline / action / media primitives, so a fix to the action pair lands in all
 * five instead of drifting across five copies.
 *
 * Not a block: `listBlocks()` never sees this file, it just holds the pieces the
 * five block modules assemble.
 *
 * THREE THINGS HERE ARE LOAD-BEARING — read before editing:
 *
 * 1. Every helper builds FRESH nodes on every call. `slot()` MUTATES the node it
 *    is handed (kit.ts), so a shared node constant would put one object into two
 *    blocks' trees and cross-contaminate both slot indexes.
 *
 * 2. Every class is a LITERAL string. The builder harness and apps/site
 *    `@source`-scan this directory to safelist block utilities; a class composed
 *    at runtime (`` `py-${n}` ``) is invisible to that scan and never generates.
 *
 * 3. The five layouts SHARE slot names — `headline`, `subhead`, `primary`,
 *    `secondary`, `image`. These are also the names the hero family and
 *    footer-closing-cta use for the same concepts, so moving an ask from the top
 *    of the page to the bottom keeps its copy.
 *
 * WHERE THIS FAMILY STOPS: `cta_band` and friends INTERRUPT a page — something
 * follows them. The dark, full-bleed, this-is-the-end closer is
 * `footer_closing_cta`, because it also carries the mark, the links, and the
 * copyright. Building a second one here would put two near-identical rows in the
 * palette, which is the exact confusion the navbar and hero splits removed.
 *
 * ON `btn` INSIDE A FILLED BAND: a bare `.btn` on `bg-primary` inherits
 * `primary-content` for its ink and would vanish. `cta_band` therefore uses the
 * neutral pair (`btn` for the solid, `btn-ghost` for the quiet one) rather than
 * `btn-primary`, which is the one place in the family the classes differ.
 */
import { atom, el, slot } from "../kit";
import type { ComponentNode, ElementNode } from "../schema";

/** The ask. An `<h2>` — a CTA band is never the page's opening statement. */
export function headline(cls: string, text: string): ElementNode {
    return slot(el("h2", cls, { text }), {
        name: "headline",
        type: "text",
        label: "Headline",
        required: true,
    });
}

/** The line that removes the last objection. */
export function subhead(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "subhead",
        type: "text",
        label: "Subheadline",
    });
}

/** The primary action. `href` lowers it to an `<a>` — a CTA band navigates. */
export function primaryCta(cls: string, label: string): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "primary",
        type: "link",
        label: "Primary action",
    });
}

/** The quieter second path — "talk to sales", "read the docs". */
export function secondaryCta(cls: string, label: string): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "secondary",
        type: "link",
        label: "Secondary action",
    });
}

/**
 * The action pair. A column on a narrow container, a row from `@sm` up.
 * Pass the two button class strings explicitly — a filled band and a card on
 * `base-100` need different button colors, and inferring that from context is
 * the kind of cleverness that ends in an invisible button (see the header note).
 */
export function actions(
    cls: string,
    primary: { label: string; cls: string },
    secondary?: { label: string; cls: string },
): ElementNode {
    const children = [primaryCta(primary.cls, primary.label)];
    if (secondary) children.push(secondaryCta(secondary.cls, secondary.label));
    return el("div", cls, { children });
}

/** The supporting image, for the layouts that have one. */
export function ctaImage(cls: string, alt: string, ratio?: "wide" | "square" | "portrait"): ComponentNode {
    const props: Record<string, unknown> = { alt };
    if (ratio) props.ratio = ratio;
    return slot(atom("Image", cls, props), {
        name: "image",
        type: "image",
        label: "Image",
    });
}

/**
 * The reassurance line under an action — "no card required", "cancel any time".
 * Full ink, deliberately: it exists to be read at the exact moment someone is
 * deciding whether to click, which is the opposite of the de-emphasis case that
 * house RULE #3 reserves faded text for.
 */
export function note(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "note",
        type: "text",
        label: "Reassurance line",
    });
}
