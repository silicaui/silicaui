// Library-level proof of the symbol OUTPUT contract: `flattenSymbols` inlines
// every instance into a fresh clone of its master, recursively, breaking cycles —
// so a consumer (sparx, any host) projects instances to plain markup with no
// symbol awareness. Run against built output:
//   pnpm --filter @wizeworks/silicaui-html build && node verify-symbols.mjs
import { applyOverrides, el, flattenSymbols, hasInstances, toHtml } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const instance = (symId) => ({ kind: "element", tag: "div", instanceOf: symId });

// A master: a card with a heading.
const cardMaster = el("section", "card", { children: [el("h3", "title", { text: "Card master" })] });

// ── 1. a lone instance flattens to its master markup ─────────────────────────
{
  const page = el("main", "page", { children: [instance("card"), el("p", undefined, { text: "after" })] });
  check("page has instances before flatten", hasInstances(page) === true);
  const flat = flattenSymbols(page, { card: { id: "card", name: "Card", root: cardMaster } });
  check("flatten removes all instance markers", hasInstances(flat) === false);
  const html = toHtml(flat);
  check("output carries the master markup", html.includes("Card master") && html.includes("<section"));
  check("output keeps sibling content", html.includes("after"));
  check("input page was NOT mutated", hasInstances(page) === true);
}

// ── 2. nested symbols expand fully ───────────────────────────────────────────
{
  // outer master embeds an instance of inner.
  const inner = el("span", "inner", { text: "INNER" });
  const outer = el("div", "outer", { children: [el("b", undefined, { text: "OUTER" }), instance("inner")] });
  const page = el("main", undefined, { children: [instance("outer")] });
  const html = toHtml(
    flattenSymbols(page, {
      outer: { id: "outer", name: "Outer", root: outer },
      inner: { id: "inner", name: "Inner", root: inner },
    }),
  );
  check("nested symbol expands (outer)", html.includes("OUTER"));
  check("nested symbol expands (inner)", html.includes("INNER"));
}

// ── 3. a self-referential cycle is broken, not infinite ──────────────────────
{
  // master contains an instance of ITSELF — flatten must terminate.
  const selfMaster = el("div", "self", { children: [el("span", undefined, { text: "SELF" }), instance("loop")] });
  const page = el("main", undefined, { children: [instance("loop")] });
  let html = "";
  let threw = false;
  try {
    html = toHtml(flattenSymbols(page, { loop: { id: "loop", name: "Loop", root: selfMaster } }));
  } catch {
    threw = true;
  }
  check("cyclic flatten terminates (no throw / stack overflow)", threw === false);
  check("cyclic flatten still emits the one non-cyclic level", html.includes("SELF"));
}

// ── 4. a dangling reference degrades to an empty element, not a crash ─────────
{
  const page = el("main", undefined, { children: [instance("gone")] });
  let threw = false;
  let html = "";
  try {
    html = toHtml(flattenSymbols(page, {}));
  } catch {
    threw = true;
  }
  check("missing symbol does not throw", threw === false);
  check("missing symbol leaves valid markup", html.includes("<main"));
}

// ── 5. per-instance overrides are baked into the flattened output ────────────
{
  const master = el("section", "card", {
    children: [el("h3", { id: "h", class: "title" }, { text: "Default title" })],
  });
  // The master node ids must be present for override keys to match.
  master.id = "root";
  master.children[0].id = "h";
  const a = { kind: "element", tag: "div", instanceOf: "card", overrides: { h: { text: "Overridden A" } } };
  const b = { kind: "element", tag: "div", instanceOf: "card" };
  const page = el("main", undefined, { children: [a, b] });
  const html = toHtml(flattenSymbols(page, { card: { id: "card", name: "Card", root: master } }));
  check("override applies to the instance that set it", html.includes("Overridden A"));
  check("the other instance keeps the master default", html.includes("Default title"));

  // applyOverrides in isolation does not mutate its input.
  const clone = JSON.parse(JSON.stringify(master));
  applyOverrides(clone, { h: { text: "X" } });
  check("applyOverrides mutates the passed clone", JSON.stringify(clone).includes("X"));
  check("original master untouched by the clone edit", !JSON.stringify(master).includes("X"));
}

console.log(`\n${failures === 0 ? "✅ symbol flatten contract: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
