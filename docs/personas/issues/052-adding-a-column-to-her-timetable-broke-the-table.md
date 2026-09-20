# 052 — Adding a column to the timetable left the table ragged, and nothing said so

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 8, building the eleven-row timetable
**Surface:** Site builder › duplicate (Cmd/Ctrl+D) on a table cell
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Her timetable is **Class · Day · Time · Ages** — four columns, eleven rows. The Table
she gets from the palette is two columns, three rows:

```
the table she gets: {"rows":3,"cells":6,"perRow":[2,2,2]}
```

**Growing it downwards works perfectly.** Select a row, Ctrl+D:

```
after one Ctrl+D:       {"rows":4,"cells":8,  "perRow":[2,2,2,2]}
after a second Ctrl+D:  {"rows":5,"cells":10, "perRow":[2,2,2,2,2]}
```

Growing it sideways did this:

```
after duplicating one cell: {"rows":5,"cells":11,"perRow":[3,2,2,2,2]}
```

**One row has three columns and the rest have two.** That is not a table. The header
has a heading with nothing under it, every body cell is under the wrong heading, and
the published HTML is malformed.

No error. No warning. No console output. The canvas just quietly draws a broken table.

## What should have happened

There is no case in which somebody wants one row of a table wider than the others.
**A cell's peer group, in a table, is its column.**

## How to reproduce

1. Open `http://localhost:5178/`, insert a **Table**.
2. Click any header cell on the canvas.
3. Press **Cmd/Ctrl+D**.
4. Before the fix: that row has three cells, every other row has two.
5. Every time, both themes, every width.

## Why it matters

The timetable is the page she came here to build — *"I want the timetable on the front
page, not buried"* — and four columns is the shape her real data has. So this is on the
critical path of her whole job, and it fails in the way she is least able to recover
from:

- **It looks plausible.** One extra cell on one row reads as "I need to fill that in",
  not "the table is now invalid".
- **It compounds.** Doing it once per row, in order, eleven times, is how she would
  have had to get four columns. Miss one and the table is silently broken.
- **It reaches the visitor.** A ragged `<table>` is what publishes.

## Where it lives

[packages/silicaui-builder/src/site/commands.ts](../../../packages/silicaui-builder/src/site/commands.ts) — `duplicateMany`, reached from Cmd/Ctrl+D.

`editor.duplicate(id)` inserts a copy beside the original in its parent. That is
generically correct and specifically wrong here: the parent of a `<td>` is one `<tr>`.

## Do the siblings have it too?

**Checked every place a repeated-structure element can be duplicated.**

| | verdict |
| --- | --- |
| a table **row** | **already correct** — a row's peer group *is* its siblings |
| a table **cell** | **the defect** |
| list `<li>`, nav links, cards in a grid | **correct** — these have no cross-row alignment to keep |
| email builder columns | **not affected** — it has a dedicated `columns.rebalance` op, which is this same idea already solved on that side |

The email builder having `columns.rebalance` and the site builder having nothing is the
tenth instance this run-series of the same shape: **the idea exists in a sibling and
did not travel.**

## The fix

Duplicating a single table cell duplicates its **column** — one new cell in every row,
across `thead`, `tbody` and `tfoot`, as one undo step:

```ts
export function duplicateColumn(editor: Editor, cellId: string): string[] | undefined {
  const place = placeOf(editor, cellId);
  if (!place || tagOf(place.parent) !== "tr") return undefined;
  const rows = tableRowsFor(editor, cellId);
  if (!rows) return undefined;
  const column = place.index;
  return editor.batch(() => { … for each row, duplicate the cell at `column` … });
}
```

`duplicateMany` routes a single-cell selection through it and falls back to the plain
behaviour for everything else, so nothing else in the builder changes.

Cells are matched **by index**, because the schema has no column identity — a table is
`tr`s of `td`s and nothing more. A row that is already short is clamped to its last
cell rather than skipped, so this makes a ragged table less ragged and never more.

### The bug inside the fix

The first version looked for a `table` element ancestor and found none, so it silently
fell back to the old behaviour and the probe still printed `[3,2,2,2,2]`. **A Table is
a component macro** — the real ancestry is:

```
{"tag":"th","ancestors":["div","component","thead","tr"]}
```

There is no `table` element in the tree at all; it appears when the macro expands.
`tableRowsFor` now walks **up** from the row — past a `thead`/`tbody`/`tfoot` if there
is one — instead of searching for a tag that does not exist.

That is worth recording because the failure mode was a fix that changed nothing and
reported no error, which is the same category of silence as the defect it was fixing.

## Confirmed by

Driven as Marlene, same gestures, same table:

```
the table she gets:          {"rows":3,"cells":6, "perRow":[2,2,2]}
after two row duplicates:    {"rows":5,"cells":10,"perRow":[2,2,2,2,2]}
selected: "Name"  (a header cell, on the canvas)
after duplicating that cell: {"rows":5,"cells":15,"perRow":[3,3,3,3,3]}
console errors: none
```

**Every row gained a cell.** `[3,3,3,3,3]` — a real column, in one press, one undo step.

`pnpm verify` green across the builder. `e2e/canvas.spec.ts` and
`e2e/collab-ops.spec.ts` — **9 tests, all passing**, including the one that asserts what
ops a real UI edit emits. Typecheck clean.

## Rating effect

`Site builder › Canvas — Ease 6 → 8` in [rating.md](../rating.md).
