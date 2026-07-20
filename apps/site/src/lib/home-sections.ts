import { el, stampTree, type Node } from "@wizeworks/silicaui-html";

/**
 * Site-specific sections for /about that don't fit a shared, reusable block —
 * real project counts, and a footer whose links all point at destinations that
 * actually exist (the shared `blocks/footer.ts` ships generic
 * Careers/Privacy/Terms columns, which would be links to nowhere here).
 *
 * Built from the same `el` primitives every shared block uses; `stampTree`
 * mints real ids, matching how `stamp()` treats every other section.
 */

const GITHUB_URL = "https://github.com/silicaui/silicaui";
const NPM_URL = "https://www.npmjs.com/package/@wizeworks/silicaui";

const stat = (value: string, label: string) =>
  el("div", "flex flex-col items-center gap-1 text-center", {
    children: [
      el("span", "text-4xl font-semibold text-base-content @2xl:text-5xl", { text: value }),
      el("span", "text-sm text-base-content", { text: label }),
    ],
  });

/** Real counts as of this build — read off this repo, not invented. */
export function statsSection(): Node {
  return stampTree(
    el("section", "@container bg-base-100", {
      children: [
        el("div", "mx-auto grid w-full max-w-5xl grid-cols-2 gap-8 px-6 py-16 @2xl:grid-cols-4", {
          children: [
            stat("113", "Components"),
            stat("34", "Behaviors"),
            stat("13", "Packages"),
            stat("MIT", "License"),
          ],
        }),
      ],
    }),
  );
}

const footerLink = (label: string, href: string) =>
  el("li", undefined, {
    children: [el("a", "text-sm text-base-content", { text: label, attrs: { href } })],
  });

export function siteFooter(): Node {
  return stampTree(
    el("footer", "@container bg-base-100 border-t border-base-300", {
      children: [
        el("div", "mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 @md:flex-row @md:items-start @md:justify-between", {
          children: [
            el("div", "flex flex-col gap-2", {
              children: [
                el("p", "text-lg font-semibold text-base-content", { text: "SilicaUI" }),
                el("p", "text-sm text-base-content", { text: "A component library that stays out of your way." }),
              ],
            }),
            el("ul", "flex flex-wrap gap-x-6 gap-y-2", {
              children: [
                footerLink("Docs", "/docs"),
                footerLink("Components", "/docs/components/button"),
                footerLink("About", "/about"),
                footerLink("GitHub", GITHUB_URL),
                footerLink("npm", NPM_URL),
              ],
            }),
          ],
        }),
        el("div", "mx-auto w-full max-w-6xl border-t border-base-300 px-6 py-6", {
          children: [el("p", "text-sm text-base-content", { text: "MIT licensed — open source." })],
        }),
      ],
    }),
  );
}
