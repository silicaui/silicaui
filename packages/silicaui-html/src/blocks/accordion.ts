/**
 * Accordion — a generic multi-open disclosure list (each row toggles
 * independently; unlike the single-open FAQ). Exercises the `disclosure`
 * behavior with `trigger`/`panel` pairs and NO `single` param. Collapsed panels
 * ship `hidden`; the editor canvas reveals them so every row is editable.
 * Real utility classes only.
 */
import { behave, block, el, part } from "../kit";

const row = (title: string, body: string, open = false) =>
  el("div", "border border-base-200 rounded-box", {
    children: [
      part(
        el("button", "w-full flex items-center justify-between gap-4 text-left p-4 font-medium text-base-content", {
          text: title,
          attrs: { type: "button" },
        }),
        "trigger",
      ),
      part(
        el("div", "p-4 pt-0 text-base-content/70", {
          text: body,
          attrs: open ? undefined : { hidden: true },
        }),
        "panel",
      ),
    ],
  });

export const accordion = block({
  key: "accordion",
  name: "Accordion — sections",
  category: "accordion",
  version: "1.0.0",
  description: "A multi-open disclosure list; each section expands independently.",
  tags: ["accordion", "interactive", "disclosure"],
  colors: ["base-200", "base-content"],
  behaviors: ["disclosure"],
  emailEligible: false,
  root: behave(
    el("div", "flex flex-col gap-2 @container", {
      children: [
        row("What's included", "Everything in the core plan, plus priority support and analytics.", true),
        row("How billing works", "You're charged monthly and can change or cancel your plan anytime."),
        row("Can I export my data?", "Yes — export to CSV or JSON from your dashboard whenever you like."),
      ],
    }),
    { type: "disclosure" },
  ),
});
