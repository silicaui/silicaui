// Runnable proof of the spine: author → validate → project → stamp. Run against
// the built output: `pnpm --filter @wizeworks/silicaui-html build && node verify.mjs`.
import {
  block,
  el,
  iconSvg,
  resolveTree,
  stamp,
  stampTree,
  stripIds,
  toHtml,
  toJson,
  walk,
} from "./dist/index.js";
import {
  faqAccordion,
  featureGrid,
  getBlock,
  heroSplitCta,
  listBlocks,
} from "./dist/blocks/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
function collectIds(node) {
  const ids = [];
  walk(node, (n) => {
    if (n.kind !== "outlet") ids.push(n.id);
  });
  return ids;
}

// ── HTML projection ────────────────────────────────────────────────────────
const html = toHtml(heroSplitCta);
console.log("\n— toHtml(heroSplitCta) —\n");
console.log(html);
console.log("\n— checks —");

check("renders a <section>", html.startsWith("<section"));
check("establishes a container (@container)", html.includes("@container"));
check("headline text present", html.includes("Ship your store in an afternoon"));
check("Button atom → <button> with btn classes", html.includes('<button class="btn btn-primary btn-lg"'));
check("Button label rendered", html.includes(">Start free</button>"));
check("Image atom → self-closing <img> w/ aspect-video", /<img class="rounded-box w-full aspect-video"[^>]*\/>/.test(html));
check("template is id-free (no id= in output)", !html.includes(" id="));

// ── prefix (external-embedder path) ─────────────────────────────────────────
const prefixed = toHtml(heroSplitCta, { prefix: "st-" });
check("prefix: component classes rewritten (btn → st-btn)", prefixed.includes('class="st-btn st-btn-primary st-btn-lg"'));
check("prefix: utilities untouched (grid stays)", prefixed.includes("grid grid-cols-1"));
check("prefix: variant preserved (@3xl: intact)", prefixed.includes("@3xl:grid-cols-2"));

// ── behavior lowering (faq accordion) ───────────────────────────────────────
const faqHtml = toHtml(faqAccordion);
check("behavior → data-sui-behavior=disclosure", faqHtml.includes('data-sui-behavior="disclosure"'));
check("behavior params lowered (single)", faqHtml.includes("data-sui-behavior-params=") && faqHtml.includes("single"));
check("part → data-sui-part=trigger", faqHtml.includes('data-sui-part="trigger"'));
check("part → data-sui-part=panel", faqHtml.includes('data-sui-part="panel"'));
check("first panel open, others ship hidden", (faqHtml.match(/ hidden/g) || []).length === 2);

// ── data lowering + new atoms (feature grid) ────────────────────────────────
const featHtml = toHtml(featureGrid);
check("collection → data-sui-repeat=features", featHtml.includes('data-sui-repeat="features"'));
check("value → data-sui-bind=feature.title", featHtml.includes('data-sui-bind="feature.title"'));
check("Icon atom → span with data-icon", featHtml.includes('data-icon="sparkles"'));

// ── icon inlining: static pages are self-contained (default Lucide resolver) ──
check("Icon inlines <svg> by default (data-icon kept)", featHtml.includes('data-icon="sparkles"') && /<span[^>]*data-icon="sparkles"[^>]*><svg[^>]*>.*<\/svg><\/span>/s.test(featHtml));
check("inlined svg sizes to 1em + currentColor", featHtml.includes('width="1em"') && featHtml.includes('stroke="currentColor"'));
check("icons:false opts out (bare span, no svg)", (() => {
  const bare = toHtml(featureGrid, { icons: false });
  return bare.includes('data-icon="sparkles"') && !bare.includes("<svg");
})());
check("custom resolver map overrides default", toHtml({ kind: "component", component: "Icon", props: { name: "sparkles" } }, { icons: { sparkles: '<circle cx="12" cy="12" r="9" />' } }).includes('<circle cx="12" cy="12" r="9" />'));
check("unknown icon name → bare span (resolver miss)", !toHtml({ kind: "component", component: "Icon", props: { name: "definitely-not-an-icon" } }).includes("<svg"));
check("iconSvg() helper wraps inner markup", iconSvg("box")?.startsWith("<svg") && iconSvg("box").includes("</svg>"));
check("iconSvg() returns undefined for unknown name", iconSvg("definitely-not-an-icon") === undefined);

