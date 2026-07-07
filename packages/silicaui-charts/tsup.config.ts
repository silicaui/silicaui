import { defineConfig } from "tsup";

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
  external: ["react", "react-dom", "silicaui-react", /^echarts/],
});
