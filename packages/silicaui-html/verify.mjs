// Runnable proof of the spine: author → validate → project → stamp. Run against
// the built output: `pnpm --filter @wizeworks/silicaui-html build && node verify.mjs`.
import {
  block,
  el,
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
