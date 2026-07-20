// Runnable proof that the interactive composite BLOCKS hydrate correctly: we
// lower each real block (tabs / accordion / dropdown) with @wizeworks/silicaui-html's own
// toHtml — the exact markup a host ships — mount it in jsdom, hydrate, and drive
// the interaction. This proves the whole chain block → toHtml → runtime, not a
// hand-written stand-in. Run against built output of BOTH packages:
//   pnpm --filter @wizeworks/silicaui-html build && pnpm --filter @wizeworks/silicaui-behaviors build \
//     && node verify-interactive.mjs
import { JSDOM } from "jsdom";
import { hydrate } from "./dist/index.js";
import { toHtml } from "../silicaui-html/dist/index.js";
import { tabs, accordion, dropdown } from "../silicaui-html/dist/blocks/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

/** A fresh jsdom whose globals back the handlers' DOM/instanceof use. */
function mount(html) {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const { window } = dom;
  for (const k of [
    "document",
    "window",
    "Event",
    "CustomEvent",
    "KeyboardEvent",
    "MouseEvent",
    "Node",
    "Element",
    "HTMLElement",
    "HTMLButtonElement",
    "HTMLAnchorElement",
  ]) {
    globalThis[k] = window[k];
  }
  return window.document;
}

const hidden = (el) => el.hasAttribute("hidden");
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

// ── TABS: exclusive selection + arrow-key roving ─────────────────────────────
console.log("tabs — panels");
{
  const doc = mount(toHtml(tabs));
  const tabEls = [...doc.querySelectorAll('[data-sui-part="tab"]')];
  const panels = [...doc.querySelectorAll('[data-sui-part="panel"]')];
  check("authored: 3 tabs + 3 panels", tabEls.length === 3 && panels.length === 3);
  check("pre-hydrate: only the first panel is visible", !hidden(panels[0]) && hidden(panels[1]) && hidden(panels[2]));

  const dispose = hydrate(doc, {});
  check("hydrate: first tab is selected", tabEls[0].getAttribute("aria-selected") === "true");

  click(tabEls[1]);
  check("click tab 2: its panel shows, others hide", hidden(panels[0]) && !hidden(panels[1]) && hidden(panels[2]));
  check("click tab 2: aria-selected moves to tab 2", tabEls[1].getAttribute("aria-selected") === "true" && tabEls[0].getAttribute("aria-selected") === "false");

  key(tabEls[1], "ArrowRight");
  check("ArrowRight: selection advances to tab 3", !hidden(panels[2]) && tabEls[2].getAttribute("aria-selected") === "true");
  key(tabEls[2], "Home");
  check("Home: selection returns to tab 1", !hidden(panels[0]) && tabEls[0].getAttribute("aria-selected") === "true");
  dispose();
}

// ── ACCORDION: multi-open disclosure (independent toggles) ───────────────────
console.log("accordion — sections");
{
  const doc = mount(toHtml(accordion));
  const triggers = [...doc.querySelectorAll('[data-sui-part="trigger"]')];
  const panels = [...doc.querySelectorAll('[data-sui-part="panel"]')];
  check("authored: 3 trigger/panel pairs", triggers.length === 3 && panels.length === 3);

  const dispose = hydrate(doc, {});
  check("hydrate: first section open, rest closed", !hidden(panels[0]) && hidden(panels[1]) && hidden(panels[2]));
  check("hydrate: aria-expanded reflects state", triggers[0].getAttribute("aria-expanded") === "true" && triggers[1].getAttribute("aria-expanded") === "false");

  click(triggers[1]);
  check("open section 2: BOTH 1 and 2 open (multi-open)", !hidden(panels[0]) && !hidden(panels[1]));

  click(triggers[0]);
  check("toggle section 1 closed: 1 hides, 2 stays open", hidden(panels[0]) && !hidden(panels[1]));
  check("closed section reflects aria-expanded=false", triggers[0].getAttribute("aria-expanded") === "false");
  dispose();
}

// ── DROPDOWN: menu open/close via click, Escape, item, outside-click ─────────
console.log("dropdown — menu");
{
  const doc = mount(toHtml(dropdown));
  const trigger = doc.querySelector('[data-sui-part="trigger"]');
  const panel = doc.querySelector('[data-sui-part="panel"]');
  const items = [...doc.querySelectorAll('[data-sui-part="item"]')];
  check("authored: trigger + panel + 3 items", trigger && panel && items.length === 3);

  const dispose = hydrate(doc, {});
  check("hydrate: panel closed, aria wired", hidden(panel) && trigger.getAttribute("aria-haspopup") === "menu" && trigger.getAttribute("aria-expanded") === "false");

  click(trigger);
  check("click trigger: panel opens, aria-expanded=true", !hidden(panel) && trigger.getAttribute("aria-expanded") === "true");

  key(doc.querySelector('[data-sui-behavior="menu"]'), "Escape");
  check("Escape: panel closes", hidden(panel));

  click(trigger); // re-open
  click(items[0]); // choosing an item closes
  check("click item: panel closes", hidden(panel));

  click(trigger); // re-open
  click(doc.body); // outside-click
  check("outside click: panel closes", hidden(panel));
  dispose();
}

