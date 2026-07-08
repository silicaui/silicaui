import { defineConfig } from "tsup";

export default defineConfig({
  // Two entries: the core (schema + kit + projection) and the blocks subpath
  // (`@wizeworks/silicaui-html/blocks`). Shared modules are chunked automatically.
  entry: ["src/index.ts", "src/blocks/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
