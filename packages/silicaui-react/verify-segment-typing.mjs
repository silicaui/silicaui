/**
 * Behavioral probe for the segmented fields: `DateInput`, `TimeInput`,
 * `DateTimeInput`.
 *
 * These are typeable fields — the whole point of them over a calendar popover
 * is that a person can put their hands on the keyboard and type the date. That
 * claim was false for every CONTROLLED empty field, in every consuming app, for
 * as long as the components have existed.
 *
 * `onValueChange` only fires with a WHOLE value, which is the right contract: a
 * parent must never be handed the 4th of no month. But it means the keystrokes
 * before the last one are not representable in the parent — and the components
 * kept the cells only for the uncontrolled case, deriving them from `value`
 * otherwise. So each digit reported `null`, the parent's `value` stayed `null`,
 * and the cells were reset to their placeholders before the next digit
 * arrived. An empty controlled field could never reach a complete date at all;
 * only pasting one worked. A field that started full was typeable, which is
 * exactly why this survived: the fields people looked at were seeded with
 * today's date, and the ones that start empty are on the screens nobody had
 * typed a date into yet.
 *
 * FOUND by trying to put an expected arrival date on a new purchase order and
 * watching the month cell stay "mm" while the cursor moved on to the day.
 *
 * WHY THIS IS A PROBE AND NOT A REASONED ARGUMENT: the bug lives in the
 * interaction between a `useState`, an effect and a parent's own state, and
 * every part of it typechecks. Only running the keystrokes shows it.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-segment-typing.mjs
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
const { DateInput, TimeInput, DateTimeInput } = await import("./dist/index.js");

const h = React.createElement;
let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) failures++;
}

/**
 * A parent that holds the value, like every real call site. `latest` is what
 * the parent last heard, so a check can tell "the cells look right" apart from
 * "the parent was actually told".
 */
async function mountControlled(Comp, initial, props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const state = { latest: initial, changes: 0 };
  let setOutside;

  function Host() {
    const [v, setV] = React.useState(initial);
    setOutside = setV;
    return h(Comp, {
      value: v,
      onValueChange: (next) => {
        state.latest = next;
        state.changes += 1;
        setV(next);
      },
      ...props,
    });
  }

  await act(async () => root.render(h(Host)));
  return {
    state,
    container,
    segments: () => {
      const map = {};
      for (const el of container.querySelectorAll('[role="spinbutton"]')) {
        map[el.getAttribute("aria-label")] = el;
      }
      return map;
    },
    reads: () =>
      [...container.querySelectorAll('[role="spinbutton"]')].map((el) => el.textContent).join("|"),
    setOutside: (v) => act(async () => setOutside(v)),
    unmount: () => act(async () => root.unmount()),
  };
}

/** Mount without a `value` prop at all — the uncontrolled path. */
async function mountUncontrolled(Comp, props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const state = { latest: undefined, changes: 0 };
  await act(async () =>
    root.render(
      h(Comp, {
        onValueChange: (next) => {
          state.latest = next;
          state.changes += 1;
        },
        ...props,
      }),
    ),
  );
  return {
    state,
    container,
    segments: () => {
      const map = {};
      for (const el of container.querySelectorAll('[role="spinbutton"]')) {
        map[el.getAttribute("aria-label")] = el;
      }
      return map;
    },
    reads: () =>
      [...container.querySelectorAll('[role="spinbutton"]')].map((el) => el.textContent).join("|"),
    unmount: () => act(async () => root.unmount()),
  };
}

const keydown = (el, key) =>
  act(async () =>
    el.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );

/**
 * Type a run of keys starting in one cell, letting the field's own auto-advance
 * carry the focus. Focus is taken ONCE: each segment clears its digit buffer on
 * focus, so re-focusing between keystrokes would hide a broken buffer.
 */
async function typeFrom(startEl, keys) {
  await act(async () => startEl.focus());
  for (const key of keys) {
    await keydown(document.activeElement, key);
  }
}

console.log("Segmented field typing");

// ── 1. THE ONE. An empty controlled date field can be filled by typing ───────
{
  const t = await mountControlled(DateInput, null, { locale: "en-US" });
  await typeFrom(t.segments().Month, ["0", "9", "0", "4", "2", "0", "2", "6"]);
  check(
    "empty controlled DateInput: typing 09/04/2026 fills every cell",
    t.reads() === "09|04|2026",
    `cells read ${t.reads()}, expected 09|04|2026`,
  );
  const d = t.state.latest;
  check(
    "…and the parent is told the whole date, once it is whole",
    d instanceof Date && d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 4,
    `parent holds ${d === null ? "null" : String(d)}`,
  );
  await t.unmount();
}

// ── 2. Up/Down on an empty controlled field ─────────────────────────────────
{
  const t = await mountControlled(DateInput, null, { locale: "en-US" });
  const month = t.segments().Month;
  await act(async () => month.focus());
  await keydown(month, "ArrowUp");
  await keydown(month, "ArrowUp");
  check(
    "empty controlled DateInput: ArrowUp steps the month from empty",
    t.reads().startsWith("02|"),
    `cells read ${t.reads()}, expected to start 02|`,
  );
  await t.unmount();
}

