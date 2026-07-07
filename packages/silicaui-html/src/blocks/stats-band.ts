/**
 * Stats band — a row of headline metrics. Four big-number + label pairs that
 * make traction legible at a glance. Container-query responsive: two-up on a
 * narrow container, four-up past `@2xl`.
 */
import { block, el } from "../kit";

const stat = (value: string, label: string) =>
  el("div", "flex flex-col items-center gap-1 text-center", {
    children: [
      el("span", "text-4xl font-semibold text-base-content @2xl:text-5xl", { text: value }),
      el("span", "text-sm text-base-content/60", { text: label }),
    ],
  });

export const statsBand = block({
  key: "stats_band",
  name: "Stats — metrics band",
  category: "stats",
  version: "1.0.0",
  description: "A row of headline metrics with big numbers and labels.",
  tags: ["stats", "metrics", "social-proof"],
  colors: ["base-100", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("div", "mx-auto grid w-full max-w-5xl grid-cols-2 gap-8 px-6 py-16 @2xl:grid-cols-4", {
        children: [
          stat("12k+", "Active stores"),
          stat("99.99%", "Uptime"),
          stat("40+", "Countries"),
          stat("4.9/5", "Average rating"),
        ],
      }),
    ],
  }),
});
