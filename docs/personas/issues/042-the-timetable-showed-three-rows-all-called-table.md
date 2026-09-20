# 042 — Marlene's timetable showed three rows in the tree, all called "Table"

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 4, building the eleven-row timetable
**Surface:** Site builder › Navigator
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Marlene built the timetable — the reason she is here, the thing that makes her phone
ring all evening when it is wrong. She opened the Navigator to find the header row so
she could fix a column, and read this:

```
Table
  Table
    Row
      Cell  Cell  Cell  Cell
  Table
    Row
      Cell  Cell  Cell  Cell
```

Three rows, nested inside each other, all saying the same word.

The middle one is the header. The bottom one is the body. Nothing on screen said so.
She clicked the first "Table", got the whole timetable selected, and undid it.

## What should have happened

A tree exists to tell you which part you are looking at. Three siblings with one name
is not a tree; it is a list of the same word.

She should have read:

```
Table
  Header
    Row
  Body
    Row
```

## How to reproduce

1. Open `http://localhost:5178/`.
2. Insert a Table.
3. Open the Navigator and expand it.
4. Before the fix: `table`, `thead`, `tbody` and `tfoot` all rendered as **"Table"**.
5. Every time, both themes, every width.

## Why it matters

This is the one page she came to build and the one she will edit every term for the
next ten years. Her stated fear is *"that I will break the site and not know I have
broken it"* — and the tree handed her four identical doors with one label on all of
them, on exactly that page.

It is also strictly worse than showing the raw tag name would have been. `thead` is a
word she does not know; **"Table" is a word she knows, pointing at the wrong thing.**
A wrong familiar label is more dangerous than an unfamiliar correct one, because she
has no reason to doubt it.

## Where it lives

- [packages/silicaui-builder/src/site/node-display.ts](../../../packages/silicaui-builder/src/site/node-display.ts) — the tag → plain-English map, around line 162

```ts
table: "Table",
thead: "Table",   // ← all three
tbody: "Table",
tfoot: "Table",
```

The map was written to honour memory note `navigator-business-user-naming` — "no tag
names in this rail". It did remove the tag names. It replaced four distinct things
with one word, which loses the information the rail exists to carry.

## Do the siblings have it too?

**Checked every grouping element in the map, not just the table.** The table was the
only family collapsed to a single word:

| family | before | verdict |
| --- | --- | --- |
| `table` / `thead` / `tbody` / `tfoot` | all "Table" | **the defect** |
| `tr` / `th` / `td` | "Row" / "Cell" / "Cell" | fine — `th` and `td` are both genuinely cells |
| `ul` / `ol` / `li` | "List" / "Numbered list" / "List item" | fine |
| `dl` / `dt` / `dd` | "List" / "List item" / "List item" | acceptable — a description list's two halves are both items |
| `section` / `article` / `aside` | distinct | fine |

The email builder does not project `thead`/`tbody` into its Navigator, so it is not
affected.

## The fix

Give each part the plain word a person would use for it. No tag names, which keeps the
original rule:

```ts
// A table's three parts each used to read "Table", so the tree showed three
// identical rows nested inside one another and there was no way to tell the
// header from the body — on a page whose whole job is an eleven-row
// timetable. Distinct plain words, no tag names (docs/personas/issues/042).
table: "Table",
thead: "Header",
tbody: "Body",
tfoot: "Footer",
tr: "Row",
th: "Cell",
```

No schema, class or public API changed — this is the Navigator's display vocabulary
only.

## Confirmed by

Re-ran P03 act 4 in the real Chrome at `http://localhost:5178/`. Built the timetable
with the real data, including
`Adult Beginners' Ballet (absolutely no experience required)`, and expanded the
Navigator:

```
Table
  Header
    Row
      Cell  Cell  Cell  Cell
  Body
    Row … × 11
```

Clicked "Header" — the header row alone highlighted on the canvas, not the whole
table. Clicked "Body" — the eleven rows highlighted. Repeated in dark, and at 360px
where the rail is narrowest; "Header" and "Body" are short enough that neither
truncates, which is part of why they were chosen over "Table header" / "Table body".

`pnpm verify` exit 0. Typecheck clean.

## Rating effect

Folded into `Site builder › Navigator — Ease 6 → 9` in [rating.md](../rating.md),
recorded with [041](041-thirty-three-components-arrive-in-the-rail-as-machine-keys.md).
