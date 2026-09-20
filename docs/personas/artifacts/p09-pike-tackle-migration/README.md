# Pike & Daughter Tackle — the P09 artifact

A six-year-old fishing-tackle shop admin, **before and after** a migration off
daisyUI, plus the proof that the two can run side by side while you do it.

Three apps, and the diff between the first two **is** the migration:

| | | |
| --- | --- | --- |
| [`before/`](before/) | the app as it is today, on daisyUI 5 | `npm run dev` → :5196 |
| [`after/`](after/) | the same eight screens on Silica UI | `npm run dev` → :5198 |
| [`coexist/`](coexist/) | both, in one build, Silica behind `prefix: sx-` | `npm run dev` → :5200 |

```bash
pnpm install --ignore-workspace     # in each folder, once
```

`--ignore-workspace` matters: these sit inside the silicaui repo, so a bare
`pnpm install` climbs to the repo's own workspace and adds nothing here.

## The eight screens

Products, one product, orders, one order, customers, stock take, settings, sign
in. Reached from one rail; the route is in the address bar
(`?screen=product&sku=PD-3355`), so any of them can be deep-linked.

## What the numbers are

```
BEFORE  76 distinct daisyUI classes across 28 component families
AFTER    2 component classes still written by hand, in 1 family
         (and those two are SILICA's .select, on a deliberately native picker)

74 of 76 replaced by name
45 Silica components used
lines of CODE   730 -> 819   (+89, +12%)
```

Reproduce them:

```bash
node ledger.mjs             # the class counts above, read off both trees
node coexist/verify.mjs     # the two-systems-one-build check
```

**Every `useState`, every handler, every bit of filtering and paging logic is
byte-for-byte what it was.** The migration is a change of markup. That is what
makes `diff -r before/src after/src` readable.

## The data is the test

`src/data.ts` is **identical in `before/` and `after/`** — keeping it
byte-for-byte is what makes the diff a migration rather than a rewrite.

- `Pike & Daughter's own 20lb fluorocarbon, 100m` — an apostrophe in the shop's
  own-brand line
- `Drennan Acolyte Ultra 13ft float rod — 3 piece, with spare tip` — 62 characters
- `T. Bąk` — a customer name that is not ASCII
- prices in **pence**, so no float ever touches money
- **stock `0` and stock `null` are different facts.** `0` is counted and there are
  none; `null` has never been counted. They must never read the same, because the
  shop orders from that screen
- two deliveries dated `2026-08-31` and `2026-02-28` — the last day of a month
  and the last day of a 28-day February, stored and printed as the feed's own
  strings and never parsed into a `Date`

## What this artifact proves

**That you do not have to migrate in one commit.** `coexist/` loads daisyUI and
Silica in the same build, with Silica namespaced. Its `verify.mjs` counts
selector heads in the built stylesheet rather than substrings — `.sx-btn`
contains `btn`, so a naive `includes(".btn")` is true whatever happens:

```
rules whose selector is exactly .btn     (daisyUI)  81
rules whose selector is exactly .sx-btn  (Silica)   14
Silica-only class names appearing WITHOUT the prefix  []
✅ daisyUI and Silica are in one stylesheet and share no class name
```

## Two things the migration found

**`Steps` had no vertical.** The order-detail screen shows progress down the side
of a narrow card; daisyUI does that with `steps-vertical` and Silica could not do
it at all. Added rather than worked around —
[issue 100](../../issues/100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md).

**A bug that migrated faithfully.** Typing `-` into the stock field made
`Number("-")` return `NaN`, and `NaN < 0` is false, so the "stock cannot be
negative" guard never fired. **The daisyUI app has it too.** Fixed in *both*
trees, so the diff between them stays a migration and not a bug fix wearing one.

## `before/` is deliberately not a straw man

`form-control` is still on every field there and does nothing — daisyUI removed
it in v5 and the labels have laid out inline ever since, so each one carries a
`flex flex-col gap-1` added the week of that upgrade. That is what a six-year-old
app looks like, and leaving it in is what makes the comparison fair.

## The published guide

Everything here became
[`/docs/migrating-from-daisyui`](../../../../apps/site/app/docs/migrating-from-daisyui/page.mdx).
It publishes **no hours**: this migration was not done by a person at a keyboard,
so a figure in hours would be invented.
