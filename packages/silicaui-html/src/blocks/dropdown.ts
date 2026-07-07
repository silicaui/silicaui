/**
 * Dropdown — a click-triggered menu. Exercises the `menu` behavior: a `trigger`
 * opens a `panel` of `item` parts, with Escape / outside-click dismiss and
 * Up/Down roving in output. The panel ships `hidden` and is absolutely
 * positioned under the trigger; the editor canvas reveals it for editing.
 * Real utility classes only (`absolute`/`z-10` are allowed; `fixed` is not).
 */
import { behave, block, el, part } from "../kit";

const option = (label: string) =>
  el("li", undefined, {
    children: [
      part(
        el("a", "block px-3 py-2 rounded-btn text-base-content hover:bg-base-200", {
          text: label,
          attrs: { href: "#" },
        }),
        "item",
      ),
    ],
  });

export const dropdown = block({
  key: "dropdown",
  name: "Dropdown — menu",
  category: "dropdown",
  version: "1.0.0",
  description: "A button that opens a menu of actions, with keyboard and dismiss support.",
  tags: ["dropdown", "menu", "interactive"],
  colors: ["base-100", "base-200", "base-content"],
  behaviors: ["menu"],
  emailEligible: false,
  root: behave(
    el("div", "relative inline-block @container", {
      children: [
        part(
          el("button", "btn btn-primary", { text: "Options", attrs: { type: "button" } }),
          "trigger",
        ),
        part(
          el("ul", "menu absolute mt-2 w-52 p-2 z-10 bg-base-100 rounded-box border border-base-200 shadow-lg", {
            attrs: { hidden: true },
            children: [option("Profile"), option("Settings"), option("Sign out")],
          }),
          "panel",
        ),
      ],
    }),
    { type: "menu" },
  ),
});
