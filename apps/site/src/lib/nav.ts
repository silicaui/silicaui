import { DEMO_META } from "@wizeworks/silicaui-demos/meta";

export interface NavLink {
  id: string;
  title: string;
  href: string;
}

// Single source of truth for the docs sidebar + command palette: every
// component doc page generated in app/docs/components/[slug]/page.tsx gets a
// nav entry automatically — adding a demo to silicaui-demos is enough, no nav
// file to hand-maintain in parallel.
export const COMPONENT_LINKS: NavLink[] = [...DEMO_META]
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((d) => ({ id: d.id, title: d.title, href: `/docs/components/${d.id}` }));
