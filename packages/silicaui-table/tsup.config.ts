import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the headless table engine external so the consumer dedupes them.
  external: ["react", "react-dom", "@wizeworks/silicaui-react", /^@tanstack\//],
});
