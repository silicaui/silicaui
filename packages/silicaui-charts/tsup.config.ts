import { defineConfig } from "tsup";

import { distDir, prependUseClient } from "../../scripts/tsup-use-client.mjs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers out of the bundle. ECharts is a normal dependency but stays
  // external so the consumer's bundler dedupes it (the regex also catches the
  // `echarts/core`, `echarts/charts`, … subpath imports).
  external: ["react", "react-dom", "@wizeworks/silicaui-react", /^echarts/],
  // Client-only: hooks + a DOM-touching engine. See the helper for why this
  // can't be a tsup `banner`.
  async onSuccess() {
    prependUseClient(distDir(import.meta.url));
  },
});
