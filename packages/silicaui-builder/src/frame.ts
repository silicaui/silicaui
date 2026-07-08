/**
 * The default site FRAME — the shared shell (navbar / footer) that wraps every
 * page, with exactly one `Outlet` where the page body renders (schema §9.7).
 * Minted when the user first enters Layout mode on a document that has no frame.
 *
 * The shell is composed from the real, validated `navbar` and `footer` BLOCK
 * templates (the same ones the Insert palette offers), so a new site's layout is
 * already built from our components — fully editable in place — rather than a
 * bespoke stand-in. The block roots live in `@wizeworks/silicaui-html/src` (scanned by the
 * harness `@source`), so their utilities are safelisted for the canvas.
 *
 * STYLING RULE (hard): every class authored HERE is a LITERAL string (the wrapper
 * + the defensive fallbacks) so the `@source` scan safelists them — same rule as
 * the palette, Canvas, and Inspector.
 */
import type { Node } from "@wizeworks/silicaui-html";
import { el, outlet } from "@wizeworks/silicaui-html";
import { getBlock } from "@wizeworks/silicaui-html/blocks";

/** A fresh clone of a block's root, or `fallback()` if the block is unavailable.
 *  Cloned so the shared template singleton is never mutated by frame editing. */
function blockRoot(key: string, fallback: () => Node): Node {
    const root = getBlock(key)?.root;
    return root ? (structuredClone(root) as Node) : fallback();
}

/** A navbar + outlet + footer shell — the starting point for Layout mode, built
 *  from our own navbar/footer components. */
export function defaultFrameRoot(): Node {
    return el("div", "flex min-h-screen flex-col bg-base-100 text-base-content", {
        children: [
            blockRoot("navbar", fallbackHeader),
            el("main", "flex-1", { children: [outlet()] }),
            blockRoot("footer", fallbackFooter),
        ],
    });
}

/** Neutral header, used only if the navbar block can't be resolved. */
function fallbackHeader(): Node {
    return el("header", "flex items-center justify-between px-6 py-4 border-b border-base-300", {
        children: [
            el("div", "text-lg font-semibold text-base-content", { text: "SilicaUI" }),
            el("nav", "flex items-center gap-6 text-sm text-base-content/70", {
                children: [
                    el("a", "link link-hover", { text: "Home", attrs: { href: "#" } }),
                    el("a", "link link-hover", { text: "Features", attrs: { href: "#" } }),
                    el("a", "link link-hover", { text: "Pricing", attrs: { href: "#" } }),
                ],
            }),
        ],
    });
}

/** Neutral footer, used only if the footer block can't be resolved. */
function fallbackFooter(): Node {
    return el("footer", "px-6 py-8 border-t border-base-300 text-sm text-base-content/60", {
        text: "© 2026 SilicaUI. All rights reserved.",
    });
}
