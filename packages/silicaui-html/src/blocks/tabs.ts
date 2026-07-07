/**
 * Tabs — an exclusive tab strip over stacked panels. Exercises the `tabs`
 * behavior: a `tablist` of `tab` parts paired positionally with `panel` parts,
 * arrow-key roving in output. Non-active panels ship `hidden` (so only the first
 * shows before hydration); the editor canvas reveals every panel for editing.
 * Real utility classes only.
 */
import { behave, block, el, part } from "../kit";

const tab = (label: string, selected = false) =>
  part(
    el(
      "button",
      "px-4 py-2 -mb-px border-b-2 font-medium " +
        (selected ? "border-primary text-primary" : "border-transparent text-base-content/60"),
      { text: label, attrs: { type: "button", role: "tab", "aria-selected": selected ? "true" : "false", tabindex: selected ? 0 : -1 } },
    ),
    "tab",
  );

const panel = (body: string, open = false) =>
  part(
    el("div", "p-4 text-base-content/80", {
      text: body,
      attrs: open ? { role: "tabpanel" } : { role: "tabpanel", hidden: true },
    }),
    "panel",
  );

export const tabs = block({
  key: "tabs",
  name: "Tabs — panels",
  category: "tabs",
  version: "1.0.0",
  description: "An exclusive tab strip over stacked panels, with arrow-key navigation.",
  tags: ["tabs", "interactive", "disclosure"],
  colors: ["base-100", "base-200", "base-content", "primary"],
  behaviors: ["tabs"],
  emailEligible: false,
  root: behave(
    el("div", "bg-base-100 @container", {
      children: [
        el("div", "flex gap-1 border-b border-base-200", {
          attrs: { role: "tablist" },
          children: [tab("Overview", true), tab("Features"), tab("Pricing")],
        }),
        panel("A quick summary of what this product does and who it's for.", true),
        panel("The capabilities that set it apart, described point by point."),
        panel("Straightforward plans that scale as your team grows."),
      ],
    }),
    { type: "tabs" },
  ),
});
