/**
 * Behavioral probe for `Form`'s focus policy.
 *
 * Base UI's Form moves focus to the first invalid control and calls `select()`
 * on it, from two places: synchronously on an invalid submit, and from an
 * effect whenever `errors` changes after a submit that passed. The second one
 * fires on the network's schedule — it lands while the user is typing in a
 * different field, yanks the caret out, and (thanks to `select()`) makes their
 * next keystroke replace what they had. Base UI offers no opt-out, so Silica
 * bounds the two windows in which it can focus and applies its own policy.
 *
 * That interception rides on ordering guarantees that are invisible to the type
 * system, and a Base UI bump could move the focus call somewhere else entirely
 * — so this asserts the real behavior against the built bundle rather than
 * trusting the reasoning.
 *
 * SCOPE — jsdom does NOT perform the microtask checkpoint the HTML spec runs
 * between event listener callbacks, so it cannot see mistakes in WHEN the guard
 * opens and closes relative to React's delegated handler. One such bug passed
 * every check here while being broken in every real browser. Event-loop timing
 * is covered by `examples/playground/e2e/form-focus.spec.ts` instead; keep both.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-form-focus.mjs
 */
import { JSDOM } from "jsdom";

// A real origin — an opaque one makes touching `localStorage` throw, and the
// global copy below touches every property on `window`.
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
// Node 21+ defines `navigator` as a getter-only global, so redefine rather than assign.
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no layout, so it ships no `scrollIntoView`. `focusOnError="scroll"`
// is defined by that call, so stub it and record the target.
let scrolled = null;
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
  scrolled = this;
};

const React = (await import("react")).default;
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { Form, Field, FieldControl } = await import("./dist/index.js");

const h = React.createElement;
let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) failures++;
}

const isEmail = (v) => (String(v).includes("@") ? null : "Enter a valid email address.");

/**
 * A login form shaped like the one that surfaced this: an email field that can
 * fail client-side, a password field the user may still be typing in, and a
 * submit button.
 */
function LoginForm({ focusOnError, errors, extra }) {
  return h(
    Form,
    { errors, focusOnError, onSubmit: (e) => e.preventDefault() },
    h(
      Field,
      { name: "email", validate: isEmail },
      h(FieldControl, { type: "text", "data-testid": "email" }),
    ),
    h(
      Field,
      { name: "password" },
      h(FieldControl, { type: "password", "data-testid": "password" }),
    ),
    h("button", { type: "submit", "data-testid": "submit" }, "Sign in"),
    extra ?? null,
  );
}

/** Mount a fresh tree; returns handles plus a `render` to push new props. */
async function mount(props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(h(LoginForm, props)));
  const q = (id) => container.querySelector(`[data-testid="${id}"]`);
  return {
    container,
    email: q("email"),
    password: q("password"),
    submit: q("submit"),
    q,
    render: (next) => act(async () => root.render(h(LoginForm, { ...props, ...next }))),
    unmount: () => act(async () => root.unmount()),
  };
}

const fire = (form) =>
  act(async () =>
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })),
  );

/** Type into a controlled-by-Base-UI control the way a user would. */
function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    "value",
  ).set;
  setter.call(el, value);
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

console.log("Form focus policy");

// ── 1. an invalid submit still focuses the first invalid control ─────────────
{
  const t = await mount();
  await act(async () => type(t.email, "brandon"));
  t.submit.focus();
  await fire(t.email.form);
  check(
    "invalid submit focuses the first invalid control",
    document.activeElement === t.email,
    `focus landed on ${document.activeElement?.dataset?.testid ?? document.activeElement?.tagName}`,
  );
  await t.unmount();
}

// ── 2. …without selecting what the user already typed ────────────────────────
{
  const t = await mount();
  await act(async () => type(t.email, "brandon"));
  // Start from Base UI's own outcome (select-all) so a pass proves we actively
  // collapsed it, not that jsdom happened to leave the caret at the end.
  t.email.focus();
  t.email.setSelectionRange(0, "brandon".length);
  t.submit.focus();
  await fire(t.email.form);
  check(
    "invalid submit leaves the caret at the end, never select-all",
    t.email.selectionStart === 7 && t.email.selectionEnd === 7,
    `selection was ${t.email.selectionStart}–${t.email.selectionEnd}, expected 7–7`,
  );
  await t.unmount();
}