// ── 3. Backspace clears the cell it is in, not the whole field ──────────────
//
// One Backspace in the month used to empty the day and the year with it,
// because clearing the month made the composed date `null` and the effect
// wrote the placeholders back over all three.
{
  const t = await mountControlled(DateInput, new Date(2026, 8, 18), {
    locale: "en-US",
  });
  check("populated DateInput renders its value", t.reads() === "09|18|2026", t.reads());
  const month = t.segments().Month;
  await act(async () => month.focus());
  await keydown(month, "Backspace");
  check(
    "Backspace in the month leaves the day and the year alone",
    t.reads() === "mm|18|2026",
    `cells read ${t.reads()}, expected mm|18|2026`,
  );
  check("…and the parent is told the field is now incomplete", t.state.latest === null);
  await keydown(document.activeElement, "7");
  check(
    "…and the month can be typed straight back in",
    t.reads() === "07|18|2026",
    `cells read ${t.reads()}, expected 07|18|2026`,
  );
  await t.unmount();
}

// ── 4. The parent still wins — a clamp is not a keystroke to be preserved ───
{
  const t = await mountControlled(DateInput, null, {
    locale: "en-US",
    min: new Date(2026, 8, 10),
  });
  await typeFrom(t.segments().Month, ["0", "9", "0", "4", "2", "0", "2", "6"]);
  check(
    "a date below `min` is clamped, and the cells follow the clamp",
    t.reads() === "09|10|2026",
    `cells read ${t.reads()}, expected 09|10|2026`,
  );
  await t.unmount();
}

// ── 5. …and an external change replaces what is on screen ───────────────────
{
  const t = await mountControlled(DateInput, new Date(2026, 8, 18), {
    locale: "en-US",
  });
  await t.setOutside(new Date(2027, 0, 2));
  check(
    "a value set from outside replaces the cells",
    t.reads() === "01|02|2027",
    `cells read ${t.reads()}, expected 01|02|2027`,
  );
  await t.setOutside(null);
  check(
    "…and clearing it from outside empties them",
    t.reads() === "mm|dd|yyyy",
    `cells read ${t.reads()}, expected mm|dd|yyyy`,
  );
  await t.unmount();
}

// ── 6. The uncontrolled path is unchanged ───────────────────────────────────
{
  const t = await mountUncontrolled(DateInput, { locale: "en-US" });
  await typeFrom(t.segments().Month, ["1", "2", "2", "5", "2", "0", "2", "6"]);
  check(
    "uncontrolled DateInput still fills by typing",
    t.reads() === "12|25|2026",
    `cells read ${t.reads()}, expected 12|25|2026`,
  );
  await t.unmount();
}

// ── 7. TimeInput, the same shape ────────────────────────────────────────────
{
  const t = await mountControlled(TimeInput, null, { hourCycle: 12 });
  await typeFrom(t.segments().hour, ["0", "2", "3", "0", "p"]);
  check(
    "empty controlled TimeInput: typing 02:30 PM fills every cell",
    t.reads() === "02|30|PM",
    `cells read ${t.reads()}, expected 02|30|PM`,
  );
  check(
    "…and the parent is told 14:30 in canonical 24h",
    t.state.latest?.hour === 14 && t.state.latest?.minute === 30,
    `parent holds ${JSON.stringify(t.state.latest)}`,
  );
  await t.unmount();
}

// ── 8. DateTimeInput — six cells, so five keystrokes have nowhere to go ─────
{
  const t = await mountControlled(DateTimeInput, null, {
    locale: "en-US",
    hourCycle: 24,
  });
  await typeFrom(t.segments().Month, ["0", "7", "0", "8", "2", "0", "2", "6", "1", "4", "3", "0"]);
  check(
    "empty controlled DateTimeInput: typing 07/08/2026 14:30 fills every cell",
    t.reads() === "07|08|2026|14|30",
    `cells read ${t.reads()}, expected 07|08|2026|14|30`,
  );
  const d = t.state.latest;
  check(
    "…and the parent is told the whole moment",
    d instanceof Date &&
      d.getFullYear() === 2026 &&
      d.getMonth() === 6 &&
      d.getDate() === 8 &&
      d.getHours() === 14 &&
      d.getMinutes() === 30,
    `parent holds ${d === null ? "null" : String(d)}`,
  );
  await t.unmount();
}

// ── 9. The parent hears nothing until the value is whole ────────────────────
//
// The other half of the contract: keeping partial cells must NOT start
// reporting partial values.
{
  const t = await mountControlled(DateInput, null, { locale: "en-US" });
  await typeFrom(t.segments().Month, ["0", "9", "0", "4"]);
  check(
    "a half-typed date is shown but never reported",
    t.reads() === "09|04|yyyy" && t.state.latest === null,
    `cells read ${t.reads()}, parent holds ${String(t.state.latest)}`,
  );
  await t.unmount();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
