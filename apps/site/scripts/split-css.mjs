/**
 * After `next build`: replace each page's one 400 KB render-blocking stylesheet with
 * head + the component chunks that page uses + tail. Chunks keep the plugin's emit order,
 * so the cascade is the full file's. Unused chunks still arrive: React adds Next's
 * original stylesheet link after hydration (see verify-css-split.mjs for what is enforced).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { classesIn, classesInHtml, cutStylesheet, isGlobal } from "./css-split-lib.mjs";

const OUT = new URL("../out/", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const CSS_DIR = join(OUT, "_next/static/css");
const SPLIT_DIR = join(OUT, "_next/static/css-split");
const LINK = /<link rel="stylesheet" href="(\/_next\/static\/css\/[^"]+\.css)"[^>]*\/?>/;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "_next" ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

/** Writes one content-hashed file and returns its public URL. */
function emit(name, css) {
  const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
  const file = `${name}.${hash}.css`;
  writeFileSync(join(SPLIT_DIR, file), css);
  return `/_next/static/css-split/${file}`;
}

function prepare() {
  const [file, ...extra] = readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
  if (!file || extra.length) throw new Error(`split-css: expected one stylesheet in ${CSS_DIR}`);
  mkdirSync(SPLIT_DIR, { recursive: true });
  const { head, chunks, tail } = cutStylesheet(readFileSync(join(CSS_DIR, file), "utf8"));
  return {
    head: emit("head", head),
    tail: emit("tail", tail),
    chunks: chunks.map((c) => ({ ...c, url: emit(`c-${c.name}`, c.css), classes: classesIn(c.css), global: isGlobal(c.css) })),
  };
}

/** Chunks whose classes the page's markup uses, in cascade order. */
function usedChunks(parts, html) {
  const used = classesInHtml(html);
  return parts.chunks.filter((c) => c.global || [...c.classes].some((k) => used.has(k)));
}

function rewrite(parts, path) {
  const html = readFileSync(path, "utf8");
  if (!LINK.test(html)) return null;
  const urls = [parts.head, ...usedChunks(parts, html).map((c) => c.url), parts.tail];
  const links = urls.map((href) => `<link rel="stylesheet" href="${href}"/>`).join("");
  writeFileSync(path, html.replace(LINK, links));
  return urls.length;
}

const parts = prepare();
let pages = 0;
for (const path of htmlFiles(OUT)) if (rewrite(parts, path)) pages++;
console.log(`split-css: ${pages} pages, ${parts.chunks.length} component chunks`);
