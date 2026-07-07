import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "dist");

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
  async onSuccess() {
    // Every component here is a client component (state, context, or Base UI
    // under the hood). esbuild special-cases "use client" as a directive and
    // silently drops it when injected via `banner` on a bundled entry, so it
    // has to be prepended as raw text after the bundle is written instead.
    const outFile = join(outDir, "index.js");
    const js = readFileSync(outFile, "utf8");
    if (!js.startsWith("'use client';")) {
      writeFileSync(outFile, `'use client';\n${js}`);
    }

    // Prepending a line shifts every mapping down by one; a leading `;` in
    // the mappings string accounts for that without recomputing segments.
    const mapFile = `${outFile}.map`;
    const map = JSON.parse(readFileSync(mapFile, "utf8"));
    if (!map.mappings.startsWith(";")) {
      map.mappings = `;${map.mappings}`;
      writeFileSync(mapFile, JSON.stringify(map));
    }
  },
});
