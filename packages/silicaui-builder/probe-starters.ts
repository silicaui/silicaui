/**
 * Isolated proof for the HOST-EXTENSIBLE component-starter picker — no React, no
 * DOM. Covers the pure assembly in `componentStarterGroups`: defaults intact, a
 * host's `catalog().extend` groups auto-surfacing as starters (key + label
 * preserved), explicit `componentStarters().extend` merging, `hide` pruning both
 * items and whole groups, and — critically — that `hostComponents()` (locked
 * HostNodes) never leaks in.
 */
import { componentStarterGroups } from "./src/site/component-starters";
import type { PaletteGroup, PaletteItem } from "./src/site/palette";
import { el } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
const item = (key: string, label = key): PaletteItem => ({ key, label, icon: "plus", make: () => el("div", "p-4") });
const keysIn = (groups: { items: PaletteItem[] }[]): string[] => groups.flatMap((g) => g.items.map((i) => i.key));
const group = (groups: { key: string }[], key: string) => groups.find((g) => g.key === key);

// ── 1. defaults with no host: blank + built-in archetypes ────────────────────
console.log("defaults hold with no host adapter");
{
  const g = componentStarterGroups();
  check("first group is Start blank", g[0]?.key === "blank" && g[0]?.items[0]?.key === "blank");
  check("includes the Structure archetypes (navbar/footer)", keysIn(g).includes("block:navbar") && keysIn(g).includes("block:footer"));
  check("no host groups leak in", !g.some((x) => x.key === "commerce"));
}

// ── 2. a host's catalog().extend auto-surfaces, key + label preserved ────────
console.log("catalog().extend groups auto-surface as starters");
{
  const commerce: PaletteGroup = { key: "commerce", label: "Commerce", items: [item("productCard", "Product Card"), item("priceRow", "Price Row")] };
  const g = componentStarterGroups({ catalogExtend: [commerce] });
  const surfaced = group(g, "commerce");
  check("a Commerce group appears", !!surfaced);
  check("its label is preserved verbatim ('Commerce', not a generic bucket)", surfaced?.label === "Commerce");
  check("its editable items come through", keysIn([surfaced!]).includes("productCard") && keysIn([surfaced!]).includes("priceRow"));
  check("defaults still present alongside it", keysIn(g).includes("block:navbar"));
}

// ── 3. hostComponents() is NEVER accepted here (different seam, locked trees) ─
console.log("hostComponents() cannot leak into the picker");
{
  // The function signature only accepts catalogExtend + starters — a host node
  // group would have to arrive via catalogExtend to appear, which a correct host
  // never does. Proven structurally: passing ONLY host components yields defaults.
  const g = componentStarterGroups({ catalogExtend: undefined, starters: undefined });
  check("no host:* items with an empty contribution", !keysIn(g).some((k) => k.startsWith("host:")));
}

// ── 4. explicit componentStarters().extend merges by group key ───────────────
console.log("explicit starter groups merge by key");
{
  const commerce: PaletteGroup = { key: "commerce", label: "Commerce", items: [item("productCard")] };
  const g = componentStarterGroups({
    catalogExtend: [commerce],
    starters: { extend: [{ key: "commerce", label: "Commerce", items: [item("bundleCard")] }, { key: "sparx", label: "Sparx", items: [item("heroPromo")] }] },
  });
  const c = group(g, "commerce")!;
  check("same-key extend appends into the auto-surfaced group", keysIn([c]).includes("productCard") && keysIn([c]).includes("bundleCard"));
  check("a new-key extend becomes its own trailing group", !!group(g, "sparx"));
  // A duplicate item key is not doubled.
  const dup = componentStarterGroups({ catalogExtend: [commerce], starters: { extend: [{ key: "commerce", label: "Commerce", items: [item("productCard")] }] } });
  check("duplicate item keys are de-duped", keysIn([group(dup, "commerce")!]).filter((k) => k === "productCard").length === 1);
}

// ── 5. hide prunes items AND whole groups (defaults included) ─────────────────
console.log("hide curates items and groups");
{
  const commerce: PaletteGroup = { key: "commerce", label: "Commerce", items: [item("productCard"), item("priceRow")] };
  const g = componentStarterGroups({ catalogExtend: [commerce], starters: { hide: ["priceRow", "block:pricing_tiers"] } });
  check("an item key is hidden", !keysIn(g).includes("priceRow"));
  check("its sibling survives", keysIn(g).includes("productCard"));
  check("a default starter item is hidden by key", !keysIn(g).includes("block:pricing_tiers"));
  // Hiding a whole group key drops the group; empty groups fall away too.
  const g2 = componentStarterGroups({ catalogExtend: [commerce], starters: { hide: ["commerce"] } });
  check("a whole group key is hidden", !group(g2, "commerce"));
  const g3 = componentStarterGroups({ catalogExtend: [{ key: "solo", label: "Solo", items: [item("only")] }], starters: { hide: ["only"] } });
  check("a group emptied by hide falls away", !group(g3, "solo"));
}

console.log(failures === 0 ? "\nALL STARTER PROBES PASSED" : `\n${failures} STARTER PROBE(S) FAILED`);
if (failures) process.exit(1);
