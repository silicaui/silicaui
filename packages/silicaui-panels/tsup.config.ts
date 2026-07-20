import { defineConfig } from "tsup";

import { distDir, prependUseClient } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the resize engine external so the consumer's bundler dedupes it.
  external: ["react", "react-dom", "@wizeworks/silicaui-react", "react-resizable-panels"],
  // Client-only: hooks + a DOM-touching engine. See the helper for why this
  // can't be a tsup `banner`.
  async onSuccess() {
    prependUseClient(distDir(import.meta.url));
  },
});
