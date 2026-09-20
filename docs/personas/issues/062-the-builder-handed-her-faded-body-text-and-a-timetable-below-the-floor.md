# 062 — Every paragraph the builder gives you starts faded, and her timetable shipped below the type floor

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · the design-rule count, measured off her published site
**Surface:** Site builder › page template, Insert palette, component starters, default frame
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The persona file asks for a count of design-rule breaches. Counting it properly means
scanning **what shipped** — her seven published pages, with no builder running — rather
than reading the source and hoping.

**RULE #2 (no eyebrows): 0.** Across all seven pages and the builder chrome, nothing
sits above a heading to introduce it. No kickers, no badges in that slot, no `01/02/03`.
**RULE #1 (no hex on a control): 0 inline hex fills** anywhere.

**RULE #3: two findings, both in what the builder handed her rather than anything she
did.**

```
/fees  — 6 element(s) breaking RULE #3
     16px  text-base-content/70   "Ballet and tap are £7.50 a class, paid by th…"   ← the sentence people came for
     14px  (table cell)           "Adult Beginners' Ballet (absolutely no exper…"   ← her timetable
```

1. **The lead paragraph of every page is `text-base-content/70`.** It measures 6.36:1,
   so it passes AA — and RULE #3 is not a contrast rule. It says a fade is *a deliberate
   signal*, never applied to text a person is meant to READ. The fees paragraph is the
   sentence a parent opened the page for.

2. **Her timetable rendered at 14px.** The `.table` default is `0.875rem`, and the
   builder inserted a bare `table` with no size, so the eleven rows of class times — the
   whole reason her site exists — sat under RULE #3's 16px body floor.

## What should have happened

The text people are meant to read is full-strength ink at 16px or more, without her
having to know that.

## How to reproduce

1. Open `http://localhost:5178/`, add a page, insert a Table, publish.
2. Before the fix: the page's lead `<p>` computes to `oklab(… / 0.7)`, and every `td`
   computes to `14px`.

## Why it matters

**Because she will never change it.** Marlene does not know what an opacity is. She
types her fees into the paragraph the builder gave her and publishes. If that paragraph
is faded, her fees are faded — forever, on the page her income depends on.

That is what makes this a **template** defect rather than a styling nit. A faded default
is not a suggestion; for a non-technical author it is the final answer. The same is true
of the table: she is not going to discover a size scale.

**And I made one of them worse during this same run.**
[043](043-the-builders-own-labels-are-faded-below-the-contrast-floor.md) raised this
exact line from `/60` to `/70` to clear the WCAG floor. That treated it as a contrast
problem. RULE #3's answer is that readable body text should not be faded **at all**, and
I moved the number instead of removing it. Worth writing down: deriving the right
number for a thing that should not exist is a very convincing way to be wrong.

## Where it lives

| | |
| --- | --- |
| [`site/engine.ts`](../../../packages/silicaui-builder/src/site/engine.ts) | `newPageRoot()` — the lead `<p>` of every new page, and the component-board twin |
| [`site/palette.ts`](../../../packages/silicaui-builder/src/site/palette.ts) | the Table item's class, plus **7** faded placeholder paragraphs |
| [`site/component-starters.ts`](../../../packages/silicaui-builder/src/site/component-starters.ts) | 1 more |
| [`site/frame.ts`](../../../packages/silicaui-builder/src/site/frame.ts) | the fallback header nav and footer, both `/70` |

## Do the siblings have it too?

**This is the point of the issue.** The one Marlene hit was the page template. Sweeping
for the same shape found **eleven** places, and the worst is not the one she hit:

```
palette.ts:150   el("p", "text-base text-base-content/70", { text: "Body text. Edit me in the inspector." })
```

That is the **Text** item — the thing you insert when you want a paragraph. Every
paragraph anybody adds to any site starts faded.

| where | what it fades |
| --- | --- |
| `newPageRoot()` ×2 | the lead paragraph of every new page / component |
| Insert › **Text** | every paragraph anyone inserts |
| Insert › Card, Link card | the card's supporting copy |
| Insert › App shell main + footer | main content, footer text |
| Insert › Wordmark tagline, Stepper step | a tagline, a step's body |
| component starters | the starter's body copy |
| default frame fallbacks | the header nav links and the footer line |

All eleven are text somebody reads. All eleven are now solid ink.

## The fix

**Faded ink → real ink**, in all eleven:

```ts
// was
el("p", "text-base-content/70", { text: "Add sections from the Insert panel." })
// now
el("p", "text-base-content", { text: "Add sections from the Insert panel." })
```

**And the table gets a size that clears the floor**, at the point the builder inserts
it rather than by changing the component:

```ts
// `table-lg` (16px cells), not the bare `table` default of 14px. This builder
// makes PUBLIC pages, and a table on one is the thing people came to read —
// Marlene's class timetable. RULE #3's body floor is 16px, and the 14px default
// is right for the dense admin grids the component is mostly used for, not for
// this.
atom("Table", "table table-lg", undefined, [ … ])
```

**Why not change `.table`'s default.** 14px is the right default for a data grid, and
P01's operations console is exactly that — a screen where density is the feature.
The component is not wrong; the builder was picking the wrong size for a public web
page. Fixing it where the choice is made leaves both consumers right.

## What is deliberately NOT changed

Her published pages still carry 14px in the **navigation, footer and copyright** of the
shipped header/footer blocks. Measured and left alone: a nav link and a copyright line
are chrome, not body text, and 14px there is conventional and readable. RULE #3's floor
is about the text people came to read, and this is the text around it. Recorded so the
next person does not have to re-measure to find out it was considered.

## Confirmed by

Rebuilt from a fresh run of the whole site, republished, and re-scanned as a visitor
with the builder shut down:

```
before:  /classes-timetable — 14 elements breaking RULE #3
after:   /classes-timetable —  5 elements breaking RULE #3   (nav, footer, copyright only)

the faded lead paragraph:  gone from all 7 pages
the timetable:             14px → 16px, all 11 rows
```

And the rule count that started this, on the same published site:

```
eyebrows: 0     inline hex: 0     faded readable text: 0
```

`pnpm verify` green across the workspace (canvas safelist still current at 310 classes —
`table-lg` is a literal in `palette.ts`, so the text scan finds it), builder e2e
**200 passed**, typecheck clean, 0 console errors on all seven pages.

## Rating effect

`Site builder › Canvas — Design` and `› Insert — Design`, when those rows are scored.
Both are recorded in [rating.md](../rating.md)'s builder note rather than as a number
today, because the 360px pass RULE #6 requires has not run.
