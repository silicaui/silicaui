/**
 * Starter templates for a NEW component. When a user creates a component they can
 * begin from a blank shell or from a ready-made section — a navbar, a footer, a
 * content block, and so on. The section starters are the SAME validated block
 * templates the Insert palette offers (`@wizeworks/silicaui-html/blocks`), pulled through
 * `paletteItemByKey` so their labels, glyphs, hints, and (crucially) their
 * LITERAL-class roots are reused verbatim — no second copy to drift or to miss the
 * `@source` safelist.
 *
 * A starter is just a `PaletteItem`: `make()` returns a fresh, id-free root the
 * engine stamps into a component master.
 */
import { el } from "@wizeworks/silicaui-html";
import type { PaletteItem } from "./palette";
import { paletteItemByKey } from "./palette";

/** The blank shell — an empty component to build up by hand. Classes are LITERAL
 *  for the canvas safelist (mirrors `createBlankSymbol`'s starter). */
const BLANK: PaletteItem = {
  key: "blank",
  label: "Blank",
  icon: "plus",
  hint: "An empty component to build from scratch",
  make: () =>
    el("div", "flex flex-col gap-3 p-6", {
      children: [
        el("h3", "text-lg font-semibold text-base-content", { text: "New component" }),
        el("p", "text-base-content/70", { text: "Add elements from the Insert panel." }),
      ],
    }),
};

/** One starter grouping shown in the picker. */
export interface StarterGroup {
  key: string;
  label: string;
  items: PaletteItem[];
}

/** Block keys offered as component starters, grouped. Ordered with the archetypes
 *  a user reaches for first (navbar / footer / content) at the top. */
const STARTER_GROUPS: ReadonlyArray<{ key: string; label: string; blocks: string[] }> = [
  { key: "structure", label: "Structure", blocks: ["navbar", "footer"] },
  {
    key: "content",
    label: "Content",
    blocks: ["content_prose", "hero_split_cta", "cta_band", "feature_grid", "feature_media", "faq_accordion"],
  },
  {
    key: "social",
    label: "Marketing",
    blocks: ["pricing_tiers", "stats_band", "testimonials_grid", "team_grid", "logo_cloud", "contact_section"],
  },
];

/** The picker's groups: a "Start blank" group, then the section archetypes. Any
 *  block key that isn't in the catalog is silently skipped (defensive). */
export function componentStarterGroups(): StarterGroup[] {
  const groups: StarterGroup[] = [{ key: "blank", label: "Start blank", items: [BLANK] }];
  for (const g of STARTER_GROUPS) {
    const items = g.blocks
      .map((k) => paletteItemByKey(`block:${k}`))
      .filter((i): i is PaletteItem => Boolean(i));
    if (items.length) groups.push({ key: g.key, label: g.label, items });
  }
  return groups;
}
