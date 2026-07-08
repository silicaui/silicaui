import { defineConfig } from "tsup";

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
});
