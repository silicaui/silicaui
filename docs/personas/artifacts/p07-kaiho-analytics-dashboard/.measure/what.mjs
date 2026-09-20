// What is actually IN the one-button bundle, by module, biggest first.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rows = [];

await build({
  root: HERE,
  configFile: false,
  logLevel: "error",
  plugins: [
    react(),
    {
      name: "weigh",
      generateBundle(_opts, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type !== "chunk") continue;
          for (const [id, mod] of Object.entries(file.modules)) {
            rows.push({ id, bytes: mod.renderedLength });
          }
        }
      },
    },
  ],
  resolve: { dedupe: ["react", "react-dom"] },
  build: {
    outDir: path.join(HERE, "out-what"),
    emptyOutDir: true,
    rollupOptions: { input: path.join(HERE, "one-button.html"), output: { manualChunks: undefined } },
  },
});

rows.sort((a, b) => b.bytes - a.bytes);
const short = (id) => id.replace(/.*node_modules[\/]/, "").replace(/.*\.pnpm[\/]/, "");
let total = 0;
for (const r of rows) total += r.bytes;
console.log(`total rendered: ${(total / 1024).toFixed(1)} kB across ${rows.length} modules`);
console.log("");
for (const r of rows.slice(0, 18)) {
  console.log(`  ${(r.bytes / 1024).toFixed(1).padStart(8)} kB  ${short(r.id)}`);
}
