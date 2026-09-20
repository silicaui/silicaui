# 109 — The prop reference on 116 doc pages sat below the type floor those pages teach

**Status:** fixed
**Severity:** minor
**Found by:** P03 · act 10 follow-up, closing P01's "the other 114 pages individually, and … 360px"
**Surface:** `apps/site` — the component doc pages
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P01 recorded two things it could not do by hand:

> **Not checked:** the other 114 pages individually, and the new section at 360px.
> **Not checked:** the getting-started page at 360px.

Nobody reads 121 pages on a phone, which is the shape a probe is for. Swept at
360×780 with touch, every route in `rating.md`:

```
CONTROL  "/" as shipped     -> pageWidth 360 of 360   no overflow
CONTROL  "/" + a 900px box  -> pageWidth 900 of 360   OVERFLOWS  ok

pages that scroll sideways at 360px:  0 of 121
pages with body text under 16px:    106 of 121
```

**Nothing on the site overflows at 360px.** That half is a clean result and it is
what P01 wanted to know.

The other half was one line of markup. `component-api.tsx` renders the prop
reference — every component's props, types and descriptions — as:

```tsx
<table className="table w-full">
```

The bare `table` class is size `md`, and the table scale is
**12 / 13 / 14 / 16 / 18**, so `md` is `0.875rem` = **14px**. That is the same
14px [062](062-the-builder-handed-her-faded-body-text-and-a-timetable-below-the-floor.md)
found in a dance class timetable and fixed by inserting `table-lg`:

> **Her timetable rendered at 14px.** The `.table` default is `0.875rem` … sat
> under RULE #3's 16px body floor. … And the table gets a size that clears the
> floor … `table-lg` (16px cells), not the bare `table` default of 14px.

## Why it matters

The `doc` column is a sentence — *"Semantic or custom color; maps to
`btn-<color>`"* — on **116 component pages**. It is the reference a developer
reads to use the system, and it was the one part of the documentation still under
the floor the documentation teaches.

It is the "a fix leaves its neighbour behind" shape again: 062 fixed tables the
builder creates for an author, and silicaui's own docs kept the default.

`minor` because 14px is legible and nothing is lost — but it is silicaui's own
site not following silicaui's own rule, on more pages than anything else on it.

## Where it lives

[apps/site/app/docs/components/[slug]/component-api.tsx:234](../../../apps/site/app/docs/components/%5Bslug%5D/component-api.tsx)

## The fix

`table table-lg w-full` — the same size 062 has the builder insert, for the same
reason, with the reason written above the line.

## Confirmed by

The same sweep, unchanged, controls still green:

```
                                        before      after
pages that scroll sideways at 360px      0/121      0/121
pages with body text under 16px        106/121     41/121
```

**One line closed 65 pages.** `/docs/components/button` went from 44 runs under
the floor to **0**.

## What the remaining 41 are, and why they are not this issue

Read rather than counted. They are **demo content inside the component
showcases** — a Breadcrumb demo saying "Home", an AppShell demo whose body reads
"Content for 'dashboard'", a DataTable demo listing "Ada Lovelace" — plus the
site footer. Sample UI showing what a component looks like, not the site's own
prose.

Underneath them, though, the sweep turned up something larger that is **not**
being fixed here because it is a product decision rather than a defect:
**49 component parts whose job is to hold words carry a default size under
16px** — `field-error` and `field-description` at 12px, `field-label` at 14px,
`accordion-content` at 15px, `countdown-label` and `dock-label` at 11px. Measured
across 72 components, excluding size variants (`-xs` at 11px is what `xs`
*means*). Raising them would change the density of every form in every consumer
app, and a fair reading of RULE #3 — "the **base** font floor … the plugin
anchors this by declaring `100%`" — is about the anchor of the scale and the
body copy, not about every label in component chrome. Put to Brandon with the
numbers rather than decided here.

## Rating effect

Every `— component doc` row in [rating.md](../rating.md), none of which is scored
— but the deduction is now written down for when one is.

---

## Superseded an hour later, and the line is plain again

The `table-lg` above lasted about an hour. The sentence that justified it —
*"the default size is `md`, whose cells are 14px"* — turned out to be true of the
whole library, not just tables, and Brandon's answer was to
[re-base the ladder](110-md-meant-fourteen-pixels-and-nobody-chose-that.md) so
`md` **is** 16px.

That makes `table-lg` an 18px overshoot, so the markup is back to the bare
`table` class. The class is the same as it was before this issue was opened and
the reason is not: it was wrong then because the default was 14px, and it is
right now because the default is 16px.

Left as a comment in the file rather than a silent revert, so the next person to
read that line does not re-derive this.

**This issue stands as filed.** The measurement was right, the fix was right for
the day it was made, and it is what turned up 110.
