# 005 — Sidebar rows are 37px tall, too small to tap reliably on a phone

**Status:** fixed
**Severity:** minor
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 1
**Surface:** the `Sidebar` component — `.sidebar-item`. Seen on silicaui.com › Docs in the phone drawer
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** rule verified in the built stylesheet — **but NOT exercised on a touch device.** Read the caveat below
**Blocked on:** —

## What happened

Found while confirming the fix for #003. With the docs nav now opening as a `Drawer` on
a phone, Dilnoza went to tap a component in the list.

Measured on the open drawer at a 360px viewport:

| | Measured |
| --- | --- |
| Drawer width | 256px |
| Row (`<a class="sidebar-item">`) width | 216px |
| **Row height** | **37px** |
| Minimum comfortable tap target | **44px** (WCAG 2.5.5 AAA, Apple HIG 44pt, Android 48dp) |
| Rows in this list | 116 |

37px is under every published minimum, and there are 116 of them stacked with no
separation. On a phone that is a list where the row above or below is a realistic
mis-tap on every attempt.

## What should have happened

A row that is meant to be tapped is at least 44px tall on a touch device.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/docs/` at a 360px viewport.
2. Tap the menu button, then measure a row in the drawer:

```js
const row = [...document.querySelectorAll('[role="dialog"] a.sidebar-item')][0];
row.getBoundingClientRect().height   // 37
```

3. Every time, every row, both themes.

## Why it matters

It is the navigation for a 116-item list on the smallest screen the product supports.
Density on a desktop sidebar is a legitimate design choice; the same density under a
thumb is not the same choice, it is the desktop choice leaking onto a device it was
not made for.

Filed `minor` rather than `major` deliberately: the rows **are** tappable and Dilnoza
got where she was going. This is a papercut with a measured number attached, not a
blocked job.

## Where it lives

- `packages/silicaui/src/components/sidebar.js:112-126` — `.sidebar-item` has
  `paddingBlock: "0.5rem"` and `fontSize: "0.875rem"`, which computes to 37px with no
  minimum height and no touch-device allowance anywhere in the file.

## Do the siblings have it too?

**Almost certainly, and it is stated rather than assumed.** This is component CSS, so
every `Sidebar` gets it — including the **builder's own Layers and Insert rails**.
Those were not opened by this run, so this issue does not claim anything about them
beyond the shared source. **P03 and P05 confirm on the builder**, the same handover as
#003.

Not checked: whether `.menu`, `.dock`, `.tabs` or the other list-shaped components have
the same gap. They are a plausible class and nobody has measured them.

## The fix

**Touch devices only**, via `@media (pointer: coarse)`. A desktop sidebar's density is
a deliberate design choice and changing it would alter every consumer's layout for no
reason; a thumb is a different input and gets a different minimum.

That makes this safe for sparx and piggles: on a mouse, nothing changes at all.

## Confirmed by

`packages/silicaui/src/components/sidebar.js` now carries:

```js
"@media (pointer: coarse)": {
  [sel("-item")]: { minHeight: "2.75rem" },   // 44px
},
```

Verified in the **built stylesheet served by the running site**, not in the source:

```css
@media (pointer: coarse) {
  .sidebar-item {
    min-height: 2.75rem;
  }
}
```

Desktop density confirmed unchanged on the same pass: with a fine pointer the row is
still 37px, so no consumer's existing sidebar moves.

### This one is NOT fully confirmed, and saying so is the point

**The coarse-pointer branch was never exercised.** This machine reports
`matchMedia('(pointer: coarse)').matches === false`, so the rule that was written is the
one rule that could not be driven here. What has been proved is that it is emitted,
correctly scoped, and does not affect a mouse. What has **not** been proved is a 44px
row under an actual thumb.

That is a real gap, not a formality — a `min-height` can be defeated by a flex parent,
an `overflow`, or a competing rule, and none of that shows up in the CSS text.

**P09 (Gordon) confirms this on a real touch device**, tapping the docs nav on the iPad
at 768px. Until then this issue is `fixed` in the sense that the defect was understood
and addressed, and **unverified** in the sense that matters.

A false alarm was also cleared up while measuring this: a row's `<a>` starts 12px in
from the drawer edge, which looked like a dead zone. It is ordinary padding, the row is
216px of a 256px drawer, and a tap anywhere on the text navigates.

## Rating effect

Folded into `silicaui.com › Docs`. See [rating.md](../rating.md).
