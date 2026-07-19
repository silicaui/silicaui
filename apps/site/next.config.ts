import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Static export: every route bakes to a real .html file at build time so
// crawlers that don't execute JS (most AI answer-engine bots included) see
// real content, not a client-rendered shell.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // .mdx alongside .tsx as a page/layout source — docs prose (getting-started,
  // architecture guides) lives in .mdx files; component doc pages stay .tsx
  // (schema-driven off DEMO_META, not hand-written prose). Not competing.
  pageExtensions: ["ts", "tsx", "mdx"],
  // @wizeworks/silicaui-react ships pre-built ESM with a top-level
  // `createContext()` call inside its `"use client"` bundle. Next's default
  // handling bundles ESM node_modules packages into its OWN server
  // compilation graph, where the page-data-collection pass resolves `react`
  // to Next's internal react-server-components build (no createContext).
  // `serverExternalPackages` opts it out of that bundling — Next leaves it as
  // a genuine external import resolved via normal Node/ESM resolution, which
  // gets the real `react` install instead of Next's vendored one.
  serverExternalPackages: [
    "@wizeworks/silicaui-react",
    "@wizeworks/silicaui-html",
    "@wizeworks/silicaui-demos",
  ],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
