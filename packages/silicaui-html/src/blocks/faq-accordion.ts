/**
 * FAQ — accordion. Exercises the behavior primitive: a `disclosure` root with
 * `trigger`/`panel` parts, single-open. Collapsed panels ship `hidden` so they
 * don't flash open before the runtime hydrates. Uses real utility classes only.
 */
import { behave, block, el, part, slot } from "../kit";

const item = (q: string, a: string, open = false) =>
  el("div", "border border-base-200 rounded-box", {
    children: [
      part(
        el("button", "w-full text-left p-4 font-medium text-base-content", {
          text: q,
        }),
        "trigger",
      ),
      part(
        el("div", "p-4 pt-0 text-base-content/70", {
          text: a,
          attrs: open ? undefined : { hidden: true },
        }),
        "panel",
      ),
    ],
  });

export const faqAccordion = block({
  key: "faq_accordion",
  name: "FAQ — accordion",
  category: "faq",
  version: "1.0.0",
  description: "Single-open disclosure list of question/answer pairs.",
  tags: ["faq", "accordion", "disclosure"],
  colors: ["base-100", "base-200", "base-content"],
  behaviors: ["disclosure"],
  emailEligible: false,
  root: el("section", "bg-base-100 @container p-8", {
    children: [
      slot(
        el("h2", "text-2xl font-semibold text-base-content mb-6", {
          text: "Frequently asked questions",
        }),
        { name: "heading", type: "text", label: "Heading" },
      ),
      behave(
        el("div", "flex flex-col gap-2", {
          children: [
            item("Do I need to know how to code?", "Nope — everything is visual.", true),
            item("Can I use my own domain?", "Yes, connect any domain you already own."),
            item("Is there a free plan?", "Yes — start free and upgrade whenever you're ready."),
          ],
        }),
        { type: "disclosure", params: { single: true } },
      ),
    ],
  }),
});
