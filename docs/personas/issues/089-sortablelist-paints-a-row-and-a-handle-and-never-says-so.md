# 089 — `SortableList` paints a row and a drag handle, and nothing in its docs, its types or its props says so

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 5, the watchlist
**Surface:** `@wizeworks/silicaui-dnd` › `SortableList`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

I installed the package, read the README, and wrote the documented example. What
I got was a box inside a box:

```
the row the PACKAGE draws   {"width":467,"border":"1px solid oklch(0.3 0.022 255)",
                             "background":"oklch(0.18 0.018 255)","padding":"9.6px 12px","radius":"4px"}
the row the CONSUMER drew   {"width":459,"border":"1px solid oklch(0.3 0.022 255)",
                             "background":"oklch(0.18 0.018 255)","padding":"8px 12px","radius":"6px"}
```

Two borders, two backgrounds, and two different radii on the same row — 4px from
the package, 6px from me. And the inner box did not fill the row it sat in:

```
how far every row's contents fall short of its row
  [-8, -206, -258, -170, -211, -210, -185, -184, -225]
```

**Up to 258px of a 467px row, empty.** Nine rows of ragged, mismatched boxes,
which is what the screenshot of act 5 showed before the fix.

## Why it matters

The package **does** style its rows. `packages/silicaui/src/components/sortable-list.js`
ships `.sortable-list`, `.sortable-item`, `.sortable-item[data-dragging]` and a
complete `.sortable-handle` — grab and grabbing cursors, a hover ink, a
`:focus-visible` outline, an svg size. All of it real, all of it correct.

**None of it is reachable from the package's own surface.**

- The README describes `renderItem` as "Render a row", and its example returns a
  `<div>`. Following the documentation exactly is what produces the double box.
- The `<li>` is `display: flex`, so a consumer's single wrapper is a flex item at
  its natural width. The README's own example therefore yields a row that is
  mostly empty — and the first row hides it, because the longest item stretches
  to fill and looks correct.
- `.sortable-handle` exists and **nothing tells a consumer it does.** It is not in
  the README, not in the props table, not on `SortableItemContext`. Worse, the
  class name is prefix-dependent (`${prefix}sortable-handle`), so a consumer
  could not hardcode it even having found it. So every consumer hand-rolls the
  handle — which is RULE #1's "a hand-rolled replacement for something silicaui
  already provides" — and most will not think to add a focus ring. I did not.
- There is no way to put a class on the row at all. `className` goes to the
  `<ul>`. A consumer who wants a different row surface has no hook whatsoever.

This is the "a promise in copy is a contract" shape, inverted: the package keeps
a promise it never made, and the consumer paints over it.

## Where it lives

[packages/silicaui-dnd/src/sortable-list.tsx](../../../packages/silicaui-dnd/src/sortable-list.tsx) — `SortableRow`, `SortableListProps`
[packages/silicaui/src/components/sortable-list.js](../../../packages/silicaui/src/components/sortable-list.js) — `.sortable-item`
[packages/silicaui-dnd/README.md](../../../packages/silicaui-dnd/README.md) — usage + props table

## The fix

**The handle's class rides along with its props**, so the documented usage is
styled without anyone having to know a prefix-dependent class name:

```tsx
const handleProps = {
  ...attributes,
  ...(listeners ?? {}),
  className: cx(sc("sortable-handle")) || undefined,
} as SortableHandleProps;
```

**A single wrapper fills its row**, which is the shape the README shows:

```js
// Scoped to `:only-child` so the ordinary case (a handle, a label and a badge
// side by side) keeps its own sizing.
"& > :only-child": { flex: "1 1 auto", minWidth: "0" },
```

**`itemClassName` reaches the row**, which nothing could before.

**And the documentation says what the component does.** The README now opens the
usage section with "The list and its rows come styled", shows an example that
returns the row's contents, explains that `ctx.handleProps` carries a `className`
that spreading-then-overriding will replace, and the props table gained
`getItemLabel`, `handle`, `className` and `itemClassName` — four props that
existed and were not listed.

## Confirmed by

The Kaihō watchlist, rewritten onto the component the way the fixed docs
describe:

```
8 - does the component style its own rows, and did I know?
  · CSS rules found for .badge (the control) - 2
  ✓ the scanner works at all
  · rules for .sortable-item - [".sortable-item",".sortable-item[data-dragging]",
                                ".sortable-item[data-dragging] .sortable-handle"]
  ✓ the list and the row ARE styled by the package
  ✓ and so is a drag handle, if you know the class name
  ✓ there is not a bordered box inside a bordered box
  · how far every row's contents fall short of its row - [0,0,0,0,0,0,0,0,0]
  ✓ the row contents fill the row, on every row and not just the longest
```

And the **documented shape** — `renderItem` returning one wrapper — built out of
the real classes in the real page, because the Kaihō watchlist returns three
children and would never exercise that rule:

```
{"rowWidth":401,"wrapperShortBy":0,"flexGrow":"1"}
✓ a single wrapper fills its row
```

**Deliberately broken to watch it fail.** With `& > :only-child` removed:

```
{"rowWidth":401,"wrapperShortBy":-310,"flexGrow":"0"}
✗ a single wrapper is 310px short of its row, of 401px
```

Restored: 0px short, `flex-grow: 1`. The handle now reports
`"classes":"sortable-handle"` where it previously reported a hand-rolled
`"cursor-grab rounded-field p-1 text-base-content hover:bg-base-200 active:cursor-grabbing"`.

The rest of act 5 held throughout — nine rows, reorder by keyboard and by mouse,
the order surviving a reload, and a row dropped on itself changing nothing.

## Three of my own checks were measuring nothing

All three read as findings, and all three were mine:

- **A CSS scan that walked only the top level of each stylesheet.** Tailwind v4
  emits everything inside `@layer`, whose rules carry no `selectorText`, so the
  scan found zero rules for every class on the page and reported "the component
  ships class names with no rules behind them" — a defect that did not exist. The
  rewrite recurses through grouping rules and carries a control: `.badge`, a class
  that is definitely styled. Had that control been there the first time, the
  scan's own failure would have been obvious instead of being read as a product
  defect.
- **A source grep with the wrong file extensions.** `--include=*.ts --include=*.css
  --include=*.mjs` over a plugin whose components are all `.js`. It found nothing
  and that nothing corroborated the bad scan. Two wrong checks agreeing is not
  evidence.
- **A width check that measured the one row that cannot fail.** It read the first
  row, which holds the longest vessel name and therefore stretches to fill
  whatever the layout does. Measuring every row turned "-8px" into "-258px".

## Rating effect

`Sortable list` in [rating.md](../rating.md), once P07's screens are scored.