// ── PREVIEW MODE: disclosure/menu panels revealed for canvas-style editing ───
console.log("preview mode — collapsed panels revealed");
{
  const dd = mount(toHtml(dropdown));
  hydrate(dd, { preview: true });
  check("dropdown: panel revealed in preview", !hidden(dd.querySelector('[data-sui-part="panel"]')));

  const ac = mount(toHtml(accordion));
  hydrate(ac, { preview: true });
  const acPanels = [...ac.querySelectorAll('[data-sui-part="panel"]')];
  check("accordion: every panel revealed in preview", acPanels.every((p) => !hidden(p)));
}

// ── Alert dismissal: a feature that existed in React but NOT in static output ─
// The `dismiss` handler and the `.alert-close` CSS both shipped, while the
// -html macro emitted a bare <div role="alert"> — so `dismissible` was silently
// React-only. This walks the whole chain (schema → toHtml → hydrate → click)
// because a structural markup assertion alone would have passed before the fix
// too, as long as it only checked the button's presence.
console.log("alert — dismissible in static output");
{
  const node = {
    kind: "component",
    component: "Alert",
    class: "alert alert-warning",
    props: { text: "Heads up", dismissible: true },
  };
  const root = mount(toHtml(node));
  check("dismissible alert emits a close trigger", !!root.querySelector('[data-sui-part="trigger"]'));
  check("dismissible alert carries the behavior marker", !!root.querySelector('[data-sui-behavior="dismiss"]'));

  hydrate(root, {});
  click(root.querySelector('[data-sui-part="trigger"]'));
  check("clicking the close button removes the alert", !root.querySelector(".alert"));

  // A plain alert must stay inert — no stray button, no marker.
  const plain = mount(toHtml({ ...node, props: { text: "Heads up" } }));
  check("non-dismissible alert emits no close button", !plain.querySelector("button"));
  check("non-dismissible alert has no behavior marker", !plain.querySelector("[data-sui-behavior]"));
}

// ── ChatToolCalls: a composite that REUSES `disclosure` rather than inventing
// a BehaviorType. Reuse is only correct if it actually hydrates, so this drives
// the real toggle instead of asserting the marker is present.
console.log("chat tool calls — reuses the disclosure behavior");
{
  const node = {
    kind: "component",
    component: "ChatToolCalls",
    props: { label: "Called search_web(query)" },
    children: ["{ ok: true }"],
  };
  const doc = mount(toHtml(node));
  const trigger = doc.querySelector('[data-sui-part="trigger"]');
  const panel = doc.querySelector('[data-sui-part="panel"]');
  check("emits a trigger + panel", !!trigger && !!panel);
  check("collapsed before hydrate", hidden(panel));

  const dispose = hydrate(doc, {});
  click(trigger);
  check("click trigger: tool-call detail opens", !hidden(panel));
  check("aria-expanded reflects the open state", trigger.getAttribute("aria-expanded") === "true");
  click(trigger);
  check("click again: it closes", hidden(panel));
  dispose();

  // defaultOpen must survive the round trip, not just the initial render.
  const openDoc = mount(toHtml({ ...node, props: { ...node.props, defaultOpen: true } }));
  check("defaultOpen renders expanded", !hidden(openDoc.querySelector('[data-sui-part="panel"]')));
}

// ── Filter: single-select chips + reset, reusing `toggle-group` rather than
// adding a BehaviorType. The reset is the handler's optional `close` part, so
// the plain-toggle-group path must stay untouched — checked both ways below.
console.log("filter — chips reuse toggle-group, reset is an optional part");
{
  const node = {
    kind: "component",
    component: "Filter",
    props: {},
    children: [
      { kind: "component", component: "FilterItem", props: { value: "all", text: "All", selected: true } },
      { kind: "component", component: "FilterItem", props: { value: "gear", text: "Gear" } },
    ],
  };
  const doc = mount(toHtml(node));
  const chips = [...doc.querySelectorAll('[data-sui-part="item"]')];
  const reset = doc.querySelector('[data-sui-part="close"]');
  check("authored: 2 chips + a reset", chips.length === 2 && !!reset);

  const dispose = hydrate(doc, {});
  check("reset is visible while a chip is pressed", !hidden(reset));

  click(chips[1]);
  check("single-select: pressing one un-presses the other", chips[1].getAttribute("aria-pressed") === "true" && chips[0].getAttribute("aria-pressed") === "false");

  click(reset);
  check("reset clears every chip", chips.every((c) => c.getAttribute("aria-pressed") === "false"));
  check("reset hides itself once nothing is selected", hidden(reset));

  click(chips[0]);
  check("reset reappears when a chip is pressed again", !hidden(reset));
  dispose();

  // A plain toggle group has no `close` part — the reset code must no-op, not throw.
  const plain = mount(
    toHtml({
      kind: "element",
      tag: "div",
      behavior: { type: "toggle-group" },
      children: [
        { kind: "element", tag: "button", part: "item", attrs: { "aria-pressed": "false" }, children: ["A"] },
        { kind: "element", tag: "button", part: "item", attrs: { "aria-pressed": "false" }, children: ["B"] },
      ],
    }),
  );
  const d2 = hydrate(plain, {});
  const plainItems = [...plain.querySelectorAll('[data-sui-part="item"]')];
  click(plainItems[0]);
  check("plain toggle-group (no reset part) still presses", plainItems[0].getAttribute("aria-pressed") === "true");
  d2();
}

