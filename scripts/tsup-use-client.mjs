/**
 * Shared tsup `onSuccess` helper: stamp `'use client'` onto a built bundle.
 *
 * Every React-layer package here is client-only (state, context, Base UI, or a
 * third-party engine that touches the DOM), so its bundle must carry the
 * directive or a Next.js App Router consumer gets a hard error on import.
 *
 * This can't be done with tsup's `banner`: esbuild special-cases `"use client"`
 * as a directive and silently drops it when injected that way on a bundled
 * entry. The only reliable route is prepending raw text after the bundle is
 * written — which is fiddly enough (the sourcemap has to be shifted too) that
 * it lives here once instead of being re-derived in six tsup configs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIRECTIVE = "'use client';";

/**
 * @param {string} outDir  absolute path to the package's `dist`
 * @param {string[]} files bundle basenames to stamp (default: the main entry)
 */
export function prependUseClient(outDir, files = ["index.js"]) {
  for (const file of files) {
    const outFile = join(outDir, file);
    const js = readFileSync(outFile, "utf8");
    if (!js.startsWith(DIRECTIVE)) {
      writeFileSync(outFile, `${DIRECTIVE}\n${js}`);
    }

    // Prepending a line shifts every mapping down by one; a leading `;` in the
    // mappings string accounts for that without recomputing segments.
    const mapFile = `${outFile}.map`;
    const map = JSON.parse(readFileSync(mapFile, "utf8"));
    if (!map.mappings.startsWith(";")) {
      map.mappings = `;${map.mappings}`;
      writeFileSync(mapFile, JSON.stringify(map));
    }
  }
}

/** Resolve `dist` relative to a tsup config's own `import.meta.url`. */
export function distDir(configUrl) {
  return join(dirname(fileURLToPath(configUrl)), "dist");
}
