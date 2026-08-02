/**
 * Shared parts for the HERO FAMILY — five opening sections built from one set of
 * headline / action / media primitives, so a fix to the action row lands in all
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
 * 3. The five layouts SHARE slot names — `headline`, `subhead`, `cta`,
 *    `secondary`, `image`, `trust`. Swapping one hero for another is the most
 *    common edit a user makes here, and a host's fill writes BY NAME, so shared
 *    names mean the content survives the swap instead of resetting to demo copy.
 *
 * TYPE COMES FROM `.display-*`, NOT a `text-4xl @3xl:text-5xl` chain. The display
 * ramp is fluid via `cqi` (silicaui/src/components/typography.js), so it scales
 * against the container each section already establishes: one class, no
 * breakpoint variants, and it stays honest under the builder's device toggle.
 * Every hero root must therefore carry `@container` or the clamp falls back to
 * the viewport.
 */
import { atom, el, slot } from "../kit";
import type { ComponentNode, ElementNode } from "../schema";

/**
 * The headline. Always an `<h1>` — a hero is the page's opening statement, and
 * exactly one of these per layout is asserted in verify.mjs.
 */
export function headline(cls: string, text: string): ElementNode {
    return slot(el("h1", cls, { text }), {
        name: "headline",
        type: "text",
        label: "Headline",
        required: true,
    });
}

/** The supporting line under the headline. `.lead` carries size, leading, and full ink. */
export function subhead(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "subhead",
        type: "text",
        label: "Subheadline",
    });
}

/**
 * The primary action. `href` lowers it to an `<a>` — a hero CTA navigates. The
 * one exception is Email Capture, whose button submits a form and so builds its
 * own `type: "submit"` node rather than calling this.
 */
export function primaryCta(cls: string, label = "Start free"): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "cta",
        type: "link",
        label: "Primary action",
    });
}

/** The quieter second action — the "talk to us" / "see how it works" half of the pair. */
export function secondaryCta(cls: string, label = "Book a demo"): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "secondary",
        type: "link",
        label: "Secondary action",
    });
}

/** The action pair. A column on a narrow container, a row from `@sm` up. */
export function actions(cls: string, primary?: string, secondary?: string): ElementNode {
    return el("div", cls, {
        children: [primaryCta("btn btn-primary btn-lg", primary), secondaryCta("btn btn-outline btn-lg", secondary)],
    });
}

/**
 * The hero's media. `ratio` appends an aspect utility, so callers that stretch
 * the image themselves (Image Overlay's full-bleed layer) must omit it — an
 * `aspect-video` fights `h-full` and the picture stops covering.
 */
export function heroImage(cls: string, alt: string, ratio?: "wide" | "square" | "portrait"): ComponentNode {
    const props: Record<string, unknown> = { alt };
    if (ratio) props.ratio = ratio;
    return slot(atom("Image", cls, props), {
        name: "image",
        type: "image",
        label: "Hero image",
    });
}

/**
 * The proof line — overlapped faces beside a claim. `.avatar-group` does the
 * overlap and the separating ring, so the row needs no per-avatar chrome.
 *
 * `size-9` sets BOTH axes: `.avatar` ships a 2.5rem square, and a bare `w-*`
 * would narrow the width while the height stayed, ovalling every face.
 *
 * Full ink on the claim, deliberately. Reading it IS the point of the row, which
 * is exactly the case RULE #3 reserves against fading text out.
 */
export function trustRow(cls: string, text = "Trusted by 12,000+ teams shipping every day"): ElementNode {
    return el("div", cls, {
        children: [
            atom("AvatarGroup", "avatar-group", undefined, [
                atom("Avatar", "avatar size-9", { alt: "" }),
                atom("Avatar", "avatar size-9", { alt: "" }),
                atom("Avatar", "avatar size-9", { alt: "" }),
            ]),
            slot(el("p", "text-sm text-base-content", { text }), {
                name: "trust",
                type: "text",
                label: "Proof line",
            }),
        ],
    });
}

/**
 * A customer wordmark for an in-hero logo strip. A plain styled `<span>` stand-in
 * the author swaps for a real mark — full ink, because recognizing it is the
 * whole job (the same call logo-cloud.ts makes).
 */
export function logoMark(name: string): ElementNode {
    return el("span", "text-lg font-semibold tracking-tight text-base-content", { text: name });
}
