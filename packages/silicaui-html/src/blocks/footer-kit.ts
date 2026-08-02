/**
 * Shared parts for the FOOTER FAMILY — five closing sections built from one set
 * of brand / link / legal primitives, so a fix to the link column lands in all
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
 * 3. The five layouts SHARE slot names. `brand`, `blurb` and `copyright` exist in
 *    every one that has the concept, column titles are `col1…col5`, and the links
 *    themselves are `link1…linkN` in reading order regardless of how many columns
 *    they're split across. Swapping one footer for another is the most common
 *    edit here and a host's fill writes BY NAME, so shared names mean the content
 *    survives the swap instead of resetting to demo copy.
 *
 * EVERY LINK GETS FULL INK. A footer is the canonical place a design system
 * starts fading text out — `text-base-content/60` on eighteen links reads as
 * "tasteful" and is just unreadable at 12px on a light surface. House RULE #3:
 * these are links a person is meant to read and click, so they take the real ink
 * token and earn their de-emphasis from SIZE (`text-sm`) instead. The linter
 * enforces this (`no-faded-ink`), which is why it can't drift back.
 */
import { atom, el, slot } from "../kit";
import { themeToggle } from "./navbar-kit";
import type { Child, ComponentNode, ElementNode } from "../schema";

// The theme switcher is re-exported rather than re-implemented: the nested
// behavior-root wiring (and the deliberate lack of an `aria-label`, which the
// handler owns) is subtle enough that a second copy would drift. See
// navbar-kit.ts for why it is safe to nest.
export { themeToggle };

/** A `[label, slotName]` pair — the shape the column and row builders take. */
export type FooterLink = readonly [label: string, slotName: string];

/**
 * The brand lockup. A `Wordmark`, not a bare `<a>`: the component takes a logo
 * MARK via `src` (or a nested `<svg>` child), which is the Inspector's
 * one-control path for "put my logo here" — impossible with a raw text link.
 * `.wordmark` already supplies weight, tracking, and ink, so `cls` should carry
 * layout and a size class (`wordmark-sm`/`-lg`), never `text-*`/`font-*`.
 */
export function brandMark(cls: string, text = "SilicaUI"): ComponentNode {
    return slot(atom("Wordmark", cls, { text, href: "#" }), {
        name: "brand",
        type: "text",
        label: "Brand",
    });
}

/** The one-line description under the mark — what this company actually does. */
export function blurb(cls: string, text: string): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "blurb",
        type: "text",
        label: "Blurb",
    });
}

/** One footer link, wrapped in its `<li>`. */
export function footerLink([label, name]: FooterLink): ElementNode {
    return el("li", undefined, {
        children: [
            slot(
                el("a", "text-sm text-base-content hover:text-primary", {
                    text: label,
                    attrs: { href: "#" },
                }),
                { name, type: "link", label },
            ),
        ],
    });
}

/**
 * A titled column of links. The TITLE is a slot too (`col1`…`col5`) — the old
 * single footer hard-coded "Product / Company / Legal", so a host filling the
 * block could rewrite every link and none of the headings above them.
 */
export function linkColumn(title: string, titleSlot: string, links: readonly FooterLink[]): ElementNode {
    return el("div", "flex flex-col gap-3", {
        children: [
            slot(el("p", "text-sm font-semibold text-base-content", { text: title }), {
                name: titleSlot,
                type: "text",
                label: "Column title",
            }),
            el("ul", "flex flex-col gap-2", { children: links.map(footerLink) }),
        ],
    });
}

/**
 * Links on one line, no heading — the slim-footer and legal-bar arrangement.
 *
 * A `<ul>`, not a `<nav>`: `footerLink` builds an `<li>`, and an `<li>` outside
 * a list parent is invalid markup that assistive tech reads as loose text
 * instead of "list, 3 items".
 */
export function linkRow(cls: string, links: readonly FooterLink[]): ElementNode {
    return el("ul", cls, { children: links.map(footerLink) });
}

/**
 * The social row. Deliberately WORDMARKS, not icons: the bundled icon set is
 * Lucide, which ships no brand glyphs, and dressing "GitHub" in a generic
 * `code` square is a worse lie than just writing GitHub. Each is a slot, so an
 * author swaps the network rather than living with our four guesses.
 */
export function socialRow(cls: string, links: readonly FooterLink[]): ElementNode {
    return el("ul", cls, {
        children: links.map(([label, name]) =>
            el("li", undefined, {
                children: [
                    slot(
                        el("a", "text-sm font-medium text-base-content hover:text-primary", {
                            text: label,
                            attrs: { href: "#" },
                        }),
                        { name, type: "link", label },
                    ),
                ],
            }),
        ),
    });
}

/** The default social set, as `[label, slot]` pairs. */
export const SOCIAL: readonly FooterLink[] = [
    ["X", "social1"],
    ["GitHub", "social2"],
    ["LinkedIn", "social3"],
] as const;

/** The copyright line. Present in all five, always slot `copyright`. */
export function copyright(cls: string, text = "© 2026 SilicaUI, Inc. All rights reserved."): ElementNode {
    return slot(el("p", cls, { text }), {
        name: "copyright",
        type: "text",
        label: "Copyright",
    });
}

/**
 * The closing rule: a hairline, then the copyright beside whatever else the
 * layout wants on that line (legal links, a status pill, a theme toggle).
 */
export function legalBar(cls: string, trailing?: Child[], text?: string): ElementNode {
    const children: Child[] = [copyright("text-sm text-base-content", text)];
    if (trailing) children.push(...trailing);
    return el("div", cls, { children });
}
