/**
 * Features — Checklist. Six capabilities in two columns, each a tick with a line
 * of explanation. No cards, no images. Reach for it when the honest answer to
 * "what does it do?" is a LIST — a comparison page, an enterprise section, the
 * part of a pricing page that says what "everything included" means.
 *
 * The density IS the design. Cards would add six borders and six shadows to
 * information that is already scannable, and images would triple the height of a
 * section whose job is to be read in fifteen seconds.
 *
 * `items-start` with `mt-1` on the glyph, not `items-center`: the body wraps to
 * two or three lines and a centered tick would drift to the middle of the
 * paragraph instead of sitting against the title it marks.
 */
import { block, el } from "../kit";
import { checkRow, heading, subhead } from "./feature-kit";

export const featureChecklist = block({
    key: "feature_checklist",
    name: "Features — Checklist",
    category: "features",
    version: "1.0.0",
    description: "A dense two-column checklist of capabilities, no cards or media.",
    tags: ["features", "list", "marketing"],
    colors: ["base-100", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-5xl px-6 py-16", {
                children: [
                    el("div", "mb-10 flex max-w-2xl flex-col gap-3", {
                        children: [
                            heading("text-3xl font-semibold text-base-content @2xl:text-4xl", "What's included, in full"),
                            subhead("text-base-content", "Every plan, no add-ons, nothing held back for the tier above."),
                        ],
                    }),
                    el("ul", "grid grid-cols-1 gap-x-10 gap-y-6 @2xl:grid-cols-2", {
                        children: [
                            checkRow({
                                index: 1,
                                title: "Unlimited pages and projects",
                                body: "Build as many stores as you like on one account.",
                                icon: "check",
                            }),
                            checkRow({
                                index: 2,
                                title: "Custom domains with automatic TLS",
                                body: "Point a domain at it and the certificate handles itself.",
                                icon: "check",
                            }),
                            checkRow({
                                index: 3,
                                title: "Version history on every page",
                                body: "A readable diff and a one-second rollback, forever.",
                                icon: "check",
                            }),
                            checkRow({
                                index: 4,
                                title: "Static HTML export",
                                body: "Take the output and host it anywhere, with no runtime to license.",
                                icon: "check",
                            }),
                            checkRow({
                                index: 5,
                                title: "Team seats at no extra cost",
                                body: "Invite everyone who touches the site; we don't charge per head.",
                                icon: "check",
                            }),
                            checkRow({
                                index: 6,
                                title: "Accessibility checks as you build",
                                body: "Contrast and landmark warnings surface in the editor, not in an audit.",
                                icon: "check",
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
