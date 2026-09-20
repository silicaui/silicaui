/**
 * A pasted date must mean what it says, or be refused.
 *
 * FOUND by P03 (docs/personas/issues/048). Marlene runs a dance studio; half her
 * site is term dates, and she keeps them in a spreadsheet. A spreadsheet exports
 * `2026-12-18`. Pasted into a `DateInput` in an en-US browser, that field read
 * **10/12/2186**, with nothing in the console and no visible error.
 *
 * Two causes, both silent:
 *
 *  1. The digit groups were mapped POSITIONALLY by the locale's display order.
 *     ISO 8601 is year-first in every locale, so en-US read 2026 as the month.
 *  2. "Did a Date construct" was used as the validity test. It is not one —
 *     `new Date(2018, 2025, 12)` is a perfectly good Date in the year 2186,
 *     because JavaScript rolls overflowing months forward. That is why
 *     `99/99/9999` was accepted as 06/07/10007.
 *
 * The second is why this is a probe and not a code comment: every wrong answer
 * typechecks, and each one looks like a date.
 *
 * It also pins the timezone trap. `new Date("2026-12-18")` is defined as UTC
 * midnight, so anywhere west of Greenwich it reads back as the 17th — the term
 * that ends "Friday 18 December" would publish as Thursday the 17th. CI runs in
 * UTC and this was written on a UTC-7 machine, so a naive implementation passes
 * in one place and fails in the other. The assertion below is the invariant, not
 * the local answer.
 *
 * Driven through the real component, not the parser, because what a customer
 * touches is a field: the paste is a real `ClipboardEvent` and the answer is read
 * off the rendered segments.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-date-paste.mjs
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
const { DateInput } = await import("./dist/index.js");

const h = React.createElement;
let failures = 0;
const check = (name, cond, detail) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

/** Mount a DateInput for `locale`, paste `text`, and read the segments back. */
function pasteInto(locale, text) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(h(DateInput, { locale, defaultValue: new Date(2026, 6, 8), "aria-label": "Date" }));
  });
  const field = host.querySelector(".segment-field");
  // JSDOM has no `DataTransfer`; React's paste handler only ever calls
  // `clipboardData.getData`, so the smallest honest stand-in is that one method.
  const ev = new dom.window.Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "clipboardData", {
    value: { getData: (type) => (type === "text" || type === "text/plain" ? text : "") },
  });
  act(() => {
    field.dispatchEvent(ev);
  });
  const read = {};
  for (const seg of host.querySelectorAll(".segment-field-segment")) {
    read[seg.getAttribute("aria-label")] = seg.textContent.trim();
  }
  act(() => root.unmount());
  host.remove();
  if (read.Year == null) return null;
  return `${read.Year}-${read.Month}-${read.Day}`;
}

const UNCHANGED = "2026-07-08"; // what the field was seeded with; a refusal leaves it

// ── ISO 8601 means the same thing in every locale ─────────────────────────────
// Marlene's real term dates, straight out of a spreadsheet.
const ISO = [
  ["2026-12-18", "2026-12-18"], // Autumn term ends, Friday
  ["2026-10-26", "2026-10-26"], // half term starts, Monday
  ["2026-10-30", "2026-10-30"], // half term ends, Friday
  ["2027-01-05", "2027-01-05"], // Spring term starts, Tuesday
  ["2027-04-01", "2027-04-01"], // Spring term ends, Thursday
  ["2028-02-29", "2028-02-29"], // a leap day
  ["2026-01-01", "2026-01-01"],
  ["2026-12-31", "2026-12-31"],
  ["2026-12-18T23:59:00", "2026-12-18"], // a minute before midnight — the day must not roll
];
for (const locale of ["en-US", "en-GB", "de-DE", "ja-JP"]) {
  for (const [text, want] of ISO) {
    const got = pasteInto(locale, text);
    check(`${locale}  paste ${text} → ${want}`, got === want, `field read ${got}`);
  }
}

// ── the locale's own display order still works ────────────────────────────────
check("en-US  12/18/2026 → 2026-12-18", pasteInto("en-US", "12/18/2026") === "2026-12-18", pasteInto("en-US", "12/18/2026"));
check("en-GB  18/12/2026 → 2026-12-18", pasteInto("en-GB", "18/12/2026") === "2026-12-18", pasteInto("en-GB", "18/12/2026"));
check("de-DE  18.12.2026 → 2026-12-18", pasteInto("de-DE", "18.12.2026") === "2026-12-18", pasteInto("de-DE", "18.12.2026"));

// ── prose, which is how a person writes it ────────────────────────────────────
for (const text of ["18 December 2026", "December 18, 2026", "Friday 18 December 2026"]) {
  const got = pasteInto("en-US", text);
  check(`prose ${JSON.stringify(text)} → 2026-12-18`, got === "2026-12-18", `field read ${got}`);
}

// ── nonsense is REFUSED, not rolled over ──────────────────────────────────────
// Every one of these used to be accepted, because a Date constructed from them.
for (const text of [
  "99/99/9999",
  "13/45/2026", // month 13, day 45 in en-US order
  "2026-13-01", // month 13, ISO
  "2026-00-10", // month 0
  "2026-02-30", // February never has 30 days
  "2027-02-29", // 2027 is NOT a leap year
  "0000-01-01", // year 0
  "not a date at all",
]) {
  const got = pasteInto("en-US", text);
  check(`refuses ${JSON.stringify(text)} (field unchanged)`, got === UNCHANGED, `field read ${got}`);
}

// ── the day must not shift, wherever this runs ────────────────────────────────
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const offset = -new Date("2026-12-18T12:00:00").getTimezoneOffset() / 60;
console.log(`\n  running in ${tz} (UTC${offset >= 0 ? "+" : ""}${offset})`);
check(
  "2026-12-18 is the 18th whatever the timezone",
  pasteInto("en-US", "2026-12-18") === "2026-12-18",
  `field read ${pasteInto("en-US", "2026-12-18")} in ${tz}`,
);

if (failures) {
  console.log(`\n✗ ${failures} date-paste check(s) failed`);
  process.exit(1);
}
console.log("\n✅ a pasted date means what it says, or is refused");
