/**
 * Logo cloud — a "trusted by" strip. A caption over a row of muted wordmarks
 * (plain text stand-ins the author swaps for real logos). Container-query
 * responsive: wraps to fewer per row on a narrow container.
 */
import { block, el, slot } from "../kit";

const mark = (name: string) =>
  el("span", "text-lg font-semibold tracking-tight text-base-content/50", { text: name });

export const logoCloud = block({
  key: "logo_cloud",
  name: "Logo cloud — trusted by",
  category: "logos",
  version: "1.0.0",
  description: "A social-proof strip of customer wordmarks under a caption.",
  tags: ["logos", "social-proof", "marketing"],
  colors: ["base-100", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("div", "mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-14", {
        children: [
          slot(
            el("p", "text-sm font-medium uppercase tracking-wide text-base-content/50", {
              text: "Trusted by teams at",
            }),
            { name: "caption", type: "text", label: "Caption" },
          ),
          el("div", "flex flex-wrap items-center justify-center gap-x-10 gap-y-6", {
            children: [mark("Meridian"), mark("Halcyon"), mark("Brightline"), mark("Loom & Co"), mark("Northgate")],
          }),
        ],
      }),
    ],
  }),
});
