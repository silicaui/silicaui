/**
 * Behavioral probe for `Combobox`'s `filter` prop.
 *
 * A Combobox matched only what its label said. A sparx owner looking for the
 * rule "they paid" typed "paid" into a picker whose item is labeled
 * "Order · Payment" and got "No results", though "Paid" is one of that detail's
 * values. `filter` lets the host decide what an item answers to.
 *
 * Two cases:
 *   1. With a `filter` that also reads the item's values, "paid" finds
 *      "Order · Payment" and nothing else.
 *   2. With no `filter`, the default still matches on the label: "book" finds
 *      "Booking · Status".
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-combobox-filter.mjs
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  pretendToBeVisual: true,
  url: "http://localhost/",
});
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key.startsWith("_") || key in globalThis) continue;
  globalThis[key] = dom.window[key];
}
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import("react")).default;
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { Combobox } = await import("./dist/index.js");

const h = React.createElement;
let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) failures++;
}

const ITEMS = [
  { value: "order.paymentStatus", label: "Order · Payment", words: "not paid part paid paid refunded" },
  { value: "booking.status", label: "Booking · Status", words: "awaiting confirmation confirmed canceled" },
  { value: "customer.email", label: "Customer · Email address", words: "" },
];

const byLabelAndWords = (item, query) => {
  const q = query.trim().toLowerCase();
  return `${item.label} ${item.words}`.toLowerCase().includes(q);
};

/** Mount a Combobox, type `query` into it, and return the option texts it shows. */
async function shown(query, props = {}) {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(h(Combobox, { items: ITEMS, "aria-label": "Detail", value: null, ...props })));
  const input = container.querySelector("input");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  // Open it the way a person does, from its arrow, then type.
  const trigger = container.querySelector('button[aria-label="Open"]');
  await act(async () => {
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      trigger.dispatchEvent(new window.MouseEvent(type, { bubbles: true, button: 0 }));
    }
  });
  await act(async () => {
    input.focus();
    setter.call(input, query);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await act(async () => new Promise((r) => setTimeout(r, 50)));
  const options = [...document.querySelectorAll('[role="option"]')].map((el) => el.textContent.trim());
  await act(async () => root.unmount());
  return options;
}

console.log("Combobox filter");

{
  const options = await shown("paid", { filter: byLabelAndWords });
  check(
    'a host filter finds "Order · Payment" for "paid"',
    options.length === 1 && options[0].includes("Order · Payment"),
    `shown: ${JSON.stringify(options)}`
  );
}

{
  const options = await shown("book");
  check(
    'with no filter, "book" still finds "Booking · Status" by its label',
    options.length === 1 && options[0].includes("Booking · Status"),
    `shown: ${JSON.stringify(options)}`
  );
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll checks passed.");
