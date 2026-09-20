# 099 — The site markets itself as a "daisyUI alternative" and has no page telling a daisyUI user what to change

**Status:** fixed
**Severity:** major
**Found by:** P09 · Gordon Pike · act 1, before writing a line of code
**Surface:** `apps/site` — the documentation
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** — (was: the migration itself, through acts 2 and 3)

## What happened

Gordon has forty screens on daisyUI and a client who will not pay for a rewrite.
Before he touches anything he goes looking for the page that tells him what he is
in for.

**The landing page names daisyUI once**, inside an FAQ accordion:

> "How is SilicaUI different from daisyUI?"

The answer is about philosophy — a behavior layer, OKLCH tokens, derived
foregrounds. All true, and none of it tells him what to change.

**The docs search returns nothing:**

```
searching "button"      ["Button"]      <- the control
searching "daisyui"     []
searching "migrate"     []
searching "migration"   []
searching "daisy"       []
```

**No page exists under any obvious name:**

```
/docs/migration/               404
/docs/migrating-from-daisyui/  404
/docs/from-daisyui/            404
/docs/daisyui/                 404
/docs/getting-started/         200 — names daisyUI 0 times
```

**And of the four things a migrating developer needs, one is present and by
accident:**

| | |
| --- | --- |
| a class-by-class mapping | not there |
| a note on what is NOT a drop-in | not there |
| how themes differ | there, via `data-theme` — incidentally, not for him |
| what has no equivalent | not there |

## Why it matters

This is not an oversight in the docs; it is a gap between what the product says
and what it provides.

`apps/site/src/lib/site.ts` lists **`"daisyUI alternative"`** in the site's own
keywords. The product advertises to daisyUI users deliberately, and then the
first thing one of them asks — *what does this cost me* — has no answer anywhere
on the site.

A developer with forty screens and a client does not need persuading that the
architecture is better. He needs a number. Without one the honest answer to
"should I switch" is "I cannot tell", and "I cannot tell" is a no.

It is `major` rather than `minor` because of who it stops: **the single most
likely source of new customers**, at the single moment they are willing to move.

## Where it lives

[apps/site](../../../apps/site) — there is no page to name
[apps/site/src/lib/faq.tsx](../../../apps/site/src/components/landing/faq.tsx) — the one mention
[apps/site/src/lib/site.ts](../../../apps/site/src/lib/site.ts) — the `"daisyUI alternative"` keyword

## How this gets fixed

**Not by writing the page now.** A class mapping written from the source would be
a guess about which classes are drop-ins, and the whole value of the page is that
the numbers in it are real.

So the fix is deferred until acts 2 and 3 of this run have migrated eight real
screens and filled the ledger — every daisyUI class, its Silica equivalent, and
whether it was a drop-in. The page then gets written **from that ledger**, and
every claim in it is something that happened.

(The persona asks for minutes too. None were measured, and the page says so
rather than inventing them — see the run's own "Not checked".)

Filed open here so the gap is on the record from the moment it was found, rather
than appearing fully solved at the end of a run that caused it.

## The fix

[apps/site/app/docs/migrating-from-daisyui/page.mdx](../../../apps/site/app/docs/migrating-from-daisyui/page.mdx),
written from the ledger of a real eight-screen migration, and in the docs nav and
the command palette with the search terms a migrating developer actually types.

Six sections, and the ORDER is the finding:

1. **The short answer** — one table: 76 classes, 74 replaced, 45 components,
   +12% lines, 1 component with no equivalent.
2. **A screen at a time**, first, because it is the part that decides whether a
   forty-screen migration is possible at all. `prefix: sx-` and
   `<SilicaProvider prefix>`, with the numbers off a real build that loads both
   plugins: 81 rules on `.btn`, 14 on `.sx-btn`, and not one Silica class in the
   sheet without its prefix.
3. **What is a drop-in** — thirteen rows, the ones that took the same markup.
4. **What is not** — five, with what each one costs and what two of them give
   back.
5. **What had no equivalent** — one, and it now exists ([100](100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md)).
6. **Themes**, and what the migration does not change.

**It publishes no hours.** The migration it is written from was not done by a
person at a keyboard, so any figure in hours would be invented, and the page says
that in those words rather than quietly omitting it.

## Confirmed by

The same act-1 probe, unchanged, against the same docs site:

```
searching "button"      ["Button"]                     <- the control
searching "daisyui"     ["Migrating from daisyUI…"]
searching "migrate"     ["Migrating from daisyUI…"]
searching "migration"   ["Migrating from daisyUI…"]
searching "daisy"       ["Migrating from daisyUI…"]

/docs/migrating-from-daisyui/  200 — names daisyUI 17 times
```

And the four things a migrating developer needs, asked of the page itself:

```
✓ a class-by-class mapping
✓ a note on what is NOT a drop-in
✓ how themes differ
✓ what has no equivalent
✓ how to do it a screen at a time
✓ the prefix that makes that possible
· the counts on the page — ["76","28","74","45"]
✓ it answers with numbers, not adjectives
```

**"How themes differ" failed on the first pass** and the fix was the page, not
the check: the Themes section explained the token block and never said how you
switch, which is the first thing somebody coming from `data-theme` wants to know.
It says so now, including that nesting still works.

The new page is also a new SCREEN, so `gen-screens --check` went red until
`rating.md` was regenerated — **144 became 145**. Its row is deliberately `—`:
writing a page is not opening it as a reader.

## Rating effect

The docs site's own pages in [rating.md](../rating.md) — a missing page is not a
row, and that is the point.
