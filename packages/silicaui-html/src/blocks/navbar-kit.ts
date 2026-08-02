/**
 * Shared parts for the NAVBAR FAMILY — five header layouts built from one set of
 * link / trigger / panel primitives, so a fix to the mobile menu lands in all
 * five instead of drifting across five copies.
 *
 * Not a block: `listBlocks()` never sees this file, it just holds the pieces the
 * five block modules assemble.
 *
 * THREE THINGS HERE ARE LOAD-BEARING — read before editing:
 *
 * 1. Every helper builds FRESH nodes on every call. `slot()`/`part()`/`behave()`
 *    MUTATE the node they're handed (kit.ts), so a shared node constant would
 *    put one object in two blocks' trees and cross-contaminate both slot indexes.
 *
 * 2. Every class is a LITERAL string. The builder harness and apps/site
 *    `@source`-scan this directory to safelist block utilities; a class composed
 *    at runtime (`` `px-${n}` ``) is invisible to that scan and never generates.
 *
 * 3. A desktop link and its mobile twin SHARE one slot name. `fillSlots` walks
 *    the tree and writes by name, so one content key updates both copies — a
 *    consumer shouldn't have to know the block renders each link twice to cover
 *    the breakpoint. The same holds for the CTA and the sign-in link, which is
 *    why the mobile panel carries them too: at narrow width they've left the bar,
 *    and a header whose primary action vanishes on a phone is a broken header.
 */
import { atom, behave, el, part, slot } from "../kit";
import type { Child, ComponentNode, ElementNode } from "../schema";

/** A `[label, slotName]` pair — the shape the panel builder takes. */
export type NavLink = readonly [label: string, slotName: string];

/**
 * The brand lockup. A `Wordmark`, not a bare `<a>`: the component takes a logo
 * MARK via `src` (or a nested `<svg>` child), which is the Inspector's
 * one-control path for "put my logo here" — impossible with a raw text link.
 * `.wordmark` already supplies weight, tracking, and ink, so `cls` should carry
 * layout and a size class (`wordmark-sm`/`-lg`), never `text-*`/`font-*`.
 */
export function brand(cls: string, text = "SilicaUI"): ComponentNode {
    return slot(atom("Wordmark", cls, { text, href: "#" }), {
        name: "brand",
        type: "text",
        label: "Brand",
    });
}

/** A desktop nav link. */
export function navLink(label: string, slotName: string): ElementNode {
    return slot(
        el("a", "text-sm font-medium text-base-content hover:text-primary", {
            text: label,
            attrs: { href: "#" },
        }),
        { name: slotName, type: "link", label },
    );
}

/** The same link stacked in the mobile panel — SAME slot name (see note 3). */
export function navLinkMobile(label: string, slotName: string): ElementNode {
    return slot(
        el("a", "block rounded-btn px-3 py-2 text-sm font-medium text-base-content hover:bg-base-200", {
            text: label,
            attrs: { href: "#" },
        }),
        { name: slotName, type: "link", label },
    );
}

/**
 * The hamburger — the `trigger` half of the mobile disclosure pair. No display
 * utility: `.btn:has(svg)` already centers an icon-only button, and revealing a
 * `.btn` with a bare `flex`/`inline-flex` is the documented papercut
 * (silicaui/src/components/button.js).
 */
export function hamburger(cls: string): ElementNode {
    return part(
        el("button", cls, {
            attrs: { type: "button", "aria-label": "Toggle navigation menu" },
            children: [atom("Icon", undefined, { name: "menu" })],
        }),
        "trigger",
    );
}

/**
 * The theme switcher. A NESTED behavior root inside the header's `disclosure`
 * root, which is safe in both directions: `theme-toggle` makes the root itself
 * the trigger so it declares no `data-sui-part` for the outer disclosure to
 * mistake for a hamburger, and `ownParts` stops at nested behavior boundaries
 * anyway (silicaui-behaviors/src/dom.ts).
 *
 * Deliberately unlabelled — the handler owns `aria-label` when the button has no
 * accessible name, and folds the CURRENT theme into it so each activation
 * announces the change. Naming it here would silence that.
 */
export function themeToggle(cls: string): ElementNode {
    return behave(
        el("button", cls, {
            attrs: { type: "button" },
            children: [atom("Icon", undefined, { name: "theme" })],
        }),
        { type: "theme-toggle" },
    );
}

/** The quiet secondary action — a text link. Slot `secondary`. */
export function signInLink(cls: string, label = "Sign in"): ElementNode {
    return slot(el("a", cls, { text: label, attrs: { href: "#" } }), {
        name: "secondary",
        type: "link",
        label: "Secondary link",
    });
}

/** The secondary action as a real button (the sign-in / sign-up pair). */
export function signInButton(cls: string, label = "Sign in"): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "secondary",
        type: "link",
        label: "Secondary link",
    });
}

/**
 * The primary action. `href` lowers it to an `<a>` — a navbar CTA navigates, it
 * doesn't submit. Reveal it with `@md:inline-block`, NEVER `@md:inline-flex`.
 */
export function ctaButton(cls: string, label = "Get started"): ComponentNode {
    return slot(atom("Button", cls, { label, href: "#" }), {
        name: "cta",
        type: "link",
        label: "Primary action",
    });
}

/**
 * The stacked mobile menu — the `panel` half of the disclosure pair.
 *
 * Ships the `hidden` ATTRIBUTE (preflight's `display:none !important`, so it
 * beats any display class) and stays class-hidden at `@md`, so a menu opened on
 * a phone can't survive a resize into the desktop layout. The builder canvas has
 * no runtime, so it strips the attribute to make the panel editable — which is
 * why the class matters as well as the attribute.
 */
export function mobilePanel(
    cls: string,
    links: readonly NavLink[],
    opts?: { secondary?: string; cta?: string },
): ElementNode {
    const children: Child[] = links.map(([label, name]) => navLinkMobile(label, name));
    if (opts?.secondary != null) {
        children.push(signInButton("btn btn-ghost btn-sm mt-2 w-full", opts.secondary));
    }
    if (opts?.cta != null) {
        children.push(ctaButton("btn btn-primary btn-sm mt-1 w-full", opts.cta));
    }
    return part(el("nav", cls, { attrs: { hidden: true }, children }), "panel");
}
