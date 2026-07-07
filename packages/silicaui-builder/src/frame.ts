/**
 * The default site FRAME — the shared shell (header / nav / footer) that wraps
 * every page, with exactly one `Outlet` where the page body renders (schema §9.7).
 * Minted when the user first enters Layout mode on a document that has no frame.
 *
 * STYLING RULE (hard): every class here is a LITERAL string so the harness's
 * `@source` scan safelists the utilities the freshly-created frame wears — same
 * rule as the palette, Canvas, and Inspector.
 */
import type { Node } from "silicaui-html";
import { el, outlet } from "silicaui-html";

/** A neutral header + outlet + footer shell — the starting point for Layout mode. */
export function defaultFrameRoot(): Node {
  return el("div", "flex min-h-screen flex-col bg-base-100 text-base-content", {
    children: [
      el("header", "flex items-center justify-between px-6 py-4 border-b border-base-300", {
        children: [
          el("div", "text-lg font-semibold text-base-content", { text: "Brand" }),
          el("nav", "flex items-center gap-6 text-sm text-base-content/70", {
            children: [
              el("a", "link link-hover", { text: "Home", attrs: { href: "#" } }),
              el("a", "link link-hover", { text: "Features", attrs: { href: "#" } }),
              el("a", "link link-hover", { text: "Pricing", attrs: { href: "#" } }),
            ],
          }),
        ],
      }),
      el("main", "flex-1", { children: [outlet()] }),
      el("footer", "px-6 py-8 border-t border-base-300 text-sm text-base-content/60", {
        text: "© 2026 Brand. All rights reserved.",
      }),
    ],
  });
}
