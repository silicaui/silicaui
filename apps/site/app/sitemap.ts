import type { MetadataRoute } from "next";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import { url } from "@/lib/site";

/**
 * The complete URL set — the marketing surfaces, the docs entry points, and
 * every one of the ~113 generated component pages — so search and answer
 * engines discover the whole library from one file instead of only what they
 * stumble onto via links. Generated from the same `DEMO_META` the pages are,
 * so a new component appears here automatically.
 */
// Bake to a static /sitemap.xml at build time (required by `output: export`).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: url("/docs"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    {
      url: url("/docs/getting-started"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: url("/about"), lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];

  const components: MetadataRoute.Sitemap = DEMO_META.map((d) => ({
    url: url(`/docs/components/${d.id}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...core, ...components];
}
