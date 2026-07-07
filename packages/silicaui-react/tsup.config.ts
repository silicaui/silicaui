import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers and Base UI out of the bundle. The regex catches every
  // `@base-ui-components/react/<part>` subpath import, not just the bare name.
  external: ["react", "react-dom", /^@base-ui-components\//],
});
