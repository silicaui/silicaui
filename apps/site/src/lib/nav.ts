import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import { CATALOG, GROUP_ORDER } from "./catalog";

export interface NavLink {
  id: string;
  title: string;
  href: string;
  /** Which sidebar group this belongs under (docs/personas/issues/007). */
  group: string;
}

// Single source of truth for the docs sidebar + command palette: every
// component doc page generated in app/docs/components/[slug]/page.tsx gets a
// nav entry automatically — adding a demo to silicaui-demos is enough, no nav
// file to hand-maintain in parallel.
export const COMPONENT_LINKS: NavLink[] = [...DEMO_META]
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((d) => ({
    id: d.id,
    title: d.title,
    href: `/docs/components/${d.id}`,
    group: CATALOG[d.id]?.group ?? "Foundations",
  }));

/**
 * The same links, grouped for the docs sidebar. One flat alphabetical list of 116
 * meant "something to show a status" had to be found by guessing its name — see
 * docs/personas/issues/007. Groups come from the MCP catalog's own `category`,
 * generated into `./catalog`; empty groups are dropped rather than rendered bare.
 */
export const COMPONENT_GROUPS: { group: string; links: NavLink[] }[] = GROUP_ORDER.map(
  (group) => ({ group, links: COMPONENT_LINKS.filter((l) => l.group === group) }),
).filter((g) => g.links.length > 0);
