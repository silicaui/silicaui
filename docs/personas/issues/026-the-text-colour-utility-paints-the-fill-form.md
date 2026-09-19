# 026 — `text-warning` measured 1.78:1 while `<Button color="warning" variant="ghost">` measured 5.60

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 9
**Surface:** `@wizeworks/silicaui` › the `text-<role>` utility
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

The status timeline needed a coloured dot per event — an amber one for `Held by customs`,
which is the row she scans for. Timeline ships colourless by design, so the tone was
composed on with `bg-warning`: silicaui's own class plus a Tailwind utility, which RULE #1
names as the sanctioned toolbox.

Scoring it at 360px in both themes, the dots came back:

```
dark   15.75  15.75   8.55  11.45
light  16.71  16.71   2.67   1.78
```

`1.78` is issue 019's number — the one fixed hours earlier. Checking the utility directly
rather than the dot, on a light page:

| utility | as text |
| --- | --- |
| `text-warning` | **1.78** |
| `text-success` | **2.41** |
| `text-info` | **2.67** |
| `text-accent` | **2.96** |
| `text-error` | **4.42** |

**Five of seven chromatic roles below AA.** Meanwhile `<Button color="warning"
variant="ghost">` measured **5.60** on the same page, because issue 019 gave components an
ink form and issue 024 extended it to components that paint a role by hand. The utility
layer was never touched.

## What should have happened

RULE #1 says silicaui components **and Tailwind utilities** are the whole sanctioned
toolbox. Both halves should produce readable text. `text-warning` is the obvious way to
colour a word, and it produced the worst contrast on the page.

## How to reproduce

1. Light theme. `<span className="text-warning">Held</span>` on the base surface.
2. Measure the computed `color` against the page: **1.78:1**.
3. `<Button color="warning" variant="ghost">Held</Button>` beside it: **5.60:1**.

Same colour, same page, same library, two answers.

## Why it matters

This is the third and outermost layer of one defect, and each layer looked complete from
inside:

| layer | fixed by | left behind |
| --- | --- | --- |
| component variants (`btn-*`, `badge-*`) | 019 | components painting a role by hand |
| component CSS (`label`, `validator`, …) | 024 | the utility layer |
| `text-<role>` utility | **this** | — |

A palette tunes a role as a **fill**. Light mode's `warning` is `oklch(80% 0.11 85)` — a
soft amber that carries near-black content at 8.8:1 and is 1.78:1 as the words themselves.
Nothing about that is wrong; it is simply the wrong form for text, and three separate
surfaces reached for it.

## Where it lives

`packages/silicaui/src/color-utilities.js` — `colorUtilityRules` emitted
`color: var(--color-<name>)`.

## Do the siblings have it too?

**`bg-` and `border-` deliberately keep the raw token.** A background IS the fill form, and
a border is a boundary under WCAG 1.4.11's 3:1 rather than text under 1.4.3's 4.5 — a
threshold acts 6, 7 and 8 have each deliberately left alone (`fieldBorder()` is measured,
documented and probe-guarded).

**`base-*` and every `-content` token are skipped.** Both are already inks. Deriving an ink
from an ink would drag `text-primary-content` toward the page's own ink, which is the
opposite of its job — verified unchanged after the fix.

## The fix

`text-<role>` emits `ink(...)` from `lib/ink.js` — the same derivation issues 019 and 024
use, so all three layers now answer with one number.

**The first attempt only half worked, and measuring is what showed it.** Emitting through
`addBase` moved `text-accent` from 2.96 to 6.88 and left `text-warning`, `text-info`,
`text-success` and `text-error` at exactly their old values. The reason is in this file's
own comment, written for the `soft` family:

> *a registered semantic color like `bg-primary` gets a REAL utilities-layer rule from
> Tailwind itself whenever the literal class is scanned, which always outranks anything in
> the `base` layer regardless of source order.*

`accent` moved because nothing in the app scans `text-accent`; the other four did not
because something does. **A fix that works for whichever colours happen not to be used is
not a fix.** So a second pass, `textInkUtilities`, emits the same rules through
`addUtilities` with the `[class]` specificity bump `softUtilities` already uses for exactly
this reason.

## Confirmed by

Console rebuilt cold after `node sync-silica.mjs`, read off the computed style, converter
checked at `#fff` on `#000` = 21.00.

**All seven roles pass AA in both themes:**

| role | light before | light after | dark after |
| --- | --- | --- | --- |
| `warning` | **1.78** | **5.60** | 13.48 |
| `success` | **2.41** | 6.46 | 12.39 |
| `info` | **2.67** | 6.89 | 11.86 |
| `accent` | **2.96** | 6.88 | 11.76 |
| `error` | **4.42** | 9.57 | 8.45 |
| `secondary` | 4.58 | 9.43 | 12.45 |
| `primary` | 7.99 | 12.20 | 11.30 |

`text-warning-content` is unchanged in both themes, as intended.

**On the screen it was found on:** the timeline's dots now read **5.60** (warning) and
**6.89** (info) in light, against 1.78 and 2.67 before. Seen as well as measured — the
amber and blue dots are plainly visible on the white page, which is the entire reason the
dot exists.

The artifact's own markup moved with it: the dot is `text-<role> bg-current` rather than
`bg-<role>`, because a 12px graphic doing the job of text wants the ink form, not the fill.

`pnpm verify` across the workspace: **exit 0**.

## Rating effect

None recorded — the console's screens are not in `rating.md`.
