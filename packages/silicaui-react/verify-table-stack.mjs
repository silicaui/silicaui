/**
 * Probe: `<Table stack>` maps to the plugin's `table-stack` classes.
 *
 * A list opts into stacking with one prop, so the prop is the whole contract:
 * `stack` is `table-stack`, `stack="lg"` is `table-stack-lg`, and the names
 * the React layer accepts must be exactly the ones the CSS plugin emits. A
 * breakpoint the plugin does not ship would type-check and then render as an
 * ordinary table, which is the very overflow the prop exists to fix, so the
 * list is compared against the plugin's own `TABLE_STACK_BREAKPOINTS` rather
 * than restated here.
 *
 * It also holds the wrapper to the class the plugin ships (`table-scroll`), not
 * an inline style: the wrapper is the stacked table's query container, and it
 * is what a consumer's `wrapperClassName` lands on.
 *
 * Rendered markup only, no jsdom needed.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-table-stack.mjs
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as silica from "./dist/index.js";
import { TABLE_STACK_BREAKPOINTS } from "../silicaui/src/components/table.js";

const { Table, SilicaProvider } = silica;
const REACT_BREAKPOINTS = silica.TABLE_STACK_BREAKPOINTS;
const h = React.createElement;
let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) failures++;
}

const render = (props, prefix) => {
  const table = h(Table, props, h("tbody", null, h("tr", null, h("td", null, "Ada"))));
  return renderToStaticMarkup(prefix ? h(SilicaProvider, { prefix }, table) : table);
};
/** The class tokens on the first element whose tag is `tag`. */
const classesOf = (markup, tag) => {
  const m = new RegExp(`<${tag}\\b[^>]*\\bclass="([^"]*)"`).exec(markup);
  return m ? m[1].split(/\s+/) : [];
};

console.log("Table stack prop");

{
  const m = render({ stack: true });
  const cls = classesOf(m, "table");
  check("stack puts table-stack on the <table>", cls.includes("table-stack"), m);
  check(
    "stack adds no breakpoint class of its own",
    !cls.some((c) => c.startsWith("table-stack-")),
    cls.join(" "),
  );
}

for (const bp of Object.keys(TABLE_STACK_BREAKPOINTS)) {
  const cls = classesOf(render({ stack: bp }), "table");
  check(
    `stack="${bp}" puts table-stack-${bp} on the <table>, alone`,
    cls.includes(`table-stack-${bp}`) && !cls.includes("table-stack"),
    cls.join(" "),
  );
}

for (const props of [{}, { stack: false }]) {
  const cls = classesOf(render(props), "table");
  check(
    `${JSON.stringify(props)} leaves an ordinary table`,
    cls.includes("table") && !cls.some((c) => c.startsWith("table-stack")),
    cls.join(" "),
  );
}

{
  const cls = classesOf(render({ stack: true, zebra: true, size: "sm" }), "table");
  check(
    "stack composes with zebra and size",
    ["table", "table-stack", "table-zebra", "table-sm"].every((c) => cls.includes(c)),
    cls.join(" "),
  );
}

check(
  "the React breakpoints are exactly the plugin's",
  JSON.stringify(REACT_BREAKPOINTS) === JSON.stringify(Object.keys(TABLE_STACK_BREAKPOINTS)),
  `react ${JSON.stringify(REACT_BREAKPOINTS)} vs plugin ${JSON.stringify(Object.keys(TABLE_STACK_BREAKPOINTS))}`,
);

console.log("\nTable wrapper");

{
  const m = render({ stack: true, wrapperClassName: "rounded-box" });
  const wrap = classesOf(m, "div");
  check("the wrapper carries table-scroll", wrap.includes("table-scroll"), m);
  check("the wrapper keeps the consumer's wrapperClassName", wrap.includes("rounded-box"), m);
  check("the wrapper has no inline style", !/<div[^>]*\sstyle="/.test(m), m);
}

console.log("\nTable under a prefix");

{
  const m = render({ stack: "lg" }, "sx-");
  check("the stack class is prefixed", classesOf(m, "table").includes("sx-table-stack-lg"), m);
  check("the wrapper class is prefixed", classesOf(m, "div").includes("sx-table-scroll"), m);
  check("the prop never reaches the DOM as an attribute", !/\sstack=/.test(m), m);
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\n<Table stack> maps to the plugin's stack classes.");
