/**
 * Probe: `table-stack` turns a table's rows into blocks below a CONTAINER width.
 *
 * WHY. A list pane docked beside another can be 360px wide on a desktop. About
 * 150 lists in one consuming product rendered a `<Table size="sm">` whose name
 * cell had a 224px floor plus two or three `whitespace-nowrap` cells (a total, a
 * state, the row's own button). At 343px the table ran past its pane and hid
 * the state and the button, which is the right-hand side of every row and
 * usually the thing the screen tells you to press. Viewport media queries
 * cannot see a narrow pane on a wide screen, so the switch has to be a
 * container query, and it has to work without anyone setting `@container`.
 *
 * This runs the REAL plugin through the REAL Tailwind compiler, because the
 * failure modes are all in what reaches the stylesheet: an at-rule key that
 * Tailwind drops, a stacked rule emitted outside its query (which would change
 * every table at every width), an `!important` that does not survive, or a
 * prefix that does not reach the `:has()` container rule.
 *
 * Its browser half, which measures real layout at 343px, is
 * examples/playground/e2e/table-stack.spec.ts.
 *
 * Run: node scripts/verify-table-stack.mjs
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "tailwindcss";

let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) {
    failures++;
    if (detail) console.log(`      ${detail}`);
  }
}

const here = resolve(import.meta.dirname, "..");
const plugin = `${here.replace(/\\/g, "/")}/src/index.js`;

/**
 * Compile the plugin. With `candidates`, Tailwind's own utilities are compiled
 * too, in their usual layer, for exactly those class names, the way an app's
 * source scan hands them to Tailwind. The `md` breakpoint is declared so a
 * `md:` variant compiles, as it does under `@import "tailwindcss"`.
 */
