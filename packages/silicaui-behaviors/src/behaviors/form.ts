import { DisposeBag } from "../dom";
import type { BehaviorHandler, FormValue } from "../types";

/**
 * `form` — makes an authored `<form>` genuinely functional on publish
 * (architecture §8, the action primitive). On submit it:
 *
 *   1. VALIDATES natively (`checkValidity()` — required, type=email, pattern,
 *      min/max/step, maxlength come for free) and, if invalid, blocks the submit,
 *      marks each failing control `aria-invalid`, and surfaces the browser's own
 *      messages via `reportValidity()`.
 *   2. If valid and a host `onAction` was provided, DISPATCHES a structured
 *      `{ kind: "submit", values }` payload (values gathered with native FormData
 *      semantics — checkboxes/radios/multi-selects handled) to the action `ref`
 *      read from the form's `data-sui-action`. The default is prevented; while the
 *      dispatch promise is pending the form is `aria-busy`, its submit control is
 *      disabled, and `data-sui-state` walks idle → submitting → success | error.
 *   3. If valid with NO `onAction` (and not preview), it does nothing and lets the
 *      browser submit natively — progressive enhancement, so a plain server-posted
 *      form still works.
 *
 * In `preview` mode (the builder canvas) a valid submit is prevented and never
 * dispatched, so editing a form never fires a real host action.
 *
 * Field PREFILL: at hydrate, any control carrying `data-sui-bind` is seeded from
 * `opts.resolve(ref)` when a resolver is supplied.
 */

const ACTION_ATTR = "data-sui-action";
const BIND_ATTR = "data-sui-bind";
const STATE_ATTR = "data-sui-state";
const INVALID_ATTR = "aria-invalid";

/** The native controls a form gathers values from / validates / prefills. */
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const CONTROL_SEL = "input, textarea, select";

export const form: BehaviorHandler = (root, opts) => {
  const bag = new DisposeBag();
  // The behavior marker can sit on the <form> itself or (defensively) on a wrapper.
  const form = (
    root.tagName === "FORM" ? root : root.querySelector("form")
  ) as HTMLFormElement | null;
  if (!form) return () => bag.dispose();

  setState(form, "idle");

  // ── prefill bound controls from host data ────────────────────────────────
  if (opts.resolve) {
    for (const el of controls(form)) {
      const ref = el.getAttribute(BIND_ATTR);
      if (ref == null) continue;
      const value = opts.resolve(ref);
      if (value != null) applyValue(el, value);
    }
  }

  // Clearing the invalid flag as the user fixes a field is the least-surprising
  // feedback; re-validation happens wholesale on the next submit.
  bag.listen(form, "input", (ev) => {
    const t = ev.target as Element | null;
    if (t && t.hasAttribute(INVALID_ATTR)) t.removeAttribute(INVALID_ATTR);
  });

  bag.listen(form, "submit", (ev) => {
    // Validate first — a failing form never submits, native or dispatched.
    if (!form.checkValidity()) {
      ev.preventDefault();
      markInvalid(form);
      form.reportValidity();
      setState(form, "error");
      return;
    }
    for (const el of controls(form)) el.removeAttribute(INVALID_ATTR);

    // Valid. In preview, or whenever a host wants to own the submit, prevent the
    // native post. Without a host handler (and not preview) fall through to native.
    if (opts.preview) {
      ev.preventDefault();
      setState(form, "success");
      return;
    }
    if (!opts.onAction) return; // progressive enhancement: native submit proceeds

    ev.preventDefault();
    const ref = form.getAttribute(ACTION_ATTR); // may be null (validate + notify)
    const submit = submitControl(form);
    setState(form, "submitting");
    form.setAttribute("aria-busy", "true");
    if (submit) submit.disabled = true;

    const settle = (state: "success" | "error") => {
      form.removeAttribute("aria-busy");
      if (submit) submit.disabled = false;
      setState(form, state);
    };

    let result: void | Promise<void>;
    try {
      result = opts.onAction(ref, { kind: "submit", values: collect(form), form });
    } catch {
      settle("error");
      return;
    }
    if (result && typeof (result as Promise<void>).then === "function") {
      result.then(
        () => settle("success"),
        () => settle("error"),
      );
    } else {
      settle("success");
    }
  });

  return () => bag.dispose();
};

/** Every native control under `form` (typed). */
function controls(form: HTMLFormElement): Control[] {
  return Array.from(form.querySelectorAll(CONTROL_SEL)) as Control[];
}

/** The form's submit trigger — an explicit part wins, else a submit-typed control. */
function submitControl(form: HTMLFormElement): (HTMLButtonElement | HTMLInputElement) | null {
  return form.querySelector(
    '[data-sui-part="submit"], button[type="submit"], button:not([type]), input[type="submit"]',
  );
}

/** Flag each control that fails native validation, so a host can style it. */
function markInvalid(form: HTMLFormElement): void {
  for (const el of controls(form)) {
    if (el.willValidate && !el.checkValidity()) el.setAttribute(INVALID_ATTR, "true");
    else el.removeAttribute(INVALID_ATTR);
  }
}

/** Gather values keyed by `name` using native FormData semantics. */
function collect(form: HTMLFormElement): Record<string, FormValue> {
  const fd = new FormData(form);
  const out: Record<string, FormValue> = {};
  for (const key of new Set(fd.keys())) {
    const all = fd.getAll(key).map((v) => (typeof v === "string" ? v : v.name));
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

/** Seed a control's value from a resolved host value (checkable → checked match). */
function applyValue(el: Control, value: unknown): void {
  if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
    el.checked = el.value ? String(value) === el.value : Boolean(value);
    return;
  }
  el.value = String(value);
}

function setState(form: HTMLFormElement, state: string): void {
  form.setAttribute(STATE_ATTR, state);
}
