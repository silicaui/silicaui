/**
 * Bright Step Studio — turn what the builder published into a site you can open.
 *
 *   node build.mjs && npm run css
 *
 * The builder hands its host two things: the structured `Site` (to store and
 * re-open) and every page composed to production HTML (to deploy). That is all
 * this does with them — no framework, no server, no runtime. It is the smallest
 * honest version of the host half of `onPublish`, which is the thing act 8 is
 * actually testing: can Marlene's site be opened by a visitor with no builder
 * running anywhere.
 *
 * `site/*.fragment.html` and `site.json` are written by the run itself, straight
 * out of `window.__published`. Nothing in this folder is typed by hand.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");
const SITE = path.resolve("site");

const site = JSON.parse(await readFile(path.join(SITE, "..", "site.json"), "utf8"));
const pages = JSON.parse(await readFile(path.join(SITE, "pages.json"), "utf8"));

/** The theme the studio chose, as the `[data-theme]` block @wizeworks/silicaui emits. */
function themeBlock(theme) {
  const lines = Object.entries(theme.tokens ?? {}).map(([k, v]) => `  ${k}: ${v};`);
  const dark = Object.entries(theme.dark ?? {}).map(([k, v]) => `  ${k}: ${v};`);
  return [
    `@plugin "@wizeworks/silicaui/theme" {`,
    `  name: ${theme.name || "brightstep"};`,
    ...lines,
    `}`,
    dark.length
      ? [`@plugin "@wizeworks/silicaui/theme" {`, `  name: ${theme.name || "brightstep"}-dark;`, ...dark, `}`].join("\n")
      : "",
  ].join("\n");
}

const CSS = `@import "tailwindcss";
@source "../out/**/*.html";

/* Every colour role the studio's theme declares, so a class like \`btn-primary\`
   has real rules behind it. Without this the pages render unstyled with a clean
   200 and no build error — which is the failure @wizeworks/silicaui warns about
   at boot. */
@plugin "@wizeworks/silicaui" {
  colors: primary, secondary, accent, neutral, info, success, warning, error;
}

${themeBlock(site.theme ?? { name: "brightstep", tokens: {} })}
`;

const shell = (page, body) => `<!doctype html>
<html lang="en-GB" data-theme="${(site.theme?.name || "brightstep").replace(/"/g, "")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.name} — Bright Step Studio</title>
<link rel="stylesheet" href="${page.slug === "/" ? "" : "../"}assets/site.css">
</head>
<body>
${body}
<!-- The published markup carries \`data-sui-behavior\` markers; this is what makes
     the header's menu open on a phone. One <script src>, never inline — a CSP
     that allows inline script allows the attack this whole projection avoids. -->
<script type="module" src="${page.slug === "/" ? "" : "../"}assets/behaviors.js"></script>
</body>
</html>
`;

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, "assets"), { recursive: true });
await mkdir(path.resolve("src"), { recursive: true });
await writeFile(path.resolve("src/input.css"), CSS, "utf8");

for (const page of pages) {
  const body = await readFile(path.join(SITE, page.file), "utf8");
  const dir = page.slug === "/" ? OUT : path.join(OUT, page.slug.replace(/^\//, ""));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), shell(page, body), "utf8");
  console.log(`  ${page.slug.padEnd(22)} ${path.relative(process.cwd(), path.join(dir, "index.html"))}`);
}
console.log(`\n${pages.length} pages written to out/`);
