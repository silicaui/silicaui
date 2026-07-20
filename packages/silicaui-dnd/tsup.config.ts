import { defineConfig } from "tsup";

import { distDir, prependUseClient } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the dnd-kit engine external so the consumer's bundler dedupes
  // them (the regex catches every `@dnd-kit/*` subpackage).
  external: ["react", "react-dom", "@wizeworks/silicaui-react", /^@dnd-kit\//],
  // Client-only: hooks + a DOM-touching engine. See the helper for why this
  // can't be a tsup `banner`.
  async onSuccess() {
    prependUseClient(distDir(import.meta.url));
  },
});
