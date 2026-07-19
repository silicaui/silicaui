// Regression probe for the 2026-07-18 accessibility hardening pass (audit:
// keyboard/focus/ARIA across the vanilla runtime — see docs/csp-compatibility.md's
// sibling effort). Each section locks one fixed gap so it can't silently regress.
// Run against built output:
//   pnpm --filter @wizeworks/silicaui-behaviors build && node verify-a11y.mjs
import { JSDOM } from "jsdom";
import { hydrate } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
function section(name) {
  console.log(name);
}

function mount(html) {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const { window } = dom;
  for (const k of [
    "document",
    "window",
    "Node",
    "Event",
    "CustomEvent",
    "KeyboardEvent",
    "FocusEvent",
    "FormData",
    "HTMLElement",
    "HTMLFormElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "HTMLButtonElement",
  ]) {
    globalThis[k] = window[k];
  }
  return { doc: window.document, win: window };
}

const key = (win, el, k) =>
  el.dispatchEvent(new win.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

// ── hydrate must never steal focus (toggle-group / selection-list) ──────────
{
  section("hydrate focus discipline");
  const { doc } = mount(`
    <input id="before" />
    <div data-sui-behavior="toggle-group">
      <button type="button" data-sui-part="item" aria-pressed="false">A</button>
      <button type="button" data-sui-part="item" aria-pressed="true">B</button>
    </div>
    <div data-sui-behavior="selection-list" role="listbox">
      <button type="button" data-sui-part="item" role="option" aria-selected="false">X</button>
      <button type="button" data-sui-part="item" role="option" aria-selected="true">Y</button>
    </div>`);
  doc.getElementById("before").focus();
  const dispose = hydrate(doc);
  check("focus stays where the user had it", doc.activeElement === doc.getElementById("before"));
  const tg = doc.querySelectorAll('[data-sui-behavior="toggle-group"] [data-sui-part="item"]');
  check("toggle-group: pressed item seeds tabindex 0", tg[1].tabIndex === 0 && tg[0].tabIndex === -1);
  const sl = doc.querySelectorAll('[data-sui-behavior="selection-list"] [data-sui-part="item"]');
  check("selection-list: selected item seeds tabindex 0", sl[1].tabIndex === 0 && sl[0].tabIndex === -1);
  dispose();
}

// ── rating keeps aria-checked in sync with the committed value ──────────────
{
  section("rating ARIA state");
  const { doc } = mount(`
    <div data-sui-behavior="rating">
      ${'<button type="button" data-sui-part="item" role="radio" aria-checked="false" data-filled="false"></button>'.repeat(5)}
    </div>`);
  const dispose = hydrate(doc);
  const stars = doc.querySelectorAll('[data-sui-part="item"]');
  stars[2].click();
  check("clicked star is aria-checked", stars[2].getAttribute("aria-checked") === "true");
  check("other stars are not", stars[4].getAttribute("aria-checked") === "false");
  dispose();
}

// ── wizard conveys the active step via aria-current ─────────────────────────
{
  section("wizard aria-current");
  const { doc } = mount(`
    <div data-sui-behavior="wizard">
      <button type="button" data-sui-part="step">1</button>
      <button type="button" data-sui-part="step">2</button>
      <div data-sui-part="panel">one</div>
      <div data-sui-part="panel" hidden>two</div>
      <button type="button" data-sui-part="next">Next</button>
    </div>`);
  const dispose = hydrate(doc);
  const steps = doc.querySelectorAll('[data-sui-part="step"]');
  check("step 1 starts aria-current=step", steps[0].getAttribute("aria-current") === "step");
  doc.querySelector('[data-sui-part="next"]').click();
  check("advancing moves aria-current", steps[1].getAttribute("aria-current") === "step" && !steps[0].hasAttribute("aria-current"));
  dispose();
}

// ── menu closes on Tab (APG) ────────────────────────────────────────────────
{
  section("menu Tab-to-close");
  const { doc, win } = mount(`
    <div data-sui-behavior="menu">
      <button type="button" data-sui-part="trigger">Open</button>
      <div data-sui-part="panel" role="menu" hidden>
        <button type="button" data-sui-part="item" role="menuitem">One</button>
      </div>
    </div>`);
  const dispose = hydrate(doc);
  const root = doc.querySelector('[data-sui-behavior="menu"]');
  doc.querySelector('[data-sui-part="trigger"]').click();
  const panel = doc.querySelector('[data-sui-part="panel"]');
  check("click opens", !panel.hasAttribute("hidden"));
  key(win, root, "Tab");
  check("Tab closes", panel.hasAttribute("hidden"));
  dispose();
}

// ── modal isolates the background while open ────────────────────────────────
{
  section("modal background isolation");
  const { doc, win } = mount(`
    <main id="rest"><button type="button">outside</button></main>
    <div data-sui-behavior="modal">
      <button type="button" data-sui-part="trigger">Open</button>
      <div data-sui-part="backdrop" hidden></div>
      <div data-sui-part="panel" role="dialog" aria-modal="true" hidden>
        <button type="button" data-sui-part="close">Close</button>
      </div>
    </div>`);
  const dispose = hydrate(doc);
  const rest = doc.getElementById("rest");
  doc.querySelector('[data-sui-part="trigger"]').click();
  check("body scroll locked", doc.body.style.overflow === "hidden");
  check("background subtree inert", rest.inert === true);
  key(win, doc.querySelector('[data-sui-behavior="modal"]'), "Escape");
  check("close restores scroll", doc.body.style.overflow === "");
  check("close restores inert", rest.inert === false);
  dispose();
}

// ── combobox announces the highlighted option ───────────────────────────────
{
  section("combobox activedescendant");
  const { doc, win } = mount(`
    <div data-sui-behavior="combobox">
      <input data-sui-part="input" role="combobox" aria-expanded="false" />
      <div data-sui-part="panel" role="listbox" hidden>
        <button type="button" data-sui-part="item" role="option">Alpha</button>
        <button type="button" data-sui-part="item" role="option">Beta</button>
      </div>
    </div>`);
  const dispose = hydrate(doc);
  const input = doc.querySelector('[data-sui-part="input"]');
  check("input declares aria-autocomplete=list", input.getAttribute("aria-autocomplete") === "list");
  check("input controls the generated panel id", !!input.getAttribute("aria-controls"));
  key(win, input, "ArrowDown"); // opens
  key(win, input, "ArrowDown"); // highlights first
  const first = doc.querySelector('[data-sui-part="item"]');
  check("highlight sets activedescendant to a real id", !!first.id && input.getAttribute("aria-activedescendant") === first.id);
  dispose();
}

// ── tooltip is keyboard-reachable and described ─────────────────────────────
{
  section("tooltip keyboard access");
  const { doc, win } = mount(`
    <div data-sui-behavior="popover" data-sui-behavior-params='{"trigger":"hover"}'>
      <span data-sui-part="trigger">?</span>
      <div data-sui-part="panel" role="tooltip" hidden>Help text</div>
    </div>`);
  const dispose = hydrate(doc);
  const trigger = doc.querySelector('[data-sui-part="trigger"]');
  const panel = doc.querySelector('[data-sui-part="panel"]');
  check("non-focusable trigger becomes a tab stop", trigger.getAttribute("tabindex") === "0");
  check("trigger is described by the tooltip", trigger.getAttribute("aria-describedby") === panel.id && !!panel.id);
  trigger.dispatchEvent(new win.FocusEvent("focusin", { bubbles: true }));
  check("focus opens the tooltip", !panel.hasAttribute("hidden"));
  dispose();
}

// ── overflow-list is a real disclosure ──────────────────────────────────────
{
  section("overflow-list disclosure semantics");
  const { doc, win } = mount(`
    <div data-sui-behavior="overflow-list" data-sui-behavior-params='{"maxVisible":1}'>
      <span data-sui-part="item">a</span><span data-sui-part="item">b</span><span data-sui-part="item">c</span>
      <button type="button" data-sui-part="trigger" aria-haspopup="true" hidden></button>
      <div data-sui-part="panel" hidden></div>
    </div>`);
  const dispose = hydrate(doc);
  const trigger = doc.querySelector('[data-sui-part="trigger"]');
  const panel = doc.querySelector('[data-sui-part="panel"]');
  check("trigger has a real accessible name", /more item/.test(trigger.getAttribute("aria-label") ?? ""));
  check("starts aria-expanded=false", trigger.getAttribute("aria-expanded") === "false");
  trigger.click();
  check("open reflects aria-expanded=true", trigger.getAttribute("aria-expanded") === "true" && !panel.hasAttribute("hidden"));
  key(win, doc.querySelector('[data-sui-behavior="overflow-list"]'), "Escape");
  check("Escape closes", panel.hasAttribute("hidden") && trigger.getAttribute("aria-expanded") === "false");
  dispose();
}

// ── form announces async outcomes ───────────────────────────────────────────
{
  section("form live region");
  const { doc } = mount(`
    <form data-sui-behavior="form" data-sui-action="subscribe">
      <input name="email" type="email" required value="a@b.com" />
      <button type="submit">Send</button>
    </form>`);
  const dispose = hydrate(doc, { onAction: () => {} });
  const form = doc.querySelector("form");
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  const live = form.querySelector('[role="status"]');
  check("a role=status region exists", !!live);
  check("success is announced", live?.textContent === "Submitted.");
  dispose();
}

// ── carousel: hidden slides are inert, dots use present-or-absent current ───
{
  section("carousel inert slides");
  const { doc } = mount(`
    <div data-sui-behavior="carousel">
      <div data-sui-part="track">
        <div data-sui-part="slide"><a href="/x">link</a></div>
        <div data-sui-part="slide"><a href="/y">link</a></div>
      </div>
      <button type="button" data-sui-part="dot" aria-label="Go to slide 1"></button>
      <button type="button" data-sui-part="dot" aria-label="Go to slide 2"></button>
    </div>`);
  const dispose = hydrate(doc);
  const slides = doc.querySelectorAll('[data-sui-part="slide"]');
  const dots = doc.querySelectorAll('[data-sui-part="dot"]');
  check("off-screen slide is inert", slides[1].inert === true && slides[0].inert === false);
  check("only the active dot carries aria-current", dots[0].getAttribute("aria-current") === "true" && !dots[1].hasAttribute("aria-current"));
  dispose();
}

// ── calendar: honest role + fully-named day cells ───────────────────────────
{
  section("calendar day semantics");
  const { doc } = mount(`
    <div data-sui-behavior="calendar" data-sui-behavior-params='{"defaultValue":"2026-07-15"}'>
      <div data-sui-part="title"></div>
      <div data-sui-part="grid" role="grid" class="calendar-grid"></div>
    </div>`);
  const dispose = hydrate(doc);
  const grid = doc.querySelector('[data-sui-part="grid"]');
  check("grid role downgraded to labeled group", grid.getAttribute("role") === "group" && !!grid.getAttribute("aria-label"));
  const selected = grid.querySelector('[data-date="2026-07-15"]');
  check("selected day is aria-pressed", selected?.getAttribute("aria-pressed") === "true");
  check("day cells carry full-date names", (selected?.getAttribute("aria-label") ?? "").length > 8);
  dispose();
}

// ── dismiss parks focus before removing the widget ──────────────────────────
{
  section("dismiss focus parking");
  const { doc } = mount(`
    <div data-sui-behavior="dismiss" role="alert">
      Saved!
      <button type="button" data-sui-part="trigger" aria-label="Dismiss">×</button>
    </div>
    <button type="button" id="after">next thing</button>`);
  const dispose = hydrate(doc);
  const trigger = doc.querySelector('[data-sui-part="trigger"]');
  trigger.focus();
  trigger.click();
  check("root removed", !doc.querySelector('[data-sui-behavior="dismiss"]'));
  check("focus parked on the next focusable", doc.activeElement === doc.getElementById("after"));
  dispose();
}

console.log("");
if (failures) {
  console.error(`❌ a11y: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("✅ a11y: all runtime accessibility contracts hold");
