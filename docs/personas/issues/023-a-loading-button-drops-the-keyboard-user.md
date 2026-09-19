# 023 — Pressing Enter to submit left her with no focus anywhere for half a second

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 8
**Surface:** `@wizeworks/silicaui-react` › `Button`, `loading`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 8 is the keyboard act: build the "New shipment" dialog, then do the whole job with no
mouse. A focus recorder was attached first — every `focusin`, and every `focusout` with no
`relatedTarget` — because "focus never disappears" is the act's own done-condition and the
only honest way to say it is to log it as it happens.

Eight Tabs to the trigger, Enter to open, three fields filled, Tab to **Book it**, Enter.
The recorder caught this:

```
button.btn "Book it"
-> nothing (button.btn "Book it" lost it)
div.alert  "The shipment was not booke…"
```

**Focus went nowhere for the length of the request** — 450ms against the local route
handler, and however long a real one takes.

The cause is one line. `<Button loading>` computes
`isDisabled = Boolean(disabled) || Boolean(loading)` and passes it to the native
`disabled` attribute. **When the element a keyboard user is standing on gains `disabled`,
the browser moves focus to `<body>`.**

## What should have happened

The button she just pressed should still be the button she is standing on. `aria-busy` was
being set correctly — but with focus on `<body>` there is nothing for a screen reader to
announce it against, and a sighted keyboard user has no ring anywhere on the page.

## How to reproduce

1. Any theme, any width, keyboard only.
2. Tab to a `<Button loading>` that becomes busy on activation. Press Enter.
3. `document.activeElement` is `<body>` until the request resolves.
4. Press Tab during that window: it restarts from the top of the document.

Every time. Not theme- or width-dependent.

## Why it matters

This is every form in every app built on silicaui, on the one interaction a keyboard user
performs most. The window is short enough to look like nothing and long enough to lose your
place: the next Tab does not continue from the submit button, it starts over at the top of
the page — so on this dialog she would land back on the sidebar toggle.

It is also invisible to everything that already runs here. It type-checks, it lints, it
renders correctly, and the markup is not wrong — the defect is in what the browser does
next. Only driving the screen on the keyboard finds it.

## Where it lives

`packages/silicaui-react/src/button.tsx` — `disabled={isDisabled}` on the native
`<button>`.

## Do the siblings have it too?

**No, and the component was already inconsistent with itself.** Two components in
`@wizeworks/silicaui-react` accept a `loading` prop:

- **`Button`** — had it.
- **`Field`** — does not. `FieldControl` computes `isDisabled = disabled ?? fieldDisabled`;
  `loading` only adds a spinner to the trailing slot and never disables the control.

And within `Button`, the **polymorphic path already did the right thing**: when a `render`
element is passed, `composeRender` receives `aria-disabled` and `data-disabled`, never the
native attribute. So `<Button loading render={<a/>}>` kept focus and `<Button loading>` did
not — one component, two behaviours, decided by a prop unrelated to either.

## The fix

Split the two states, because they are not the same state:

```tsx
disabled={Boolean(disabled)}                 // a real, lasting disabled
aria-disabled={isDisabled || undefined}      // covers busy as well
aria-busy={loading || undefined}
onClick={blockWhileBusy ?? rest.onClick}     // aria-disabled is advisory
```

`aria-disabled` is advisory — the element stays clickable and still submits a form on
Enter — so activation is stopped explicitly while busy.

**Nothing about the look changes**, which is what made this safe to do: button.js already
styles `&:disabled, &[aria-disabled='true']` with one shared rule, and the spinner keys off
`aria-busy`, not off `disabled`.

A genuinely `disabled` button still takes the real attribute. That state is not temporary,
the user did not just press it, and leaving the tab order is the correct platform behaviour
there.

**`verify-busy-keeps-focus.mjs`** is new and wired into `pnpm verify`. For every component
accepting a `loading` prop it checks that nothing reaching a native `disabled={…}` is
derived from a busy state — following the derivation one hop, because
`disabled={isDisabled}` pointing at a `const` built from `loading` is exactly how this hid.

## Confirmed by

**Sampled every 50ms through the request**, because the defect lived entirely inside that
window and an after-the-fact reading would have reported success either way:

| t | focus | `disabled` attr | `aria-disabled` | `aria-busy` |
| --- | --- | --- | --- | --- |
| 0–400ms | `button.btn "Book it"` | **false** | true | true |
| 500ms+ | `div.alert "The shipment was not booked…"` | false | — | — |

**`focusEverLost: false`** across the whole run, against a recorded
`-> nothing (button.btn "Book it" lost it)` before the fix.

The rest of act 8's done-condition, same run, on the keyboard alone:

- **8 Tabs** from the top to the trigger, in a sensible order, nothing skipped or trapped.
- Enter opened the dialog and focus moved **into** it, onto the first field.
- The dialog is properly modal — the background is `aria-hidden` with two focus guards.
- `Farg'ona Yog'-Moy Kombinati` typed and kept its apostrophes.
- The port Select opened on Enter, ArrowDown moved to Riga, Enter selected it and **focus
  returned to the trigger**.
- The rejected submit put focus on the error, and **one Tab from there lands on the
  Reference field** — the field the message names.
- **Escape closed the dialog with a real key press** (not a synthetic `KeyboardEvent` — act
  6 recorded one of those failing on the Drawer and correctly called it a measurement
  artifact), and focus returned to the exact trigger that opened it, with
  `:focus-visible` matching and a solid 2px ring at 2px offset.

**One focus gap remains and is not a defect: 2.3ms**, measured, at the moment the popup
unmounts and before focus is restored to the trigger. That is under a sixth of a frame and
structurally unavoidable when the focused element is removed from the DOM — a different
thing entirely from a 450ms hole, and recorded separately rather than rolled into the same
sentence.

## Rating effect

None recorded — the console's screens are not in `rating.md`.
