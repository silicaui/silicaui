/**
 * The published package has to be tree-shakeable, and that is a property of the
 * ARTIFACT, not of the source.
 *
 * The source graph always shook perfectly. What shipped was one pre-bundled
 * `dist/index.js`, and a consumer's bundler seeing a single enormous module
 * keeps whatever it cannot prove dead — so importing one `<Button>` cost
 * +301.6 kB instead of +2.0 kB, and importing four more cost 0.1 kB, because the
 * first import had already paid for the whole library. Nothing in the source
 * said so; nothing in `pnpm build` said so. See docs/personas/issues/086.
 *
 * This is the guard. It is deliberately cheap — four structural facts, no
 * bundler — so it can run on every `pnpm verify` instead of only when someone
 * remembers to weigh an app.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "dist");

if (!existsSync(DIST)) {
  console.error("verify-dist-shakes: no dist/ — run `pnpm build` first.");
  process.exit(1);
}

function jsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...jsFiles(full));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = jsFiles(DIST);
const problems = [];

// 1. `dist` mirrors `src`. One file per module is the whole mechanism: it is
//    what lets a consumer's bundler drop what the app never imports.
if (files.length < 50) {
  problems.push(
    `dist has ${files.length} JS file(s). It should mirror src (roughly one per component). ` +
      `A small number means the package went back to being bundled, and nothing downstream will tree-shake.`,
  );
}

// 2. The entry is a BARREL, not a bundle. A re-export list is small; a bundle
//    is not. This is the number that moved from 286 kB to about 5.
const indexFile = join(DIST, "index.js");
const indexSize = existsSync(indexFile) ? statSync(indexFile).size : 0;
if (indexSize > 40 * 1024) {
  problems.push(
    `dist/index.js is ${(indexSize / 1024).toFixed(1)} kB. The entry must be a re-export barrel, not a bundle — ` +
      `over 40 kB means component code was inlined into it.`,
  );
}

// 3. Every relative import carries a file extension, or Node's own ESM loader
//    cannot resolve it. A bundler papers over this; `node --input-type=module`,
//    a Jest ESM run and a native SSR path do not.
const spec = /(?:from|import)\s*["'](\.[^"']*)["']/g;
const extensionless = [];
for (const file of files) {
  const code = readFileSync(file, "utf8");
  for (const m of code.matchAll(spec)) {
    if (!/\.(js|mjs|cjs|json|css)$/.test(m[1])) extensionless.push(`${relative(DIST, file)} → ${m[1]}`);
  }
}
if (extensionless.length) {
  problems.push(
    `${extensionless.length} relative import(s) have no file extension:\n    ${extensionless.slice(0, 6).join("\n    ")}`,
  );
}

// 4. `'use client'` is on the client modules and NOT on the server entry or the
//    pure helpers it reaches. One stray directive in that graph turns
//    `@wizeworks/silicaui-react/server` into a client reference, which is the
//    exact thing that entry exists to avoid.
function reachableFrom(entry) {
  const seen = new Set();
  const start = join(DIST, entry);
  if (!existsSync(start)) return seen;
  const stack = [start];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of readFileSync(file, "utf8").matchAll(spec)) {
      const target = resolve(dirname(file), m[1]);
      const hit = existsSync(target) ? target : existsSync(`${target}.js`) ? `${target}.js` : join(target, "index.js");
      if (existsSync(hit)) stack.push(hit);
    }
  }
  return seen;
}

const serverGraph = reachableFrom("server.js");
if (serverGraph.size === 0) {
  problems.push("dist/server.js is missing — a Server Component has nothing to import.");
}
const stampedServer = [...serverGraph].filter((f) => readFileSync(f, "utf8").startsWith("'use client'"));
if (stampedServer.length) {
  problems.push(
    `${stampedServer.length} module(s) in the SERVER graph carry 'use client':\n    ` +
      stampedServer.map((f) => relative(DIST, f)).join("\n    "),
  );
}
const unstampedClient = files.filter((f) => !serverGraph.has(f) && !readFileSync(f, "utf8").startsWith("'use client'"));
if (unstampedClient.length) {
  problems.push(
    `${unstampedClient.length} client module(s) are missing 'use client', so a Next.js App Router ` +
      `consumer gets a hard error importing them:\n    ` +
      unstampedClient.slice(0, 6).map((f) => relative(DIST, f)).join("\n    "),
  );
}

if (problems.length) {
  console.error("verify-dist-shakes: the published shape would not tree-shake\n");
  for (const p of problems) console.error(`  ✗ ${p}\n`);
  process.exit(1);
}

console.log(`  ${files.length} modules in dist, entry is ${(indexSize / 1024).toFixed(1)} kB`);
console.log(`  ${serverGraph.size} module(s) in the server graph, none stamped 'use client'`);
console.log("✅ the published package keeps its module graph, so consumers can shake it");
