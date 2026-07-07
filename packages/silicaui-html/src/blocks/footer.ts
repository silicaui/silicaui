/**
 * Footer — multi-column. A brand blurb beside three link columns, with a thin
 * copyright rule beneath. Container-query responsive: the columns stack on a
 * narrow container and spread to a 4-wide grid past `@2xl`.
 */
import { block, el, slot } from "../kit";

const link = (label: string) =>
  el("li", undefined, {
    children: [
      el("a", "text-sm text-base-content/60 hover:text-base-content", { text: label, attrs: { href: "#" } }),
    ],
  });

const column = (title: string, labels: string[]) =>
  el("div", "flex flex-col gap-3", {
    children: [
      el("p", "text-sm font-semibold text-base-content", { text: title }),
      el("ul", "flex flex-col gap-2", { children: labels.map(link) }),
    ],
  });

export const footer = block({
  key: "footer",
  name: "Footer — columns + copyright",
  category: "footer",
  version: "1.0.0",
  description: "A multi-column site footer: brand blurb, link columns, and a copyright rule.",
  tags: ["footer", "nav", "marketing"],
  colors: ["base-100", "base-200", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("footer", "@container bg-base-100 border-t border-base-200", {
    children: [
      el("div", "mx-auto w-full max-w-6xl px-6 py-12", {
        children: [
          el("div", "grid grid-cols-1 gap-8 @md:grid-cols-2 @2xl:grid-cols-4", {
            children: [
              el("div", "flex flex-col gap-3", {
                children: [
                  slot(el("p", "text-lg font-semibold text-base-content", { text: "Northwind" }), {
                    name: "brand",
                    type: "text",
                    label: "Brand",
                  }),
                  slot(
                    el("p", "text-sm text-base-content/60", {
                      text: "The fastest way to launch and grow your online store.",
                    }),
                    { name: "blurb", type: "text", label: "Blurb" },
                  ),
                ],
              }),
              column("Product", ["Features", "Pricing", "Integrations", "Changelog"]),
              column("Company", ["About", "Careers", "Blog", "Contact"]),
              column("Legal", ["Privacy", "Terms", "Security"]),
            ],
          }),
          el("div", "mt-10 border-t border-base-200 pt-6", {
            children: [
              el("p", "text-sm text-base-content/50", { text: "© 2026 Northwind, Inc. All rights reserved." }),
            ],
          }),
        ],
      }),
    ],
  }),
});
