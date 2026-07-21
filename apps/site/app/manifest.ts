import type { MetadataRoute } from "next";
import {
  BRAND_BG_HEX,
  BRAND_HEX,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site";

/**
 * Web app manifest. `theme_color` is the shipped Quartz `primary` resolved to a
 * concrete hex — a JSON manifest can't hold a CSS custom property, the same
 * sanctioned literal-color context as an OG image (CLAUDE.md RULE #1).
 *
 * Icons currently reference the SVG mark (scales to any size). A PNG icon set
 * (192/512, maskable) is part of the OG-image/raster-asset follow-up.
 */
// Bake to a static /manifest.webmanifest at build time (required by `output: export`).
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — CSS-first Tailwind component library`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_BG_HEX,
    theme_color: BRAND_HEX,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
