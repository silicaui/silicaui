import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
async function run(entry) {
  const outDir = path.join(HERE, `out-${entry}`);
  await build({
    root: HERE, configFile: false, logLevel: "error",
    plugins: [react()],
    resolve: { dedupe: ["react", "react-dom"] },
    build: { outDir, emptyOutDir: true, rollupOptions: { input: path.join(HERE, `${entry}.html`), output: { manualChunks: undefined } } },
  });
  const files = await readdir(path.join(outDir, "assets"));
  let raw = 0, gz = 0;
  for (const f of files.filter((x) => x.endsWith(".js"))) {
    const buf = await readFile(path.join(outDir, "assets", f));
    raw += buf.length; gz += gzipSync(buf).length;
  }
  return { raw, gz };
}
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const base = await run("react-only");
const dist = await run("one-button");
const src = await run("from-source");
console.log("");
console.log(`  react only                     ${kb(base.raw).padStart(10)}  gzip ${kb(base.gz).padStart(9)}`);
console.log(`  + Button from the PUBLISHED dist ${kb(dist.raw).padStart(8)}  gzip ${kb(dist.gz).padStart(9)}   (+${kb(dist.raw - base.raw)})`);
console.log(`  + Button from SOURCE             ${kb(src.raw).padStart(8)}  gzip ${kb(src.gz).padStart(9)}   (+${kb(src.raw - base.raw)})`);
