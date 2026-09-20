/**
 * Shared tsup `onSuccess` helpers for a package that mirrors `src` into `dist`.
 *
 * Two jobs, both consequences of `bundle: false`.
 *
 * **1. Relative imports need a file extension.** esbuild transforms each file
 * on its own and leaves `from "./button"` exactly as written. A bundler resolves
 * that; **Node's ESM loader does not**, so the package would import cleanly in
 * Vite and throw `ERR_MODULE_NOT_FOUND` under `node --input-type=module`, in a
 * Jest ESM run, and in any SSR path that loads it natively. Rewriting to
 * `./button.js` costs nothing and is correct everywhere.
 *
 * **2. `'use client'` has to be on every client module, not just the entry.**
 * Every component here is a client component (state, context, or Base UI), so
 * without the directive a Next.js App Router consumer gets a hard error. The
 * one thing that must NOT be stamped is the server entry and the pure helpers it
 * reaches: `src/server.ts` exists precisely so a Server Component can import
 * `cx` and the class builders, and one stray directive in that graph turns the
 * whole thing into a client reference.
 *
 * The directive can't be done with tsup's `banner`: esbuild special-cases
 * `"use client"` as a directive and silently drops it when injected that way.
 * The only reliable route is prepending raw text after the files are written —
 * fiddly enough (the sourcemap has to be shifted too) that it lives here once
 * instead of being re-derived in six tsup configs.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIRECTIVE = "'use client';";

/** Every `.js` under `dir`, recursively, as absolute paths. */
function jsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...jsFiles(full));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

/** The relative specifiers an emitted module imports or re-exports from. */
function relativeSpecifiers(code) {
  const out = [];
  const re = /(?:from|import)\s*["'](\.[^"']*)["']/g;
  let m;
  while ((m = re.exec(code))) out.push(m[1]);
  return out;
}

/**
 * Add `.js` to every extensionless relative specifier, resolving a directory
 * specifier to its `index.js` the way a bundler would.
 */
export function addJsExtensions(outDir) {
  for (const file of jsFiles(outDir)) {
    const code = readFileSync(file, "utf8");
    const fixed = code.replace(/((?:from|import)\s*["'])(\.[^"']*)(["'])/g, (whole, open, spec, close) => {
      if (/\.(js|mjs|cjs|json|css)$/.test(spec)) return whole;
      const target = resolve(dirname(file), spec);
      if (existsSync(`${target}.js`)) return `${open}${spec}.js${close}`;
      if (existsSync(join(target, "index.js"))) return `${open}${spec}/index.js${close}`;
      // Unresolvable from here — leave it alone rather than inventing a path,
      // and let the check below be the thing that reports it.
      return whole;
    });
    if (fixed !== code) writeFileSync(file, fixed);
  }
}

/** Throw if any relative specifier in `dist` still has no extension. */
export function assertResolvable(outDir) {
  const bad = [];
  for (const file of jsFiles(outDir)) {
    for (const spec of relativeSpecifiers(readFileSync(file, "utf8"))) {
      if (!/\.(js|mjs|cjs|json|css)$/.test(spec)) bad.push(`${relative(outDir, file)} → ${spec}`);
    }
  }
  if (bad.length) {
    throw new Error(
      `tsup: ${bad.length} relative import(s) in dist have no file extension, so Node's ESM loader ` +
        `cannot resolve them:\n  ${bad.slice(0, 10).join("\n  ")}`,
    );
  }
}

/** Every module reachable from `entry` through relative imports, inclusive. */
function reachableFrom(outDir, entry) {
  const seen = new Set();
  const start = join(outDir, entry);
  if (!existsSync(start)) return seen;
  const stack = [start];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of relativeSpecifiers(readFileSync(file, "utf8"))) {
      const target = resolve(dirname(file), spec);
      const resolved = existsSync(target) ? target : existsSync(`${target}.js`) ? `${target}.js` : join(target, "index.js");
      if (existsSync(resolved)) stack.push(resolved);
    }
  }
  return seen;
}

/**
 * Stamp `'use client'` on every module in `dist` except the server entry and
 * everything it reaches.
 *
 * @param {string} outDir absolute path to the package's `dist`
 * @param {{ serverEntry?: string }} [opts]
 */
export function stampClientModules(outDir, opts = {}) {
  const serverEntry = opts.serverEntry ?? "server.js";
  const serverGraph = reachableFrom(outDir, serverEntry);
  let stamped = 0;
  for (const file of jsFiles(outDir)) {
    if (serverGraph.has(file)) continue;
    const js = readFileSync(file, "utf8");
    if (js.startsWith(DIRECTIVE)) continue;
    writeFileSync(file, `${DIRECTIVE}\n${js}`);
    stamped++;

    // Prepending a line shifts every mapping down by one; a leading `;` in the
    // mappings string accounts for that without recomputing segments.
    const mapFile = `${file}.map`;
    if (!existsSync(mapFile)) continue;
    const map = JSON.parse(readFileSync(mapFile, "utf8"));
    if (!map.mappings.startsWith(";")) {
      map.mappings = `;${map.mappings}`;
      writeFileSync(mapFile, JSON.stringify(map));
    }
  }
  return { stamped, serverGraph: serverGraph.size };
}

/**
 * The whole post-build step for a per-module package: fix the specifiers, prove
 * they resolve, then mark the client modules.
 */
export function finishPerModuleBuild(outDir, opts = {}) {
  addJsExtensions(outDir);
  assertResolvable(outDir);
  return stampClientModules(outDir, opts);
}

/**
 * @param {string} outDir  absolute path to the package's `dist`
 * @param {string[]} files bundle basenames to stamp (default: the main entry)
 *
 * Kept for the packages still built as a single bundle.
 */
export function prependUseClient(outDir, files = ["index.js"]) {
  for (const file of files) {
    const outFile = join(outDir, file);
    const js = readFileSync(outFile, "utf8");
    if (!js.startsWith(DIRECTIVE)) {
      writeFileSync(outFile, `${DIRECTIVE}\n${js}`);
    }

    const mapFile = `${outFile}.map`;
    if (!existsSync(mapFile)) continue;
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
