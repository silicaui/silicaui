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
import type { PaletteGroup, PaletteItem } from "./palette";
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

/** A host's contribution to the starter picker (`BuilderHost.componentStarters`).
 *  Mirrors `catalog()`'s shape: `extend` adds curated starter groups, `hide`
 *  removes item OR whole group keys — the one lever for curating what a host
 *  already surfaced (its own composites, or a default archetype it doesn't want). */
export interface StarterContribution {
  extend?: StarterGroup[];
  hide?: string[];
}

/** What a host makes available to the starter picker. `catalogExtend` is the
 *  host's OWN `catalog().extend` groups — editable node-trees — which auto-surface
 *  as starters (key + label preserved). `starters` is the explicit, curated seam.
 *  NOTE: `hostComponents()` (locked HostNodes) is deliberately NOT accepted here —
 *  those are opaque, not editable trees, so they never become starters. */
export interface StarterOptions {
  catalogExtend?: readonly PaletteGroup[];
  starters?: StarterContribution;
}

/** Append a group's items into `groups` — into a same-keyed group if one exists
 *  (skipping item keys already present), else as a new trailing group. Same merge
 *  semantics as `mergeCatalog`, so a host group lands predictably. */
function mergeStarterGroup(groups: StarterGroup[], incoming: StarterGroup): void {
  const existing = groups.find((g) => g.key === incoming.key);
  if (!existing) {
    groups.push({ ...incoming, items: [...incoming.items] });
    return;
  }
  for (const item of incoming.items) {
    if (!existing.items.some((i) => i.key === item.key)) existing.items.push(item);
  }
}

/** Drop hidden item AND group keys, then any group left empty (applied last so a
 *  host's `hide` wins over both defaults and its own `extend`). */
function applyStarterHide(groups: StarterGroup[], hide?: string[]): StarterGroup[] {
  if (!hide?.length) return groups;
  const hidden = new Set(hide);
  return groups
    .filter((g) => !hidden.has(g.key))
    .map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.key)) }))
    .filter((g) => g.items.length > 0);
}

/**
 * The picker's groups: a "Start blank" group, the built-in section archetypes,
 * then (for a host) its editable catalog additions and explicit starter groups.
 *
 * A host's `catalog().extend` groups auto-surface here verbatim — same key, same
 * label — so a "Commerce" Insert group becomes a "Commerce" starter group with no
 * second declaration; its editable node-trees are exactly what "start a component
 * from our product card" needs. `componentStarters()` then curates on top
 * (`extend` for starter-only groups, `hide` to prune anything, defaults included).
 * Any block key not in the catalog is silently skipped (defensive).
 */
export function componentStarterGroups(opts?: StarterOptions): StarterGroup[] {
  const groups: StarterGroup[] = [{ key: "blank", label: "Start blank", items: [BLANK] }];
  for (const g of STARTER_GROUPS) {
    const items = g.blocks
      .map((k) => paletteItemByKey(`block:${k}`))
      .filter((i): i is PaletteItem => Boolean(i));
    if (items.length) groups.push({ key: g.key, label: g.label, items });
  }
  // Auto-surface the host's own editable catalog groups (NOT its host components).
  for (const g of opts?.catalogExtend ?? []) {
    mergeStarterGroup(groups, { key: g.key, label: g.label, items: g.items });
  }
  // Explicit, curated starter contributions.
  for (const g of opts?.starters?.extend ?? []) mergeStarterGroup(groups, g);
  return applyStarterHide(groups, opts?.starters?.hide);
}
