# 007 — The docs nav is 116 things in one alphabetical list

**Status:** fixed
**Severity:** minor
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 2
**Surface:** silicaui.com › Docs — the sidebar, and the drawer on a phone
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** 8 groups on screen, desktop and in the phone drawer — see below
**Blocked on:** —

## What happened

Act 2, finding four components without search. The nav is:

| | Measured |
| --- | --- |
| Items | **116** |
| Group headings | **1** — "Components" |
| Order | alphabetical, flat |
| Filter / search within the list | none |

So the only affordance for finding something is knowing its name and scrolling to the
letter. That worked for **Button**. It did not help at all for "something to show a
status", because she does not know whether the thing she wants is called Badge, Status,
Label, Chip, Pill or Tag — and alphabetical order puts the four candidates at positions
spread across the whole list.

The catalogue is genuinely large and genuinely good. The nav presents it as a phone
book.

## What should have happened

The list is grouped the way a person looking for a component thinks — inputs with
inputs, feedback with feedback — so "something to show a status" narrows to a handful
of neighbours instead of 116 strangers.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/docs/`
2. Without using search, find something to display a status.

```js
document.querySelectorAll('a.sidebar-item').length          // 116
document.querySelectorAll('.sidebar-group-label').length    // 1
```

## Why it matters

It is the primary navigation for the whole product, and it degrades exactly as the
catalogue grows — the better silicaui gets, the worse this gets.

Filed `minor` rather than `major` because she **did** find all four, and the command
palette (⌘K) is a real and good escape hatch. This is friction on the browse path, not
a blocked job. It is the browse path that matters for a first-time evaluator, though:
somebody who already knows the name does not need the docs index.

On a phone it compounds — the same 116 rows now live in a drawer (#003), so the scroll
is the same length through a smaller window.

## Where it lives

- `apps/site/app/docs/docs-shell.tsx` — a single `SidebarGroup` with
  `SidebarGroupLabel "Components"` wrapping every link.
- `apps/site/src/lib/nav.ts` — `COMPONENT_LINKS` is `DEMO_META` sorted by title. Flat by
  construction; there is no grouping data in `DEMO_META` to group by.

## Do the siblings have it too?

The same flat list is used in three places and all three would benefit: the docs
sidebar, the phone drawer (same source), and the command palette's item list.

**Not checked:** the landing page's "Here are all 116" block, which is a deliberate
wall-of-names showing off the count rather than a navigation aid — different job, and
it is not claimed to be affected.

## The fix

Same source as #006: `packages/silicaui-mcp/src/data/components.json` already carries a
`category` per component, and **115 of 116 demos resolve to one**. The categories are
already the right shape for a human:

`Actions · Data display · Data input · Feedback & overlay · Layout · Navigation ·
Typography · Advanced / composite`

So `COMPONENT_LINKS` gains a `category`, generated from the catalog, and the shell
renders one `SidebarGroup` per category instead of one for everything. Alphabetical
within each group.

Two catalog categories are not human-facing — `css` and `wrapper`. Those fall into a
sensible bucket rather than being shown as-is, and `Hooks` (which matches nothing) gets
a home too.

## What was built

The same generator as #006. `NavLink` gains a `group`, `COMPONENT_LINKS` reads it from
the generated catalog, and `docs-shell.tsx` renders one `SidebarGroup` per group in a
reading order rather than alphabetically.

**Twelve components needed editorial judgement no data source had.** The catalog's
`css` (7) and `wrapper` (5) are package-origin markers, not places a person looks — a
reader hunting for a toast is not thinking "this one happens to be CSS-only". Those are
re-homed by hand in the generator's `REGROUP` map, with the five `wrapper` entries all
going to *Advanced / composite* (they are exactly the opt-in packages). A 2-item
"Typography" group beside a 38-item "Data input" read as an accident, so the base layer
collects into **Foundations**, which also gives `Hooks` — which matches no catalog
entry at all — a home.

**The generator throws** if a component ends up with no group, rather than silently
dropping it into the wrong one. That is the guard that keeps this honest as the
catalogue grows.

**A second thing fixed in passing:** the command palette was passing
`group: "Components"` for every item — a grouped list with one group, which groups
nothing. It now passes the real category.

## Confirmed by

Re-ran P01 act 2 on the screen, reading the rendered sidebar rather than the source.

> **8 groups**, in reading order, totalling **116 items** — nothing lost, nothing
> duplicated:
>
> | Group | Items |
> | --- | --- |
> | Actions | 2 |
> | Data input | 38 |
> | Data display | 19 |
> | Feedback & overlay | 15 |
> | Navigation | 14 |
> | Layout | 9 |
> | Advanced / composite | 14 |
> | Foundations | 5 |
>
> Seen on screen on `/docs/components/status/`: the rail now opens **ACTIONS →
> Button, Swap**, then **DATA INPUT → Calendar, Checkbox, …** instead of a single
> "Components" heading over everything.

Re-checked in the phone drawer at 360px in dark, because that is a second mount of the
same list and the kind of place a grouping change gets dropped: **all 8 group labels
and all 116 items present**, 0px horizontal overflow.

Dilnoza's act-2 hunt now works: "something to show a status" narrows to *Data display*
and *Feedback & overlay* rather than 116 strangers, and the descriptions from #006
settle Badge vs Status once she is there.

**Honest limit:** *Data input* is still 38 items. That is a coherent group and a large
improvement on 116, but it is the one group a person still has to scan. Not filed —
the browse path works now, and a filter box inside the nav would be a new feature
rather than a repair.

`pnpm verify` passes end to end, exit 0.

Not a regression risk to an earlier persona: P01 is the first run, and nothing outside
`apps/site` changed.

## Rating effect

`silicaui.com › Docs` — the leading Ease deduction now that #003 is fixed. See
[rating.md](../rating.md).
