import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the resize engine external so the consumer's bundler dedupes it.
  external: ["react", "react-dom", "@wizeworks/silicaui-react", "react-resizable-panels"],
});
