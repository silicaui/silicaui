/**
 * Team — grid. People cards, each an avatar over a name and role. Container-query
 * responsive: two-up on a narrow container, four-up past `@3xl`.
 */
import { atom, block, el, slot } from "../kit";

const member = (name: string, role: string) =>
  el("div", "flex flex-col items-center gap-3 text-center", {
    children: [
      atom("Avatar", "avatar w-20 rounded-full", { alt: "" }),
      el("div", undefined, {
        children: [
          el("p", "font-semibold text-base-content", { text: name }),
          el("p", "text-sm text-base-content/60", { text: role }),
        ],
      }),
    ],
  });

export const teamGrid = block({
  key: "team_grid",
  name: "Team — member grid",
  category: "team",
  version: "1.0.0",
  description: "A grid of team members with avatars, names, and roles.",
  tags: ["team", "about", "people"],
  colors: ["base-100", "base-content"],
  behaviors: [],
  emailEligible: false,
  root: el("section", "@container bg-base-100", {
    children: [
      el("div", "mx-auto w-full max-w-6xl px-6 py-16", {
        children: [
          slot(
            el("h2", "mb-10 text-center text-3xl font-semibold text-base-content", { text: "Meet the team" }),
            { name: "heading", type: "text", label: "Heading" },
          ),
          el("div", "grid grid-cols-2 gap-8 @xl:grid-cols-3 @3xl:grid-cols-4", {
            children: [
              member("Ada Okafor", "CEO"),
              member("Ravi Menon", "CTO"),
              member("Lena Fischer", "Head of Design"),
              member("Tomás Silva", "Head of Support"),
            ],
          }),
        ],
      }),
    ],
  }),
});
