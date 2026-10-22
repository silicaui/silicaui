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
    // WizeLens dev tracing (instrumentation.ts) patches Node itself; never bundled.
    "@wizeworks/lens-node",
  ],
  // The WizeLens browser key (public, wl_bk_…), read at BUILD time. Always defined,
  // "" when unset, so the check in app/layout.tsx folds to a constant
  // and a build with no key ships no WizeLens code. CI sets it from the repo
  // variable WIZELENS_BROWSER_KEY.
  env: {
    NEXT_PUBLIC_WIZELENS_KEY: process.env.NEXT_PUBLIC_WIZELENS_KEY ?? "",
  },
  // Node 24 workaround, not a preference. Webpack hashes modules with a
  // bundled xxhash64 WASM module; `WasmHash._updateWithBuffer` caches a
  // reference to `exports.memory.buffer`, and on Node 24 V8 detaches that
  // ArrayBuffer when the wasm memory grows — so the next read throws
  // "Cannot read properties of undefined (reading 'length')" with no usable
  // stack. CI runs Node 20 and never hits it, which is exactly why a local
  // build could fail while CI stayed green.
  //
  // hashFunction only names build artifacts (chunk ids, asset filenames), so
  // switching to Node's native crypto sha256 changes nothing observable about
  // the output. Revisit once webpack ships a fix.
  webpack: (config) => {
    config.output.hashFunction = "sha256";
    return config;
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
