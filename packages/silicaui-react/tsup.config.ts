import { defineConfig } from "tsup";

import { distDir, prependUseClient } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  entry: ["src/index.ts", "src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers and Base UI out of the bundle. The regex catches every
  // `@base-ui-components/react/<part>` subpath import, not just the bare name.
  external: ["react", "react-dom", /^@base-ui-components\//],
  // Every component in the main entry is a client component (state, context, or
  // Base UI under the hood). `src/server.ts` is deliberately NOT stamped — it
  // exists precisely so a Server Component can import from Silica.
  async onSuccess() {
    prependUseClient(distDir(import.meta.url));
  },
});