// ── raw-element floor: media (video/audio render, iframe still downgrades) ───
const videoHtml = toHtml(
  el("video", "rounded-box w-full", {
    attrs: { src: "https://cdn.example.com/clip.mp4", poster: "/still.jpg", controls: true, muted: true, playsinline: true },
    children: [el("source", undefined, { attrs: { src: "https://cdn.example.com/clip.webm", type: "video/webm" } })],
  }),
);
check("video renders as <video> (not downgraded)", videoHtml.startsWith("<video"));
check("video src passes URL scheme check", videoHtml.includes('src="https://cdn.example.com/clip.mp4"'));
check("video poster passes URL scheme check", videoHtml.includes('poster="/still.jpg"'));
check("video boolean attrs render bare", videoHtml.includes(" controls") && videoHtml.includes(" muted") && videoHtml.includes(" playsinline"));
check("nested <source> renders (void, self-closing)", /<source[^>]*type="video\/webm"[^>]*\/>/.test(videoHtml));

const audioHtml = toHtml(el("audio", undefined, { attrs: { src: "/podcast.mp3", controls: true } }));
check("audio renders as <audio>", audioHtml.startsWith("<audio") && audioHtml.includes(" controls"));

const posterXss = toHtml(el("video", undefined, { attrs: { src: "javascript:alert(1)", poster: "javascript:alert(1)" } }));
check("video drops javascript: URLs (src + poster)", !posterXss.includes("javascript:"));

const iframeHtml = toHtml(el("iframe", undefined, { attrs: { src: "https://evil.example.com" } }));
check("iframe still downgrades to <div>", iframeHtml.startsWith("<div") && !iframeHtml.includes("iframe"));

