# 088 — The table sorted the other way round from its own documentation, and said nothing while it was loading

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 3, 800 rows
**Surface:** `@wizeworks/silicaui-table` › `DataTable`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Two small things on a component that otherwise did act 3 first time.

### 1. The prop said one thing and the component did another

```ts
/** Column sorting (click header to cycle asc → desc → none). Default `true`. */
sortable?: boolean;
```

Measured, on the Kaihō fleet:

```
clicking Delay  — none -> descending    ["140h late", "139h late", "139h late", …]
clicking Delay  — descending -> ascending  [-6, -6, -6, …]
clicking Vessel — none -> ascending      ["MV Açu Carrier", …]
```

The first click is **descending on a numeric column and ascending on a text
column**. The doc says asc first, always.

### 2. Loading was a sighted-only signal

```
while loading — {"rows": 8, "skeletons": 56, "busy": null, …}
```

Eight skeleton rows appear and the real data is gone. `aria-busy` was never set,
so a screen-reader user hears the row count change and nothing else — the table
quietly swaps eight vessels for placeholders and says so to nobody. On a
dashboard that refreshes itself every fifteen minutes, that happens on its own,
without anyone pressing anything.

## Why it matters

The sorting one is small and it is still a defect of the kind this framework
exists to catch: **a promise in a doc comment is a contract.** A doc that
describes the opposite of the behaviour is worse than no doc, because a
consumer writes a test against it — and that test then fails on correct code.

The `aria-busy` one is the more ordinary kind of gap: a state that exists and is
only expressed in pixels.

## Where it lives

[packages/silicaui-table/src/data-table.tsx](../../../packages/silicaui-table/src/data-table.tsx) — `DataTableProps.sortable`, the root element

## The fix

**The behaviour is right and the doc was wrong**, so the doc changed:

> Clicking a header cycles through both directions and back to unsorted, and
> **which direction comes first depends on the column's type**: a numeric column
> starts DESCENDING and a text column starts ASCENDING. That is not an accident
> of the engine, it is what a person means by the click — pressing "Delay" on a
> fleet list means *show me the worst*, and pressing "Vessel" means *start at A*.

It also now points at `aria-sort` on the header as the honest thing to assert
against, which is what this run ended up doing.

**And the table says when it is busy:**

```tsx
aria-busy={loading || undefined}
```

## Confirmed by

```
2 — sorting the delay, which goes negative
  ✓ clicking Delay actually changed the sort — none -> descending
  ✓ the rows match the direction the header claims — descending: [140,139,139,137,137,136]
  ✓ the second click matches ITS direction too — ascending: [-6,-6,-6,-6,-6,-6]
  ✓ the two clicks are opposite directions — descending then ascending
  · the earliest ship in the data — -6h
  ✓ ...and it is the one the table put first — -6 vs -6
  ✓ a numeric column opens on the worst, descending

6 — the loading state
  · while loading — {"rows":8,"skeletons":56,"busy":"true", …}
  ✓ it shows placeholder rows rather than an empty box
  ✓ ...and they are not real data
  ✓ ...and it SAYS it is busy, for anyone not looking at the skeletons
  ✓ the data comes back when the refresh ends
```

The negative-delay check does not merely assert "something sorted": it takes the
**minimum delay in the 800 rows** straight from the data and asserts the table
put that exact ship first. `-6h` both sides.

## What the rest of act 3 found: nothing

The table handled everything else first time, and these are worth writing down
because they are the parts most likely to be wrong:

- **800 rows in, 25 drawn.** The whole fleet reaches the component and it pages.
- **A real collator, not code points.** `MV 東京丸` sorts where a Yokohama desk
  looks for it. Checked by paging to row 359 — the first row where a collator
  order and a code-point order disagree — and comparing there, because page one
  is twenty-five copies of one name and is identical under both.
- **The 43-character vessel truncates with an ellipsis**, keeps the row one line
  tall, carries the full name on `title`, and does not push the table past the
  window: 1616 px in a 1700 px viewport.
- **The empty state is reachable by a real control** (a search that matches
  nothing) and says what to do next.

## Four of my own checks were measuring nothing

All four read as passes or as product defects, and all four were mine:

- **The sort control is a `<button>` inside the `<th>`.** Clicking the header
  cell landed on its padding, so the first run read the unsorted seed order and
  called sorting broken. Fixed by clicking the button and asserting `aria-sort`
  changed — a control a missed click cannot fake.
- **Page one is twenty-five copies of one name**, identical under a collator and
  under code points, so "the table did not use code points" could not fail there.
- **"Santa Catarina" stopped matching the 43-character ship** once the generated
  fleet contained `MV Santa Catarina Carrier`; the check was then measuring a
  25-character name and calling it the long one.
- **The first click was assumed to be ascending.** It is not, and the component
  is right.

## Rating effect

`Data table` in [rating.md](../rating.md), once P07's screens are scored.
