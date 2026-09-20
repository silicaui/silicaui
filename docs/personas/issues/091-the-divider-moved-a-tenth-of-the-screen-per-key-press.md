# 091 — The divider moved a tenth of the screen per key press, so a keyboard user had six positions to choose from

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 6, the split
**Surface:** `@wizeworks/silicaui-panels` › `ResizablePanelGroup`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The Kaihō dashboard puts 800 vessel rows on the left and the handover note on
the right, with a divider between them. Where that divider sits is a preference a
duty officer forms over a shift, and the operations room's wall screen is driven
from a keyboard on a shelf.

The divider is a proper `separator`: reachable by Tab, `aria-valuenow`/`min`/`max`
on it, arrow keys move it, and it tells assistive tech where it went. All correct.

**How far one press moves it:**

```
what each ArrowLeft moved, in percent of the group   [10, 10, 10, 10]
one press, in pixels on this screen                  156px of 1556px
positions a keyboard user can choose between         6  (min 30% to max 80%)
```

A pointer has pixel precision. A key press had **six stops in the entire range**.

## Why it matters

This is not "the keyboard path is missing" — it is there and it works, which is
why nothing flags it. It is the same shape as
[090](090-reordering-without-a-mouse-announced-the-database-key.md): the keyboard
path exists, and what it gives you is not the same control the mouse gives you.

A duty officer nudging the divider to fit one more column cannot. The nearest
they can get is a 156px jump, which on this screen is two table columns.

And the coarse step buys nothing, because travel was already covered: `Home` and
`End` go to the ends, and Shift with an arrow jumps the whole way. A 10% step is
too coarse to adjust with and redundant with the keys that already leap.

## Where it lives

[packages/silicaui-panels/src/resizable-panels.tsx](../../../packages/silicaui-panels/src/resizable-panels.tsx) — `ResizablePanelGroup`

## The fix

`react-resizable-panels` takes a `keyboardResizeBy` and defaults it to `10` when
it is not given. The wrapper now gives it one, and says why:

```tsx
/**
 * One arrow press moves the divider by this much, as a percentage of the group.
 *
 * The underlying library defaults to 10, which on a 1,500px split is 156px a
 * press and leaves a keyboard user choosing between six positions in the whole
 * range. A pointer has pixel precision; an arrow key should at least be a nudge.
 * Travel is already covered without a coarse step: Home and End go to the ends,
 * and Shift with an arrow jumps the whole way.
 */
const KEYBOARD_STEP = 1;
```

Passed as `keyboardResizeBy={keyboardResizeBy ?? KEYBOARD_STEP}`, so a consumer
who wants the old behaviour, or a coarser one, still has it.

That is the whole job of a wrapper like this one: the library's default is a
reasonable library default, and a design system is where it gets decided.

## Confirmed by

The same probe, on the same screen, before and after:

```
before                                  after
[10, 10, 10, 10] percent per press      [1, 1, 1, 1] percent per press
156px of 1556px                         16px of 1556px
6 positions                             51 positions
✗ one arrow press is a nudge            ✓ one arrow press is a nudge
```

The failing reading is the real pre-fix build measured by the identical probe,
not a synthetic break.

The rest of act 6 held throughout:

```
✓ it announces itself as a separator
✓ it says where it currently is, and the range it can move in
✓ the left panel got smaller - 1058 -> 800
✓ the two panels still add up to the group - 1556 vs 1556
✓ the divider came back where it was left
✓ ...and that is NOT the default position, so surviving means something
✓ the notes panel actually collapsed - 0px
✓ the divider is still on screen to drag back
✓ the notes came back - 0px -> 402px
✓ Home takes it to the start of its range - Home moved it 48% -> 30%
✓ it stops splitting side by side          (360px: direction vertical)
✓ neither panel is a sliver                (360px: 326px and 326px)
✓ the page does not scroll sideways        (scrollWidth 360 of 360)
✓ the grip is visible in midnight - 7.13:1
✓ the grip is visible in cobalt   - 6.46:1
✓ the grab zone is wider than the bar you can see - 8px either side
```

The grab zone is worth recording because the bar is only 10px wide and looks
like it would be hard to hit: measured by grabbing at increasing distances until
it stopped working, the effective zone is **about 26px**, which clears the 24px
target-size minimum with a mouse, and the library widens it further for a coarse
pointer.

## Also recorded, not fixed: the separator announces a maximum it then exceeds

```
aria-valuemin  30
aria-valuemax  80
End            48% -> 100%
Shift+Right    30% -> 100%
```

The handle tells assistive tech its range is 30–80 and then reports
`aria-valuenow="100"`. An `aria-valuenow` outside `[valuemin, valuemax]` is
simply invalid, and a screen-reader user is told a range the control does not
keep.

The cause is upstream: `react-resizable-panels` computes `aria-valuemax` from the
neighbouring panel's `minSize` and does not account for that panel being
`collapsible`, which lets it reach 0 and the other reach 100.

**Deliberately not patched from the wrapper.** The only fix available from out
here is a `MutationObserver` on `aria-valuenow` that widens `aria-valuemax` once
the user has already gone past it. That makes the attribute *consistent* rather
than *true* — the range is still announced wrongly at the moment it matters,
which is before anyone moves — and it puts a DOM-mutation hack inside a wrapper
whose entire value is being thin. The honest fix is upstream, and this is written
down so the next person does not spend the afternoon rediscovering it.

Reproduction, for whoever takes it upstream: a `PanelGroup` with two panels where
the second has `minSize={20} collapsible`. The handle reports `aria-valuemax="80"`.
Press `End`.

## Rating effect

`Resizable panels` in [rating.md](../rating.md), once P07's screens are scored.
