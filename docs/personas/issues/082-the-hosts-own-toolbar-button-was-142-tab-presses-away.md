# 082 — The host's own toolbar button was 142 tab presses away

**Status:** fixed
**Severity:** high
**Found by:** P05 · Arvid Lindqvist · act 4, and the "without a mouse" standing check
**Surface:** Site builder › Inspector › Design
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 4 asks for both toolbar slots to be **keyboard-reachable**. The action slot
holds Quarrystone's own "Send for review" button — the thing the whole embed
exists to make possible.

It was reachable. Eventually.

```
from the app header:                      7 tab presses away
from the canvas, nothing selected:       52 tab presses away
with a node selected and Design open:   142 tab presses away
```

The Design tab alone cost **141 tab stops**, because every chip in every
mutually-exclusive group was its own:

```
groups costing more than 3 tab stops each:
   10 stops  role=group  "Color"
   10 stops  role=group  "SizeAutoXSSMMDLGXL2XL3XL4XL5XL"
   12 stops  role=group  "Background"
   13 stops  role=group  "PaddingAuto023468101216202432"
   13 stops  role=group  "Padding XAuto023468101216202432"
   13 stops  role=group  "Padding YAuto023468101216202432"
    5 stops  role=group  "Corners"
    4 stops  role=group  "DisplayAutoBlockFlexGrid"
```

Pick one padding value with a keyboard and you have pressed Tab thirteen times
to move past a single control.

## Why it matters

A keyboard user selects a block, opens Design, and is then **inside** the rail.
Every route out of it — the host's toolbar action, Publish, the page switcher,
the app's own navigation — is on the far side of a hundred and forty presses.
That is not slow, it is a wall.

And it is a seam problem specifically. A host puts its most important action in
`toolbarSlot` because that is where the contract says host actions go. If the
builder's own rail costs 141 stops to cross, the host's action is unreachable in
practice for anyone not using a mouse — the embed looks fine and is not.

## The pattern that was already right, one component away

The builder's own **tab strips** do this correctly: `role="tablist"`, one tab in
the tab order, arrow keys to move between them. It is the standard roving
tabindex, it is already in this codebase, and it had not reached the rows of
chips underneath.

## Where it lives

[packages/silicaui-builder/src/site/react/Inspector.tsx](../../../packages/silicaui-builder/src/site/react/Inspector.tsx) — `RovingRow`

## The fix

One shared `RovingRow` wrapper, applied to all six components that render these
rows:

| | |
| --- | --- |
| `ChipGroup` | Size, Weight, Align, Padding ×3, Display direction, Fit, … |
| `SwatchGroup` | Color, Background |
| `RadiusSwatchGroup` | Corners |
| `FocalGrid` | Focal point |
| the inline Display row | Auto / Block / Flex / Grid |
| the inline Animate Trigger row | None / Load / Scroll / Hover |

It works on the **DOM** rather than through props, and that is deliberate: those
six are not one component, threading `tabIndex` through all of them would be six
chances to miss one, and wrapping them means the next row anybody adds gets it
for free.

Three behaviours, all of them things a person would expect:

- **Exactly one chip is in the tab order, and it is the ACTIVE one** — so
  entering a group lands on the value that is set, and arrowing from there moves
  relative to where you are. "Active" is read off the same signals the chips
  already paint with (`aria-pressed`, `btn-primary`), so there is no third source
  of truth to drift.
- **Arrow keys move inside**, wrapping at both ends.
- **Home and End jump to either end**, because thirteen padding chips are a long
  arrow away.

The chips keep their own roles and names, and the row keeps `Row`'s
`role="group"` + `aria-labelledby`, so nothing a screen reader already relied on
changes. What changes is that Tab treats the set as the single control it is.

## Confirmed by

```
from the app header:                      7 tab presses away   (unchanged)
from the canvas, nothing selected:       52 tab presses away   (unchanged)
with a node selected and Design open:    34 tab presses away   (was 142)
```

and the group census:

```
groups costing more than 3 tab stops each:
  (none)
```

Act 4, on the real embed:

```
  ✓ the action is a real button
  ✓ the status is NOT a button — it is not pretending to be pressable
  ✓ both are in the toolbar row
  ✓ the action is reachable by keyboard
  ✓ ...and shows a focus ring
  · pressing it says — "Sent 1 page(s) for compliance review."
  ✓ the action reads the document through extract()
```

An e2e in `inspector-a11y.spec.ts` asserts the whole tab cost stays under 60,
that exactly one chip per row is in the tab order, that Arrow and Home/End move
within it — and, as the control that matters, **that pressing Enter on the chip
the keyboard landed on still applies it.** A fix that made the controls
unreachable would have passed every other assertion.

**Deliberately broken to watch it fail**: every chip put back in the tab order,
the test went red; restored, green. Builder e2e **213 passed**, `pnpm verify`
exit 0, typecheck clean.

## The control-character check caught me writing this one

Worth recording, because it happened to the fix for this issue, hours after
[078](078-two-regexes-that-could-never-match.md) shipped the check that catches it.

`RovingRow` reads which chip is active off the same signals the chips already
paint with, and the class half of that read was written as:

```
/<U+0008>btn-primary<U+0008>|<U+0008>ring-primary<U+0008>/
```

— four literal backspace bytes where the word-boundary escape was meant, from
exactly the same kind of scripted edit. The regex could never match, so the
class fallback was dead and only `aria-pressed` was doing any work. `ChipGroup`
sets `aria-pressed`, so the tests passed; the swatch and corner rows do not, so
on those the tab stop was the FIRST chip rather than the active one — a quiet,
partial wrong that nothing on screen would have shown.

`pnpm verify` failed on it within a minute of the file being saved, named the
file, the line and the code point. That is the check paying for itself on its
first day.

## A measurement that was wrong first

The first reading of this check said the toolbar button was **not reachable at
all** after 60 presses. That was the test, not the product: the walk started from
wherever focus happened to be after act 3's clicking, which was deep inside the
right rail. Blurring first and walking further found it at 142 — which is the
real number and a much more useful one than "unreachable".

## Also recorded, not fixed

**`role="radiogroup"` would be more honest than `role="group"`** for a set where
exactly one member is chosen, and would let a screen reader announce "3 of 13".
Not done here: `Row` owns the `role="group"` + `aria-labelledby` pairing and is
shared with rows that are genuinely just groups, so making the radiogroup
correct means plumbing the label id down to the inner row. Worth doing, bigger
than this, and named rather than half-done.

**The Design tab is still 34 stops.** Every remaining stop is a distinct control
rather than a chip in a set, so there is no obvious further win without hiding
things. Recorded as the number it now is.

## Rating effect

`Site builder › Inspector` in [rating.md](../rating.md).
