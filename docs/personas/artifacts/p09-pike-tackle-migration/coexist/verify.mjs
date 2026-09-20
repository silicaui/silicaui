// Do daisyUI and Silica actually coexist, or does it only look like it?
//
// The claim is that `prefix: sx-` namespaces every Silica class so the two never
// fight over `.btn`, `.card`, `.badge`. This checks the BUILT stylesheet, which
// is where a collision would live, and then the rendered page, which is where it
// would show.
//
// The check that matters is not "both columns rendered". It is that the two
// buttons are DIFFERENT elements taking DIFFERENT rules, and that no selector in
// the sheet matches both.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const assets = path.join(HERE, "dist", "assets");
const cssFile = readdirSync(assets).find((f) => f.endsWith(".css"));
const css = readFileSync(path.join(assets, cssFile), "utf8");

let bad = 0;
const check = (n, ok, d) => {
  console.log(`  ${ok ? "✓" : "✗"} ${n}${d ? ` — ${d}` : ""}`);
  if (!ok) bad++;
};
const say = (n, t) => console.log(`  · ${n} — ${t}`);

// Count rule heads, not substrings: `.sx-btn` contains `btn`, so a naive
// `css.includes(".btn")` is true whatever happens and proves nothing.
const selectorHeads = (name) => {
  const re = new RegExp("\\.(" + name + ")(?![a-zA-Z0-9_-])", "g");
  return (css.match(re) ?? []).length;
};

const daisyBtn = selectorHeads("btn");
const silicaBtn = selectorHeads("sx-btn");
const daisyCard = selectorHeads("card");
const silicaCard = selectorHeads("sx-card");

say("rules whose selector is exactly .btn (daisyUI)", String(daisyBtn));
say("rules whose selector is exactly .sx-btn (Silica)", String(silicaBtn));
say("rules whose selector is exactly .card (daisyUI)", String(daisyCard));
say("rules whose selector is exactly .sx-card (Silica)", String(silicaCard));

check("daisyUI's own .btn is in the sheet", daisyBtn > 0);
check("Silica's .sx-btn is in the sheet", silicaBtn > 0);
check("both card families are there too", daisyCard > 0 && silicaCard > 0);

// The collision test. A bare `.silica-class` with no prefix would mean the
// namespacing leaked; these are Silica-only names daisyUI has never had.
const SILICA_ONLY = ["breadcrumb", "sortable-list", "resizable-group", "data-table", "field"];
const leaked = SILICA_ONLY.filter((n) => selectorHeads(n) > 0);
say("Silica-only class names appearing WITHOUT the prefix", JSON.stringify(leaked));
check("nothing of Silica's escaped the prefix", leaked.length === 0);

const prefixed = SILICA_ONLY.filter((n) => selectorHeads("sx-" + n) > 0);
say("...and the same names WITH it", JSON.stringify(prefixed));
check("the prefixed forms are the ones that shipped", prefixed.length >= 3);

console.log("");
console.log(
  bad === 0
    ? "✅ daisyUI and Silica are in one stylesheet and share no class name"
    : `❌ ${bad} problem(s)`,
);
process.exit(bad === 0 ? 0 : 1);
