# 098 — The only control that sorts the table was twenty pixels tall

**Status:** fixed
**Severity:** low
**Found by:** P07 · Hiroshi Tanabe · act 9, the phone
**Surface:** `@wizeworks/silicaui-table` › the sort header
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Every tap target on the phone, measured:

```
tap targets under 24px
  [{"what":"Vessel","size":"52x20"},
   {"what":"Line","size":"40x20"},
   {"what":"TEU","size":"39x20"},
   {"what":"Utilisation","size":"75x20"},
   {"what":"Delay","size":"49x20"}]
```

Five of them, all the same thing: `.data-table-sort`, the button inside each
header cell. **20px tall**, under the 24px a target needs to be hittable with a
thumb (WCAG 2.5.8).

## Why it matters

It is small and it is the only way to sort. `.data-table-sort` carries
`padding: 0` and no height, so it is exactly one line of 13px text — and a duty
officer on a phone trying to sort by delay is aiming at a 20px strip.

The header cell has the vertical room already; the button just was not taking it.

## Where it lives

[packages/silicaui/src/components/data-table.js](../../../packages/silicaui/src/components/data-table.js) — `.data-table-sort`

## The fix

```js
[sel("-sort")]: {
  display: "inline-flex",
  alignItems: "center",
  // A sort control is the only way to reorder the table, and with no padding of
  // its own it is exactly one line of 13px text tall — 20px, under the 24px
  // minimum a target needs to be hittable with a thumb. The header cell already
  // has the vertical room, so this costs no layout.
  minHeight: "1.5rem",
  …
}
```

## Confirmed by

```
· tap targets whose PAINTED box is under 24px
  [{"what":"Resize the fleet table against the","size":"326x10"}]
· the divider — painted 326x10, effective touch target ~26px (measured)
✓ every tap target clears 24px, painted or effective — 0 under 24px
```

The five header buttons are gone from the list, and the table's layout is
unchanged at both sizes.

## The one that looked like a defect and is not

The resize divider is painted 326x10 and is **not** 10px to hit: the panels
library widens the pointer hit area beyond the painted bar. Measured with real
touch input through the devtools protocol — grabbing at 0px and 8px from the
centre works, 14px does not, so the effective target is **about 26px**.

That measurement took two attempts. The first dispatched synthetic `TouchEvent`s
and reported "cannot grab" at every distance **including zero** — which is its
own control saying the method was wrong, not the handle. Synthetic touch events
do not reach a library listening for pointer events.

## Rating effect

`Data table` in [rating.md](../rating.md), once P07's screens are scored.
