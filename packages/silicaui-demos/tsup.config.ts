import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "dist");

// Two entries, deliberately NOT sharing a module graph:
//  - `index` (DEMOS incl. the actual hook-using components) is client-only.
//  - `meta` (DEMO_META, plain id/title data) imports zero component files, so
//    a Server Component (e.g. generateStaticParams) can read it safely —
//    Next's RSC compiler flags a whole *file* the moment a Server Component
//    reaches a hook call anywhere in its bundle, not just the export used.
export default defineConfig({
  entry: ["src/index.ts", "src/meta.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    /^@wizeworks\/silicaui-/,
    /^@base-ui-components\//,
  ],
  async onSuccess() {
    // Every demo uses hooks — same "use client" banner fix as silicaui-react's
    // tsup config: esbuild drops a directive injected via `banner` on a
    // bundled entry, so it's prepended as raw text after the bundle is
    // written instead. Only `index.js`, never `meta.js`.
    const outFile = join(outDir, "index.js");
    const js = readFileSync(outFile, "utf8");
    if (!js.startsWith("'use client';")) {
      writeFileSync(outFile, `'use client';\n${js}`);
    }

    const mapFile = `${outFile}.map`;
    const map = JSON.parse(readFileSync(mapFile, "utf8"));
    if (!map.mappings.startsWith(";")) {
      map.mappings = `;${map.mappings}`;
      writeFileSync(mapFile, JSON.stringify(map));
    }
  },
});
