# 093 — A numeric column could not put its header over its numbers

**Status:** fixed
**Severity:** low
**Found by:** P07 · Hiroshi Tanabe · act 7, looking at the screen as a designer
**Surface:** `@wizeworks/silicaui-table` › `DataTable`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Kaihō's fleet table right-aligns TEU and Utilisation, because that is how you
read a column of figures. The headers stayed on the left:

```
column          align   header right   cell right   gap
  TEU           left    576            660          -83
  Utilisation   left    759            807          -48
```

**The word "TEU" sits 83px to the left of the numbers it names.** At a glance the
table reads as more columns than it has.

## Why it matters

Small, and the consumer cannot fix it. They supply a cell renderer and never
touch the `<th>`, the `<td>`, or the sort button inside the header — all three
belong to `DataTable`. The only thing reachable is the cell's contents, which is
why the figures were right-aligned and the header was not.

So the component had a requirement it could not meet and no way to say so.

## Where it lives

[packages/silicaui-table/src/data-table.tsx](../../../packages/silicaui-table/src/data-table.tsx)
[packages/silicaui/src/components/data-table.js](../../../packages/silicaui/src/components/data-table.js)

## The fix

Alignment through TanStack's own per-column `meta`, which is the designed
extension point, with the module augmentation so it typechecks:

```ts
{ accessorKey: "teu", header: "TEU", meta: { align: "right" } }
```

`<th>` and `<td>` carry `data-align`, and two CSS rules do the rest. The sort
button is already `inline-flex`, so it follows the cell's `text-align` with no
rule of its own — which is why this is four lines of CSS rather than a layout
change.

## Confirmed by

```
column          align   header right   cell right   gap
  TEU           right   660            660          0
  Utilisation   right   807            807          0
✓ numeric headers sit over their numbers, worst gap 0px
```

**Deliberately broken to watch it fail**: `meta.align` removed and the old
`block text-right` cell spans put back, which is the exact pre-fix shape — 83px
and 48px. Restored: 0px on both.

A side effect worth naming: the cells no longer need
`<span className="block text-right">` at all, so the column definition got
shorter rather than longer.

## Rating effect

`Data table` in [rating.md](../rating.md), once P07's screens are scored.
