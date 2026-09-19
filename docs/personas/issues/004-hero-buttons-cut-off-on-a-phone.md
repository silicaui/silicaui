# 004 — On a phone the front page's "Get started" button runs off the edge

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 1
**Surface:** silicaui.com › Home (`/`) — the hero call-to-action row
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** re-measured and re-looked at in a 360px frame — see below
**Blocked on:** —

## What happened

Dilnoza opened the front page at 360px — the first thing her file tells her to do, and
the width she holds her own work to.

**Both** of the hero's calls to action are cut off by the right edge of the screen:

- the primary **Get started** button runs past the edge and is clipped mid-button
- the install command `npm i @wizeworks/silicaui-react` is clipped too, and the
  **copy** affordance on its right-hand end is off-screen entirely

Measured inside a 360px frame rather than eyeballed:

| Element | Width | Right edge | Available |
| --- | --- | --- | --- |
| Content column (`px-6`) | 312px | 336 | — |
| CTA row wrapper | **366px** | **390** | 312px |
| `Get started` (`.btn.btn-primary.btn-lg`) | **366px** | **390** | 312px |

The row is 54px wider than the column that holds it. The section is
`overflow-hidden`, so instead of scrolling it simply **clips** — which is why the page
only reports 3px of horizontal scroll while a visitor loses 54px of both buttons.

That last part is why this nearly got filed as a 3px nit. The page-level scroll
number is small and the actual damage is not.

## What should have happened

At 360px both CTAs sit inside the screen. The install command is long, so it should
shrink and let its own text scroll, not push the primary button off the page.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/` at a 360px viewport (device
   emulation or an iframe — not by resizing a real window).
2. Look at the hero. `Get started` is cut by the right edge; the install command's
   `copy` is not on screen.
3. Every time. Light theme (there is no other — see #002).

```js
// inside a 360px frame
const btn = document.querySelector('a.btn.btn-primary.btn-lg');
btn.getBoundingClientRect().width                 // 366, in a 312px column
btn.parentElement.getBoundingClientRect().width   // 366
```

## Why it matters

It is the landing page's primary conversion button, broken on a phone, above the fold.

For this persona it also compounds #003: she is deciding whether the project was built
by people who think about small screens, and the first screen she sees at 360px has its
main button hanging off the edge.

## Where it lives

- `apps/site/src/components/landing/install-command.tsx:39` — the button is
  `w-fit whitespace-nowrap` and the `<code>` inside it is `whitespace-nowrap` too. It
  therefore has a hard minimum width of about 366px and **cannot shrink**.
- `apps/site/src/components/landing/sections.tsx:76` — the CTA row is
  `flex flex-col gap-3 sm:flex-row sm:items-center`. In the column direction the
  wrapper takes the width of its widest child, so the un-shrinkable install command
  sets the width, and `Get started` stretches to match it.
- `apps/site/src/components/landing/sections.tsx:64` — the section is
  `overflow-hidden`, which converts the overflow into silent clipping.

Nothing is wrong with the `Button` component or with `.btn` — it is stretching to the
width it was given. The un-shrinkable sibling is the cause.

## Do the siblings have it too?

**Yes, one.** `InstallCommand` is rendered twice: in the hero, and again in the closing
"Start with one line." section. Checked — the second one has the same fixed minimum
width, so it is fixed by the same change rather than separately.

Checked and **not** affected: the `.btn` classes generally. Other buttons on the page
sit in containers that size normally; this is specific to a nowrap sibling setting the
column width.

## The fix

At the affordance, not the call site: **`InstallCommand` must be able to shrink**, and
its long command scrolls inside it instead of pushing the layout apart.

- the button gets `min-w-0 max-w-full` so it can size below its content
- the `<code>` scrolls horizontally on its own rather than forcing the button wide
- the `copy` label gets `shrink-0` so it stays reachable — it is the entire point of
  the control and was the first thing to disappear
- the CTA row gets `w-full min-w-0` so its children may shrink inside the column

## Confirmed by

Re-ran P01 act 1 at a true 360px viewport (375px iframe, so the scrollbar does not eat
15px of the measurement — the first pass did, and was testing 345px by accident).

> Reloaded the front page. **Get started** and the install command are both **312px**
> wide with their right edge at **336** — inside the 360px screen, with the column's
> `px-6` intact. The `copy` label sits at right **319** and is fully on screen. The
> command scrolls horizontally inside its own control, which is visible as a small
> scrollbar under `npm i @wizeworks/silicaui…`. **Page overflow is now 0px**
> (`scrollWidth` 360 = `clientWidth` 360); it was 3px of scroll hiding 54px of clipping.

Both `InstallCommand` instances re-measured, not just the hero one: **312px each**.

### The sibling check was wrong the first time, and the measurement caught it

This issue originally claimed the second `InstallCommand` "is fixed by the same change
rather than separately." **It was not.** After the first fix the hero was 312px and the
closing CTA was still 366px, because the fix has to be applied at every box in an
`items-center` column — each one sizes to its content, so constraining only the
innermost leaves every ancestor overflowing.

That took two more rounds to run down:

1. the closing section's row needed `w-full min-w-0` too, and
2. the `Reveal` wrapper above it needed it as well — `Reveal` took no `className`, so
   one was added to it (`reveal.tsx`), with a comment saying why it exists.

Recording it because the lesson generalises: *"the sibling has it too"* is not a claim
to be made from reading, only from measuring. Had this been left at the first fix the
issue would have been closed with half the defect still on the page.

### Noticed while in `reveal.tsx`, and NOT a defect

`Reveal` reads `prefers-reduced-motion: reduce` and sets its shown state immediately
when it matches, so the scroll-reveal does not leave content permanently invisible for
a reduced-motion visitor. This was an open worry carried from issue #001. **It is not
proven on screen** — it was read in passing while fixing something else, which is not
the same thing (RULE #1). P09 still confirms it with the setting actually on.

Not a regression risk to an earlier persona: P01 is the first run, and the change is
confined to the marketing site's own components.

## Rating effect

`silicaui.com › Home` — the leading Design deduction at 360px. See
[rating.md](../rating.md).
