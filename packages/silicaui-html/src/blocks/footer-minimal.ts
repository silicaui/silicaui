/**
 * Footer — Minimal. One slim bar: mark, inline links, social, theme toggle, and
 * a copyright line under a hairline. Reach for it on an app shell, a docs site,
 * or any page where a five-column sitemap would be more footer than page.
 *
 * IT OWNS THE THEME TOGGLE, and it is the only footer that does. A product with
 * a persistent header puts the switcher up there (see navbar-kit.ts); a docs or
 * app page whose header is a breadcrumb has nowhere else to put it, and that is
 * exactly the page this layout is for. Duplicating it into all five would mean
 * two switchers on a normal marketing page, which reads as a bug.
 *
 * The row is a column on a narrow container and one line past `@2xl` — the whole
 * point of the layout is that it stays one line wherever it can.
 */
import { block, el } from "../kit";
import { SOCIAL, brandMark, copyright, linkRow, socialRow, themeToggle } from "./footer-kit";

export const footerMinimal = block({
    key: "footer_minimal",
    name: "Footer — Minimal",
    category: "footer",
    version: "1.0.0",
    description: "A single slim bar: mark, inline links, social, and a theme toggle.",
    tags: ["footer", "nav", "app", "docs"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: ["theme-toggle"],
    emailEligible: false,
    root: el("footer", "@container bg-base-100 border-t border-base-200", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6", {
                children: [
                    el("div", "flex flex-col items-center gap-5 py-6 @2xl:flex-row @2xl:justify-between", {
                        children: [
                            brandMark("wordmark wordmark-sm"),
                            linkRow("flex flex-wrap items-center justify-center gap-x-6 gap-y-2", [
                                ["Product", "link1"],
                                ["Docs", "link2"],
                                ["Pricing", "link3"],
                                ["Blog", "link4"],
                                ["Support", "link5"],
                            ]),
                            el("div", "flex items-center gap-5", {
                                children: [
                                    socialRow("flex items-center gap-5", SOCIAL),
                                    themeToggle("btn btn-ghost btn-square btn-sm"),
                                ],
                            }),
                        ],
                    }),
                    el("div", "border-t border-base-200 py-4 text-center", {
                        children: [copyright("text-sm text-base-content")],
                    }),
                ],
            }),
        ],
    }),
});
