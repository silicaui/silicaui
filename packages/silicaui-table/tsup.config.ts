import { defineConfig } from "tsup";

import { distDir, prependUseClient } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the headless table engine external so the consumer dedupes them.
  external: ["react", "react-dom", "@wizeworks/silicaui-react", /^@tanstack\//],
  // Client-only: hooks + a DOM-touching engine. See the helper for why this
  // can't be a tsup `banner`.
  async onSuccess() {
    prependUseClient(distDir(import.meta.url));
  },
});
