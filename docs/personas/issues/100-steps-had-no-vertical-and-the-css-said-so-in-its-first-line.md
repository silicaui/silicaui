# 100 — `Steps` could only go across the page, and a migration needed it to go down

**Status:** fixed
**Severity:** major
**Found by:** P09 · Gordon Pike · act 3, migrating the order-detail screen
**Surface:** `@wizeworks/silicaui` › `.steps`, and `@wizeworks/silicaui-react` › `Steps`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Pike & Daughter's order-detail screen shows where an order is — Paid, Picking,
Dispatched — down the side of a narrow card, because that is where there is room
for it. On daisyUI that is one class:

```html
<ul class="steps steps-vertical">
```

Silica has `Steps`. It has `Step`. It has `step-primary` and the whole colour
set. It does not have vertical, and it never did:

```js
/**
 * The Steps component — a horizontal progress tracker.
 */
```

Not a prop, not a class, not a modifier. `display: flex` with no direction, and
`.step` laid out as `flex-direction: column` so the node sits above its label.
The first line of the CSS module says what it is, and it is honest.

## Why it matters

This is the finding P09 exists to produce, and act 7 asks for it by name: *a
daisyUI component with no Silica equivalent at all*. It arrived in act 3.

Gordon's three options were compose it himself, keep daisyUI on that one screen,
or tell the client no. All three are bad, and the middle one is the worst:
**daisyUI and Silica both own `.steps`, `.btn`, `.card` and `.table`, so keeping
both in one build is not "one screen on the old system", it is two stylesheets
fighting over the same names.**

The inconsistency is also inside Silica. `Stats` — a component of the same shape,
a list of blocks — has had `vertical` since it shipped:

```tsx
/** Stack the blocks vertically instead of inline. */
vertical?: boolean;
```

So the answer to "can Silica do this" was yes for one component and no for its
neighbour, with nothing saying which.

## Where it lives

[packages/silicaui/src/components/steps.js](../../../packages/silicaui/src/components/steps.js)
[packages/silicaui-react/src/steps.tsx](../../../packages/silicaui-react/src/steps.tsx)

## The fix

Added, rather than worked around. The same three pieces turned ninety degrees:

```js
[`${stepsSel}-vertical`]: {
  flexDirection: "column",
  overflowX: "visible",
  alignItems: "stretch",
},
[`${stepsSel}-vertical > ${step()}`]: {
  flexDirection: "row",      // node on the left, label beside it
  alignItems: "center",
  gap: "0.75rem",
  textAlign: "start",
  minHeight: "3rem",
  flex: "0 0 auto",
},
[`${stepsSel}-vertical > ${step()}::after`]: {
  top: "auto",               // the connector runs UP to the previous node
  left: "calc(1rem - 0.125rem)",
  bottom: "50%",
  width: "0.25rem",
  height: "100%",
},
```

and the React prop spelled the way `Stats` already spells it, so the two
neighbours agree:

```tsx
/** Stack the steps down the page instead of across it. */
vertical?: boolean;
```

The colour variants needed no change: `step-primary` paints `--step-bg` on the
node and its incoming connector, and the connector is still the connector after
it has been rotated.

## Confirmed by

The order-detail screen, which is the screen that asked for it, rendering the
three states down the side of its card with numbered nodes, connectors between
them, and the first two coloured because the order is in Picking:

```
1  Paid          (primary)
2  Picking       (primary)
3  Dispatched
```

Screenshotted at 1440px in `obsidian`. No console errors, and the horizontal
`Steps` elsewhere is byte-identical — the vertical rules are additive and scoped
under `.steps-vertical`, so nothing that did not ask for it moved.

## One thing this nearly got wrong

The first run after the fix logged a React warning:

```
Received `true` for a non-boolean attribute `vertical`.
```

which reads exactly like "the prop is not wired up and is falling through to the
DOM". It was not: the built package destructures `vertical` correctly, and the
app was serving a **cached copy of the module from before the rebuild**. The
same trap as P07's — a rebuilt package that never reached the app — and the same
fix: clear the cache and restart. Checked in the built `dist` before concluding
anything, which is what showed the destructuring was already there.

## Rating effect

`Steps — component doc` in [rating.md](../rating.md).
