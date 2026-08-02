/**
 * CTA — Inline Bar. One line: a sentence and a button. Reach for it at the foot
 * of a doc page, a blog post, or a support article — somewhere the reader is
 * mid-task and a full band would be an interruption they resent.
 *
 * It is the SMALLEST ask in the family and that is the point. No subhead, no
 * second action, no reassurance line: one sentence, one button, `py-5`. Every
 * other CTA here escalates from it.
 *
 * The headline is `text-lg`, not `text-3xl` — an `<h2>` for the outline, sized
 * like body copy because it sits inside one. Hierarchy from scale, and here the
 * scale is deliberately flat.
 */
import { block, el } from "../kit";
import { actions, headline } from "./cta-kit";

export const ctaInline = block({
    key: "cta_inline",
    name: "CTA — Inline Bar",
    category: "cta",
    version: "1.0.0",
    description: "A slim one-line ask with a single button, for the foot of an article.",
    tags: ["cta", "conversion", "docs"],
    colors: ["base-100", "base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-100", {
        children: [
            el("div", "mx-auto w-full max-w-3xl px-6 py-8", {
                children: [
                    el("div", "flex flex-col items-start gap-4 rounded-box bg-base-200 px-6 py-5 @xl:flex-row @xl:items-center @xl:justify-between", {
                        children: [
                            headline("text-lg font-semibold text-base-content", "Want this set up for your store?"),
                            actions("shrink-0", { label: "Start free", cls: "btn btn-primary" }),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
