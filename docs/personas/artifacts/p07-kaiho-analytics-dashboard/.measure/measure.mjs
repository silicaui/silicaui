/**
 * What does each import actually cost?
 *
 * Three builds from the same toolchain, differing only in what they import:
 *
 *   react-only   — react + react-dom, nothing else
 *   one-button   — the above, plus ONE component from @wizeworks/silicaui-react
 *   five         — the above, plus the four more the dashboard shell uses
 *
 * The difference between the first two is the cost of reaching into the
 * package at all, which is the number that says whether the barrel tree-shakes.
 */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readdir, readFile, rm } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const ENTRIES = ["react-only", "one-button", "five"];

async function weigh(dir) {
  const files = await readdir(path.join(dir, "assets"));
  let raw = 0;
  let gz = 0;
  for (const f of files.filter((x) => x.endsWith(".js"))) {
    const buf = await readFile(path.join(dir, "assets", f));
    raw += buf.length;
    gz += gzipSync(buf).length;
  }
  return { raw, gz };
}

const results = [];
for (const name of ENTRIES) {
  const outDir = path.join(HERE, `out-${name}`);
  await rm(outDir, { recursive: true, force: true });
  await build({
    root: HERE,
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    resolve: { dedupe: ["react", "react-dom"] },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(HERE, `${name}.html`),
        output: { manualChunks: undefined },
      },
    },
  });
  results.push({ name, ...(await weigh(outDir)) });
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log("");
console.log("what each import costs (JS only, one chunk):");
console.log("");
for (const r of results) {
  console.log(`  ${r.name.padEnd(12)} ${kb(r.raw).padStart(10)}   gzip ${kb(r.gz).padStart(9)}`);
}
const base = results[0];
console.log("");
for (const r of results.slice(1)) {
  console.log(
    `  ${r.name} over react-only: +${kb(r.raw - base.raw)} raw, +${kb(r.gz - base.gz)} gzip`,
  );
}
const one = results[1];
const five = results[2];
console.log("");
console.log(
  `  four more components on top of the first: +${kb(five.raw - one.raw)} raw, +${kb(five.gz - one.gz)} gzip`,
);
console.log("");
console.log(
  five.raw - one.raw < (one.raw - base.raw) * 0.25
    ? "  → the first import carries the weight; the next four are nearly free."
    : "  → each component costs roughly its own size, so the barrel is shaking out.",
);
