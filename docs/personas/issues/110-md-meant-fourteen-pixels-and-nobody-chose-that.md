# 110 — `md` meant 14px in a button, 13px in a toggle-group and 12px in a badge, and nobody chose that

**Status:** fixed
**Severity:** major
**Found by:** P03 · act 10 follow-up, underneath [109](109-the-docs-prop-table-sat-below-the-floor-the-docs-teach.md)
**Surface:** `@wizeworks/silicaui` — every sized component
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** — (Brandon's decision, taken 2026-09-19: re-base the scale)

## What happened

Fixing the docs' prop table turned up the thing under it. Root `CLAUDE.md`
RULE #3:

> The base font floor for body text is **16px**.

Measured across every component module, counting only DEFAULTS — the size a
consumer gets without asking for anything:

```
132 rules under 16px, across 72 components
```

Including the base rule of `.btn`, `.input`, `.select`, `.textarea`, `.table`,
`.alert`, `.toast`, `.badge`, `.tooltip`, `.tabs-tab`, `.menu`, `.label`,
`.breadcrumb` and `.pagination`. **The system's default control size was 14px.**

And the ladders did not agree with each other. Sixteen components hardcoded their
own, and there were **nine different ladders** among them:

```
11/12/14/16/18   button, input, select, textarea
11/13/14/16/18   file-input, multi-select, segment-field, tag-input
12/13/14/16/18   alert, table
10/11/12/14/16   badge
11/12/13/15/17   toggle-group
10/12/14/16/20   avatar
13/14/16/18/20   prose
13/15/18/20/24   pin-input
14/16/20/28/36   wordmark
```

So `md` meant 14px in a button, 13px in a toggle-group and 12px in a badge. That
is not a decision anybody made; it accumulated one component at a time, and
nothing could see it because a font size is an ordinary literal in a module and
no two modules are read together.

## Why it matters

A design system's default is the value almost everyone ships. If `md` is under
the floor, the floor is not a floor — it is a thing you have to know to ask for,
and `size="lg"` becomes the secret name for "normal".

`major` because it is the default size of every control in the library, and
because the rule it breaks is the repo's own.

## I got the number wrong first, and it changed the decision

Worth recording, because the wrong number nearly produced the wrong fix.

The first measurement said **49**, and it was put to Brandon as 49. That count
came from a heuristic that matched selector NAMES — `label`, `description`,
`error`, `hint` — so it saw `field-label` and missed `.btn`, whose rule is just
the component's own name. The real figure was 132, and 49 vs 132 is the
difference between "raise some captions" and "the whole system's default size is
wrong".

Corrected before anything was built on it. Brandon then chose **re-base the
ladder** rather than either patch.

## The fix

**One ladder, and `md` is 16px.**

```
xs  0.75rem   12
sm  0.875rem  14
md  1rem      16   <- the floor, and the default
lg  1.125rem  18
xl  1.25rem   20
```

Declared once, in
[packages/silicaui/src/component-type.js](../../../packages/silicaui/src/component-type.js),
the same shape `TYPE_SCALE` has for the `text-*` utilities — so the plugin and
the documented catalog cannot drift apart.

**146 rules changed across 56 components**: 14 ladders re-based, 83 other rules
raised to the floor. A consumer who wants 14px now asks for `sm`, instead of
discovering that `md` was already small.

**Three components are off the ladder, by name and with reasons** —
`prose` (its own ramp already starts at the floor), `pin-input` (one glyph per
cell, sized to the box) and `wordmark` (a brand mark, not running text).

### The first transform was wrong at both ends

It shifted each ladder up one step within itself. Tidy, and wrong twice:
`prose`'s `md` was **already** 16px and would have become 18, and `badge`'s
ladder was 10/11/12/14/16 so a shift landed `md` on **14** — still under the
floor the change exists to reach. A rule that produces the wrong answer at both
ends of the range is the wrong rule, however neat it looks. Replaced with "use
the shared ladder unless `md` is already at or above the floor".

## And it cannot drift back

[packages/silicaui/scripts/verify-component-type.mjs](../../../packages/silicaui/scripts/verify-component-type.mjs),
in the package's `verify` chain. Two rules, and the second is what keeps the
first true:

1. any rule that is **not** a size variant must be at least 16px;
2. any rule that **is** a size variant must match the shared ladder exactly —
   without this, `md` drifts back one component at a time and rule 1 still
   passes, because a component can always be the exception nobody notices.

```
  153 default rule(s) and 67 ladder step(s) checked
  3 component(s) off the ladder by review: prose, pin-input, wordmark
✅ every default clears 16px, and every size ladder is the same ladder
```

## Confirmed by

```
default rules under 16px    132  ->  0
distinct size ladders         9  ->  1 (+3 named exceptions)
```

And on the running site, read from a **cold build** — which is the part that
nearly went wrong:

```
.badge   16px      .table  16px      .btn (a btn-sm)  14px
```

**The first visual reading was against stale CSS and said 12px.** Next's `.next`
cache was serving the old stylesheet, so the badges looked untouched and the
change looked like it had not applied. Killed the server, deleted `.next`,
restarted. Every number here is from after that.

## A regression it caused, found and fixed

The re-base made a five-item theme switcher on the landing page too wide for a
phone — the first time in this run that any of the 121 pages scrolled sideways
at 360px:

```
before the re-base   0 of 121 scroll sideways
after                1 of 121   "/"  381px   div.toggle-group w-fit (357px)
after the fix        0 of 121
```

Fixed with `max-w-full overflow-x-auto` on the segmented controls, so one wider
than the phone scrolls **inside its own box** instead of pushing the page — the
same thing `Table` already does. Wrapping was the other option and was rejected:
a segmented control's shared borders and rounded ends are what make it read as
ONE control, and a wrapped one reads as two.

It also made [109](109-the-docs-prop-table-sat-below-the-floor-the-docs-teach.md)'s
fix redundant an hour after it shipped — `table-lg` is 18px now, and the bare
class is 16px — so that line is plain again, with a comment saying the reason it
is plain now is not the reason it was plain before.

## Rating effect

Every screen in [rating.md](../rating.md), which is what a default size means.
