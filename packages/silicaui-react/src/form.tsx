import * as React from "react";
import { Form as BaseForm } from "@base-ui/react/form";

/**
 * What `Form` does when Base UI asks to move focus to the first invalid control.
 *
 * - `true` (default) — focus it, with the caret at the END of its value. Never
 *   select-all, and never taken from a text control the user is mid-word in.
 * - `false` — never move focus; the field's own error styling carries it.
 * - `"scroll"` — never move focus, but scroll the invalid field into view.
 */
export type FormFocusOnError = boolean | "scroll";

export interface FormProps
  extends React.ComponentPropsWithoutRef<typeof BaseForm> {
  /** How an invalid submit (or a late `errors` update) treats focus. Defaults to `true`. */
  focusOnError?: FormFocusOnError;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Focus policy
 *
 * Base UI's Form moves focus itself, in one place — `focusControl`:
 *
 *     control.focus();
 *     if (control.tagName === 'INPUT') control.select();
 *
 * and calls it from exactly two spots: synchronously inside its `onSubmit` when
 * client validation fails, and from a `useEffect` keyed on `errors` after a
 * submit that passed. Both have real costs we've seen bite:
 *
 *   1. `select()` highlights the whole value, so the user's very next keystroke
 *      REPLACES what they had typed instead of appending to it.
 *   2. The effect fires whenever `errors` changes — i.e. when a server response
 *      lands, arbitrarily long after the submit. By then the user has usually
 *      moved on to another field, and the caret is yanked out mid-word.
 *
 * Base UI exposes no opt-out, so we bound the two windows in which it can focus
 * and shadow `focus`/`select` on this form's own controls for their duration.
 * That captures Base UI's INTENT (which control it wanted) instead of its
 * effect, so the policy below applies without ever firing a focus/blur pair on
 * the wrong field — a bounce would mark fields touched and, under Field's
 * `onBlur` validation mode, commit validation on a field the user is still
 * typing into.
 *
 * Two things make the windows exact rather than heuristic, and both are
 * load-bearing:
 *
 *   • SUBMIT — a capture-phase listener on the form element runs AT_TARGET in
 *     registration order, so ahead of React's root-level `submit` handler and
 *     therefore ahead of Base UI's `onSubmit`. Closing it takes a second
 *     listener, NOT a microtask: the HTML spec performs a microtask checkpoint
 *     between event listener callbacks, so a microtask queued in the capture
 *     handler runs BEFORE React's delegated one and the window shuts before
 *     Base UI ever focuses. (Chromium does this; jsdom does not, so only the
 *     browser probe catches it.) React delegates to the root container, so a
 *     bubble listener on the document is the first point after Base UI's
 *     handler, with a timeout as the stopPropagation backstop.
 *
 *   • COMMIT — the `errors` effect does NOT run on the commit our props change
 *     on. Base UI mirrors `errors` into state from a layout effect, and the
 *     re-render that follows updates `BaseForm` alone — our children are the
 *     same elements, so React bails out of re-rendering them, and only then
 *     does the focus effect fire. All of it is one synchronous stretch, so the
 *     window opens from a passive effect and closes on a microtask, the first
 *     moment after that stretch has unwound. React flushes passive effects
 *     child-first, so rendering the guard as the form's LAST child keeps every
 *     field's own effect ahead of the window rather than inside it.
 * ──────────────────────────────────────────────────────────────────────────── */

type FocusReason = "submit" | "commit";

interface FocusGuard {
  readonly formRef: React.RefObject<HTMLFormElement | null>;
  /** Open windows, innermost last. Empty ⇒ nothing is shadowed. */
  open: FocusReason[];
  /** Elements whose `focus`/`select` are currently shadowed. */
  patched: HTMLElement[];
  /** The control Base UI asked for while a window was open. */
  requested: HTMLElement | null;
  /** Base UI can only focus after a submit, so nothing before one needs guarding. */
  armed: boolean;
  policy: FormFocusOnError;
}

/** Every control Base UI's `focusControl` could plausibly be handed. */
const FOCUSABLE = "input, select, textarea, button, [contenteditable], [tabindex]";

/** Input types with a selection API; `setSelectionRange` throws on the rest. */
const SELECTABLE_INPUT = new Set(["text", "search", "url", "tel", "password"]);

/** Input types that aren't free-text entry — taking focus from one is harmless. */
const NON_TEXT_INPUT = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function shadow(el: HTMLElement, key: "focus" | "select", value: () => void): void {
  Object.defineProperty(el, key, { configurable: true, writable: true, value });
}

function unshadow(el: HTMLElement, key: "focus" | "select"): void {
  delete (el as unknown as Record<string, unknown>)[key];
}

function openWindow(guard: FocusGuard, reason: FocusReason): void {
  const nested = guard.open.length > 0;
  guard.open.push(reason);
  if (nested) return; // the outer window already owns the shadowing
  if (reason !== "submit" && !guard.armed) return;
  const form = guard.formRef.current;
  if (!form) return;
  for (const el of form.querySelectorAll<HTMLElement>(FOCUSABLE)) {
    shadow(el, "focus", () => {
      guard.requested = el;
    });
    shadow(el, "select", () => {});
    guard.patched.push(el);
  }
}

function closeWindow(guard: FocusGuard, reason: FocusReason): void {
  const at = guard.open.lastIndexOf(reason);
  if (at === -1) return;
  if (reason === "submit") {
    // The dispatch is the outermost boundary. Base UI validates through
    // `flushSync`, so React can commit — and run the guard's effect — while we
    // are still inside it; a `commit` entry left on the stack is that artifact,
    // not a window that outlives the submit.
    guard.open.length = 0;
  } else {
    guard.open.splice(at, 1);
    if (guard.open.length) return; // an outer window still owns the shadowing
  }
  for (const el of guard.patched) {
    unshadow(el, "focus");
    unshadow(el, "select");
  }
  guard.patched.length = 0;
  const target = guard.requested;
  guard.requested = null;
  if (!target) return;
  // Base UI consumes its own post-submit flag the first time that effect fires,
  // so stop arming commits once it has: it can't focus again until the next
  // submit, and an armed guard shadows `focus` on every commit in between.
  if (reason === "commit") guard.armed = false;
  // `reason` is the OUTERMOST window's, since inner ones return above — so a
  // focus recorded during a nested commit still resolves with submit semantics.
  applyPolicy(guard, target, reason);
}

function applyPolicy(
  guard: FocusGuard,
  target: HTMLElement,
  reason: FocusReason,
): void {
  const { policy } = guard;
  if (policy === false) return;
  if (policy === "scroll") {
    scrollIntoView(target);
    return;
  }

  // A submit IS the user asking for this, so it always moves focus. A late
  // `errors` update is not — it lands on the network's schedule, and by then
  // the caret may be somewhere the user very much wants it to stay.
  if (reason === "commit") {
    const form = guard.formRef.current;
    const active = form?.ownerDocument.activeElement as HTMLElement | null;
    if (active && active !== target && form?.contains(active) && isTextEntry(active)) {
      scrollIntoView(target);
      return;
    }
  }

  target.focus(); // the real method — the window is closed by now
  collapseCaret(target);
}

function isTextEntry(el: HTMLElement): boolean {
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") return !NON_TEXT_INPUT.has((el as HTMLInputElement).type);
  return el.isContentEditable;
}

/** Put the caret at the end rather than leaving Base UI's select-all in place. */
function collapseCaret(el: HTMLElement): void {
  const selectable =
    el.tagName === "TEXTAREA" ||
    (el.tagName === "INPUT" && SELECTABLE_INPUT.has((el as HTMLInputElement).type));
  if (!selectable) return;
  const field = el as HTMLInputElement | HTMLTextAreaElement;
  const end = field.value.length;
  try {
    field.setSelectionRange(end, end);
  } catch {
    // Selection unsupported for this control after all — focus still landed.
  }
}

function scrollIntoView(el: HTMLElement): void {
  el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

/**
 * Opens the commit window. Rendered as the form's LAST child so every field's
 * own effect runs ahead of it rather than inside the window — see the note
 * above; moving it changes which effects the window covers.
 */
function FormFocusGuard({
  guard,
  policy,
}: {
  guard: FocusGuard;
  policy: FormFocusOnError;
}): null {
  React.useEffect(() => {
    guard.policy = policy;
    openWindow(guard, "commit");
    queueMicrotask(() => closeWindow(guard, "commit"));
  });
  return null;
}

/**
 * Silica Form — a `<form>` that coordinates its Fields' validation. Behavior
 * from Base UI: it runs each Field's validation on submit, moves focus to the
 * first invalid control, and accepts server-returned `errors` keyed by field
 * `name`. Presentational only otherwise — lay it out with `Field`s and utilities.
 *
 *   <Form errors={serverErrors} onSubmit={…}>
 *     <Field name="email">…</Field>
 *     <Button type="submit">Save</Button>
 *   </Form>
 *
 * Silica narrows the focus move, which is unconditional and un-opt-out-able
 * upstream: it never selects the control's existing value, and never takes the
 * caret from a text control the user is typing in when a late `errors` update
 * arrives. Use `focusOnError` to soften it further:
 *
 *   <Form focusOnError="scroll" errors={serverErrors}>…</Form>   // reveal, don't focus
 *   <Form focusOnError={false} errors={serverErrors}>…</Form>    // leave focus alone
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  { focusOnError = true, children, ...rest },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLFormElement>(null);
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLFormElement);

  const guardRef = React.useRef<FocusGuard | null>(null);
  guardRef.current ??= {
    formRef: innerRef,
    open: [],
    patched: [],
    requested: null,
    armed: false,
    policy: focusOnError,
  };
  const guard = guardRef.current;

  React.useEffect(() => {
    const form = innerRef.current;
    if (!form) return;
    const doc = form.ownerDocument;
    const onCapture = () => {
      guard.armed = true;
      openWindow(guard, "submit");
      // Backstop, in case a handler stops propagation before `onBubble`.
      setTimeout(() => closeWindow(guard, "submit"), 0);
    };
    // React delegates `submit` to the root container, so a bubble listener on
    // the document is the first point after Base UI's `onSubmit` has run.
    const onBubble = () => closeWindow(guard, "submit");
    form.addEventListener("submit", onCapture, true);
    doc.addEventListener("submit", onBubble);
    return () => {
      form.removeEventListener("submit", onCapture, true);
      doc.removeEventListener("submit", onBubble);
    };
  }, [guard]);

  return (
    <BaseForm ref={innerRef} {...rest}>
      {children}
      <FormFocusGuard guard={guard} policy={focusOnError} />
    </BaseForm>
  );
});
