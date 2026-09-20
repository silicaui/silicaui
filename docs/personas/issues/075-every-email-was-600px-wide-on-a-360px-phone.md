# 075 — Every email was 600px wide on a 360px phone, and its buttons were too small to press

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · act 9, the same file on a phone
**Surface:** the email projector
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The composed Dispatch, opened as a file at 360 × 780 with a phone's viewport:

```
isMobile=true  { innerWidth: 600, visual: 360, bodyScroll: 600, docScroll: 600,
                 mq480: true, outerTable: 600, innerTable: 600,
                 innerStyle: "width:600px;max-width:100%;background:#f7f9fa" }

isMobile=false { innerWidth: 360, visual: 360, bodyScroll: 600, docScroll: 600, … }
```

Read those two lines together and the whole defect is in them.

`mq480: true` — **the mobile rule fired.** The three staff picks stacked, exactly
as designed. And the email was still **600 pixels wide on a 360 pixel screen.**

Which leaves a phone two choices, and both are bad:

- shrink the whole message to 60% so it fits, which is what a real phone does —
  and the 14px footer line arrives at about 8px; or
- let it scroll sideways, which is the version the desktop run shows
  (`bodyScroll: 600` inside a `360` window).

Reuben has 4,100 subscribers. Something close to half of them open on a phone.

Separately, on the same pass:

```
  ✗ "Read Nadia's full review" is at least 44px tall — 215×34px
  ✗ "Shop the Nordic shelf"    is at least 44px tall — 197×34px
```

A stock button is **34 pixels tall**. The minimum a thumb reliably hits is 44
(WCAG 2.5.5; Apple's own guidance says the same). The button is the one thing in
an email a person is actually asked to press.

## Why `max-width:100%` did not save it

This is the part worth writing down, because the markup reads as if it already
handles a phone:

```html
<table width="600" style="width:600px;max-width:100%">
  …
  <img width="552" style="width:552px;max-width:100%">
```

A percentage `max-width` resolves against the **containing block**. The
containing block here is a table cell. A table cell in auto layout is sized **by
its content**. So the percentage resolves against the very width the content is
setting — it is circular, CSS treats it as no constraint at all, and the 552px
cover keeps all 552 of its pixels and drags the table out with it.

`max-width:100%` on a fixed-pixel element inside an auto-layout table is a
decoration. It looks like responsiveness and does nothing.

## Where it lives

[packages/silicaui-builder/src/email/projector.ts](../../../packages/silicaui-builder/src/email/projector.ts) — `renderImage`, `MOBILE_CSS`, the body wrapper
[packages/silicaui-builder/src/email/schema.ts](../../../packages/silicaui-builder/src/email/schema.ts) — `EMAIL_BUTTON_PADDING`

## The fix

**1. Images are fluid up to the size the author chose**, instead of fixed with a
decorative cap:

```
width:552px; max-width:100%     →     width:100%; max-width:552px; height:auto
```

Swapped round, it is definite in the direction that matters: 100% of whatever
column it lands in, never larger than what the author picked. The `width`
ATTRIBUTE stays, because Word needs a number.

**2. The body table is fluid too**, and Outlook gets its own fixed shell:

```html
<!--[if mso]><table role="presentation" width="600" …><tr><td><![endif]-->
<table role="presentation" width="100%" class="sui-body" style="width:100%;max-width:600px;…">
<!--[if mso]></td></tr></table><![endif]-->
```

Word ignores `max-width`, so it would otherwise have run the email the full width
of the reading pane. The conditional shell gives it a real 600px table and every
other client the fluid one. Both halves were needed: making only the table fluid
leaves the images forcing it wide again.

**3. The mobile rule narrows the body, not just the columns:**

```css
@media only screen and (max-width: 480px) {
  .sui-body { width: 100% !important; }
  .sui-col  { display: block !important; width: 100% !important; }
}
```

**4. One button padding default, and it clears 44px.** `paddingY` was written out
in three places — two palette entries and the starters' own factory — all saying
`8`. It is now one exported constant saying `14`, with the arithmetic in the
comment: a 16px label sits in an ≈18px line box, so 14 + 18 + 14 = 46. The
projector mirrors it into `mso-padding-alt`, so Word gets the same target.

Three copies of a number is how two of them end up stale.

## Confirmed by

The same file, at four widths:

```
 360px → body 360, no overflow, picks stacked,  lead cover 312px
 480px → body 480, no overflow, picks stacked,  lead cover 432px
 600px → body 600,               three columns, lead cover 552px
1280px → body 600 (capped),      three columns, lead cover 552px
```

And the full act-9 pass on a real phone viewport:

```
does it fit the phone at all
  ✓ no sideways scrolling — page 360px in a 360px window
  ✓ nothing sticks out past the right edge — widest edge at 360px

can he read it one-handed
  ✓ no body text below 14px on a phone
  · the smallest text in the email — 14px — "£8.99 · in at Gloucester Road"
  ✓ every line of text meets AA against what is behind it

can he hit the things he is meant to tap
  ✓ the "Read Nadia's full review" button is a thumb-sized target — 215×46px
  ✓ the "Shop the Nordic shelf" button is a thumb-sized target — 197×46px
  ✓ "the The cover of Piranesi image" is a thumb-sized target — 312×240px
```

14 probe checks, **deliberately broken to watch six fail** before restoring — the
image pinned back to a pixel width, the body rule removed, the padding back to 8:

```
  ✗ the mobile rule narrows the body, not just the columns
  ✗ an image is fluid up to the size the author chose
  ✗ ...and no longer pins itself to a pixel width
  ✗ the one button padding default clears the 44px tap minimum
  ✗ the projected button carries that padding
  ✗ ...and hands Word the same target through mso-padding-alt
              … restored …
  ✅ email engine: all checks passed
```

Two of the checks exist only to stop the fix half-travelling: the palette's
button and the starter's button are each asserted to read the shared constant,
so a fourth copy cannot quietly appear.

**One existing check needed widening and it was right to complain.** "no
class-based layout (table + inline style only)" allowed exactly one class,
`sui-col`. There are now two, and the check says so by name — `sui-col` and
`sui-body`, both hooks for the one media query an email is allowed, everything
else inline.

`pnpm verify` exit 0 workspace-wide, builder e2e **208 passed**, typecheck clean.

## Also recorded, not fixed

**The masthead is a 37px-tall tap target** — 312 × 37 at 360px, because the
author set the wordmark to 160px wide and that is the height it comes out. Short
of 44, and it is the "view in browser" link. That is an authoring dimension, not
a projector default, so it is not fixed here — but **nothing in the builder
measures a tap target or says a word about it**, which is the part worth
recording.

**Linked text inside the cards is 16–41px tall** and is *not* counted as a
failure. WCAG 2.5.5 exempts a target "in a sentence or block of text", which is
exactly what a linked book title is, and each one sits under a 312 × 240 cover
that is a target in its own right (since [070](070-two-thirds-of-a-staff-pick-was-not-clickable.md)
made the whole card clickable). Naming the exemption rather than quietly
skipping the measurement.

**Only Chromium was used to measure.** It is the engine Gmail's web client and
most phone webviews use, but it is one engine. What Word does with the
conditional shell is act 8's question and remains **not checked**.

## Rating effect

Every email screen in [rating.md](../rating.md), since the output is the thing
being judged.
