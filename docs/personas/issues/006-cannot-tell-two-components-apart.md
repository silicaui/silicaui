# 006 — Dilnoza could not tell Table from Data Table, or Badge from Status

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 2
**Surface:** silicaui.com › Docs › every component page — 101 of 116 of them
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** re-read the four pages that caused it, on screen — see below
**Blocked on:** —

## What happened

Act 2: find a button, a data table, a dialog, and something to show a status, without
using search. She needs status chips for five shipment states and a table for 14 rows.

Two of the four came down to a choice between two plausible names:

| She needs | The list offers |
| --- | --- |
| a data table | **Table**, **Data Table** (also Metadata List, Sortable List) |
| a status chip | **Badge**, **Status** (also Label, Tag Input) |

So she opened each to compare. Here is what the pages told her, quoted:

> **Data Table** — "A sortable, filterable data table powered by TanStack Table, wrapped
> in SilicaUI's tokened styling — an opt-in package so the core stays lean."
>
> **Badge** — "A status badge with color × variant × size props for marking state on a
> row, card, or record — auto-derives a legible foreground from any token."

Both excellent. Then the other half of each pair:

> **Table** — "Table — a CSS-first, fully-tokened Table component from SilicaUI.
> Accessible by default via Base UI, themeable with color × variant × size × shape
> props, and available in React, framework-neutral HTML, and a zero-depende…"
>
> **Status** — "Status — a CSS-first, fully-tokened Status compo…"

The same sentence with the name swapped in. It says nothing about what the component is
or when you would reach for it.

**So in both pairs, exactly one side is describable and the other is a template.** She
cannot compare them, because half of each comparison is filler.

This is not two unlucky pages. **101 of the 116 component pages fall back to that
template** — only 15 have a hand-written description.

## What should have happened

