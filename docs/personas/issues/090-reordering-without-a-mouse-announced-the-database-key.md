# 090 — Reordering without a mouse announced the database key, and the grip you reach for was under the contrast floor

**Status:** fixed
**Severity:** high
**Found by:** P07 · Hiroshi Tanabe · act 5, the watchlist
**Surface:** `@wizeworks/silicaui-dnd` › `SortableList`, and `.sortable-handle` in the plugin
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Kaihō's watchlist is nine vessels in the order the duty officer thinks matters.
The operations room's wall screen is driven from a keyboard on a shelf, so
"reorder it without a mouse" is not an accessibility nicety here, it is the
primary input.

The reorder itself worked first time — Tab reaches the handle in two presses,
space picks up, arrows move, space drops, and the row that was picked up is the
row that moved, by exactly the number of arrows pressed.

**What it said while doing it:**

```
"Draggable item v-santa-catarina was moved over droppable area v-santa-catarina."
"Draggable item v-santa-catarina was moved over droppable area v-5."
"Draggable item v-santa-catarina was dropped over droppable area v-5"
```

That is the entire feedback channel for a person who cannot see the list move.
It names two database keys and no position. `v-5` is a row in an array; it is not
a ship, it is not a place in a list, and there is no way to count to it.

**And the grip itself, measured:**

```
the grip in cobalt (light)   2.88:1
```

Below the 3:1 a user-interface component owes (WCAG 1.4.11). The grip is the only
thing on the row that says the list can be reordered at all.

## Why it matters

These are one defect wearing two coats: **the reorder works and cannot be
used.**

The announcement half is dnd-kit's default, and dnd-kit is right to default that
way — it only knows the drag identity. `SortableList` is the layer that knows
both the id and the item, and it was passing neither. A wrapper that adds a
Silica look and drops the part a blind user depends on is a worse wrapper than
none.

The contrast half is more interesting, because a rule exists that should have
caught it and deliberately does not. `verify-readable-ink.mjs` enforces RULE #3,
and its allowlist reads:

> Legitimately faded, and why: … **icons and glyphs** — not text (see ALLOW_EXPLICIT)

A grip **is** a glyph, so the probe waves it through — and **under that exemption
there is no floor at all.** A glyph that is the only affordance for an
interaction still has to be visible. Nothing in the repo can currently catch
that.

## Where it lives

[packages/silicaui-dnd/src/sortable-list.tsx](../../../packages/silicaui-dnd/src/sortable-list.tsx) — `SortableList`, the `accessibility` prop
[packages/silicaui/src/components/sortable-list.js](../../../packages/silicaui/src/components/sortable-list.js) — `.sortable-handle` color

## The fix

**The list says what moved, and where it went.**

```tsx
onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, ${positionOf(active.id)}.`,
onDragOver:  ({ active, over }) => `${nameOf(active.id)} moved to ${positionOf(over.id)}.`,
onDragEnd:   ({ active, over }) => `${nameOf(active.id)} dropped in ${positionOf(over.id)}.`,
onDragCancel:({ active }) => `Reordering cancelled. ${nameOf(active.id)} is back in ${positionOf(active.id)}.`,
```

with a new optional `getItemLabel` supplying the name, and a `positionOf` that
says "position 3 of 9" rather than naming the row it landed next to. The screen
reader instructions now name escape as well, because a cancel that nobody is told
about is not a cancel.

`getItemLabel` is optional and falls back to the id, which is the honest default:
a list whose ids are already words loses nothing, and a list whose ids are keys
gets told so in the prop's own documentation.

**The grip gets ink a person can see.**

```js
// 65%, not 45%.
color: muted(65),
```

Measured on the real themes, through a canvas so the numbers are real sRGB:

| | 45% (before) | 65% (after) | the vessel name beside it |
| --- | --- | --- | --- |
| midnight (dark) | 4.09:1 | **7.32:1** | 16.25:1 |
| cobalt (light) | **2.88:1** | **5.31:1** | 16.87:1 |

65% clears the bar in both themes with margin, and the grip still reads as
quieter than the label beside it — which was the point of fading it, and is a
thing you get from the gap between 7:1 and 16:1 without going under 3:1.

## Confirmed by

```
9 - what a person hears while reordering without a mouse
  · the handle that has focus - "Reorder MV Santa Catarina do Sul Navegação Costeira"
  · announced - "MV Santa Catarina do Sul Navegação Costeira moved to position 1 of 9."
  · announced - "MV Santa Catarina do Sul Navegação Costeira moved to position 2 of 9."
  · announced - "MV Santa Catarina do Sul Navegação Costeira dropped in position 2 of 9."
  ✓ the announcements name the vessel, not a database key

