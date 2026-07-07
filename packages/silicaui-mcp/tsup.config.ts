import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // The generated catalog is plain JSON read at runtime, not bundled — copy it
  // next to the build output so `dist/data/*.json` resolves the same way
  // `src/data/*.json` does in dev.
  onSuccess: "node scripts/copy-data.mjs",
});
