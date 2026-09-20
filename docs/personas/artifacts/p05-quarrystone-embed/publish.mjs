/**
 * Quarrystone's deploy step.
 *
 *   node publish.mjs
 *
 * Takes what `onPublish` handed us — the structured `Site`, plus every page
 * already composed to production HTML — and turns it into files a customer's
 * customer can open with nothing of ours running.
 *
 * Two jobs, and only the second one is ours to think about:
 *
 *  1. Write the pages. The builder already composed them; we wrap each in a
 *     document shell and point it at one stylesheet.
 *  2. Fill the host mount points. `toHtml` emits `<div data-sui-host>` and
 *     leaves it empty on purpose — the projection stays framework-free and the
 *     host mounts its own component. We do that HERE, at publish time, with the
 *     same React components the canvas uses, because a compliance certificate
 *     that needs JavaScript to appear is one that does not appear.
 *
 * `published.json` is written by the evaluation run straight out of
 * `window.__quarrystone.lastPublish()`. Nothing in `out/` is typed by hand.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import tailwind from "@tailwindcss/vite";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(".");
const OUT = path.join(ROOT, "out");
const WORK = path.join(ROOT, ".publish");

/** Where the lead form posts once the page is live. Our static host proxies
 *  this path through to the API; the builder never knew about either. */
const LEADS_ENDPOINT = process.env.QUARRYSTONE_LEADS ?? "/leads";

const payload = JSON.parse(await readFile(path.join(ROOT, "published.json"), "utf8"));
const site = payload.site;
const pages = payload.pages;

await rm(OUT, { recursive: true, force: true });
await rm(WORK, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(WORK, { recursive: true });

// ── 1. our own components, compiled once, for the mount points ───────────────
// CJS, not ESM: silicaui-react pulls in `use-sync-external-store`, which is
// CommonJS, and esbuild's ESM output cannot `require` it at run time.
await esbuild({
  entryPoints: [path.join(ROOT, "src/publish-entry.tsx")],
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  outfile: path.join(WORK, "host-render.cjs"),
  external: ["react", "react-dom", "react-dom/server"],
  logLevel: "warning",
});
const { renderHostNodeToStaticHtml } = createRequire(import.meta.url)(path.join(WORK, "host-render.cjs"));

/** Replace every `<div data-sui-host=…></div>` with our real markup. */
function fillHostNodes(html) {
  let filled = 0;
  const out = html.replace(
    /<div([^>]*?)data-sui-host="([^"]*)"([^>]*?)><\/div>/g,
    (whole, before, component, after) => {
      const attrs = `${before} ${after}`;
      const propsMatch = /data-sui-host-props="([^"]*)"/.exec(attrs);
      let props = {};
      if (propsMatch) {
        try {
          props = JSON.parse(decodeEntities(propsMatch[1]));
        } catch {
          props = {};
        }
      }
      const classMatch = /class="([^"]*)"/.exec(attrs);
      const cls = classMatch ? ` class="${classMatch[1]}"` : "";
      filled++;
      return `<div${cls} data-sui-host="${component}">${renderHostNodeToStaticHtml(component, props)}</div>`;
    },
  );
  return { html: out, filled };
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const themeName = (site.theme?.name || "quarrystone").replace(/"/g, "");

const shell = (page, body, depth) => `<!doctype html>
<html lang="sv" data-theme="${themeName}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.name)} — Quarrystone</title>
<link rel="stylesheet" href="${"../".repeat(depth)}assets/site.css">
</head>
<body>
${body}
</body>
</html>
`;

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let totalFilled = 0;
for (const page of pages) {
  const slug = page.slug === "/" ? "" : page.slug.replace(/^\//, "");
  const dir = slug ? path.join(OUT, slug) : OUT;
  const depth = slug ? slug.split("/").length : 0;
  await mkdir(dir, { recursive: true });
  const { html, filled } = fillHostNodes(page.html);
  totalFilled += filled;
  // The lead form posts to wherever this deploy puts it, not to the literal the
  // component carries in the editor.
  const routed = html.replace(/action="https:\/\/api\.quarrystone\.se\/leads"/g, `action="${LEADS_ENDPOINT}"`);
  await writeFile(path.join(dir, "index.html"), shell(page, routed, depth), "utf8");
}

// ── 2. one stylesheet, built from what the pages actually use ────────────────
const tokens = Object.entries(site.theme?.tokens ?? {})
  .map(([k, v]) => `  ${k}: ${v};`)
  .join("\n");

await writeFile(
  path.join(WORK, "site.css"),
  `@import "tailwindcss";
/* Scan the pages we just wrote. Every class on them is a class the builder put
   there, so this is the whole safelist and there is nothing to maintain. */
@source "../out/**/*.html";

@plugin "@wizeworks/silicaui" {
  colors: primary, secondary, accent, neutral, info, success, warning, error;
}

@plugin "@wizeworks/silicaui/theme" {
  name: ${themeName};
${tokens}
}
`,
  "utf8",
);

await viteBuild({
  root: WORK,
  configFile: false,
  plugins: [tailwind()],
  logLevel: "warn",
  build: {
    outDir: path.join(OUT, "assets"),
    emptyOutDir: true,
    rollupOptions: { input: path.join(WORK, "site.css"), output: { assetFileNames: "site.css" } },
  },
});

console.log(`published ${pages.length} page(s) to out/`);
console.log(`filled ${totalFilled} host mount point(s)`);
console.log(`the lead form posts to ${LEADS_ENDPOINT}`);
