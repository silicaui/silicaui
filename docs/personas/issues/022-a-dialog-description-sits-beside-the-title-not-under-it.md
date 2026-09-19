# 022 — The dialog title split over two lines with its description beside it

**Status:** fixed
**Severity:** minor
**Found by:** P01 · Dilnoza Karimova · act 8
**Surface:** `@wizeworks/silicaui` › `.dialog-header` (and `.drawer-header`)
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Building the "New shipment" dialog, written the way the component names read:

```tsx
<DialogHeader>
  <DialogTitle>New shipment</DialogTitle>
  <DialogDescription>Booked against Peregrine's own reference series.</DialogDescription>
</DialogHeader>
```

The title came out in a squeezed left-hand column, **wrapping "New" / "shipment" over two
lines**, with the sentence sitting beside it in the other half. No error, no warning, no
type complaint — just a dialog that looks like nobody designed it.

`.dialog-header` is `display: flex` + `justify-content: space-between`, which is right for
what it was built for: a title on one side and a close button on the other. The docs demo
shows exactly that, with the description placed *after* the header rather than inside it.

## What should have happened

A description belongs under its title. Whatever else `DialogHeader` is for, it is named
after the place a title goes, so putting a title and its description in it is the obvious
move — and the obvious move should not produce a two-column layout.

## How to reproduce

1. Any theme, any width.
2. Render a `DialogHeader` containing a `DialogTitle` and a `DialogDescription`.
3. The two sit side by side; the title wraps to fit half the popup.

Every time.

## Why it matters

Cosmetic, and said plainly: nothing is unreadable and nothing is unreachable. It matters
because of the shape rather than the severity — the component's name invites a usage that
silently produces a worse result, which is the same class as issue 017 (two names for
polymorphism) and the reason this run exists. A developer who writes it this way has no
signal that they are holding it wrong; they just think the dialog looks cheap.

## Where it lives

- `packages/silicaui/src/components/dialog.js` — `.dialog-header`, `.dialog-description`
- `packages/silicaui/src/components/drawer.js` — the identical pair

## Do the siblings have it too?

**Yes, one.** Scanning every component for a `-header` that is `flex` + `space-between`
found five — `accordion`, `calendar`, `dialog`, `drawer`, `meter`. Of those, only
**`dialog` and `drawer` also ship a `-description`**, which is what makes the trap
possible; the other three have no description part to put in the wrong place.

`drawer.js` had the identical rule and is fixed identically. `AlertDialog` re-exports
`DialogHeader`, so it takes the fix through the same class.

## The fix

Not a redesign — the bar is still a row, because the row is right for title + close. It
just wraps now, and the description takes a full basis:

```js
// .dialog-header
flexWrap: "wrap",

// .dialog-description
flexBasis: "100%",
```

Three cases, all correct after:

| header contains | result |
| --- | --- |
| title + close button | one row, unchanged — nothing is wide enough to wrap |
| title + description | title row 1, description row 2 |
| title + description + close | title and close row 1, description row 2 |

`flex-basis` does nothing outside a flex parent, so a `DialogDescription` placed in its
normal position — directly in `DialogContent`, as the docs demo does — is untouched.

## Confirmed by

Re-ran act 8 on the console, **rebuilt cold after `node sync-silica.mjs`** (the first
attempt looked like the fix had failed, which turned out to be issue 019's stale-copy
problem rather than this one).

The title now renders on **one line** at full popup width with the description on its own
row beneath it — read off the geometry, not just the screenshot:
`titleOnItsOwnRow: true`, `titleLines: 1`.

Held at **360px asserted** (`documentElement.clientWidth === 360`, via the oversized-iframe
method): the popup is exactly 360px at `x: 0`, the page does not scroll sideways, the title
is still one line on its own row, and Cancel / Book it / the port select are all present.

Both themes: every text element inside the dialog passes AA — worst 5.72 in dark and 4.42
in light, the latter being the required asterisk, which act 8 then fixed separately as
issue 024.

## Rating effect

None recorded. The console's own screens are not in `rating.md`, and silicaui.com's Dialog
doc page was not opened as a screen in this act.
