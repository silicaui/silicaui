/**
 * Navbar — site header. A brand on the left, inline nav links in the middle, and
 * a primary action on the right. Fully editable: every link/label/button is a
 * real child node (not a prop), so a builder edits them in place. Container-query
 * responsive — the link row hides on a narrow container (`@md:` reveals it), the
 * bar staying usable as a compact brand + action.
 */
import { atom, block, el, slot } from "../kit";

const link = (label: string) =>
  el("a", "text-sm font-medium text-base-content/70 hover:text-base-content", {
    text: label,
    attrs: { href: "#" },
  });

export const navbar = block({
  key: "navbar",
  name: "Navbar — brand, links, action",
  category: "nav",
  version: "1.0.0",
  description: "A site header: brand, inline navigation links, and a primary action.",
  tags: ["nav", "header", "marketing"],
  colors: ["base-100", "base-200", "base-content", "primary"],
  behaviors: [],
  emailEligible: false,
  root: el("header", "@container bg-base-100 border-b border-base-200", {
    children: [
      el("div", "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4", {
        children: [
          slot(
            el("a", "text-lg font-semibold text-base-content", { text: "Northwind", attrs: { href: "#" } }),
            { name: "brand", type: "text", label: "Brand" },
          ),
          el("nav", "hidden items-center gap-6 @md:flex", {
            children: [link("Product"), link("Pricing"), link("Docs"), link("Company")],
          }),
          el("div", "flex items-center gap-3", {
            children: [
              el("a", "hidden text-sm font-medium text-base-content/70 hover:text-base-content @sm:inline", {
                text: "Sign in",
                attrs: { href: "#" },
              }),
              slot(atom("Button", "btn btn-primary btn-sm", { label: "Get started" }), {
                name: "cta",
                type: "link",
                label: "Primary action",
              }),
            ],
          }),
        ],
      }),
    ],
  }),
});
