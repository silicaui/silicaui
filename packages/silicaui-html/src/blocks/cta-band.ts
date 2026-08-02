/**
 * CTA — Band. A centered ask on a filled `primary` surface, with a pair of
 * actions. The high-contrast interruption: use it between two sections, or just
 * above a normal footer.
 *
 * THE BUTTONS ARE NOT `btn-primary`. The band is already `bg-primary`, so a
 * `btn-primary` on it is a primary rectangle on a primary field — invisible
 * except for its shadow. The solid action takes bare `.btn` (which resolves to
 * the neutral surface pair) and the quiet one takes `.btn-ghost`, whose ink
 * inherits the band's `primary-content`.
 *
 * THE ROLE IS NAMED ONCE, ON THE SECTION. `bg-primary text-primary-content` on
 * the root is the only place `primary` appears; the headline, the subhead, and
 * the ghost button all INHERIT that ink. Swap the two classes for
 * `bg-secondary text-secondary-content` and the whole band follows — which is
 * the entire reason not to repeat `text-primary-content` on each child.
 *
 * That only works because `typography.js` gives headings `color: inherit`
 * rather than `var(--color-base-content)`. It used to declare the token, and a
 * declared color beats an inherited one, so this band rendered a base-content
 * headline on a primary field: dark-on-dark-blue in light mode, pale-on-pale in
 * dark. `verify.mjs` now fails any node that paints a filled role surface
 * without naming the matching `-content` ink on that same node.
 */
import { block, el } from "../kit";
import { actions, headline, subhead } from "./cta-kit";

export const ctaBand = block({
    key: "cta_band",
    name: "CTA — Band",
    category: "cta",
    version: "2.0.0",
    description: "A centered ask on a filled primary band, with two actions.",
    tags: ["cta", "marketing", "conversion"],
    colors: ["primary", "primary-content"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-primary text-primary-content", {
        children: [
            el("div", "mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center @3xl:py-20", {
                children: [
                    // No `text-*` on either: both inherit the band's ink, so the
                    // role is stated once on the root and nothing here has to
                    // change if it becomes `bg-secondary`.
                    headline("text-3xl font-semibold @2xl:text-4xl", "Ready to build something great?"),
                    subhead("text-lg", "Start free today — no credit card, no setup, no lock-in."),
                    actions(
                        "mt-2 flex flex-col gap-3 @sm:flex-row",
                        { label: "Start free", cls: "btn btn-lg" },
                        { label: "Talk to sales", cls: "btn btn-lg btn-ghost" },
                    ),
                ],
            }),
        ],
    }),
});
