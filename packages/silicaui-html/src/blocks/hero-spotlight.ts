/**
 * Hero — Image Overlay. A full-bleed photograph with the copy laid over it. The
 * immersive opener: reach for it when the FEELING of the product is the pitch —
 * travel, food, hospitality, anything sold on atmosphere.
 *
 * THE FIRST BLOCK TO USE THE `.hero` CSS PRIMITIVE, and the reason it exists.
 * `.hero` is a single-cell grid: every direct child is pinned to row 1 / column 1
 * (silicaui/src/components/hero.js), so the three layers stack with NO
 * `absolute`, no `inset-0`, and no z-index bookkeeping. DOM order IS paint order,
 * so it must stay image → overlay → content; `.hero-content` carries `z-index: 0`
 * and only clears the scrim by coming after it.
 *
 * TWO THINGS THAT LOOK OPTIONAL AND ARE NOT:
 *
 * 1. `data-theme="dark"` is what makes the ink correct. `[data-theme]` repaints
 *    surface and ink from that theme's tokens (silicaui/src/theme.js), so
 *    `.display-1` and `.lead` resolve to the dark theme's `base-content` and the
 *    outline button resolves its own border — over a dark photograph, with zero
 *    per-theme CSS and not one hardcoded white. Remove the attribute and every
 *    layer here goes dark-on-dark.
 *
 * 2. The image takes NO `ratio`. `ratio` appends an aspect utility, and an
 *    `aspect-video` fights `h-full` — the picture stops covering and the scrim
 *    ends up sitting on bare background.
 *
 * The background image is a real `Image` atom rather than an arbitrary
 * background-image utility: a `url(` inside a class is a hard lint error, and
 * `.hero`'s own `background-size: cover` would need an inline `style`, banned too.
 *
 * That sentence deliberately does not spell the utility out. `apps/site/app/globals.css`
 * points `@source` at this whole directory, and Tailwind's scanner does not know
 * what a comment is — writing the literal form here makes it a real candidate, and
 * the emitted `url(…)` then fails the site build as an unresolvable module.
 */
import { block, el } from "../kit";
import { actions, headline, heroImage, subhead } from "./hero-kit";

export const heroSpotlight = block({
    key: "hero_spotlight",
    name: "Hero — Image Overlay",
    category: "hero",
    version: "1.0.0",
    description: "Full-bleed photograph with a scrim and centered copy laid over it.",
    tags: ["hero", "marketing", "media", "overlay"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "hero @container min-h-[32rem] overflow-hidden", {
        attrs: { "data-theme": "dark" },
        children: [
            heroImage("h-full w-full object-cover", "A wide photograph filling the banner"),
            el("div", "hero-overlay"),
            el("div", "hero-content flex-col items-center gap-6 text-center", {
                children: [
                    headline("display-1 max-w-4xl", "Somewhere worth waking up for"),
                    subhead("lead max-w-2xl", "Handpicked places to stay, in the parts of the country the guidebooks keep leaving out."),
                    actions("flex flex-col gap-3 @sm:flex-row", "Find a stay", "Browse regions"),
                ],
            }),
        ],
    }),
});