// ── Countdown: the one case where reuse was REJECTED. `counter` is a one-shot
// scroll-triggered tween; this is a recurring clock that stops at zero. These
// checks pin the behaviors that made them different, so a future "just reuse
// counter" refactor fails loudly rather than silently degrading.
console.log("countdown — live clock, distinct from `counter`");
{
  const mk = (props) => ({ kind: "component", component: "Countdown", props });

  // Far future: real formatting, days unpadded, others zero-padded.
  const doc = mount(toHtml(mk({ to: Date.now() + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000 })));
  const dispose = hydrate(doc, {});
  const val = (u) => doc.querySelector(`[data-unit="${u}"]`).textContent;
  check("days render unpadded", val("days") === "2");
  check("hours zero-pad to two digits", val("hours") === "03");
  check("minutes zero-pad", val("minutes") === "04");
  check("seconds render", /^0[45]$/.test(val("seconds")));
  check("not marked complete while time remains", !doc.querySelector("[data-complete]"));
  dispose();

  // Already elapsed: zeros, complete flag, and the event fires exactly once.
  const past = mount(toHtml(mk({ to: Date.now() - 5000 })));
  let completions = 0;
  past.addEventListener("sui:complete", () => completions++);
  const d2 = hydrate(past, {});
  check("elapsed countdown renders all zeros", [...past.querySelectorAll("[data-unit]")].every((e) => /^0+$/.test(e.textContent)));
  check("elapsed countdown marks itself complete", !!past.querySelector("[data-complete]"));
  check("sui:complete fires exactly once", completions === 1);
  d2();

  // Only the authored units are written — the handler never invents DOM.
  const two = mount(toHtml(mk({ to: Date.now() + 90_000, units: ["minutes", "seconds"] })));
  const d3 = hydrate(two, {});
  check("only authored units are present", two.querySelectorAll("[data-unit]").length === 2);
  check("no days unit invented", !two.querySelector('[data-unit="days"]'));
  d3();

  // Preview paints values but must NOT leave a timer running. Asserted on
  // HOURS, deliberately: an exact-minute offset lands on a rollover boundary,
  // where sub-millisecond drift flips 01:00 to 00:59 and the check flakes.
  // 1h30m keeps drift confined to the units we don't assert on.
  const prev = mount(toHtml(mk({ to: Date.now() + (3600 + 1800) * 1000 })));
  const d4 = hydrate(prev, { preview: true });
  check("preview still paints correct values", prev.querySelector('[data-unit="hours"]').textContent === "01");
  d4();
}

// ── TagInput: the handler CREATES DOM, which nothing else here does. It clones
// a `template` part so class names come from authored markup — a runtime that
// built `<span class="tag-input-chip">` itself would emit unprefixed classes
// and render unstyled under a SilicaProvider prefix. Checked below.
console.log("tag input — chips created by cloning the authored template");
{
  const node = {
    kind: "component",
    component: "TagInput",
    props: { name: "topics", value: ["alpha"], placeholder: "Add a topic" },
  };
  const doc = mount(toHtml(node));
  const root = doc.querySelector(".tag-input");
  const field = doc.querySelector('[data-sui-part="input"]');
  const hiddenInput = () => doc.querySelector('input[type="hidden"]');
  const chips = () => [...root.querySelectorAll('[data-sui-part="item"]')];

  check("authored chip renders", chips().length === 1);
  check("template does NOT render as a visible chip", root.querySelector("template") !== null);

  const dispose = hydrate(doc, {});
  check("hidden input seeds from authored chips", hiddenInput().value === "alpha");

  field.value = "beta";
  key(field, "Enter");
  check("Enter adds a chip", chips().length === 2);
  check("new chip carries the typed text", chips()[1].textContent.trim() === "beta");
  check("hidden input tracks the value", hiddenInput().value === "alpha,beta");
  check("field clears after adding", field.value === "");

  // The prefix-safety property: the cloned chip must carry the SAME classes the
  // authored one does, because it came from the template rather than from JS.
  check(
    "cloned chip reuses the authored class names",
    chips()[1].className === chips()[0].className,
  );

  field.value = "alpha";
  key(field, "Enter");
  check("duplicates are rejected by default", chips().length === 2);

  key(field, "Backspace");
  check("Backspace on an empty field removes the last chip", chips().length === 1);
  check("hidden input updates after removal", hiddenInput().value === "alpha");

  click(chips()[0].querySelector('[data-sui-part="close"]'));
  check("clicking a chip's close removes that chip", chips().length === 0);
  check("hidden input empties", hiddenInput().value === "");
  check("placeholder returns once empty", field.placeholder === "Add a topic");
  dispose();
}

console.log(`\n${failures === 0 ? "✅ interactive composites: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