Every component page says what the component is, in a sentence that distinguishes it
from the component next to it in the list.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/docs/`
2. Open **Table**, then **Data Table**. Read the paragraph under each title.
3. Open **Status**, then **Badge**. Same.
4. Every time, both themes, any width.

```js
// the scale of it
// apps/site/src/lib/site.ts → CURATED has 15 entries; DEMO_META has 116
```

## Why it matters

Choosing the right component is the job a component library's docs exist to do, and for
87% of the catalogue these ones cannot.

It is worse than it looks, because **the same string is the page's `<meta
name="description">`**, its Open Graph description, and its entry in the `llms.txt`
answer-engine feed (`componentAbstract` wraps `componentDescription`). So 101 pages ship
near-identical descriptions to search engines and answer engines.

`apps/site/app/docs/components/[slug]/page.tsx:18` carries a comment saying per-page
metadata exists "so none reads as a thin duplicate to search or answer engines." For
101 of them, that is exactly what they are. That comment is the third one found today
asserting a property nothing enforces — see also #001's "Counts. Real, and checked
against the repo" and `home-sections.ts`'s "read off this repo, not invented".

And the answer she needed was **there**: `Status` is a status *dot*, not a chip, so
`Badge` was correct. The information existed; the page just did not say it.

## Where it lives

- `apps/site/src/lib/site.ts` — `CURATED` (15 entries) and `componentDescription()`,
  which falls back to `templateDescription(title)`.
- The comment above `CURATED` says the fallback "is still unique per component (the name
  varies) and keyword-rich." It is unique the way 101 copies of one sentence with a
  different noun are unique.

## Do the siblings have it too?

**Measured, not guessed: 101 of 116 pages**, listed by the count in `The fix` below.
The 15 that are fine are the hand-written ones (button, combobox, calendar,
color-picker, data-table, badge and nine others).

Also affected and **not separately filed**, because one fix covers them: the SEO
description, the OG card description, and the `llms.txt` abstract for those same 101
pages.

## The fix

**The repo already ships the missing copy.** `packages/silicaui-mcp/src/data/components.json`
is the catalog the MCP serves, and it carries a real `description` and a `category` for
every component, extracted from the source:

> **Table** — "Silica Table — a styled `<table>`. Compose it from plain semantic rows;
> the CSS styles the native elements, so no per-cell classes are needed"
>
> **Status** — "Silica Status — a small status dot, optionally pinging"

Matched against `DEMO_META`: **115 of 116 demos resolve to a catalog entry, 114 with a
description.** The one that does not is `Hooks`, which is not a component.

So the site stops hand-maintaining a 15-entry map and reads the catalog it already
publishes — one source of truth, generated, unable to drift. `CURATED` stays as an
override for pages where a hand-written marketing sentence beats the extracted one.

The catalog's descriptions carry inline code examples, so the generator takes the
leading prose sentence and drops the example.

## What was built

`apps/site/scripts/gen-catalog.mjs` → `apps/site/src/lib/catalog.ts`, run before
`next build` and checked by `pnpm verify` as `verify:catalog`. It matches every
`DEMO_META` entry to its catalog entry and extracts the prose.

`componentDescription()` is now a three-step fallback, and the middle step is the one
that was missing:

1. `CURATED` — the 15 hand-written sentences, still authoritative
2. `CATALOG` — the extracted description, **114 of 116**
3. `templateDescription` — a genuine last resort, now reached by `Hooks` and
   `Resizable Panels` only, down from 101

The catalog's descriptions are written for a developer reading the MCP, so the
extractor strips the `Silica <Name> — ` prefix, cuts the trailing code example, and
removes Markdown links. **Two extractor bugs were found by reading the output rather
than trusting it**, and both are worth recording because both produced plausible-looking
text:

- **Timestamp** came out as *"Dependency-free relative/absolute time formatting
  (Intl."* — truncated mid-abbreviation inside an unclosed bracket, because
  `Intl.RelativeTimeFormat` looks like a sentence end. A sentence now only ends at a
  `.` followed by whitespace.
- **Data Table** came out as the two words *"table CSS."*. That was my own fix making
  it worse: `String.match()` silently **skips** a prefix it cannot match, so the greedy
  version returned the *second* sentence and dropped the first. Sentence ends are now
  found by position, not by `match()`.

Both would have shipped as real-looking sentences. Neither would have failed a build.

## Confirmed by

Re-ran P01 act 2 on the screen — the four pages that caused the issue, read as Dilnoza
choosing between them.

> **Status** now reads *"A small status dot, optionally pinging."*
> **Badge** now reads *"A status badge with color × variant × size props for marking
> state on a row, card, or record — auto-derives a legible foreground from any token."*
>
> That is the decision made. She wants chips for five shipment states, so **Badge** is
> the answer and `Status` is a presence dot. The page also shows it: Status renders
> coloured dots, Badge renders pills in solid / outline / soft / ghost.
>
> **Table** now reads *"A styled `<table>`. Compose it from plain semantic rows; the
> CSS styles the native elements, so no per-cell classes are needed."*
> **Data Table** now reads *"A data grid over TanStack Table dressed in the Silica
> .table CSS."*

Both pairs are now comparable, which is the whole complaint.

Read off the rendered page, not the source: the Status page's `<h1> + p` and its
`<meta name="description">` both return *"A small status dot, optionally pinging."* — so
the near-duplicate SEO description is fixed in the same pass, which was the second half
of this issue.

Badge still shows its hand-written `CURATED` sentence, confirming precedence order is
right and that the generator did not stamp over the curated copy.

Checked at 360px in dark on the same pass: description renders full-width, no
clipping, 0px horizontal overflow.

`pnpm verify` passes end to end, exit 0, including the new `verify:catalog`.

Not a regression risk to an earlier persona: P01 is the first run, and nothing outside
`apps/site` changed.

## Rating effect

`silicaui.com › Docs` and every component doc page. See [rating.md](../rating.md).
