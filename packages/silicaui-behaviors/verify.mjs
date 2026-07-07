// Runnable proof of the `form` behavior contract (architecture §8): validate →
// dispatch → state. Run against built output:
//   pnpm --filter silicaui-behaviors build && node verify.mjs
//
// A jsdom document stands in for a published page: we lower a <form> exactly as
// `silicaui-html` would (data-sui-behavior="form" + data-sui-action), hydrate it,
// and assert the submit lifecycle a real host relies on.
import { JSDOM } from "jsdom";
import { hydrate } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

/** A fresh jsdom whose globals back the handler's DOM/FormData/instanceof use. */
function mount(html) {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const { window } = dom;
  for (const k of [
    "document",
    "window",
    "Event",
    "CustomEvent",
    "FormData",
    "Node",
    "HTMLFormElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "HTMLButtonElement",
  ]) {
    globalThis[k] = window[k];
  }
  return window.document;
}

/** Fire a cancelable submit and report whether the default was prevented. */
function submit(form) {
  const ev = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(ev);
  return ev.defaultPrevented;
}

const FORM = (action = "subscribe", extra = "") => `
  <form class="flex" data-sui-behavior="form" data-sui-action="${action}">
    <input name="email" type="email" required value="" ${extra}/>
    <input name="topic" type="text" value="pricing"/>
    <button type="submit">Send</button>
  </form>`;

// ── 1. valid submit dispatches a structured payload, prevents native post ────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  let got = null;
  const dispose = hydrate(doc, { onAction: (ref, payload) => { got = { ref, payload }; } });

  const prevented = submit(form);
  check("valid submit prevents native default", prevented);
  check("dispatched with the form's action ref", got?.ref === "subscribe");
  check("payload is a submit kind", got?.payload?.kind === "submit");
  check("payload carries field values keyed by name", got?.payload?.values?.email === "a@b.com" && got?.payload?.values?.topic === "pricing");
  check("payload exposes the form element", got?.payload?.form === form);
  check("state settles to success (sync handler)", form.getAttribute("data-sui-state") === "success");
  dispose();
}

// ── 2. invalid submit blocks dispatch, flags the field, state=error ──────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form"); // email empty → required fails
  let called = false;
  const dispose = hydrate(doc, { onAction: () => { called = true; } });

  const prevented = submit(form);
  check("invalid submit prevents default", prevented);
  check("invalid submit does NOT dispatch", called === false);
  check("failing control marked aria-invalid", form.querySelector('[name="email"]').getAttribute("aria-invalid") === "true");
  check("valid control NOT marked invalid", form.querySelector('[name="topic"]').hasAttribute("aria-invalid") === false);
  check("state=error on invalid", form.getAttribute("data-sui-state") === "error");
  dispose();
}

// ── 3. fixing a flagged field clears its invalid mark on input ───────────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  hydrate(doc, { onAction: () => {} });
  submit(form); // fails → email flagged
  const email = form.querySelector('[name="email"]');
  check("field flagged after failed submit", email.getAttribute("aria-invalid") === "true");
  email.value = "x@y.com";
  email.dispatchEvent(new Event("input", { bubbles: true }));
  check("invalid mark cleared on input", email.hasAttribute("aria-invalid") === false);
}

// ── 4. async handler: pending (busy + disabled) then success ─────────────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  const btn = form.querySelector('button[type="submit"]');
  let resolve;
  const dispose = hydrate(doc, { onAction: () => new Promise((r) => { resolve = r; }) });

  submit(form);
  check("submitting: state=submitting while pending", form.getAttribute("data-sui-state") === "submitting");
  check("submitting: form aria-busy", form.getAttribute("aria-busy") === "true");
  check("submitting: submit control disabled", btn.disabled === true);
  resolve();
  await Promise.resolve(); await Promise.resolve();
  check("resolved: state=success", form.getAttribute("data-sui-state") === "success");
  check("resolved: aria-busy cleared", form.hasAttribute("aria-busy") === false);
  check("resolved: submit control re-enabled", btn.disabled === false);
  dispose();
}

// ── 5. rejected handler settles to error and re-enables submit ───────────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  const btn = form.querySelector('button[type="submit"]');
  const dispose = hydrate(doc, { onAction: () => Promise.reject(new Error("nope")) });
  submit(form);
  await Promise.resolve(); await Promise.resolve();
  check("rejected: state=error", form.getAttribute("data-sui-state") === "error");
  check("rejected: submit control re-enabled", btn.disabled === false);
  dispose();
}

// ── 6. preview mode: valid submit prevented, NEVER dispatched ────────────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  let called = false;
  const dispose = hydrate(doc, { preview: true, onAction: () => { called = true; } });
  const prevented = submit(form);
  check("preview: valid submit prevented", prevented);
  check("preview: no host dispatch", called === false);
  check("preview: state=success (would-submit)", form.getAttribute("data-sui-state") === "success");
  dispose();
}

// ── 7. progressive enhancement: no onAction → native submit not prevented ────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  const dispose = hydrate(doc, {}); // no onAction, not preview
  const prevented = submit(form);
  check("no handler + valid → native submit NOT prevented", prevented === false);
  dispose();
}

// ── 8. prefill: a bound control is seeded from resolve(ref) at hydrate ────────
{
  const doc = mount(`
    <form data-sui-behavior="form">
      <input name="email" data-sui-bind="user.email" value=""/>
      <input name="news" type="checkbox" data-sui-bind="user.subscribed" value="yes"/>
    </form>`);
  const form = doc.querySelector("form");
  const data = { "user.email": "seed@host.com", "user.subscribed": "yes" };
  const dispose = hydrate(doc, { resolve: (ref) => data[ref] });
  check("prefill: bound text control seeded", form.querySelector('[name="email"]').value === "seed@host.com");
  check("prefill: bound checkbox checked on value match", form.querySelector('[name="news"]').checked === true);
  dispose();
}

// ── 9. idempotent hydrate + clean teardown ───────────────────────────────────
{
  const doc = mount(FORM());
  const form = doc.querySelector("form");
  form.querySelector('[name="email"]').value = "a@b.com";
  let calls = 0;
  const d1 = hydrate(doc, { onAction: () => { calls++; } });
  const d2 = hydrate(doc, { onAction: () => { calls++; } }); // already hydrated → no-op
  submit(form);
  check("idempotent: only the first hydrate wired the form", calls === 1);
  d1();
  submit(form);
  check("teardown: no dispatch after dispose", calls === 1);
  d2();
}

console.log(`\n${failures === 0 ? "✅ form contract: all checks passed" : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
