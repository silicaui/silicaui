# 108 — The scroll-area thumb was invisible in every theme the system ships, and the carousel dot in half of them

**Status:** fixed
**Severity:** major
**Found by:** P07 · Kaiho · recorded as an unmeasured lead, turned into a number by P03's act 10 follow-up
**Surface:** `@wizeworks/silicaui` — `scroll-area`, `carousel`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P07 left this, and left it deliberately short of a number:

> **The carousel's inactive dot and the scroll-area thumb** fade the same way the
> drag handle did; a first measurement on the docs site was inconclusive because
> that page's theme state could not be pinned down, and **it is not being
> reported as a number.**

Refusing to publish a figure it could not stand behind was the right call. The
reason the browser reading was inconclusive is also the reason a browser was the
wrong instrument: the question is not "is it visible in one page's theme" but
"is it visible in **every** theme a consumer can pick".

Computed from the declared tokens of all 20 shipped themes, in both modes, over
all three surfaces — 120 combinations, the same corpus `verify-chrome-ink.mjs`
uses for text:

```
CONTROL  black on white -> 21.0        CONTROL  white on white -> 1.0

.scroll-area-thumb          25% ink   worst 1.60:1   under 3:1 in 120 of 120  — every single one
.scroll-area-thumb:hover    40% ink   worst 2.22:1   under 3:1 in  60 of 120
.carousel-dot (inactive)    45% ink   worst 2.49:1   under 3:1 in  57 of 120
```

**The scrollbar thumb failed in all 120.** Not "in dark", not "on one theme" — in
every theme and mode the system ships. The scrollbar is `opacity: 0` until you
hover or scroll, so it fades IN to 1.60:1, which is a scroll affordance you still
cannot see once it has arrived.

## Why it matters

The bar here is **3:1, not 4.5:1** — WCAG 2.1 SC 1.4.11 Non-text Contrast, which
covers the visual information needed to identify a control and its states. It is
the half of RULE #3 that has no words in it.

Both of these are controls, not decoration:

- **the scroll-area thumb** is the thing you drag;
- **the carousel dot** is the thing you click to change slide. "Inactive" here
  means *not the current slide*, not *disabled* — every one of them is clickable,
  so 1.4.11's inactive-component exception does not apply.

And a carousel dot's own comment already carried the scar of this class: it was
changed from a surface token to an ink because in dark it had measured
**1.96:1** — *"invisible, on the control that navigates the carousel"*. The
direction was fixed; the strength was never checked against the rest of the
themes.

## Where it lives

[packages/silicaui/src/components/scroll-area.js](../../../packages/silicaui/src/components/scroll-area.js)
[packages/silicaui/src/components/carousel.js](../../../packages/silicaui/src/components/carousel.js)

## The fix

Every number measured, none chosen:

| | before | after | worst reading |
| --- | --- | --- | --- |
| `.scroll-area-thumb` | 25% | **55%** | 1.60 → **3.22:1** |
| `.scroll-area-thumb:hover` | 40% | **70%** | 2.22 → **4.77:1** |
| `.carousel-dot` inactive | 45% | **55%** | 2.49 → **3.22:1** |

**53% is the lowest alpha that clears 3:1 in all 120 combinations.** 55% is that
floor with a little margin — the same way `/70` was established for text.

The active carousel dot is untouched and still obvious: it is `--color-primary`
and three times as wide, so it carries hue **and** size, neither of which
depends on the inactive dots being faint.

## And it cannot come back

[scripts/verify-control-contrast.mjs](../../../scripts/verify-control-contrast.mjs),
wired into the root `verify` chain. It composites every faded-ink **background**
in every component over all 120 surfaces and fails anything under 3:1.

**Default strict, exempt by review**, the same discipline
[107](107-the-readable-ink-probe-excused-thirty-seven-fades-and-named-none-of-them.md)
put under the readable-ink probe an hour earlier. Two rules are exempt and both
are named in the file with the reason: the table row's hover tint and the
toggle-group item's, because a hover highlight is not information needed to
identify a control — the pointer is already on it. That is why focus rings are
guarded ([092](092-twenty-seven-controls-wore-the-browsers-focus-ring-instead-of-the-systems.md))
and a mouse-only tint is not.

The instrument proves itself before it judges anything: black-on-white must read
21.0 and white-on-white 1.0, or it exits without reporting a single number.

## Confirmed by

```
  5 control(s) checked against 120 theme/mode/surface combinations
  2 surface tint(s) exempt: table|& tbody tr:hover @ 6%, toggle-group|&:hover… @ 7%
✅ every faded-ink control reads at 3:1 in every shipped theme
```

**Shown able to fail**, by putting the thumb back to 25%:

```
✗ scroll-area.js:78 `-thumb` paints a control at 25% ink — worst 1.60:1 at
  ocean/light/base-300, under 3:1 in 120 of 120 theme/mode/surface combinations.
exit 1
```

restored to 55% and green again.

## Rating effect

None yet — no persona has scored a screen whose subject is a scrollbar. It moves
every screen that has one.
