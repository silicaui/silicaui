# 018 — At midnight, the column headers are not readable at all

**Status:** fixed
**Severity:** blocker
**Found by:** P01 · Dilnoza Karimova · act 6
**Surface:** `@wizeworks/silicaui` — the `neutral` role in dark, every non-solid variant
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 6, on `localhost:4099`

## What happened

The shipments table's column headers are sortable, so each one is a low-emphasis button:
`<Button variant="ghost" color="neutral" size="sm">`. On screen in dark they are a
barely-visible grey while the data under them is bright.

Measured off the computed style, against the surface each one actually sits on:

| | ink | background | contrast |
| --- | --- | --- | --- |
| column header | `rgb(45, 51, 59)` | page, `lab(3.68%)` | **1.52 : 1** |
| a data cell beside it | `lab(91.88%)` | same | 15.75 : 1 |

WCAG AA wants 4.5:1. The headers are at **a third of the floor**, on the screen two
operators read for six hours a night.

**The measurement was validated before it was believed.** These colours compute as
`lab()`/`oklab()`, which a naive parser silently reads as black — the mistake act 1 made.
The converter was checked by pre-filling magenta and confirming each value actually
parsed, plus `#fff` on `#000` = 21.00.

## What should have happened

`neutral` should be readable as ink in dark, like every other role is.

## How to reproduce

1. Any app in dark — `data-theme="dark"` or `prefersdark` with an OS in dark; both give
   the identical result, so this is **not** the surface-scoping defect from issues 013/015.
2. Render `<Button color="neutral" variant="ghost">Reference</Button>` on the base surface.
3. Contrast 1.52:1. Every time, every width.

## Why it matters

Blocker, and specifically for this persona. Peregrine's whole reason for looking at
silicaui is the third question on her list — *"if I put this in front of Sardor at
midnight, can he read it?"* — and the answer on the first real table she builds is no.

It is also the quiet kind. In light mode the same markup is fine, so it survives every
review done in daylight and fails only for the people who actually use the product.

## Where it lives

`packages/silicaui/src/colors.js`. The dark palette barely moves `neutral` while every
other role lightens substantially for dark:

```js
LIGHT  neutral: oklch(26% 0.014 255)      DARK  neutral: oklch(32% 0.016 255)
LIGHT  accent:  oklch(64% 0.13  211)      DARK  accent:  oklch(72% 0.13  211)
LIGHT  info:    oklch(68% 0.1   232)      DARK  info:    oklch(74% 0.09  232)
```

`neutral` is 32% lightness against a 16% surface. Used as a **fill** that is correct — a
subtle dark chip with light `neutral-content` on it. Used as **ink**, it is invisible.

## Do the siblings have it too?

**No — and that is the finding.** Eight roles × four variants, measured in dark on the
real surface:

| role | solid | soft | outline | ghost |
| --- | --- | --- | --- | --- |
| **neutral** | 10.37 | **1.46** | **1.52** | **1.52** |
| primary | 8.10 | 6.61 | 7.87 | 7.87 |
| secondary | 9.88 | 7.92 | 9.70 | 9.70 |
| accent | 8.43 | 6.84 | 8.18 | 8.18 |
| info | 8.77 | 7.13 | 8.55 | 8.55 |
| success | 9.36 | 7.52 | 9.12 | 9.12 |
| warning | 11.50 | 9.18 | 11.45 | 11.45 |
| error | 5.89 | 4.94 | 5.72 | 5.72 |

Thirty-one of thirty-two pass AA. The three failures are all `neutral`, all the variants
that use the role colour as INK rather than as a fill, and the one `neutral` variant that
passes is the one that uses it as a background.

**It is not confined to Button.** The colour classes are pure var-setters shared through
`COLOR_VARIANTS`, so `badge-neutral`, `alert-neutral`, `link-neutral` and every other
family take the same value. **`Badge` with `color="neutral"` is the chip this console
uses for `Awaiting pickup`** — which makes this act 7's contrast test arriving two acts
early, and act 7 should verify the chips specifically rather than assume this covers them.

## Why the existing probe did not catch it

`verify-token-contrast.mjs` checks that every `-content` token is legible **on the colour
it names** — the solid pairing. That is why `neutral`/`neutral-content` passes at 10.37
and the build is green.

Nothing checks the other direction: **a role colour used as ink on the base surface.**
That is precisely what `soft`, `outline` and `ghost` do, and it is untested for all eight
roles — `neutral` is simply the only one that currently fails it.

## The fix

**Not the token.** The two uses have genuinely opposed requirements and one value cannot
serve both: raising `neutral`'s lightness until it reads on a 16% surface pushes it past
the point where `neutral-content` at 93% still reads on top of it. Checked before
choosing, rather than assumed.

So the ink form needs its own source. `neutral` as ink on a neutral surface is
semantically the surface's own ink — `--color-base-content` — which is per-theme already,
so it is correct in light and dark without a branch CSS cannot express. In light it moves
the ink from `lab(14.1%)` to `lab(8.3%)`, a shade darker and still correct.

Then extend `verify-token-contrast.mjs` with the missing direction, for **all** roles and
both modes, so a custom colour registered too dark to read fails the build instead of
shipping.

## Confirmed by

**Re-ran act 6 on the shipments table**, cold build, dark, no `data-theme` — the same
screen and the same markup that measured 1.52:1.

| | before | after |
| --- | --- | --- |
| column-header ink | `rgb(45, 51, 59)` | `lab(91.88%)` |
| contrast on the page | **1.52 : 1** | **15.75 : 1** |
| a data cell beside it | 15.75 : 1 | 15.75 : 1 |

The headers now measure **exactly** what the data cells measure, which is the right
answer: a column header is not a de-emphasised thing, it is the label you read to know
what the column is. Seen on screen as well as measured — the zoomed header row went from
barely-there grey to plainly legible.

Light re-measured too, because the ink source changed in both modes: header **16.71 : 1**,
identical to the cells. The shift there is `lab(14.1%)` → `lab(8.3%)`, a shade darker and
still correct.

**The converter was re-validated on the spot**, not trusted from earlier: magenta
pre-fill to prove `lab()` actually parsed, plus `#fff` on `#000` = 21.00.

**Probed, and the probe was proved to fail first.** `verify-token-contrast.mjs` gained the
direction it never had — a role colour measured as INK on `base-100`, for every role and
both modes. `neutral` is listed as fill-only there and covered by `FILL_ONLY_ROLES`
instead; every other role is checked outright.

**The probe caught one of my own errors immediately**, which is the best evidence it
works: it flagged `secondary` as wrongly listed, because `secondary` passes at 4.57 on the
raw token and only fails in its `soft` form, where the tinted background closes the gap.
The list was corrected rather than the reading.

**Not fixed here, and filed instead:** turning that check on exposed that LIGHT mode fails
it for five more roles — `warning` at 1.77:1. That is issue **019**, with the fix designed
and the reason it needs its own pass written down.

## Rating effect

—