// ── 3. focusOnError={false} ──────────────────────────────────────────────────
{
  const t = await mount({ focusOnError: false });
  await act(async () => type(t.email, "brandon"));
  t.submit.focus();
  await fire(t.email.form);
  check(
    "focusOnError={false} leaves focus where it was",
    document.activeElement === t.submit,
    `focus moved to ${document.activeElement?.dataset?.testid ?? document.activeElement?.tagName}`,
  );
  await t.unmount();
}

// ── 4. focusOnError="scroll" ─────────────────────────────────────────────────
{
  const t = await mount({ focusOnError: "scroll" });
  await act(async () => type(t.email, "brandon"));
  t.submit.focus();
  scrolled = null;
  await fire(t.email.form);
  check(
    'focusOnError="scroll" reveals the field without taking focus',
    document.activeElement === t.submit && scrolled === t.email,
    `focus=${document.activeElement?.dataset?.testid}, scrolled=${scrolled?.dataset?.testid ?? "none"}`,
  );
  await t.unmount();
}

// ── 5. THE BUG: a late `errors` update must not yank the caret out ───────────
{
  const t = await mount();
  await act(async () => type(t.email, "brandon@wize.works"));
  t.submit.focus();
  await fire(t.email.form); // valid — arms Base UI's post-submit errors effect
  // The request is in flight and the user carries on into the password field.
  t.password.focus();
  await act(async () => type(t.password, "hunter"));
  // The server answers.
  await t.render({ errors: { email: "That address is already registered." } });
  check(
    "a late errors update does not steal focus from a field being typed in",
    document.activeElement === t.password,
    `focus jumped to ${document.activeElement?.dataset?.testid ?? document.activeElement?.tagName}`,
  );
  check(
    "…and does not disturb the caret in that field",
    t.password.selectionStart === 6 && t.password.selectionEnd === 6,
    `selection was ${t.password.selectionStart}–${t.password.selectionEnd}`,
  );
  await t.unmount();
}

// ── 6. …but it DOES focus when the user isn't mid-input ──────────────────────
{
  const t = await mount();
  await act(async () => type(t.email, "brandon@wize.works"));
  t.submit.focus();
  await fire(t.email.form);
  // Select-all first, so a collapsed caret afterwards proves OUR policy placed
  // the focus — Base UI reaching the control directly would leave it selected.
  t.email.setSelectionRange(0, t.email.value.length);
  await t.render({ errors: { email: "That address is already registered." } });
  check(
    "a late errors update still focuses when focus sits on the submit button",
    document.activeElement === t.email,
    `focus stayed on ${document.activeElement?.dataset?.testid ?? document.activeElement?.tagName}`,
  );
  check(
    "…and that focus goes through the policy, not past it",
    t.email.selectionStart === t.email.value.length &&
      t.email.selectionEnd === t.email.value.length,
    `selection was ${t.email.selectionStart}–${t.email.selectionEnd}, expected collapsed at ${t.email.value.length}`,
  );
  await t.unmount();
}

// ── 7. the guard leaves no residue on the DOM ────────────────────────────────
{
  const t = await mount();
  await act(async () => type(t.email, "brandon"));
  await fire(t.email.form);
  const own = ["focus", "select"].filter((k) => Object.getOwnPropertyDescriptor(t.email, k));
  check(
    "shadowed focus/select are removed once the window closes",
    own.length === 0 && t.email.focus === dom.window.HTMLElement.prototype.focus,
    `still shadowed: ${own.join(", ") || "(prototype method not restored)"}`,
  );
  await t.unmount();
}

// ── 8. the window must not swallow anyone else's focus call ──────────────────
// The guard is rendered as the form's LAST child precisely so that sibling
// fields' effects fall OUTSIDE the window. Render it first and this fails.
{
  let focusedByChild = false;
  function Autofocuser({ on }) {
    React.useEffect(() => {
      if (!on) return;
      const el = document.querySelector('[data-testid="password"]');
      el?.focus();
      focusedByChild = document.activeElement === el;
    }, [on]);
    return null;
  }
  const t = await mount({ extra: h(Autofocuser, { on: false }) });
  await act(async () => type(t.email, "brandon"));
  await fire(t.email.form); // arms the guard, so later commits open a window
  await t.render({ extra: h(Autofocuser, { on: true }) });
  check(
    "a sibling child's own focus call inside the same commit still works",
    focusedByChild && document.activeElement === t.password,
    `child focus ${focusedByChild ? "took, then was overridden" : "was swallowed"}`,
  );
  await t.unmount();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
