import { defineConfig } from "tsup";

export default defineConfig({
  // Three entries: the core (schema + kit + projection), the blocks subpath
  // (`@wizeworks/silicaui-html/blocks`), and the theme→CSS subpath
  // (`@wizeworks/silicaui-html/theme`) — separate because it is the only part
  // that needs `@wizeworks/silicaui`, an optional peer, so the core entry stays
  // dependency-free. Shared modules are chunked automatically.
  entry: ["src/index.ts", "src/blocks/index.ts", "src/theme.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
