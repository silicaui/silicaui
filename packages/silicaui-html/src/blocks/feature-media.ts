/**
 * Features — Media Split. ONE feature, told properly: heading, body, a short
 * list of specifics, and an action, beside a picture of it. Reach for it when a
 * single capability is worth a whole section — the thing the product is actually
 * for, rather than the twelve things it also does.
 *
 * No eyebrow. Nothing sits above the heading to introduce it (house RULE #2).
 */
import { atom, block, el, slot } from "../kit";
import { featureImage, point } from "./feature-kit";

export const featureMedia = block({
    key: "feature_media",
    name: "Features — Media Split",
    category: "features",
    version: "2.0.0",
    description: "One feature: copy, specifics, and an action beside a supporting image.",
    tags: ["features", "marketing", "media"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 @3xl:grid-cols-2 @3xl:py-20", {
                children: [
                    el("div", "flex flex-col gap-4", {
                        children: [
                            slot(
                                el("h2", "text-3xl font-semibold text-base-content @2xl:text-4xl", {
                                    text: "Design, publish, and iterate in one place",
                                }),
                                { name: "heading", type: "text", label: "Heading", required: true },
                            ),
                            slot(
                                el("p", "text-base-content", {
                                    text: "No handoffs, no rebuilds. What you design is exactly what ships — and you can change it in seconds.",
                                }),
                                { name: "body", type: "text", label: "Body" },
                            ),
                            el("ul", "flex flex-col gap-2", {
                                children: [
                                    point("Live container-query previews"),
                                    point("One-click publish"),
                                    point("Version history and rollback"),
                                ],
                            }),
                            slot(atom("Button", "btn btn-primary mt-2 self-start", { label: "See how it works", href: "#" }), {
                                name: "cta",
                                type: "link",
                                label: "Action",
                            }),
                        ],
                    }),
                    featureImage("w-full rounded-box", "The editor with a page open", 1, "square"),
                ],
            }),
        ],
    }),
});
