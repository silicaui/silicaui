import { defineConfig } from "tsup";

import { distDir, finishPerModuleBuild } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  // ONE OUTPUT FILE PER SOURCE FILE, not one bundle.
  //
  // A single pre-bundled `dist/index.js` cannot be tree-shaken by a consumer's
  // bundler: it sees one enormous module and keeps whatever it cannot prove
  // dead. Measured on a real app (docs/personas/issues/086) importing exactly
  // one `Button`:
  //
  //     from SOURCE          +2.0 kB
  //     from the dist bundle +301.6 kB
  //
  // The component is two kilobytes. Publishing it inside one file made it three
  // hundred. Mirroring `src` into `dist` hands the consumer the real module
  // graph, which is the thing their bundler is good at.
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  bundle: false,
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Peers and Base UI were already external; with `bundle: false` nothing is
  // inlined at all, so the list is kept only as documentation of intent.
  external: ["react", "react-dom", /^@base-ui\//],
  // With one file per module there are three things to put right afterwards:
  // relative imports need a `.js` so Node's own ESM loader can resolve them,
  // that has to be PROVED rather than assumed, and `'use client'` belongs on
  // every client module instead of only the entry — but never on `server.js` or
  // the pure helpers it reaches, which exist precisely so a Server Component can
  // import `cx` and the class builders.
  async onSuccess() {
    finishPerModuleBuild(distDir(import.meta.url), { serverEntry: "server.js" });
  },
});
