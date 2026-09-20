// Act 10 — where the final bundle's bytes actually went.
//
// The act-1 method was to build twice and subtract. That works for one component
// and it is the wrong tool for five engines: subtracting five builds hides the
// shared code and double-counts nothing consistently. This builds the REAL app
// once and asks rollup which module contributed how many rendered bytes, then
// groups by the package the module came from.
//
// Rendered bytes, not gzipped: gzip is a property of the whole file, so a
// per-module gzip figure would be an invention. The gzip total for the file is
// measured separately, on the file.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const rows = [];

await build({
  root: APP,
  configFile: false,
  logLevel: "error",
  plugins: [
    react(),
    tailwind(),
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
  build: { outDir: path.join(HERE, "out-attribute"), emptyOutDir: true, minify: "esbuild" },
});

/**
 * Which engine a module belongs to, by the package path it came from.
 *
 * ORDER MATTERS AND IT BIT ME. The `react` rule was `/react@/`, and pnpm stores
 * this package as `@wizeworks+silicaui-react@file+...` -- which contains
 * `react@`. So every silicaui-react module was counted as React, and the run
 * reported "silicaui core 0.0 kB", which is not a number anybody should publish.
 * The design-system packages are matched FIRST now, and the catch-all buckets
 * are printed so a mis-binned package is visible instead of silent.
 */
function owner(id) {
  const n = id.split(String.fromCharCode(92)).join("/");
  if (/@wizeworks[+/]silicaui-charts/.test(n)) return "silicaui-charts (wrapper)";
  if (/@wizeworks[+/]silicaui-table/.test(n)) return "silicaui-table (wrapper)";
  if (/@wizeworks[+/]silicaui-editor/.test(n)) return "silicaui-editor (wrapper)";
  if (/@wizeworks[+/]silicaui-dnd/.test(n)) return "silicaui-dnd (wrapper)";
  if (/@wizeworks[+/]silicaui-panels/.test(n)) return "silicaui-panels (wrapper)";
  if (/@wizeworks[+/]silicaui-react/.test(n)) return "silicaui-react (core)";
  if (/node_modules\/(\.pnpm\/)?.*echarts/.test(n) || /\/zrender\//.test(n)) return "echarts (charts)";
  if (/@tanstack[+/]/.test(n)) return "tanstack table (table)";
  if (/@tiptap[+/]|prosemirror/.test(n)) return "tiptap + prosemirror (editor)";
  if (/@dnd-kit[+/]/.test(n)) return "dnd-kit (dnd)";
  if (/react-resizable-panels/.test(n)) return "react-resizable-panels (panels)";
  if (/@base-ui/.test(n)) return "base-ui (behind core)";
  if (/\/react-dom\//.test(n) || /react-dom@/.test(n)) return "react-dom";
  // No escape sequence anywhere on this line. A heredoc ate the backslash in
  // a backslash-b here and left a literal U+0008 -- which the repo's own
  // control-character check caught, the FIFTH time in this run. A word
  // boundary before "react@" is expressible as a character class instead.
  if (/[/]react[/]/.test(n) || /[^a-z0-9-]react@/.test(n) || /[/]scheduler[/]/.test(n)) return "react";
  // A module inside node_modules is never "the dashboard's own code", whatever
  // directory it happens to sit under. Without this line prosemirror's own
  // dependencies (`rope-sequence`, `orderedmap`) were counted as code I wrote.
  if (/\/node_modules\//.test(n)) return "other dependencies";
  if (n.startsWith(APP.split(String.fromCharCode(92)).join("/"))) return "the dashboard's own code";
  return "everything else";
}

const totals = new Map();
let all = 0;
for (const r of rows) {
  const key = owner(r.id);
  totals.set(key, (totals.get(key) ?? 0) + r.bytes);
  all += r.bytes;
}

// Debug: what landed in the catch-all buckets.
for (const bucket of ["the dashboard's own code", "everything else"]) {
  const mine = rows
    .filter((r) => owner(r.id) === bucket)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);
  console.log(`--- biggest in "${bucket}":`);
  for (const m of mine) console.log(`    ${Math.round(m.bytes / 1024)} kB  ${m.id.split(String.fromCharCode(92)).join("/").slice(-90)}`);
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
console.log(`${rows.length} modules, ${kb(all)} of rendered code`);
console.log("");
for (const [name, bytes] of sorted) {
  const pct = ((bytes / all) * 100).toFixed(1);
  console.log(`  ${name.padEnd(34)} ${kb(bytes).padStart(10)}   ${pct.padStart(5)}%`);
}

const engines = [
  "echarts (charts)",
  "tanstack table (table)",
  "tiptap + prosemirror (editor)",
  "dnd-kit (dnd)",
  "react-resizable-panels (panels)",
];
const wrappers = [...totals.keys()].filter((k) => k.endsWith("(wrapper)"));
const engineBytes = engines.reduce((n, k) => n + (totals.get(k) ?? 0), 0);
const wrapperBytes = wrappers.reduce((n, k) => n + (totals.get(k) ?? 0), 0);
console.log("");
console.log(`the five ENGINES        ${kb(engineBytes)}`);
console.log(`the five WRAPPERS       ${kb(wrapperBytes)}   <- what silicaui itself adds on top of them`);
console.log(`react + react-dom       ${kb((totals.get("react") ?? 0) + (totals.get("react-dom") ?? 0))}`);
console.log(`silicaui core           ${kb(totals.get("silicaui-react (core)") ?? 0)}`);
