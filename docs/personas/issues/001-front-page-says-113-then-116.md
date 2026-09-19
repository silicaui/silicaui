# 001 — The front page tells Dilnoza two different component counts, one screen apart

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 1
**Surface:** silicaui.com › Home (`/`) — the stats band and the Ecosystem section
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** re-read both screens as Dilnoza — see **Confirmed by** below
**Blocked on:** —

## What happened

Dilnoza came to the front page to decide whether to commit her company to a 0.x design
system with one maintainer. Her own words for what she is looking for: *"signs that
somebody thought this through."*

She scrolled to the stats band and read, in very large type:

> **113**
> Documented components

She scrolled one section further — the very next heading — and read:

> **116 components across 13 packages**

And below that:

> Every one has a live page. Here are all **116**.

…followed by a list of 116 links.

Light theme, 1232px. Every time.

So the page states the same fact twice, one screen apart, and disagrees with itself.
Then she checked the other two numbers in the same band. All three are wrong:

| The band says | The truth | |
| --- | --- | --- |
| **113** Documented components | **116** — `DEMO_META` has 116 entries, and the page's own list renders 116 | ✗ |
| **34** Vanilla behaviors | **35** — `HANDLERS` in `silicaui-behaviors/src/registry.ts` registers 35 | ✗ |
| **13** Published packages | **12** — `packages/` holds 13 packages but `@wizeworks/silicaui-demos` is `"private": true` and is never published | ✗ |
| **MIT** Licensed, open source | MIT | ✓ |

The prose repeats the wrong package number twice more: the heading says "across 13
packages" and the paragraph under it opens "Thirteen packages, but you install four."

## What should have happened

Every number on the page is either right or is not on the page. This is the first
screen of the product, its entire job is to be believed, and a visitor who checks one
number and finds it wrong stops believing the rest of the page — including the claims
that are true.

For this persona specifically it is worse than a wrong number. Dilnoza is auditing the
project for care. Three wrong numbers in one band, with the correct value rendered
twelve lines below one of them, is the exact signal she came looking for, pointing the
wrong way.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/`
2. Scroll to the stats band — read **113**
3. Keep scrolling one section — read **116 components across 13 packages**
4. Count the component list below it: 116 links
5. Every time. Both themes. Any width.

## Why it matters

A sentence on screen is FALSE, which the rulebook makes `major` rather than `copy`.

It is not cosmetic: the number is the product's headline claim about its own size, it
is used to decide whether to adopt, and it undercounts. The project is selling itself
short by three components while looking careless about all three numbers.

## Where it lives

- `apps/site/src/components/landing/sections.tsx:189-194` — the `STATS` array, all
  four values hand-typed as strings.
- `apps/site/src/components/landing/sections.tsx:253` — `{components.length} components
  across 13 packages`: the component count **is derived correctly here**, twelve lines
  below the hardcoded 113, and the package count next to it is hardcoded.
- `apps/site/src/components/landing/sections.tsx:258` — "Thirteen packages" in prose.
- `apps/site/src/lib/home-sections.ts:31-32` — `stat("113", "Components")` and
  `stat("34", "Behaviors")`, the same two wrong numbers again on `/about`.

The comment sitting directly above the `STATS` array reads:

```
/* ---------------------------------------------------------------------------
   Counts. Real, and checked against the repo rather than remembered.
   --------------------------------------------------------------------------- */
```

Nothing checks them. That comment is itself part of the defect — it is a green badge
over a number with no enforcement behind it, and it is why the numbers were trusted
and left alone while the repo grew past them.

## Do the siblings have it too?

**Yes.** This is a class, not a call site.

- `/about` carries the same two wrong numbers through `home-sections.ts` — checked, and
  it does.
- The package-count error appears **three** times on `/` alone: the stat tile, the
  Ecosystem heading, and the prose beneath it.
- `apps/site/app/docs/components/[slug]/page.tsx:18` and `apps/site/app/sitemap.ts:7`
  both carry "~113" in comments. Those are comments, not screen text, so they are not
  user-visible defects — but they are the same stale number propagating, and they get
  corrected in the same pass.

Every user-visible count on the marketing site was hand-typed. That is the real defect.

## The fix

Fix the affordance, not the call site: **no count that a person can read may be typed
by a person.**

`apps/site/scripts/gen-counts.mjs` derives all three from the repo and writes
`apps/site/src/lib/counts.ts`. It runs before `next build` (beside the existing
`gen-og.mjs`, the same pattern), and `--check` is wired into `pnpm verify` so a drifted
count fails CI instead of sitting on the front page.

Sources, each the same one the code already treats as authoritative:

| Count | Derived from |
| --- | --- |
| components | `DEMO_META.length` in `@wizeworks/silicaui-demos/meta` |
| behaviors | the `HANDLERS` keys in `packages/silicaui-behaviors/src/registry.ts` |
| packages | `packages/*/package.json` where `private` is not `true` |

The prose at line 258 is reworded so the package number appears **once** on the page
instead of three times — a number that exists in one place cannot disagree with itself.

The misleading comment above `STATS` is removed along with the array.

## Confirmed by

Re-ran P01 act 1 on the screen, light theme, 1232px, with the dev server on 4011.

> Scrolled the front page to the stats band. It reads **116 · Documented components**,
> **35 · Vanilla behaviors**, **12 · Published packages**, **MIT**. Scrolled on to the
> next section: **"116 components across 12 packages"**, and under it *"You install four
> of them."* The two sections now say the same thing, and the package number appears
> once on the page instead of three times.

Sibling re-checked on the same pass, because the issue claimed it was fixed:

> Opened `/about`. The four stat tiles read **116 Components · 35 Behaviors ·
> 12 Packages · MIT License** — read back off the rendered DOM, not off the source.

One thing looked wrong on the first re-check and was **not** a defect: the stats
appeared as very pale grey on near-white. Measured rather than eyeballed — after the
scroll-reveal settles, `opacity` is `1` and the ink computes to
`oklch(0.21 0.012 255)`. The pale frame was the reveal animation caught mid-flight by
a programmatic scroll. Nothing filed.

**Open question handed to P09, not tested here:** whether that same scroll-reveal
leaves this content permanently invisible under `prefers-reduced-motion: reduce`. This
run did not check it and is not claiming it is fine (RULE #4). It is P09's surface —
Gordon works at 150% zoom and is the persona who would actually have that setting on.

Not a regression risk to any earlier persona: P01 is the first run, and the change
touches the marketing site only, not the plugin, the token engine or the shared class
vocabulary — so RULE #7's second confirmation line does not apply.

## Rating effect

`silicaui.com › Home` — scored in act 1. See [rating.md](../rating.md).