// ── Embed component: curated iframe (allowlist) vs. floor (arbitrary iframe) ──
const ytEmbed = toHtml({ kind: "component", component: "Embed", class: "w-full", props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Demo" } });
check("Embed (YouTube) emits a sandboxed iframe", ytEmbed.includes("<iframe") && ytEmbed.includes("sandbox="));
check("Embed normalizes to youtube-nocookie embed URL", ytEmbed.includes('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"'));
check("Embed iframe carries title + allowfullscreen + lazy", ytEmbed.includes('title="Demo"') && ytEmbed.includes("allowfullscreen") && ytEmbed.includes('loading="lazy"'));
const vimeoEmbed = toHtml({ kind: "component", component: "Embed", props: { url: "https://vimeo.com/123456789" } });
check("Embed (Vimeo) normalizes to player.vimeo.com", vimeoEmbed.includes('src="https://player.vimeo.com/video/123456789"'));
const badEmbed = toHtml({ kind: "component", component: "Embed", props: { url: "https://evil.example.com/x" } });
check("Embed (unknown host) falls back to a link, NO iframe", !badEmbed.includes("<iframe") && badEmbed.includes('href="https://evil.example.com/x"'));
const emptyEmbed = toHtml({ kind: "component", component: "Embed", props: {} });
check("Embed (no url) shows a hint, no iframe", !emptyEmbed.includes("<iframe") && emptyEmbed.includes("Add a YouTube"));
check("arbitrary authored <iframe> STILL downgrades (floor unchanged)", toHtml(el("iframe", undefined, { attrs: { src: "https://www.youtube.com/embed/x" } })).startsWith("<div"));

// ── inline-SVG allowlist: a pasted logo survives; the vectors stay closed ────
const logo = el("svg", undefined, {
  attrs: { viewBox: "0 0 100 100", xmlns: "http://www.w3.org/2000/svg" },
  children: [
    el("defs", undefined, {
      children: [
        el("linearGradient", undefined, {
          attrs: { id: "g", x1: "0", y1: "0", x2: "1", y2: "1" },
          children: [
            el("stop", undefined, { attrs: { offset: "0%", "stop-color": "#f00", "stop-opacity": "0.8" } }),
            el("stop", undefined, { attrs: { offset: "100%", "stop-color": "#00f" } }),
          ],
        }),
        el("clipPath", undefined, { attrs: { id: "c" }, children: [el("circle", undefined, { attrs: { cx: "50", cy: "50", r: "40" } })] }),
      ],
    }),
    el("rect", undefined, { attrs: { x: "0", y: "0", width: "100", height: "100", fill: "url(#g)", "clip-path": "url(#c)", "fill-rule": "evenodd" } }),
    el("text", undefined, { attrs: { x: "10", y: "55", "font-family": "sans-serif", "font-size": "20", "text-anchor": "middle" }, children: ["Aa"] }),
    el("use", undefined, { attrs: { href: "#c", transform: "translate(2,2)" } }),
  ],
});
const logoHtml = toHtml(logo);
check("SVG: gradient + stops survive", logoHtml.includes("<linearGradient") && logoHtml.includes('stop-color="#f00"') && logoHtml.includes('stop-opacity="0.8"'));
check("SVG: clipPath + defs survive", logoHtml.includes("<clipPath") && logoHtml.includes("<defs"));
check("SVG: presentation attrs survive (fill url, fill-rule, transform)", logoHtml.includes('fill="url(#g)"') && logoHtml.includes('fill-rule="evenodd"') && logoHtml.includes('transform="translate(2,2)"'));
check("SVG: <text> + typographic attrs survive", logoHtml.includes("<text") && logoHtml.includes('font-family="sans-serif"'));
check("SVG: internal <use href='#..'> survives", logoHtml.includes('<use href="#c"'));
check("SVG: EXTERNAL <use href> is dropped (fragment-only)", !toHtml(el("use", undefined, { attrs: { href: "https://evil.example.com/x.svg#i" } })).includes("evil.example.com"));
check("SVG: <script> inside svg still downgrades to <div>", toHtml(el("script", undefined, { children: ["alert(1)"] })).startsWith("<div"));
check("SVG: <foreignObject> still downgrades to <div>", toHtml(el("foreignObject", undefined, {})).startsWith("<div"));
check("SVG: style attribute still stripped (no inline style)", !toHtml(el("rect", undefined, { attrs: { style: "fill:red", width: "10" } })).includes("style="));

// ── Video component macro (registry-driven, like Image) ──────────────────────
const videoComp = toHtml({
  kind: "component",
  component: "Video",
  class: "rounded-box w-full",
  props: { src: "https://cdn.example.com/clip.mp4", ratio: "wide", controls: true, muted: true },
});
check("Video macro expands to <video>", videoComp.startsWith("<video"));
check("Video ratio prop → aspect-video utility", videoComp.includes("aspect-video") && videoComp.includes("rounded-box"));
check("Video controls/muted booleans render bare", videoComp.includes(" controls") && videoComp.includes(" muted"));
check("Video src on element (no nested source)", videoComp.includes('src="https://cdn.example.com/clip.mp4"') && !videoComp.includes("<source"));
check("Video controls default off unless === true", !toHtml({ kind: "component", component: "Video", props: { src: "/a.mp4" } }).includes(" controls"));

const videoSources = toHtml({
  kind: "component",
  component: "Video",
  props: { poster: "/still.jpg", sources: [{ src: "https://cdn.example.com/clip.webm", type: "video/webm" }] },
});
check("Video props.sources → nested <source>", /<source[^>]*type="video\/webm"[^>]*\/>/.test(videoSources));
check("Video with sources: poster kept, no element src", videoSources.includes('poster="/still.jpg"') && !/<video[^>]* src=/.test(videoSources));

// ── data-bound trusted HTML (rich text / CMS long-form) ─────────────────────
const RICH = '<p>Hello <strong>world</strong></p><ul><li>one</li></ul>';
const htmlHost = { resolveBinding: (ref) => ({ value: ref === "post.body" ? RICH : "" }) };
// On an element node.
const richEl = el("div", "prose", {});
richEl.data = { kind: "html", ref: "post.body" };
const richElOut = toHtml(resolveTree(richEl, htmlHost));
check("html bind → inner HTML emitted UNESCAPED", richElOut.includes(RICH));
check("html bind: no residual data-sui-html marker after resolve", !richElOut.includes("data-sui-html"));
check("html bind: authored children replaced by rawHtml", richElOut === `<div class="prose">${RICH}</div>`);
// On a RichText component (marker carried through expansion via lower()).
const richComp = { kind: "component", component: "RichText", class: "prose", data: { kind: "html", ref: "post.body" }, children: [{ kind: "element", tag: "p", children: ["placeholder"] }] };
const richCompOut = toHtml(resolveTree(richComp, htmlHost));
check("RichText component fills rawHtml through expansion", richCompOut === `<div class="prose">${RICH}</div>`);
check("html bind escaping is NOT applied (trusted path)", richCompOut.includes("<strong>") && !richCompOut.includes("&lt;strong&gt;"));
// Unresolved (no host / client-hydration path): lowers to an inert data-sui-html marker.
check("unresolved html bind → data-sui-html marker", toHtml(richEl).includes('data-sui-html="post.body"'));
check("plain value bind still ESCAPES (regression guard)", toHtml(resolveTree((() => { const n = el("p", undefined, {}); n.data = { kind: "value", ref: "x" }; return n; })(), { resolveBinding: () => ({ value: "<b>x</b>" }) })).includes("&lt;b&gt;"));

// ── toJson projection ───────────────────────────────────────────────────────
const json = toJson(heroSplitCta);
check("toJson round-trips (stable)", JSON.stringify(json) === JSON.stringify(heroSplitCta));
check("toJson output is a plain object", json.key === "hero_split_cta" && json.root.kind === "element");

// ── stamp: template → document (id minting) ─────────────────────────────────
const doc = stamp(heroSplitCta, { name: "test", tokens: {} });
const docIds = collectIds(doc.root);
check("stamp: every node has an id", docIds.every((id) => typeof id === "string" && id.length > 0));
check("stamp: ids are unique", new Set(docIds).size === docIds.length);
check("stamp: theme attached", doc.theme.name === "test");
check("stamp: template stays id-free (not mutated)", !toHtml(heroSplitCta).includes(" id="));
const doc2 = stamp(heroSplitCta, { name: "test", tokens: {} });
check("stamp: fresh ids each call", collectIds(doc2.root)[0] !== docIds[0]);

// ── duplicate/paste (stampTree) + save-as-component (stripIds) ───────────────
const dup = stampTree(doc.root);
check("stampTree: re-mints ids (no collision with source)", collectIds(dup)[0] !== docIds[0]);
const stripped = stripIds(doc.root);
check("stripIds: produces an id-free tree", collectIds(stripped).every((id) => id === undefined));

// ── linter: a bad block fails at authoring ──────────────────────────────────
function authorFails(name, fn) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(name, threw);
}
const mk = (cls) => ({
  key: "bad", name: "Bad", category: "test", version: "1.0.0",
  description: "x", colors: [], behaviors: [], emailEligible: false,
  root: el("div", cls),
});
authorFails("lint: `fixed` rejected", () => block(mk("fixed")));
authorFails("lint: arbitrary z-[9999] rejected", () => block(mk("z-[9999]")));
authorFails("lint: content-[…] rejected", () => block(mk("content-['x']")));
authorFails("lint: url(...) rejected", () => block(mk("bg-[url(https://x.com/a.png)]")));
authorFails("lint: viewport variant md: rejected", () => block(mk("md:flex")));
// Every authored block passed the linter at module load (`block()` throws
// otherwise), so a non-empty catalog means the whole library is clean.
check("lint: real blocks are clean (all authored)", listBlocks().length > 0);

// ── block index ─────────────────────────────────────────────────────────────
check("listBlocks() returns the full catalog", listBlocks().length >= 15);
check("listBlocks({category}) filters", listBlocks({ category: "faq" }).length === 1);
check("getBlock(key) resolves", getBlock("feature_grid")?.name === "Feature grid — data-bound");
check(
  "slots derived from tree in order (hero)",
  heroSplitCta.slots.map((s) => s.name).join(",") === "headline,subhead,cta,image",
);

console.log(
  failures === 0 ? "\n✅ all checks passed\n" : `\n❌ ${failures} check(s) failed\n`,
);
process.exit(failures ? 1 : 0);
