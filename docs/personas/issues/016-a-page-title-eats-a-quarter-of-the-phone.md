# 016 — On a phone, the page title eats a quarter of the screen before anything else loads

**Status:** fixed
**Severity:** design
**Found by:** P01 · Dilnoza Karimova · act 5
**Surface:** `@wizeworks/silicaui` › typography › the `h1`/`h2` global defaults
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 5, measured at 360px and at 1438px

## What happened

The console's overview heading is the one act 5 exists to test — 68 characters:

> Live shipments awaiting customs clearance or consignee confirmation

At 360px it renders at **36px, over five lines, 198px tall — 26% of a 360×760 screen**,
before a single shipment is visible. Measured in the page, not estimated.

`h1` is `2.25rem` flat. It is 36px on a 360px phone and 36px on a 27" monitor.

## What should have happened

The top of the ramp should ease down on a narrow container, the way the display ramp
already does.

Measured by stepping the size in the live page at a 360px viewport:

| `h1` size | lines | height | share of a 360×760 screen |
| --- | --- | --- | --- |
| **36px — shipped** | **5** | 198px | **26%** |
| 32px | 5 | 176px | 23% |
| 30px | 4 | 132px | 17% |
| **28px** | **3** | **92px** | **12%** |
| 26px | 3 | 86px | 11% |
| 24px | 3 | 79px | 10% |

**28px is the knee.** It buys back 14% of the screen and two lines; below it there is
almost nothing more to win. That makes the target range obvious rather than a matter of
taste: floor at 28px, ceiling at the current 36px.

## How to reproduce

1. Any app on the plugin, at a 360px viewport.
2. Render a real page title of 60–70 characters in a bare `<h1>` or `<Heading level={1}>`.
3. Five lines. Every time, both themes.

## Why it matters

A 13" laptop is Peregrine's main screen, so this is not their daily case — which is
exactly why it is filed as **design** and not as a blocker. It matters because it is a
*default*: every consumer who opens their app on a phone writes the same override, and a
design system that needs the same correction in every project has made the wrong choice
once instead of right once.

`text-balance` is already applied — the ragged edge is fine. The size is the problem.

## Where it lives

`packages/silicaui/src/components/typography.js`, `STEP`:

```js
h1: { fontSize: "2.25rem", … },   // 36 — flat
h2: { fontSize: "1.875rem", … },  // 30 — flat
```

## Do the siblings have it too?

**The display ramp in the SAME OBJECT is already fluid, and h1/h2 are not.**

```js
"display-1": clamp(2.5rem,   1rem + 6cqi,   4.5rem)
"display-2": clamp(2.125rem, 1rem + 4.5cqi, 3.75rem)
"display-3": clamp(1.875rem, 1rem + 3.5cqi, 3rem)
```

So the technique, the units and the house pattern all exist twenty lines away. The
heading ramp simply never got it.

**h3–h6 checked and deliberately left alone.** They are 24 / 20 / 18 / 16px; at 360px a
24px h3 sets fine and fluid type below that buys nothing while adding a `clamp` to every
rule. Only the two steps that overflow get it.

**Checked against a prior decision rather than assumed.** The repo has a SETTLED position
on this area — *no responsive size variants, CQ-first*. This does not reverse it: it adds
no variant, no breakpoint and no prop. It uses `cqi` container units, which is what
"CQ-first" means and what `display-*` next door already does. If anything the heading ramp
was the exception to that decision, not an expression of it.

## The fix

Give `h1` and `h2` the same `clamp(min, base + Ncqi, max)` shape the display steps use,
with the ceilings exactly where they are today:

```js
h1: clamp(1.75rem,  1.15rem + 2.6cqi, 2.25rem)    // 28 → 36
h2: clamp(1.5rem,   1.05rem + 2cqi,   1.875rem)   // 24 → 30
```

**Nothing changes on a desktop.** Both reach their present size at roughly a 680px
container and are flat above it, so the 13" laptop this console is built for, and every
existing consumer at normal widths, renders byte-identically. Only narrow containers move.

## Confirmed by

**Both ends measured, because the claim was "desktop does not move".**

At **1438px**, after the change: `h1` **36px**, `h2` **30px** — the shipped values,
unchanged. The clamp is at its ceiling and flat, so the 13" laptop this console is
actually for renders exactly as before.

At **360px** (iframe sized 364 so the scrollbar leaves a true 360 viewport, asserted
`clientWidth === 360`):

| | before | after |
| --- | --- | --- |
| `h1` font-size | 36px | **28px** |
| lines | **5** | **3** |
| height | 198px | **92px** |
| share of a 360×760 screen | **26%** | **12%** |
| horizontal scrollbar | none | none |

Confirmed in **both themes** at 360px — 28px and three lines in dark and in light — and
seen on screen, not only measured: the title now sits above the fold with the first two
stat cards.

**Not a defect, recorded because it was checked:** the `Needs a decision today` rows wrap
their money onto a second line at 360px. That list is a placeholder for the real table
act 6 builds, so it is not being fixed here.

## Rating effect

—
