/**
 * CTA — Split Media. The ask beside a picture of the thing being asked about.
 * Reach for it when the product is visual and the reader has scrolled past the
 * hero screenshot: a second look at the interface, right where the decision is.
 *
 * Left-aligned, not centered. A centered column beside an image leaves a ragged
 * gutter down the middle of the section; the copy edge and the image edge should
 * be the two verticals the eye follows.
 */
import { block, el } from "../kit";
import { actions, ctaImage, headline, note, subhead } from "./cta-kit";

export const ctaSplit = block({
    key: "cta_split",
    name: "CTA — Split Media",
    category: "cta",
    version: "1.0.0",
    description: "An ask and its actions beside a supporting image.",
    tags: ["cta", "marketing", "media", "conversion"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 @3xl:grid-cols-2 @3xl:py-20", {
                children: [
                    el("div", "flex flex-col items-start gap-5", {
                        children: [
                            headline("text-3xl font-semibold text-base-content @2xl:text-4xl", "See it running on your own catalog"),
                            subhead(
                                "max-w-lg text-base-content",
                                "Import a CSV and we'll build a working storefront from it in about a minute. Keep it or throw it away.",
                            ),
                            actions(
                                "flex flex-col gap-3 @sm:flex-row",
                                { label: "Import a catalog", cls: "btn btn-primary btn-lg" },
                                { label: "Watch the demo", cls: "btn btn-outline btn-lg" },
                            ),
                            note("text-sm text-base-content", "No account needed to try it. Nothing is published until you say so."),
                        ],
                    }),
                    ctaImage("w-full rounded-box", "The storefront editor with a catalog loaded", "wide"),
                ],
            }),
        ],
    }),
});
