# 040 — Marlene dragged the left rail once and every session after that said "Lay"

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 1, the first ninety seconds
**Surface:** Site builder › left rail (Navigator / Layers / Pages) and right rail (Inspector)
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The very first thing Marlene did in the builder was drag the edge of the left rail,
because it was covering the page and she wanted to see the page. The rail let her drag
it to **164px**, and at 164px the rail cannot draw itself:

| | at 164px |
| --- | --- |
| the tab strip needs | 164px |
| the tab strip gets | **51px** |
| scroll arrows appear | **2**, at 32px each |
| the arrows' share of the row | **52%** |
| the word "Layers" reads | **"Lay"** |
| tree rows cut off | **8 of 12** |

So the two buttons whose only job is to **scroll the tabs** took more than half the
strip, leaving 51px for the three tabs they were scrolling. Every row in the tree
showed about four characters.

The rail then **remembered it**. The width is persisted by `autoSaveId`, so the state
is not "she is dragging" — it is "the builder now opens like this, forever, on this
machine". She did not do it again. She did it once.

This is precisely the thing she said she was afraid of in her own words: *"that I
will break it and not know I have broken it."* She broke it in the first ninety
seconds, and nothing told her.

**Playwright could not see this.** The harness turns persistence off when
`navigator.webdriver` is true, so the automated run always starts from the default
width and the defect does not exist there. It was found in Brandon's own Chrome, on a
1426px window, at the width that was already stored.

## What should have happened

A rail has a minimum width because there is a width below which it stops working. That
width is a **number of pixels** — the longest tab label, the icon, the padding. It is
not a share of the window.

[docs/builder-ux-principles.md](../../builder-ux-principles.md) is explicit that the
rails are working surfaces, not decoration. A surface a person can silently and
permanently destroy is not a working surface.

## How to reproduce

1. Open `http://localhost:5178/` in a **real browser** — not Playwright, which
   disables the persistence this depends on.
2. Drag the left rail's divider as far left as it will go.
3. Read the tab strip. At a 1426px window it reads **"Lay"**, with two scroll arrows.
4. Reload the page. It is still like that.
5. Every time, in both themes, at any window width — the percentage just changes which
   window width it happens at.

## Why it matters

Three separate harms, and the third is the one that matters:

1. **The rail stops naming itself.** "Lay" is not a word. She cannot tell what she is
   looking at.
2. **The tree stops being a tree.** Eight of twelve rows truncate at roughly four
   characters, so `Adult Beginners' Ballet…` and `Autumn 2026` are the same row.
3. **It is permanent and silent.** There is no reset, no snap-back, and no message.
   She has no reason to connect "the builder is broken" with "I dragged something once
   last Tuesday", so she cannot undo it, and she cannot describe it to anyone who
   could.

## Where it lives

- [packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — the left and right `Panel`s
- [packages/silicaui-builder/src/email/react/EmailBuilder.tsx](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the same two rails

`react-resizable-panels` takes `minSize` as a **percentage of the group**. The left
rail was `minSize={12}`, which is 164px at 1426px wide, 122px at 1024px, and 230px on
a 1920px monitor. The constraint the rail actually needs does not move with the
window: the tab strip is the same 164px on every screen.

## Do the siblings have it too?

**Yes, both of them.** Checked all four rails across the two builders:

| | before | after |
| --- | --- | --- |
| site builder, left rail | `minSize={12}`, no pixel floor | `min-w-60` (240px) |
| site builder, right rail | `minSize={14}`, no pixel floor | `min-w-64` (256px) |
| email builder, left rail | same defect | `min-w-60` |
| email builder, right rail | same defect | `min-w-64` |

This is the seventh instance this run-series of **"the fix exists in a sibling and did
not travel"** — except here it had not been fixed anywhere, so all four were wrong in
the same way for the same reason.

## The fix

A percentage minimum and a pixel minimum are not alternatives; the rail needs both.
`minSize` keeps the proportional behaviour when the window is large, and a CSS
`min-width` on the panel's own content is the floor that the drag cannot cross.

```tsx
// The panel's minSize is a PERCENTAGE of the group, so on a 1426px window
// minSize={12} is 164px — where the tab strip gets 51px of the 164px it needs and
// two 32px scroll arrows take 52% of the row. The real constraint is in pixels and
// does not move with the window: `min-w-60` is 240px, measured as the width at which
// the three tabs, their icons and their padding all fit with no scroll arrow.
className="… min-w-60 …"
```

Both builders, all four rails. No component API changed; these are Tailwind utilities
on the builder's own chrome, which is RULE #1's sanctioned toolbox.

## Confirmed by

Re-opened the real Chrome at the **same stored 12%** — the broken state was already on
disk from the run that found it, so this is the repair applied to the actual damage,
not a fresh window:

| | before | after |
| --- | --- | --- |
| rail width | 164px | **240px** |
| tab strip drawn / needed | 51 / 164 | **164 / 164** |
| scroll arrows | 2 | **0** |
| tab reads | "Lay" | **"Layers"** |
| tree rows cut | 8 of 12 | 3 of 12 |

Dragged the divider hard left again and held: it stops at 240px and the strip stays
whole. Repeated in dark — identical. Repeated at a 1024px window, where the old
percentage was 122px: the floor holds at 240px there too, which is the case the
percentage was worst at.

The three rows still cut at 240px are the genuinely long ones
(`Adult Beginners' Ballet (absolutely no experience required)`), and they cut with an
ellipsis and a tooltip, which is a rail doing its job.

## Rating effect

`Site builder › left rail (Navigator) — Ease 5 → 8` in [rating.md](../rating.md).
