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

console.log(`\n${failures === 0 ? "✅ interactive composites: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
