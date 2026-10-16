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

async function build(options = "") {
  const dir = mkdtempSync(join(tmpdir(), "silica-table-stack-"));
  const source = options ? `@plugin "${plugin}" {\n${options}\n}\n` : `@plugin "${plugin}";\n`;
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
    return compiled.build([]);
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
check(
  "the first cell takes a line of its own",
  /flex-basis:\s*100%/.test(decls(rules, ".table-stack > tbody > tr > :first-child", AT)),
);
check(
  "the last cell (the row's button) sits at the end",
  /margin-inline-start:\s*auto/.test(decls(rules, ".table-stack tr > :last-child:not(:first-child)", AT)),
);
check(
  "a cell with data-label shows that label",
  /content:\s*attr\(data-label\)/.test(decls(rules, ".table-stack :is(td, th)[data-label]::before", AT)),
);
check(
  "the footer is set off from the last row with a token rule",
  /border-top:[^;]*var\(--color-base-300\)/.test(decls(rules, ".table-stack > tfoot", AT)),
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
