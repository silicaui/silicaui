/**
 * Hero — Bold Statement. Type carries the whole section: no photograph, no
 * screenshot, nothing to load. The opener for a manifesto, an about page, or a
 * brand that would rather say something than show a dashboard.
 *
 * Left-aligned and set on `base-200`, so it reads as a distinct surface from the
 * `base-100` heroes it will sit beside in a page. `base-200` is a real surface
 * token, NOT `bg-soft` — soft is an accent spent on one thing, never a backdrop
 * (house RULE #3).
 *
 * The three proof points are separated by LAYOUT — grid columns and whitespace.
 * No rules, no dividers, no `01 / 02 / 03` markers, and nothing sitting above a
 * heading to introduce it (house RULE #2). A statement hero is exactly where
 * editorial decoration is most tempting and most wrong.
 */
import { block, el } from "../kit";
import { actions, headline, subhead } from "./hero-kit";

/** One proof point: a claim and its sentence. Fresh nodes per call. */
const point = (title: string, body: string) =>
    el("div", "flex flex-col gap-2", {
        children: [
            el("p", "text-base font-semibold text-base-content", { text: title }),
            el("p", "text-base-content", { text: body }),
        ],
    });

export const heroStatement = block({
    key: "hero_statement",
    name: "Hero — Bold Statement",
    category: "hero",
    version: "1.0.0",
    description: "Oversized editorial type with no media — the manifesto and about-page opener.",
    tags: ["hero", "marketing", "editorial", "typography"],
    colors: ["base-200", "base-content", "primary"],
    behaviors: [],
    emailEligible: false,
    root: el("section", "@container bg-base-200", {
        children: [
            el("div", "mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 @3xl:py-32", {
                children: [
                    headline("display-1 max-w-4xl", "Software should feel like it was built for you, not sold to you."),
                    subhead("lead max-w-2xl", "We started this because every tool we used treated our work as an afterthought to its own roadmap. So we built the one we wanted."),
                    actions("flex flex-col items-start gap-3 @sm:flex-row", "Read our approach", "Meet the team"),
                    el("div", "mt-8 grid grid-cols-1 gap-8 @2xl:grid-cols-3", {
                        children: [
                            point("Built in the open", "Every roadmap decision, every postmortem, and every price change is public before it ships."),
                            point("Yours to leave with", "Export the whole thing — content, structure, and styles — in one click, any day you like."),
                            point("Priced once", "One number, billed yearly, with no seat maths and no call with anyone in sales."),
                        ],
                    }),
                ],
            }),
        ],
    }),
});
