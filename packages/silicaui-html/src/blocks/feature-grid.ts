/**
 * Features — Grid. Data-bound: a `collection` repeat over `features` with
 * per-item `value` binds inside. Statically it renders one card with default copy
 * (plus the `data-sui-repeat` / `data-sui-bind` attributes a host or runtime
 * hydrates); with a resolver it repeats once per item.
 *
 * IT IS THE ONE BOUND BLOCK IN THE FAMILY, and that is what to reach for it for.
 * The other four are authored — you type three features and they are three
 * features. This one draws whatever the host's `features` collection contains,
 * so a CMS or a database is the source of truth.
 *
 * The icon was `sparkles`, which exists in the html icon set but NOT in the
 * builder's baked copy (silicaui-builder/src/shared/icons.ts) — so the canvas
 * drew an empty span while published output drew a glyph. Every icon this family
 * names is present in both sets.
 */
import { bind, block, el, repeat } from "../kit";
import { featureIcon, heading } from "./feature-kit";

export const featureGrid = block({
    key: "feature_grid",
    name: "Features — Grid",
    category: "features",
    version: "2.0.0",
    description: "A responsive grid that repeats over a collection, binding each item's fields.",
    tags: ["features", "grid", "dynamic"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-6xl px-6 py-16", {
                children: [
                    heading("mb-10 text-3xl font-semibold text-base-content @2xl:text-4xl", "Everything you need"),
                    repeat(
                        el("div", "grid grid-cols-1 gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3", {
                            children: [
                                el("div", "flex flex-col gap-3 rounded-box bg-base-200 p-6", {
                                    children: [
                                        featureIcon("layout"),
                                        bind(
                                            el("h3", "text-lg font-semibold text-base-content", { text: "Fast by default" }),
                                            "feature.title",
                                        ),
                                        bind(
                                            el("p", "text-base-content", { text: "Every page ships lean, so your store feels instant." }),
                                            "feature.body",
                                        ),
                                    ],
                                }),
                            ],
                        }),
                        "features",
                    ),
                ],
            }),
        ],
    }),
});