async function build(options = "", candidates = null) {
  const dir = mkdtempSync(join(tmpdir(), "silica-table-stack-"));
  const pluginRule = options ? `@plugin "${plugin}" {\n${options}\n}\n` : `@plugin "${plugin}";\n`;
  const source = candidates
    ? "@layer theme, base, components, utilities;\n" +
      "@theme {\n  --breakpoint-md: 48rem;\n}\n" +
      `@layer utilities {\n  @tailwind utilities;\n}\n${pluginRule}`
    : pluginRule;
  try {
    const compiled = await compile(source, {
      base: dir,
      // On Windows an absolute path is not a valid ESM specifier; see
      // verify-theme-plugin.mjs.
      loadModule: async (id, base) => {
        const abs = id.startsWith(".") ? resolve(base, id) : id;
        const mod = await import(pathToFileURL(abs).href);
        return { module: mod.default ?? mod, base };
      },
    });
    return compiled.build(candidates ?? []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Tailwind's `build()` keeps CSS nesting (`& th, & td { … }`); the consumer's
// bundler flattens it later. Flatten it here the same way, so a check reads the
// selector a browser actually matches, with the at-rules that wrap it.
// ---------------------------------------------------------------------------

/** Split on commas that are not inside parentheses. */
function splitTop(list) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** Parse nested CSS into `{ header, decls, children }` blocks. */
function parse(css) {
  let i = 0;
  function block() {
    const decls = [];
    const children = [];
    let buf = "";
    while (i < css.length) {
      const ch = css[i++];
      if (ch === "{") {
        const header = buf.trim();
        buf = "";
        children.push({ header, ...block() });
      } else if (ch === "}") {
        if (buf.trim()) decls.push(buf.trim());
        return { decls, children };
      } else if (ch === ";") {
        if (buf.trim()) decls.push(buf.trim());
        buf = "";
      } else buf += ch;
    }
    return { decls, children };
  }
  return block().children;
}

/** Flat `{ selector, at: string[], decls: string }` rules. */
function flatten(nodes, parents = [], at = [], out = []) {
  for (const n of nodes) {
    if (n.header.startsWith("@")) {
      if (n.decls.length && parents.length) {
        out.push({ selector: parents.join(", "), at: [...at, n.header], decls: n.decls.join("; ") });
      }
      flatten(n.children, parents, [...at, n.header], out);
      continue;
    }
    const selectors = [];
    for (const part of splitTop(n.header)) {
      if (!parents.length) selectors.push(part.replace(/&/g, ""));
      else
        for (const p of parents) selectors.push(part.includes("&") ? part.replace(/&/g, p) : `${p} ${part}`);
    }
    if (n.decls.length) out.push({ selector: selectors.join(", "), at, decls: n.decls.join("; ") });
    flatten(n.children, selectors, at, out);
  }
  return out;
}

const containerOf = (rule) => rule.at.find((a) => a.startsWith("@container"));

/** The declarations of the rule for `selector`, inside `container` or outside any. */
function decls(rules, selector, container = null) {
  const hit = rules.find(
    (r) => r.selector === selector && (container ? containerOf(r) === container : !containerOf(r)),
  );
  return hit ? hit.decls : "";
}

let rules;
try {
  rules = flatten(parse(await build()));
} catch (err) {
  console.log("  ✗ the plugin did not compile");
  console.log(`      ${err.message}`);
  process.exit(1);
}

console.log("\ntable-stack: the switch is a container query");

const EXPECTED = [
  ["table-stack", "36rem"],
  ["table-stack-sm", "24rem"],
  ["table-stack-md", "28rem"],
  ["table-stack-lg", "32rem"],
  ["table-stack-xl", "36rem"],
  ["table-stack-2xl", "42rem"],
  ["table-stack-3xl", "48rem"],
];
for (const [cls, width] of EXPECTED) {
  check(
    `.${cls} stacks below a ${width} container`,
    /display:\s*block/.test(decls(rules, `.${cls}`, `@container (width < ${width})`)),
  );
}

// Every stacked rule lives inside a query. A `.table-stack …` rule outside one
// would restyle the table at EVERY width, which breaks the "above the
// breakpoint, an ordinary table" promise.
const leaked = rules
  .filter((r) => /\.table-stack/.test(r.selector) && !containerOf(r))
  .filter((r) => !r.selector.startsWith(":where(:has("))
  .map((r) => r.selector);
check(
  "no stacked rule applies outside its container query",
  rules.some((r) => /\.table-stack/.test(r.selector)) && leaked.length === 0,
  leaked.length ? leaked.slice(0, 3).join(" | ") : "no stack rules at all",
);

console.log("\ntable-stack: the container is established by the plugin");

const containerRule = rules.find((r) => r.selector.startsWith(":where(:has(") && /table-stack/.test(r.selector));
check(
  "the table's parent becomes an inline-size query container",
  !!containerRule && !containerOf(containerRule) && /container-type:\s*inline-size/.test(containerRule.decls),
);
check(
  "every stack class makes its parent a container",
  !!containerRule && EXPECTED.every(([cls]) => new RegExp(`\\.${cls}(?![-\\w])`).test(containerRule.selector)),
  containerRule ? containerRule.selector : "no :has() rule",
);
const stackQueries = rules.filter((r) => /\.table-stack/.test(r.selector) && containerOf(r)).map(containerOf);
check(
  "the queries are unnamed, so a consumer's own @container on that parent still serves",
  stackQueries.length > 0 && stackQueries.every((q) => /^@container \(/.test(q)),
);

console.log("\ntable-stack: what a stacked row looks like");

const AT = "@container (width < 36rem)";
const thead = decls(rules, ".table-stack > thead", AT);
check(
  "the header is visually hidden, not removed (a screen reader still reads it)",
  /position:\s*absolute/.test(thead) && /clip:\s*rect\(0/.test(thead) && !/display:\s*none/.test(thead),
  thead,
);
const tr = decls(rules, ".table-stack tr", AT);
check("a row wraps its cells", /display:\s*flex/.test(tr) && /flex-wrap:\s*wrap/.test(tr), tr);
check(
  "a row pads and gaps at its size's cell density",
  /padding-inline:\s*var\(--table-pad-x\)/.test(tr) && /column-gap:\s*var\(--table-pad-x\)/.test(tr),
  tr,
);
const cell = decls(rules, ".table-stack :is(td, th)", AT);
check(
  "a cell can never be wider than its row, whatever width utilities it carries",
  /max-width:\s*100%\s*!important/.test(cell) && /min-width:\s*0\s*!important/.test(cell),
  cell,
);
check(
  "a nowrap cell can still wrap when it cannot fit on a line of its own",
  /white-space:\s*normal\s*!important/.test(cell),
  cell,
);
check(
  "a cell's `display` is left alone, so a cell hidden with `hidden` stays hidden",
  cell !== "" && !/display/.test(cell),
  cell,
);
// "The first cell" and "the last cell" mean the first and last cells that SHOW.
// A list that hides a column below a pane width does it with Tailwind's
// `hidden` plus a container variant (`hidden @xl:table-cell`), or with the
// `hidden` attribute. With `:first-child` / `:last-child`, a hidden first cell
// took the name's line and a hidden last cell kept the button from the end.
const SHOWN = ":not(.hidden, [hidden])";
const stackedAt = (re) =>
  rules.filter((r) => containerOf(r) === AT && r.selector.startsWith(".table-stack ") && re.test(r.decls));
const ownLine = stackedAt(/flex-basis:\s*100%/).filter((r) => /^\.table-stack > tbody > tr > /.test(r.selector));
check(
  "the first cell that shows takes a line of its own (a `hidden` class or attribute is skipped)",
  ownLine.length === 1 && ownLine[0].selector.startsWith(`.table-stack > tbody > tr > :nth-child(1 of ${SHOWN})`),
  ownLine.map((r) => r.selector).join(" | ") || "no own-line rule",
);
const atEnd = stackedAt(/margin-inline-start:\s*auto/);
check(
  "the last cell that shows (the row's button) sits at the end, unless it is also the first",
  atEnd.length === 1 &&
    atEnd[0].selector === `.table-stack tr > :nth-last-child(1 of ${SHOWN}):not(:nth-child(1 of ${SHOWN}))`,
  atEnd.map((r) => r.selector).join(" | ") || "no end rule",
);

// A first cell that holds only a selection control (or says it is one with
// `data-stack="select"`) stays on the name's line instead of taking a line to
// itself, and the name fills the rest of that line.
const SELECT = /\[data-stack="?select"?\]/;
const PICK = /input:is\(\[type="?checkbox"?\], \[type="?radio"?\]\):only-child/;
check(
  "a selection cell is not given a line of its own",
  ownLine.length === 1 && SELECT.test(ownLine[0].selector) && PICK.test(ownLine[0].selector) &&
    /:not\(:is\(/.test(ownLine[0].selector),
  ownLine.map((r) => r.selector).join(" | "),
);
const fill = stackedAt(/flex-grow:\s*1/);
check(
  "the cell after a leading selection cell fills the rest of its line",
  fill.length === 1 && SELECT.test(fill[0].selector) && PICK.test(fill[0].selector) &&
    fill[0].selector.includes(`~ :nth-child(2 of ${SHOWN})`) && /flex-basis:\s*0/.test(fill[0].decls),
  fill.map((r) => r.selector).join(" | ") || "no fill rule",
);
const lineBreak = stackedAt(/flex-basis:\s*100%/).filter((r) => /::before$/.test(r.selector));
check(
  "a row with a leading selection cell breaks the line after the name",
  lineBreak.length === 1 && /^\.table-stack > tbody > tr:has\(/.test(lineBreak[0].selector) &&
    /order:\s*1/.test(lineBreak[0].decls) && /content:\s*""/.test(lineBreak[0].decls),
  lineBreak.map((r) => r.selector).join(" | ") || "no break rule",
);
const after = stackedAt(/order:\s*1/).filter((r) => !/::before$/.test(r.selector));
check(
  "the cells after the name move below that break",
  after.length === 1 && after[0].selector.endsWith(`~ :nth-child(2 of ${SHOWN}) ~ *`),
  after.map((r) => r.selector).join(" | ") || "no order rule",
);

const pullUp = stackedAt(/margin-block-end:\s*calc\(var\(--table-pad-y\) \/ -2\)/);
check(
  "the name's line pulls up by one row gap, so the break does not open a second gap",
  pullUp.length === 1 && pullUp[0].selector.includes(`~ :nth-child(2 of ${SHOWN})`) &&
    /--table-pad-y\) \/ 2\)/.test(tr),
  pullUp.map((r) => r.selector).join(" | ") || "no pull-up rule",
);

// `:has()` may not nest inside another `:has()`: a browser drops the whole rule,
// and nothing else says so. The selection test is a `:has()`, so this is easy to
// write by accident in the row's break rule.
function nestedHas(selector) {
  let depth = 0;
  const open = [];
  for (let i = 0; i < selector.length; i++) {
    if (selector.startsWith(":has(", i)) {
      if (open.some((d) => d < depth + 1)) return true;
      open.push(depth + 1);
    }
    if (selector[i] === "(") depth++;
    else if (selector[i] === ")") {
      if (open.length && open[open.length - 1] === depth) open.pop();
      depth--;
    }
  }
  return false;
}
const nested = rules.filter((r) => /\.table-stack/.test(r.selector) && nestedHas(r.selector)).map((r) => r.selector);
check("no stacked selector nests a :has() inside a :has()", nested.length === 0, nested.slice(0, 2).join(" | "));
check(
  "a cell with data-label shows that label",
  /content:\s*attr\(data-label\)/.test(decls(rules, ".table-stack :is(td, th)[data-label]::before", AT)),
);
check(
  "the footer is set off from the last row with a token rule",
  /border-top:[^;]*var\(--color-base-300\)/.test(decls(rules, ".table-stack > tfoot", AT)),
);

console.log("\ntable-stack: the stacked table beats Tailwind's own `table` utility");

// `table` is also a Tailwind core utility, `.table { display: table }`. An app
// whose sources contain the word gets it in the utilities layer, which outranks
// the base layer this plugin writes to. Stacked, the table must still be a
// block: as a table it grows to fit its longest unbroken line, and a list of
// truncated names ran 1040px wide in a 323px pane. So the stacked `display` is
// `!important`, except on a table that is hidden, which must stay hidden.
//
// This resolves the cascade for `display` on a `<table>` the way a browser
// does, over the rules the compiler really emitted: importance, then layer,
// then specificity, then source order.

/** Remove CSS escapes from a class name: `md\:hidden` is the class `md:hidden`. */
const unescapeCss = (s) => s.replace(/\\(.)/g, "$1");

/** Split a compound selector into its simple parts, keeping `:not(...)` whole. */
function simpleParts(compound) {
  const parts = [];
  let i = 0;
  while (i < compound.length) {
    const start = i;
    // An attribute selector opens a bracket that its own first character is.
    let depth = compound[i] === "[" ? 1 : 0;
    i += compound[i] === "\\" ? 2 : 1;
    while (i < compound.length) {
      const ch = compound[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (depth === 0 && (ch === "." || ch === ":" || ch === "[")) break;
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      i++;
    }
    parts.push(compound.slice(start, i));
  }
  return parts;
}

/**
 * The specificity (as one number) with which `selector`, a single compound with
 * no combinators, matches a `<table>` with these classes and attributes, or
 * null if it does not match. Anything this does not understand does not match,
 * so a rule it cannot read is left out rather than guessed at.
 */
function matchTable(selector, el) {
  const outer = selector.replace(/\\./g, "").replace(/\([^)]*\)|\[[^\]]*\]/g, "");
  if (/[\s>~+]/.test(outer)) return null;
  let spec = 0;
  for (const part of simpleParts(selector)) {
    if (part === "table") spec += 1;
    else if (part.startsWith(".")) {
      if (!el.classes.includes(unescapeCss(part.slice(1)))) return null;
      spec += 100;
    } else if (part.startsWith("[")) {
      const m = part.match(/^\[(\w[\w-]*)(?:([*~])="([^"]*)")?\]$/);
      if (!m) return null;
      const [, attr, op, want] = m;
      const value = attr === "class" ? el.classes.join(" ") : el.attrs[attr];
      if (value === undefined) return null;
      if (op === "*" && !value.includes(want)) return null;
      if (op === "~" && !value.split(/\s+/).includes(want)) return null;
      spec += 100;
    } else if (part.startsWith(":not(")) {
      const args = splitTop(part.slice(5, -1));
      if (args.some((a) => matchTable(a, el) !== null)) return null;
      // Every argument here is one class or attribute selector.
      spec += 100;
    } else return null;
  }
  return spec;
}

const LAYERS = ["theme", "base", "components", "utilities"];

/**
 * The `display` declaration a `<table>` gets inside a container narrower than
 * `width` (or `null` for a wide one, outside every query): every emitted rule
 * that sets `display` and matches, ranked the way the cascade ranks them. Every
 * `@media` query counts as matching, as on a wide screen.
 */
function tableDisplay(rules, el, width) {
  const candidates = [];
  rules.forEach((rule, order) => {
    const query = containerOf(rule);
    if (query && query !== `@container (width < ${width})`) return;
    const decl = rule.decls.split(/;\s*/).find((d) => /^display\s*:/.test(d));
    if (!decl) return;
    const specs = splitTop(rule.selector)
      .map((s) => matchTable(s, el))
      .filter((s) => s !== null);
    if (!specs.length) return;
    const layer = rule.at.find((a) => a.startsWith("@layer "));
    candidates.push({
      value: decl.replace(/^display\s*:\s*/, "").replace(/\s*!important$/, ""),
      important: /!important$/.test(decl),
      layer: layer ? LAYERS.indexOf(layer.slice(7).trim()) : LAYERS.length,
      spec: Math.max(...specs),
      order,
      selector: rule.selector,
    });
  });
  candidates.sort((a, b) => {
    if (a.important !== b.important) return a.important ? 1 : -1;
    // An important declaration in an EARLIER layer wins; a normal one in a later.
    if (a.layer !== b.layer) return a.important ? b.layer - a.layer : a.layer - b.layer;
    return a.spec - b.spec || a.order - b.order;
  });
  return candidates.at(-1) ?? null;
}

const shown = (won) => (won ? `${won.value}${won.important ? " !important" : ""} from ${won.selector}` : "no display at all");

const withUtilities = flatten(
  parse(
    await build("", ["table", "hidden", "md:hidden", "hidden!", "!hidden", ...EXPECTED.map(([c]) => c)]),
  ),
);
check(
  "Tailwind emits its `table` utility in the utilities layer (the collision is real)",
  withUtilities.some(
    (r) => r.selector === ".table" && r.at.includes("@layer utilities") && /display:\s*table/.test(r.decls),
  ),
  "no `.table { display: table }` in @layer utilities, so this section tests nothing",
);
for (const [cls, width] of EXPECTED) {
  const won = tableDisplay(withUtilities, { classes: ["table", cls], attrs: {} }, width);
  check(
    `<table class="table ${cls}"> is a block below ${width}, not the utility's table`,
    won?.value === "block",
    shown(won),
  );
}
const wide = tableDisplay(withUtilities, { classes: ["table", "table-stack"], attrs: {} }, null);
check("above the breakpoint the stacked table is a table again", wide?.value === "table", shown(wide));
// A hidden table must stay hidden. The important block is what could undo
// that, so it skips a table that carries a hide: the `hidden` class, a variant
// or an important form of it, or the `hidden` attribute.
//
// `md:hidden` (here at a width where it applies) is a later utility than
// `table`, and `hidden!` is important, so each wins once the block steps aside. The bare `hidden` class does
// not beat Tailwind's `table` on any table, stacked or not: both are utilities
// of equal weight and `table` is emitted after it. So that case is checked in a
// build without the `table` utility, as in an app whose tables come from
// generated markup the source scan never sees.
for (const cls of ["md:hidden", "hidden!", "!hidden"]) {
  const won = tableDisplay(withUtilities, { classes: ["table", "table-stack", cls], attrs: {} }, "36rem");
  check(`a stacked table hidden with \`${cls}\` stays hidden`, won?.value === "none", shown(won));
}
const noTableUtility = flatten(parse(await build("", ["hidden", "table-stack"])));
const hiddenClass = tableDisplay(noTableUtility, { classes: ["table", "table-stack", "hidden"], attrs: {} }, "36rem");
check("a stacked table hidden with the `hidden` class stays hidden", hiddenClass?.value === "none", shown(hiddenClass));
// Preflight hides `[hidden]` with an important rule in the base layer, and is
// not compiled here. What could override it is the stack's important block, so
// this checks that the block does not apply.
const attrWon = tableDisplay(withUtilities, { classes: ["table", "table-stack"], attrs: { hidden: "" } }, "36rem");
check(
  "a stacked table with the `hidden` attribute does not get the important block",
  !!attrWon && !attrWon.important,
  shown(attrWon),
);
const cellWithUtilities = decls(withUtilities, ".table-stack :is(td, th)", AT);
check(
  "a cell's `display` is still left alone, so `hidden` on a cell keeps working",
  cellWithUtilities !== "" && !/display/.test(cellWithUtilities),
  cellWithUtilities,
);

console.log("\ntable: sizes drive the padding the stacked rows read");

for (const [size, x] of [["xs", "0.5rem"], ["sm", "0.75rem"], ["md", "1rem"], ["lg", "1.25rem"], ["xl", "1.5rem"]]) {
  const d = decls(rules, `.table-${size}`);
  check(`.table-${size} sets --table-pad-x: ${x}`, new RegExp(`--table-pad-x:\\s*${x}`).test(d), d);
}
check(
  "a plain table's cells pad from the same properties",
  /padding-inline:\s*var\(--table-pad-x\)/.test(decls(rules, ".table th, .table td")),
);
check("table-scroll is the scrolling wrapper", /overflow-x:\s*auto/.test(decls(rules, ".table-scroll")));

console.log("\ntable-stack: a prefix reaches every part");

const prefixed = flatten(parse(await build("  prefix: sx-;")));
const prefixedContainer = prefixed.find((r) => r.selector.startsWith(":where(:has(") && /table-stack/.test(r.selector));
check(
  "the container rule names the prefixed classes",
  !!prefixedContainer && /\.sx-table-stack(?![-\w])/.test(prefixedContainer.selector),
  prefixedContainer ? prefixedContainer.selector : "no :has() rule",
);
check(
  "the stacked rules are prefixed",
  /position:\s*absolute/.test(decls(prefixed, ".sx-table-stack > thead", AT)),
);

if (failures > 0) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nA stacked table turns its rows into blocks below its container's width.");
