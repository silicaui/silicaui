// Runnable proof of the spine: author → validate → project → stamp. Run against
// the built output: `pnpm --filter @wizeworks/silicaui-html build && node verify.mjs`.
import {
  atom,
  block,
  el,
  iconSvg,
  outlet,
  pageDocument,
  renderSite,
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
// A hero CTA NAVIGATES, so `href` lowers the Button atom to an <a>. The <button>
// half of that fork is covered below by hero_signup, whose CTA submits a form —
// both paths asserted against a real block rather than a synthetic node.
check("Button atom + href → <a> with btn classes", html.includes('<a class="btn btn-primary btn-lg" href="#">'));
check("Button label rendered", html.includes(">Start free</a>"));
check("Image atom → self-closing <img> w/ aspect-video", /<img class="w-full rounded-box aspect-video"[^>]*\/>/.test(html));
check("template is id-free (no id= in output)", !html.includes(" id="));
{
  const signupHtml = toHtml(getBlock("hero_signup"));
  check("Button atom + type → <button type=submit>", signupHtml.includes('<button class="btn btn-primary" type="submit">'));
}

// ── prefix (external-embedder path) ─────────────────────────────────────────
const prefixed = toHtml(heroSplitCta, { prefix: "st-" });
check("prefix: component classes rewritten (btn → st-btn)", prefixed.includes('class="st-btn st-btn-primary st-btn-lg"'));
check("prefix: utilities untouched (grid-cols-1 stays bare)", prefixed.includes("grid-cols-1") && !prefixed.includes("st-grid"));
check("prefix: variant preserved (@3xl: intact)", prefixed.includes("@3xl:grid-cols-2"));
// The UI type ramp is emitted WITH the prefix by typography(prefix), so its
// stems have to be in COMPONENT_STEMS or a prefixed page renders unstyled
// headlines — the silent breakage `wordmark`/`glass` were added to close, and
// live from the moment a block reached for `.display-*`. See class-utils.ts.
check("prefix: type ramp rewritten (display-2 → st-display-2)", prefixed.includes('class="st-display-2"'));
check("prefix: type ramp rewritten (lead → st-lead)", prefixed.includes("st-lead"));

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
// `layout`, not `sparkles`: feature_grid's glyph changed because `sparkles`
// exists in this package's icon set but NOT in the builder's baked copy, so the
// canvas drew an empty span while published output drew a glyph. The fixture
// follows the block rather than pinning a name the block no longer uses.
check("Icon atom → span with data-icon", featHtml.includes('data-icon="layout"'));

// ── icon inlining: static pages are self-contained (default Lucide resolver) ──
check("Icon inlines <svg> by default (data-icon kept)", featHtml.includes('data-icon="layout"') && /<span[^>]*data-icon="layout"[^>]*><svg[^>]*>.*<\/svg><\/span>/s.test(featHtml));
check("inlined svg sizes to 1em + currentColor", featHtml.includes('width="1em"') && featHtml.includes('stroke="currentColor"'));
check("icons:false opts out (bare span, no svg)", (() => {
  const bare = toHtml(featureGrid, { icons: false });
  return bare.includes('data-icon="layout"') && !bare.includes("<svg");
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

// `template` was moved OUT of the exclusion list (it's inert — content parses
// into a detached fragment, never renders, never executes) so a behavior can
// clone new DOM from authored markup instead of constructing it in the runtime.
// That widening is only safe if the floor still applies INSIDE the template, so
// that is asserted here rather than assumed.
const tpl = toHtml(
  el("template", undefined, {
    children: [
      el("script", undefined, { children: ["alert(1)"] }),
      el("iframe", undefined, { attrs: { src: "https://evil.example.com" } }),
      el("span", undefined, { attrs: { onclick: "steal()" }, children: ["ok"] }),
    ],
  }),
);
check("template renders as <template> (not downgraded)", tpl.startsWith("<template"));
check("script inside a template still downgrades", !tpl.includes("<script"));
check("iframe inside a template still downgrades", !tpl.includes("<iframe"));
check("on* handler inside a template is still stripped", !tpl.includes("onclick"));

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
// This check used to assert the OPPOSITE — that an unset url renders "Add a
// YouTube, Vimeo, or Google Maps URL" — which is how that builder copy came to
// be published to visitors on live pages. `toHtml` is what a VISITOR sees; the
// authoring affordance belongs to the canvas, which draws its own (Canvas.tsx).
check("Embed (no url) renders nothing at all", !emptyEmbed.includes("<iframe") && !/Add a/i.test(emptyEmbed));
// Provider coverage, the frameable/not-frameable split and every carried
// parameter live in verify-embed.mjs — the contract is too big for this file.
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
check("getBlock(key) resolves", getBlock("feature_grid")?.name === "Features — Grid");

// A block's `name` IS the host palette's row label (see `blockItem` in
// silicaui-builder's palette.ts), so a duplicate ships two identical-looking
// rows and the user picks blind. That's precisely what the navbar family was
// before it was split, so the invariant is guarded rather than remembered.
{
  const names = listBlocks().map((b) => b.name);
  check("block names are unique (each IS a palette label)", new Set(names).size === names.length);
  check(
    "block names are short enough to read as a label",
    names.every((n) => n.length <= 28),
  );
}

// ── the navbar family ───────────────────────────────────────────────────────
// Five layouts, and every one of them collapses. The gap this closes: a header
// with no mobile menu is broken on a phone, and shipping one alongside four that
// work is worse than shipping none.
{
  const navbars = listBlocks({ category: "nav" });
  check("five navbar layouts are registered", navbars.length === 5);
  for (const b of navbars) {
    const triggers = [];
    const panels = [];
    walk(b.root, (n) => {
      if (n.part === "trigger") triggers.push(n);
      if (n.part === "panel") panels.push(n);
    });
    // `disclosure` pairs trigger[i] ↔ panel[i] by DOCUMENT ORDER, so an unequal
    // count means some trigger silently toggles nothing.
    check(`${b.key}: every trigger has a panel`, triggers.length > 0 && triggers.length === panels.length);
    // A panel must ship closed, or it flashes open before the runtime hydrates.
    check(`${b.key}: every panel ships hidden`, panels.every((p) => p.attrs?.hidden === true));
    check(`${b.key}: declares the disclosure behavior`, b.behaviors.includes("disclosure"));
  }
}
check(
  "slots derived from tree in order (hero)",
  heroSplitCta.slots.map((s) => s.name).join(",") === "headline,subhead,cta,secondary,trust,image",
);

// ── the hero family ─────────────────────────────────────────────────────────
// Five layouts where there used to be one block plus a lookalike `.hero`
// primitive wearing the same palette label. Two invariants earn their keep:
//
//  • ONE <h1>. A hero is the page's opening statement; two of them is an
//    outline bug that no visual review reliably catches.
//  • A SHARED slot vocabulary. Swapping heroes is the most common edit here, and
//    a host's fill writes by NAME — so `headline` + `cta` existing in all five
//    is what makes a swap keep the author's content instead of resetting it.
{
  const heroes = listBlocks({ category: "hero" });
  check("five hero layouts are registered", heroes.length === 5);
  for (const b of heroes) {
    let h1s = 0;
    walk(b.root, (n) => {
      if (n.kind === "element" && n.tag === "h1") h1s++;
    });
    check(`${b.key}: exactly one <h1>`, h1s === 1);
    const names = new Set(b.slots.map((s) => s.name));
    check(`${b.key}: carries the shared headline + cta slots`, names.has("headline") && names.has("cta"));
  }
  // The one hero that submits rather than navigates must DECLARE it, or a host
  // ships a dead form: the marker is what a runtime hydrates against.
  check(
    "hero_signup declares the form behavior",
    getBlock("hero_signup")?.behaviors.includes("form") === true,
  );
  // Image Overlay stacks image → overlay → content in ONE `.hero` grid cell.
  // Order is the whole mechanism (`.hero-content` clears the scrim only by
  // coming after it), and `data-theme` is what keeps the ink off hardcoded white.
  {
    const spotlight = getBlock("hero_spotlight");
    check("hero_spotlight is a dark theme island", spotlight?.root.attrs?.["data-theme"] === "dark");
    const layers = (spotlight?.root.children ?? []).map((c) => {
      if (typeof c === "string") return "text";
      if (c.kind === "component") return c.component;
      const first = (c.class ?? "").split(/\s+/)[0];
      return first || c.tag;
    });
    check("hero_spotlight layers image → overlay → content", layers.join("|") === "Image|hero-overlay|hero-content");
  }
}

// ── the five-strong families ────────────────────────────────────────────────
// Five families were expanded from one or two blocks each, for the same reason
// the navbar and hero families were: a category with a single entry is a single
// answer to a question that has several, and the palette row that offers it
// reads as "this is how a footer looks here" rather than "pick one".
//
// The count is pinned per family so adding a sixth is a deliberate edit in two
// places, and each family gets the ONE invariant that its members could
// plausibly break independently of each other.
{
  const familySlots = (b) => new Set(b.slots.map((s) => s.name));
  for (const category of ["features", "testimonial", "pricing", "cta", "footer"]) {
    check(`five ${category} layouts are registered`, listBlocks({ category }).length === 5);
  }

  // FOOTER. Two things every variant must get right, both of which are
  // invisible in a screenshot:
  //  • the root is a real <footer>, i.e. a `contentinfo` landmark. A <section>
  //    that looks like a footer is not one, and "skip to footer" stops working.
  //  • `brand` + `copyright` exist in all five, so swapping layouts keeps the
  //    two pieces of content every footer has (a host's fill writes BY NAME).
  for (const b of listBlocks({ category: "footer" })) {
    check(`${b.key}: root is a <footer> landmark`, b.root.kind === "element" && b.root.tag === "footer");
    const names = familySlots(b);
    check(`${b.key}: carries the shared brand + copyright slots`, names.has("brand") && names.has("copyright"));
  }
  check(
    "footer_newsletter declares the form behavior",
    getBlock("footer_newsletter")?.behaviors.includes("form") === true,
  );
  check(
    "footer_minimal declares the theme-toggle behavior",
    getBlock("footer_minimal")?.behaviors.includes("theme-toggle") === true,
  );
  // The one dark island in the family. Same mechanism as hero_spotlight: without
  // `data-theme` the "full-bleed dark closer" is a light section with dark
  // buttons, and the failure only shows on a page that isn't already dark.
  check(
    "footer_closing_cta is a dark theme island",
    getBlock("footer_closing_cta")?.root.attrs?.["data-theme"] === "dark",
  );

  // PRICING. Every layout is answering "what does it cost", so `heading` plus a
  // first plan name and price is the vocabulary a swap has to preserve.
  for (const b of listBlocks({ category: "pricing" })) {
    const names = familySlots(b);
    check(`${b.key}: carries heading + the first plan's name and price`, names.has("heading") && names.has("plan1") && names.has("price1"));
  }
  // Billing Toggle is the only one with parts, and `tabs` pairs tab[i] ↔ panel[i]
  // by DOCUMENT ORDER — an unequal count means a tab silently switches nothing.
  {
    const toggle = getBlock("pricing_toggle");
    check("pricing_toggle declares the tabs behavior", toggle?.behaviors.includes("tabs") === true);
    const tabParts = [];
    const panelParts = [];
    walk(toggle.root, (n) => {
      if (n.part === "tab") tabParts.push(n);
      if (n.part === "panel") panelParts.push(n);
    });
    check("pricing_toggle: every tab has a panel", tabParts.length > 0 && tabParts.length === panelParts.length);
    // Exactly one panel starts open. Both open ships two contradictory prices to
    // a no-JS reader; none open ships an empty section.
    check(
      "pricing_toggle: exactly one panel starts open",
      panelParts.filter((p) => p.attrs?.hidden !== true).length === 1,
    );
  }

  // CTA. `headline` + `primary` are the whole point of the family — a call to
  // action with no action is the one way these five could each be wrong alone.
  for (const b of listBlocks({ category: "cta" })) {
    const names = familySlots(b);
    check(`${b.key}: carries headline + primary`, names.has("headline") && names.has("primary"));
  }
  check("cta_signup declares the form behavior", getBlock("cta_signup")?.behaviors.includes("form") === true);
  // The band is the only filled surface in the family, and a `btn-primary` on
  // `bg-primary` is invisible. Guarded because it looks right in source.
  {
    const solids = [];
    walk(getBlock("cta_band").root, (n) => {
      if (n.kind === "component" && n.component === "Button") solids.push(n.class ?? "");
    });
    check(
      "cta_band never puts a btn-primary on its primary surface",
      solids.length > 0 && solids.every((c) => !c.split(/\s+/).includes("btn-primary")),
    );
  }

  // FEATURES. All five answer "what does it do", so `heading` plus the first
  // feature's title and body is the shared vocabulary — except the bound grid,
  // whose per-item copy comes from the host's collection, not from slots.
  for (const b of listBlocks({ category: "features" })) {
    check(`${b.key}: carries the heading slot`, familySlots(b).has("heading"));
  }
  check(
    "feature_grid still repeats over a collection (it is the family's bound layout)",
    (() => {
      let bound = false;
      walk(getBlock("feature_grid").root, (n) => {
        if (n.data?.kind === "collection") bound = true;
      });
      return bound;
    })(),
  );
  // An icon named in a block must exist in BOTH icon sets — this one is html's.
  // `feature_grid` shipped `sparkles`, which the builder's baked copy
  // (silicaui-builder/src/shared/icons.ts) does not have, so the canvas drew an
  // empty span while published output drew a glyph. The builder-side half of
  // this pairing is asserted in its own e2e run.
  {
    const missing = [];
    for (const b of listBlocks()) {
      walk(b.root, (n) => {
        const name = n.kind === "component" && n.component === "Icon" ? n.props?.name : undefined;
        if (typeof name === "string" && !iconSvg(name)) missing.push(`${b.key}:${name}`);
      });
    }
    check(`every Icon named in a block resolves${missing.length ? ` (missing ${missing.join(", ")})` : ""}`, missing.length === 0);
  }

  // A FILLED SURFACE MUST NAME ITS INK ON THE SAME NODE, catalog-wide.
  //
  // `bg-primary` without `text-primary-content` beside it leaves everything
  // inside inheriting the ambient `base-content` — dark ink on a dark primary
  // band in light mode, pale on pale in dark. v1 of `cta_band` shipped that.
  //
  // The invariant is deliberately "the SURFACE names the role", not "every
  // heading names the role". Repeating `text-primary-content` down the subtree
  // hardcodes `primary` into a dozen places, so switching the band to
  // `bg-secondary` leaves them all wrong — the exact bug in a new outfit.
  // Naming it once and letting children inherit is what makes the section
  // re-colorable, and it is why typography.js gives headings `color: inherit`.
  //
  // Only FILLED ROLE surfaces are checked: `bg-base-*` is what the ramp already
  // assumes, and a `[data-theme]` island re-points `base-content` by itself.
  //
  // And only surfaces that CARRY TEXT. A `bg-primary` bullet dot or a rule is a
  // 6px painted box with nothing inside it, and demanding an ink token on those
  // is the kind of false positive that trains people to skip the probe.
  {
    const FILLED = /^bg-(primary|secondary|accent|neutral|info|success|warning|danger|error)$/;
    const carriesText = (node) => {
      let found = false;
      walk(node, (n) => {
        for (const c of n.children ?? []) {
          if (typeof c === "string" && c.trim()) found = true;
        }
        // A component that renders its own copy (a Button's `label`, a
        // Wordmark's `text`) counts too — it is text on the surface even though
        // the tree stores it as a prop rather than a child.
        if (n.kind === "component" && (n.props?.label != null || n.props?.text != null)) found = true;
      });
      return found;
    };
    const offenders = [];
    for (const b of listBlocks()) {
      walk(b.root, (n) => {
        const tokens = (n.class ?? "").split(/\s+/).filter(Boolean);
        const surface = tokens.find((t) => FILLED.test(t));
        if (!surface || !carriesText(n)) return;
        const role = surface.slice("bg-".length);
        if (!tokens.includes(`text-${role}-content`)) offenders.push(`${b.key}:${surface}`);
      });
    }
    check(
      `every filled role surface carrying text names its ink${offenders.length ? ` (bare: ${offenders.join(", ")})` : ""}`,
      offenders.length === 0,
    );
  }

  // TESTIMONIAL. `quote` is the family; a proof section with no quoted words is
  // a logo strip. The single-quote layouts use the bare name and the multi-quote
  // ones number from 1, so a swap in either direction keeps the first one.
  for (const b of listBlocks({ category: "testimonial" })) {
    const names = familySlots(b);
    check(`${b.key}: carries a first quote`, names.has("quote") || names.has("quote1"));
  }
  check(
    "testimonial_carousel declares the carousel behavior",
    getBlock("testimonial_carousel")?.behaviors.includes("carousel") === true,
  );
  // THE BARE-<blockquote> TRAP, guarded catalog-wide. `typography.js` styles
  // `[data-theme] :where(blockquote)` with a `primary` inline-start rule and
  // 1.25rem of matching padding. That is a good default and it silently wrecks a
  // CENTERED pull-quote — the padding shifts the text off-centre and the bar
  // hangs down one side. v1 of `testimonial_quote` shipped exactly that, and it
  // is invisible in a diff. Every blockquote in the library must therefore SAY
  // which it wants, so the ambient rule is never inherited by accident.
  {
    const undeclared = [];
    for (const b of listBlocks()) {
      walk(b.root, (n) => {
        if (n.kind !== "element" || n.tag !== "blockquote") return;
        const tokens = (n.class ?? "").split(/\s+/);
        if (!tokens.includes("border-0") && !tokens.some((t) => t.startsWith("border-s-"))) {
          undeclared.push(b.key);
        }
      });
    }
    check(
      `every <blockquote> declares its own rule${undeclared.length ? ` (bare in ${[...new Set(undeclared)].join(", ")})` : ""}`,
      undeclared.length === 0,
    );
  }
  // It is the first block to use `carousel` at all, so this is also the coverage
  // that the macro still expands to the parts the runtime hydrates against.
  {
    const html = toHtml(getBlock("testimonial_carousel").root);
    check('testimonial_carousel expands to a carousel behavior root', html.includes('data-sui-behavior="carousel"'));
    for (const role of ["track", "slide", "prev", "next", "dot"]) {
      check(`testimonial_carousel expands a ${role} part`, html.includes(`data-sui-part="${role}"`));
    }
  }
  // Autoplay would move the words someone is reading, and the runtime suppresses
  // it under prefers-reduced-motion — so switching it on ships a section that
  // behaves differently for different readers.
  check(
    "testimonial_carousel does not autoplay",
    !toHtml(getBlock("testimonial_carousel").root).includes('"autoplay"'),
  );
}

// ── Wordmark: the brand lockup (golden markup) ────────────────────────────
{
  const wm = (props, children) => {
    const n = atom("Wordmark", "wordmark", props);
    if (children) n.children = children;
    return toHtml(n);
  };
  // THE regression guard: text-only markup must be byte-identical to the
  // pre-container `elementDef(…, "span")` output. Everything else is additive.
  check(
    "Wordmark text-only markup is UNCHANGED (byte-identical to the element atom)",
    wm({ text: "SilicaUI" }) === '<span class="wordmark">SilicaUI</span>',
  );
  check(
    "Wordmark src renders a mark before the name",
    wm({ text: "SilicaUI", src: "/logo.svg" }) ===
      '<span class="wordmark"><img class="wordmark-mark" src="/logo.svg" alt="" loading="lazy"/>SilicaUI</span>',
  );
  check(
    "Wordmark href lowers to an <a> (same sugar as Button)",
    wm({ text: "Acme", src: "/l.svg", alt: "Acme logo", href: "/" }) ===
      '<a class="wordmark" href="/"><img class="wordmark-mark" src="/l.svg" alt="Acme logo" loading="lazy"/>Acme</a>',
  );
  check(
    "Wordmark authored children win over props (the documented composition)",
    wm({ text: "ignored" }, [el("svg", "")]) === '<span class="wordmark"><svg></svg></span>',
  );
  check("Wordmark mark-only (no text) emits just the mark", wm({ src: "/l.svg" }).includes("</span>"));
}

// ── ComponentDef.primary: a component declares its own bind target ─────────
{
  // The trap `primary` exists to prevent: a Wordmark HAS a `src` prop, so the
  // old `"src" in props` sniff would have written the bound NAME into the logo URL.
  const n = atom("Wordmark", "wordmark", { text: "Placeholder", src: "/logo.svg" });
  n.data = { kind: "value", ref: "site.identity.name" };
  const out = toHtml(resolveTree(n, { resolveBinding: () => ({ value: "Acme Storefront" }) }));
  check("primary:'text' — a bare bind on Wordmark fills the NAME", out.includes("Acme Storefront"));
  check("primary:'text' — the bound name does NOT hijack the logo src", out.includes('src="/logo.svg"'));

  const img = atom("Image", "", { src: "/placeholder.png" });
  img.data = { kind: "value", ref: "hero" };
  check(
    "primary:'src' — a bare bind on Image still fills the source (name-list removed, behavior kept)",
    toHtml(resolveTree(img, { resolveBinding: () => ({ value: "/real.jpg" }) })).includes('src="/real.jpg"'),
  );

  const av = atom("Avatar", "avatar", { src: "/p.png" });
  av.data = { kind: "value", ref: "user.photo" };
  check(
    "primary:'src' — Avatar unchanged too",
    toHtml(resolveTree(av, { resolveBinding: () => ({ value: "/me.jpg" }) })).includes('src="/me.jpg"'),
  );

  // An undeclared text component still falls back to text — no regression.
  const t = atom("Text", "", { text: "placeholder" });
  t.data = { kind: "value", ref: "copy" };
  check(
    "no `primary` declared — falls back to text as before",
    toHtml(resolveTree(t, { resolveBinding: () => ({ value: "resolved copy" }) })).includes("resolved copy"),
  );
}

// ── responsive images (doc 139 §6) ───────────────────────────────────────────
// `srcset`/`sizes` were allowlisted attributes with nothing generating them, so
// every published image shipped at one resolution. The HOST owns making the
// variants; the projector both surfaces share owns emitting them, so a
// responsive image can't be a thing that only works in production.
{
  const img = atom("Image", "w-full", {
    src: "/hero-1280.jpg",
    srcset: "/hero-640.jpg 640w, /hero-1280.jpg 1280w",
    sizes: "(min-width: 60rem) 50vw, 100vw",
    alt: "Hero",
  });
  const html = toHtml(img);
  check("Image emits srcset", html.includes('srcset="/hero-640.jpg 640w, /hero-1280.jpg 1280w"'));
  check("Image emits sizes", html.includes('sizes="(min-width: 60rem) 50vw, 100vw"'));
  check("...alongside the plain src, so a non-supporting client still loads one", html.includes('src="/hero-1280.jpg"'));
  check("...and keeps lazy loading", html.includes('loading="lazy"'));

  const plain = atom("Image", "w-full", { src: "/hero.jpg", alt: "Hero" });
  check("an Image with no variants emits neither attribute (unchanged)", !toHtml(plain).includes("srcset") && !toHtml(plain).includes("sizes"));

  // The density form is a complete srcset that takes no sizes — so they're
  // independent, not a unit that has to be supplied together.
  const density = atom("Image", "", { src: "/logo.png", srcset: "/logo.png 1x, /logo@2x.png 2x", alt: "" });
  check("srcset without sizes is emitted as-is", toHtml(density).includes('srcset="/logo.png 1x, /logo@2x.png 2x"'));
  check("...and no empty sizes is invented", !toHtml(density).includes("sizes="));

  // A hand-authored <img> element takes the same attributes (they were already
  // allowlisted) — the component path just stopped being the exception.
  const raw = el("img", "w-full", { attrs: { src: "/a.jpg", srcset: "/a-2x.jpg 2x", alt: "" } });
  check("a raw <img> element carries srcset too", toHtml(raw).includes('srcset="/a-2x.jpg 2x"'));
}

// ── Marquee: the one macro that renders its children more than once ─────────
// Everything here is about the two halves agreeing. The copy count drives both
// the number of `.marquee-group`s AND the `--marquee-copies` the keyframe
// divides by, so a mismatch is a strip that visibly hitches once per loop —
// invisible to a structural read of either half alone.
{
  const marquee = (props, kids) => ({
    kind: "component",
    component: "Marquee",
    class: "marquee marquee-fast",
    props,
    children: kids,
  });
  const item = (text, id) => ({ kind: "element", tag: "span", class: "logo", id, children: [text] });

  const two = toHtml(marquee({}, [item("Acme"), item("Contoso")]));
  check("Marquee lowers to a track", two.includes('class="marquee-track"'));
  check("...carrying the behavior marker", two.includes('data-sui-behavior="marquee"'));
  check("...and the track part", two.includes('data-sui-part="track"'));
  check("default repeat renders two groups", (two.match(/marquee-group/g) ?? []).length === 2);
  check("...and declares the matching copy count", two.includes("marquee-copies-2"));
  check("pause-on-hover is on by default", two.includes("marquee-pause-on-hover"));
  check("...with no redundant behavior param", !two.includes("data-sui-behavior-params"));
  check("the authored class survives", two.includes("marquee marquee-fast"));

  const dup = two.match(/aria-hidden="true"/g) ?? [];
  check("every copy past the first is aria-hidden", dup.length === 1);
  check("...and inert, so it's out of the tab order too", (two.match(/ inert/g) ?? []).length === 1);

  const five = toHtml(marquee({ repeat: 5 }, [item("Acme")]));
  check("repeat renders that many groups", (five.match(/marquee-group/g) ?? []).length === 5);
  check("...and the copy count follows it", five.includes("marquee-copies-5"));
  check("repeat clamps to the range the CSS actually emits", toHtml(marquee({ repeat: 99 }, [item("A")])).includes("marquee-copies-6"));
  check("...at the bottom too", toHtml(marquee({ repeat: 1 }, [item("A")])).includes("marquee-copies-2"));

  const off = toHtml(marquee({ pauseOnHover: false }, [item("Acme")]));
  check("pauseOnHover:false drops the CSS class", !off.includes("marquee-pause-on-hover"));
  check("...and tells the runtime the same thing", off.includes("&quot;pauseOnHover&quot;:false") || off.includes('"pauseOnHover":false'));

  // Ids are globally unique by contract — a duplicated copy carrying the
  // original's id would make a builder click land on whichever copy the DOM
  // query hit first.
  const withIds = toHtml(marquee({}, [item("Acme", "n1")]), { ids: true });
  check("only the authored copy keeps its id", (withIds.match(/data-sui-id="n1"/g) ?? []).length === 1);
}

// ── the site shell ───────────────────────────────────────────
// One frame per site, wrapping every page. `pageDocument` and `renderPage` must
// agree about it — the canvas reads one and publish the other, and a
// disagreement is a preview that lies.
{
  const shell = (label) => ({
    root: el("div", "shell", { children: [el("header", "hdr", { text: label }), outlet()] }),
    editable: true,
  });
  const site = {
    version: "1",
    theme: { name: "t", tokens: {} },
    frame: shell("DEFAULT"),
    pages: [
      { id: "p1", name: "Home", slug: "/", root: el("div", "body", { text: "home" }) },
      { id: "p2", name: "Pricing", slug: "/pricing", root: el("div", "body", { text: "pricing" }) },
    ],
  };

  const html = Object.fromEntries(renderSite(site).map((p) => [p.id, p.html]));
  check("every page renders inside the site shell", html.p1.includes("DEFAULT") && html.p1.includes("home"));
  check("...including the second one", html.p2.includes("DEFAULT") && html.p2.includes("pricing"));
  check("pageDocument carries that same frame", pageDocument(site, "p1").frame === site.frame);

  // A site with no shell at all renders its pages bare — exactly the page tree,
  // nothing wrapped around it.
  const bare = { ...site, frame: undefined };
  check("no frame → the page renders bare", renderSite(bare)[0].html === toHtml(site.pages[0].root));
  check("...and pageDocument omits it too", pageDocument(bare, "p1").frame === undefined);
}

console.log(
  failures === 0 ? "\n✅ all checks passed\n" : `\n❌ ${failures} check(s) failed\n`,
);
process.exit(failures ? 1 : 0);
