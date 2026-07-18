/**
 * Behavioral probe for the `render` prop's composition and its RSC failure
 * modes. Runs against the built `dist/`, so it also proves the bundle's
 * "use client" banner and tree-shaking didn't drop the guards.
 *
 *   pnpm --filter @wizeworks/silicaui-react verify
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Badge, ClickableCard } from "./dist/index.js";
import { mergeProps } from "./dist/server.js";

const h = React.createElement;
let failed = 0;

function check(name, fn) {
  try {
    const errors = [];
    const real = console.error;
    console.error = (msg) => errors.push(String(msg));
    let markup;
    try {
      markup = fn();
    } finally {
      console.error = real;
    }
    const problem = assert(name, markup, errors);
    if (problem) {
      failed++;
      console.log(`  ✗ ${name}\n      ${problem}`);
    } else {
      console.log(`  ✓ ${name}`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n      threw: ${e.message.split("\n")[0]}`);
  }
}

// Per-check expectations, kept beside the check list for readability.
const expectations = new Map();
function assert(name, markup, errors) {
  return expectations.get(name)(markup, errors);
}
function expect(name, fn, verdict) {
  expectations.set(name, verdict);
  check(name, fn);
}

const has = (m, s) => (m.includes(s) ? null : `expected ${s} in ${m}`);
const quiet = (errors) =>
  errors.length ? `unexpected console.error: ${errors[0].slice(0, 80)}` : null;

/**
 * An element that survived RSC serialization but lost its props, and one whose
 * `type` didn't survive at all. `isValidElement` passes for both — the second
 * is what throws React's opaque "Element type is invalid… got: undefined".
 */
function propsless(el) {
  const copy = { ...el };
  Object.defineProperty(copy, "props", { get: () => undefined });
  return copy;
}
const typeless = (el) => ({ ...el, type: undefined });

console.log("\n@wizeworks/silicaui-react — render prop\n");

expect(
  "Button render={<a>} composes into an anchor",
  () => renderToStaticMarkup(h(Button, { render: h("a", { href: "/docs" }) }, "Docs")),
  (m, e) => has(m, '<a href="/docs" class="btn">Docs</a>') || quiet(e),
);

expect(
  "Button without render stays a <button>",
  () => renderToStaticMarkup(h(Button, null, "Click")),
  (m, e) => has(m, "<button") || quiet(e),
);

expect(
  "Badge render={<a>} composes into an anchor",
  () => renderToStaticMarkup(h(Badge, { render: h("a", { href: "/t" }) }, "New")),
  (m, e) => has(m, '<a href="/t"') || quiet(e),
);

expect(
  "ClickableCard render={<a>} composes into an anchor",
  () => renderToStaticMarkup(h(ClickableCard, { render: h("a", { href: "/p" }) }, "Card")),
  (m, e) => has(m, '<a href="/p"') || quiet(e),
);

expect(
  "ours+theirs className both survive the merge",
  () =>
    renderToStaticMarkup(
      h(Button, { color: "brand", render: h("a", { href: "/d", className: "mine" }) }, "D"),
    ),
  (m) => has(m, "btn") || has(m, "mine"),
);

expect(
  "unreadable props: still composes, warns, loses href",
  () =>
    renderToStaticMarkup(h(Button, { render: propsless(h("a", { href: "/docs" })) }, "Docs")),
  (m, e) =>
    has(m, "<a") ||
    (m.includes("href") ? "href should be gone when props are unreadable" : null) ||
    (e.some((x) => x.includes("[silicaui]")) ? null : "expected a [silicaui] console.error"),
);

expect(
  "undefined type: falls back to <button> instead of throwing",
  () =>
    renderToStaticMarkup(h(Button, { render: typeless(h("a", { href: "/docs" })) }, "Docs")),
  (m, e) =>
    has(m, "<button") ||
    (e.some((x) => x.includes("[silicaui]")) ? null : "expected a [silicaui] console.error"),
);

expect(
  "Badge undefined type: falls back to <span>",
  () => renderToStaticMarkup(h(Badge, { render: typeless(h("a", {})) }, "New")),
  (m) => has(m, "<span"),
);

expect(
  "ClickableCard undefined type: falls back to <button>",
  () => renderToStaticMarkup(h(ClickableCard, { render: typeless(h("a", {})) }, "Card")),
  (m) => has(m, "<button"),
);

expect(
  "non-element render (serialized to a plain object) falls back",
  () => renderToStaticMarkup(h(Button, { render: { href: "/docs" } }, "Docs")),
  (m, e) =>
    has(m, "<button") ||
    (e.some((x) => x.includes("[silicaui]")) ? null : "expected a [silicaui] console.error"),
);

expect(
  "public mergeProps(ours) with no second arg stays silent",
  () => {
    mergeProps({ className: "btn" });
    return "";
  },
  (_m, e) => (e.length ? `should not warn, got: ${e[0].slice(0, 60)}` : null),
);

console.log(
  failed ? `\n❌ ${failed} check(s) failed\n` : "\n✅ all render-prop checks passed\n",
);
process.exit(failed ? 1 : 0);
