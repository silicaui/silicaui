# 095 — A refresh moved the selection to a different ship, and told the app it had not

**Status:** fixed
**Severity:** blocker
**Found by:** P07 · Hiroshi Tanabe · act 8, the refresh arriving mid-edit
**Surface:** `@wizeworks/silicaui-table` › `DataTable`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Kaihō's dashboard refreshes itself every fifteen minutes. A real fleet feed does
not hand back the same rows forever: delays move, a vessel that has berthed drops
off the board, and one just picked up appears. The vessel that berths is wherever
it happens to sit, which is the middle of the list.

The duty officer has a sort applied, one vessel ticked, and a half-typed note.
The refresh lands.

**Before:**

```
the vessel the duty officer selected             ["MV Açu Navegação Costeira"]
which row shows a tick, before anything happens  ["MV Açu Navegação Costeira"]
its delay, as the dashboard was handed it        139
```

**After:**

```
which row has its box ticked on screen           []
what the dashboard now thinks is selected        ["MV Açu Navegação Costeira"]
its delay, as the dashboard reports it           139
its delay, as the row on screen says it          138h late
```

**Nothing is ticked on screen, and the app has been told a vessel is selected
that carries a delay figure the table itself no longer shows.**

## Why it matters

Two defects, and they compound into the worst kind: the screen and the app
disagree, and neither says so.

**Selection was remembered by POSITION.** `DataTable` never set TanStack's
`getRowId`, so the default applies and the selection map is keyed by the row's
index in the array. Position is not identity on a screen that refreshes itself —
drop a vessel out of the middle and every row after it shifts by one. The tick
then belongs to a row number, not a ship.

**And the caller was never told.** The effect that surfaces the selection ran on
`[rowSelection, selectable]`. A data change does not change the selection *key*,
so the effect did not re-run, and the consumer kept holding **the row objects it
was handed before the refresh** — a vessel whose delay has since moved, or which
has berthed and is not in the fleet at all.

On this dashboard that is a duty officer acting on a ship they think is selected,
reading a delay that is fifteen minutes stale, while the table shows nothing
selected at all. It is a `blocker` because it is silent: every individual piece
looks right.

The first version of this test did not catch it, and that is worth recording.
The refresh it used dropped the FIRST row and added one at the front, which
leaves every other row's index exactly where it was — so a positional selection
survived by luck, and the act passed. A refresh where the departing vessel leaves
from the middle is both more realistic and the only one that asks the question.

## Where it lives

[packages/silicaui-table/src/data-table.tsx](../../../packages/silicaui-table/src/data-table.tsx) — `useReactTable`, the selection effect

## The fix

**A row with an `id` is identified by it:**

```tsx
const rowId = React.useMemo(() => {
  if (getRowId) return getRowId;
  const allIdentified =
    data.length > 0 &&
    data.every((row) => {
      const id = (row as { id?: unknown }).id;
      return typeof id === "string" || typeof id === "number";
    });
  if (!allIdentified) return undefined;
  return (row: TData) => String((row as { id: string | number }).id);
}, [data, getRowId]);
```

Checked against the **whole** dataset rather than the first row: a half-identified
dataset would key some rows by id and some by position, which is worse than
either. Data without ids keeps the old behaviour, because position is all a table
can do when nothing identifies a row — and a new `getRowId` prop lets a caller
say what identity means when it is not an `id` field.

**And the caller is told when the rows change:**

```tsx
}, [rowSelection, selectable, data]);
```

`data` is in there deliberately. The selection *key* can survive a data change;
the row behind it cannot be assumed to.

## Confirmed by

```
2 - the refresh arrives
  ✓ the sort survived - descending -> descending
  ✓ the data actually changed, or this act proves nothing
  ✓ the SAME VESSEL is still selected, not the same row number
  · its delay now, as the dashboard reports it - 142
  · its delay now, as the row on screen says it - 142h late
  ✓ the dashboard was handed the CURRENT row, not the one from before the refresh - 139 -> 142
  ✓ the tick is on the vessel the person ticked
```

The screen and the app now agree, on the same number.

**Deliberately broken to watch both fail** — `getRowId` removed and `data` taken
back out of the effect:

```
  · its delay now, as the dashboard reports it - 139
  · its delay now, as the row on screen says it - 138h late
  ✗ BLOCKER the dashboard was handed the CURRENT row - 139 -> 139
  ✗ BLOCKER the tick is on the vessel the person ticked - ticked []
```

Restored: 139 → 142, and the tick back on the right vessel.

## What else survived the refresh: everything

Worth writing down, because these are the parts most likely to be wrong and all
three held first time:

- **The half-typed note, byte for byte.** 258 characters before, 258 after,
  identical — including the `Ø`. `RichTextEditor` is uncontrolled
  (`defaultValue`), so a parent re-render cannot reach in and replace what is
  being typed. That is the single most important thing on this screen and it was
  never at risk.
- **The sort**, column and direction both.
- **Sorting mid-refresh** — the header clicked while a refresh was in flight, no
  console errors, and the sort landed.
- **5,000 characters pasted into the note**: 5,507 characters held, the earlier
  sentence still in there, the editor capped at **429px tall** rather than growing
  without bound, and the page still 1,700px wide with no sideways scroll.

## Rating effect

`Data table` in [rating.md](../rating.md), once P07's screens are scored.