10 - can the duty officer SEE the grip, in BOTH themes?
  · the measuring tool, on two colours whose answer is known - {"blackOnWhite":21,"whiteOnWhite":1}
  ✓ the contrast tool is right before it is trusted
  · the grip in midnight - 7.32:1 (the vessel name beside it is 16.25:1)
  ✓ the grip clears 3:1 in midnight
  ✓ ...and is still quieter than the name beside it in midnight
  · the grip in cobalt - 5.31:1 (the vessel name beside it is 16.87:1)
  ✓ the grip clears 3:1 in cobalt
  ✓ ...and is still quieter than the name beside it in cobalt
```

**Deliberately broken to watch both fail.** With the `accessibility` prop removed
and the grip back at 45%:

```
  · announced - "Draggable item v-santa-catarina was moved over droppable area v-5."
  ✗ the announcements name the vessel, not a database key - they name the id
  · the grip in cobalt - 2.88:1
  ✗ the grip clears 3:1 in cobalt
```

Restored: names and positions, 5.31:1.

## My contrast number was fiction the first time

The first measurement said the grip was **1.77:1 in midnight**, and it was
nonsense. `getComputedStyle().color` returns `oklab(0.95 -0.00273616 -0.00751754 / 0.45)`
in this browser, and the check pulled the numbers out of that **text** with a
`[\d.]+` regex and treated them as 0-255 channels. Every ratio it produced was
invented.

The tell was in the run and I nearly missed it: **full-strength body ink scored
1.03:1 against its own surface**, which cannot happen. Nothing else in the table
looked wrong.

The rewrite paints each colour into a `<canvas>` and reads the pixel back, which
is the browser doing its own conversion, and it proves the tool before trusting
it — `black on white` must be 21 and `white on white` must be 1, checked on every
run. With a working tool the real answer turned out to be the opposite of the
false one: the grip was **fine in dark (4.09:1) and failing in light (2.88:1)**.

A wrong measurement that points at the wrong theme is worse than no measurement,
because the fix it suggests is the wrong fix.

## Also recorded, not fixed

**The exemption with no floor.** `verify-readable-ink.mjs` exempts "icons and
glyphs" from RULE #3 on the correct grounds that they are not text — and stops
there. An interactive glyph owes 3:1 as a user-interface component, and nothing
checks it. A probe for this is real work: the contrast maths lives in
`@wizeworks/silicaui-html` and is deliberately not reimplemented, and deciding
which faded inks are *affordances* rather than de-emphasised decoration needs a
curated list, not a pattern match. Worth doing as its own pass.

**Two siblings of the same shape, found by grep and NOT resolved.** The plugin
fades two other control affordances the same way: `carousel.js:106` (the inactive
dot, 45%) and `scroll-area.js:77` (the scrollbar thumb, 25%). Measured on the
docs site, the carousel dot came out at 2.9:1 light and 1.04:1 dark — but the
same run showed the dot computing an **identical dark ink in both themes** while
the surface behind it flipped correctly, which means either a real defect or an
artefact of how that page switches theme. **It is not resolved and it is not
being reported as a number.** Neither component was driven by this persona;
both need their own measurement on a page whose theme state is known.

## Rating effect

`Sortable list` in [rating.md](../rating.md), once P07's screens are scored.
