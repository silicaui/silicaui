/**
 * Shared parts for the FEATURES FAMILY — five ways to say what the product does,
 * built from one set of heading / card / checklist primitives, so a fix to the
 * feature card lands in all five instead of drifting across five copies.
 *
 * Not a block: `listBlocks()` never sees this file, it just holds the pieces the
 * five block modules assemble.
 *
 * THREE THINGS HERE ARE LOAD-BEARING — read before editing:
 *
 * 1. Every helper builds FRESH nodes on every call. `slot()`/`bind()` MUTATE the
 *    node they are handed (kit.ts), so a shared node constant would put one
 *    object into two blocks' trees and cross-contaminate both slot indexes —
 *    and `featureCard` is called up to six times inside ONE block here.
 *
 * 2. Every class is a LITERAL string. The builder harness and apps/site
 *    `@source`-scan this directory to safelist block utilities; a class composed
 *    at runtime (`` `col-span-${n}` ``) is invisible to that scan and never
 *    generates — which is exactly the trap the Bento layout would fall into if
 *    its spans were computed.
 *
 * 3. The five layouts SHARE the `heading` slot, and their feature copy is
 *    numbered `feature{n}` / `body{n}` in reading order. A host's fill writes BY
 *    NAME, so swapping a grid for a bento or a checklist keeps the copy.
 *
 * NO EYEBROWS ANYWHERE IN THIS FAMILY (house RULE #2). A features section is
 * where "01 / 02 / 03" step markers and uppercase category chips breed; the
 * heading carries itself and the icon does the visual work. The linter rejects
 * the `uppercase` + `tracking-wide` pairing outright, so this can't drift back.
 */
import { atom, el, slot } from "../kit";
import type { Child, ComponentNode, ElementNode } from "../schema";

/** One feature, as the card builders take it. */
export interface Feature {
    /** 1-based position in reading order — drives the `feature{n}` slot names. */
    index: number;
    title: string;
    body: string;
    /** An icon name present in BOTH the html set and the builder's baked copy. */
    icon: string;
}

/** The section heading. An `<h2>` — a features section never opens the page. */
export function heading(cls: string, text: string): ElementNode {
    return slot(el("h2", cls, { text }), {
        name: "heading",
        type: "text",
        label: "Heading",
        required: true,
    });
}

/** The line under the heading, for the layouts that have room for one. */
export function subhead(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "subhead",
        type: "text",
        label: "Subheadline",
    });
}

/**
 * The feature's glyph. Sized with `text-2xl` rather than a `size-*` utility:
 * `iconSvg` frames every glyph at `1em` (silicaui-html/src/icons.ts) so font-size
 * is what scales it, and a `size-6` would set the span's box while leaving the
 * SVG inside it at the inherited size.
 */
export function featureIcon(name: string, cls = "text-2xl text-primary"): ComponentNode {
    return atom("Icon", cls, { name });
}

/** The feature's name. Slot `feature{n}`. */
export function featureTitle(cls: string, f: Feature): ElementNode {
    return slot(el("h3", cls, { text: f.title }), {
        name: `feature${f.index}`,
        type: "text",
        label: "Feature title",
    });
}

/** The feature's description. Slot `body{n}`. */
export function featureBody(cls: string, f: Feature): ElementNode {
    return slot(el("p", cls, { text: f.body }), {
        name: `body${f.index}`,
        type: "text",
        label: "Feature body",
    });
}

/** A feature card: icon, title, body. `cls` carries the card's own chrome. */
export function featureCard(f: Feature, cls = "flex flex-col gap-3 rounded-box border border-base-200 bg-base-100 p-6"): ElementNode {
    return el("div", cls, {
        children: [
            featureIcon(f.icon),
            featureTitle("text-lg font-semibold text-base-content", f),
            featureBody("text-base-content", f),
        ],
    });
}

/**
 * A feature as a checklist row — glyph beside title-and-body, no card. The
 * `check` glyph exists in both the html icon set and the builder's baked copy,
 * so it renders identically on the canvas and in published output.
 */
export function checkRow(f: Feature): ElementNode {
    return el("li", "flex items-start gap-3", {
        children: [
            atom("Icon", "mt-1 shrink-0 text-primary", { name: "check" }),
            el("div", "flex flex-col gap-1", {
                children: [
                    featureTitle("font-semibold text-base-content", f),
                    featureBody("text-sm text-base-content", f),
                ],
            }),
        ],
    });
}

/** A short supporting bullet — used inside the media rows, not slotted. */
export function point(label: string): ElementNode {
    return el("li", "flex items-center gap-2 text-base-content", {
        children: [
            el("span", "inline-block size-1.5 shrink-0 rounded-full bg-primary", {}),
            el("span", undefined, { text: label }),
        ],
    });
}

/** The supporting image for the media layouts. Slot `image{n}`. */
export function featureImage(cls: string, alt: string, index: number, ratio: "wide" | "square" | "portrait" = "wide"): ComponentNode {
    return slot(atom("Image", cls, { alt, ratio }), {
        name: `image${index}`,
        type: "image",
        label: "Image",
    });
}

/**
 * One row of the alternating layout: copy on one side, image on the other.
 *
 * `flip` swaps them with `@3xl:order-2` on the copy — an ORDER utility, not a
 * `flex-row-reverse`, because the source order has to stay copy-then-image for
 * the stacked narrow layout (and for a screen reader, which reads DOM order and
 * would otherwise hit the image first on every other row).
 */
export function mediaRow(f: Feature, points: readonly string[], flip: boolean): ElementNode {
    const copy: Child[] = [
        featureTitle("text-2xl font-semibold text-base-content", f),
        featureBody("text-base-content", f),
        el("ul", "mt-1 flex flex-col gap-2", { children: points.map(point) }),
    ];
    return el("div", "grid grid-cols-1 items-center gap-8 @3xl:grid-cols-2 @3xl:gap-12", {
        children: [
            el("div", flip ? "flex flex-col gap-3 @3xl:order-2" : "flex flex-col gap-3", { children: copy }),
            featureImage("w-full rounded-box", `${f.title} in the editor`, f.index),
        ],
    });
}
