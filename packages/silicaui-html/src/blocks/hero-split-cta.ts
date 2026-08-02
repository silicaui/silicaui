/**
 * Hero — Split CTA. The asymmetric workhorse: copy and both actions on the left,
 * media on the right. The layout to reach for when the product is best shown
 * beside the claim rather than under it.
 *
 * Container-query responsive: `@container` on the section establishes the
 * container, and the two columns collapse to one below `@3xl` — never viewport
 * variants, per the builder's element-canvas model.
 *
 * Also the ORIGINAL proof block: authored once as a neutral tree, consumable
 * three ways (HTML / React / block.json).
 */
import { block, el } from "../kit";
import { actions, headline, heroImage, subhead, trustRow } from "./hero-kit";

export const heroSplitCta = block({
    key: "hero_split_cta",
    name: "Hero — Split CTA",
    category: "hero",
    version: "1.0.0",
    description: "Two-column hero: headline, actions, and social proof beside a product image.",
    tags: ["hero", "marketing", "cta"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 @3xl:grid-cols-2 @3xl:py-24", {
                children: [
                    el("div", "flex flex-col items-start gap-5", {
                        children: [
                            headline("display-2", "Ship your store in an afternoon"),
                            // Copy deliberately unchanged from the original block: this
                            // sentence is a fixture in a dozen e2e specs, and rewording it
                            // buys nothing the layout upgrade doesn't already deliver.
                            subhead("lead max-w-lg", "Everything you need to sell online — no code, no wrangling."),
                            actions("flex flex-col gap-3 @sm:flex-row", "Start free", "Book a demo"),
                            trustRow("mt-2 flex items-center gap-3"),
                        ],
                    }),
                    heroImage("w-full rounded-box", "Product preview", "wide"),
                ],
            }),
        ],
    }),
});
