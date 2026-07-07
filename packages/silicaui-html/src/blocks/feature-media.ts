/**
 * Feature — media split. A single feature told as copy beside a supporting image:
 * eyebrow, heading, body, a short checklist, and an action, with an `Image` atom
 * on the other side. Container-query responsive: the two columns collapse and the
 * image drops below the copy on a narrow container.
 */
import { atom, block, el, slot } from "../kit";

const point = (label: string) =>
  el("li", "flex items-center gap-2 text-base-content/80", {
    children: [
      el("span", "inline-block size-1.5 rounded-full bg-primary", {}),
      el("span", undefined, { text: label }),
    ],
  });

export const featureMedia = block({
  key: "feature_media",
  name: "Feature — media split",
  category: "features",
  version: "1.0.0",
  description: "A single feature: copy, checklist, and action beside a supporting image.",
  tags: ["features", "marketing", "media"],
  colors: ["base-100", "base-content", "primary"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("div", "mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 @3xl:grid-cols-2", {
        children: [
          el("div", "flex flex-col gap-4", {
            children: [
              slot(
                el("p", "text-sm font-semibold uppercase tracking-wide text-primary", { text: "Workflow" }),
                { name: "eyebrow", type: "text", label: "Eyebrow" },
              ),
              slot(
                el("h2", "text-3xl font-semibold text-base-content @2xl:text-4xl", {
                  text: "Design, publish, and iterate in one place",
                }),
                { name: "heading", type: "text", label: "Heading", required: true },
              ),
              slot(
                el("p", "text-base-content/70", {
                  text: "No handoffs, no rebuilds. What you design is exactly what ships — and you can change it in seconds.",
                }),
                { name: "body", type: "text", label: "Body" },
              ),
              el("ul", "flex flex-col gap-2", {
                children: [point("Live container-query previews"), point("One-click publish"), point("Version history")],
              }),
              slot(atom("Button", "btn btn-primary mt-2 self-start", { label: "See how it works" }), {
                name: "cta",
                type: "link",
                label: "Action",
              }),
            ],
          }),
          slot(atom("Image", "rounded-box w-full", { ratio: "square", alt: "Product screenshot" }), {
            name: "image",
            type: "image",
            label: "Image",
          }),
        ],
      }),
    ],
  }),
});
