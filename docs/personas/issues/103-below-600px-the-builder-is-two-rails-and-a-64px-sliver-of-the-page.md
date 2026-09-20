# 103 — Below 600px the builder is two rails and a 64px sliver of the page she is editing

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 10, the deferred 360px pass
**Surface:** `@wizeworks/silicaui-builder` — the three-pane body, both builders
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Marlene opened the builder on her phone to check the term dates she had typed.
The canvas — the page itself, the only thing she came to look at — was **64
pixels wide**. Not scrolled off, not collapsed on purpose. Sixty-four pixels of a
765-pixel page, between two rails that each insisted on their full width.

The same sweep as [101](101-the-toolbar-drops-publish-at-1024px-and-never-says-so.md),
reading the canvas rather than the toolbar:

```
1440px   canvas 880px of 880px        <- control: nothing is lost here
1280px   canvas 765px of 765px
1024px   canvas 509px of 509px
 900px   canvas 385px of 385px
 768px   canvas 253px of 253px        <- an iPad in portrait
 600px   canvas  85px of  85px
 480px   canvas  64px of  64px
 360px   canvas  64px of  64px        <- her phone
```

The screenshot at 360px shows the shape exactly: the mode switcher across the
top, then the **Layers** rail (its own tab cut off at the left edge, reading
"ayers"), a drag handle, then the **Design/Settings** rail. The canvas is not in
the picture at all.

## Why it matters

The two rails have hard pixel floors and the canvas does not:

```
left  rail   min-w-60   = 240px
right rail   min-w-64   = 256px
canvas       min-w-0
                 496px of floor before the page gets a single pixel
```

Those floors are correct, and they were put there on purpose by
[040](040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md) — a percentage
minimum made the rail 164px on a small monitor, where "Layers" rendered as "Lay".
The fix was to express a pixel need as a pixel quantity. That was right.

**What is wrong is that three panes stay three panes at every width.** Two
correct floors and a floorless middle means the middle is what vanishes, and the
middle is the document. The layout has no width behaviour of any kind — there is
no `matchMedia`, no `@container` and no width branch anywhere in the chrome — so
at 360px it is still trying to be a desktop IDE and the page being edited is the
part that loses.

This is the "absence behaves like fine" shape again, one level up: a 64px canvas
is not an error state, not an empty state and not a message. It renders as a
working screen.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx:463-577](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — the `ResizablePanelGroup` and its three panels
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the same three-pane shape

## How this gets fixed

**Not by shrinking the rails.** 040 is the reason they have floors and undoing it
re-breaks a real screen at a real width. The rails need their pixels when they
are shown; what has to change is *whether they are shown*.

Below the width at which all three fit — 496px of rail plus a canvas worth
looking at — the builder stops being three columns and becomes **one pane at a
time**: the canvas, with each rail available as an overlay over it rather than a
column beside it. The rails keep their widths; they stop taking them from the
page.

This is a layout change with a product decision inside it, and the decision is
recorded in the run rather than assumed here — see the P03 act 10 log.

## Rating effect

Every site-builder and email-builder row in [rating.md](../rating.md).

## The fix

**The rails keep their pixels and stop taking them from the page.**

A shared hook,
[`useChromeIsNarrow`](../../../packages/silicaui-builder/src/shared/react/chrome.tsx),
watches the builder's OWN box with a `ResizeObserver` — never `window.innerWidth`,
because this thing embeds and the viewport is a different number. Below **900px**
both rails collapse to zero and the canvas takes the width. Two toolbar toggles,
rendered only while the rails are collapsed, bring one back over the page;
opening one closes the other, because 240px of rail and 256px of rail do not both
fit next to a page worth reading.

900px is measured, not picked: 496px of rail floor plus a canvas still worth
looking at. At 900px the canvas is 385px; at 768px it was 253px and at 600px it
was 85px.

One detail that would have made the whole thing a no-op: `min-w-60` on a
collapsed panel wins over a 0% size, so the rail would have kept its 240px and
nothing would have moved. The pixel floor is applied only while the rail is
shown.

Both builders, from the shared hook, for the same reason `IconItem` is shared.

## Confirmed by

The same sweep, same controls, reading the canvas:

```
          before          after
1280px    765px           765px      <- wide mode is untouched
1024px    509px           509px
 900px    385px           385px      <- the threshold; still three panes
 768px    253px    ->     747px
 600px     85px    ->     579px
 480px     64px    ->     459px
 414px     64px    ->     393px
 390px     64px    ->     369px
 360px     64px    ->     339px
```

And the job itself, at 390×844 with touch and real `tap()` gestures:

```
1. opens the builder      canvas 369px of 390px
2. taps Layers            rail 240px   canvas 130px   12 tree rows visible
   CONTROL tap again      rail 1px     closed  ok
3. taps a heading, then the Inspector
   inspector rail 256px, reading "Design Settings Heading <h1> Editing …"
   CONTROL showing the selection, not "No selection": ok
   panes wider than 1px: 2  ok (canvas + one rail)
4. Publish                reachable  66x32
page errors: 0
```

The second and third controls are the ones that matter. A toggle that only opens
is a trap on a screen this size, and **both rails open at once is exactly what the
64px canvas was** — so the run asserts the rail closes again, and that never more
than one rail plus the canvas has width.

**Wide mode renders what it rendered before.** That is deliberate and it is why
the 217 e2e tests, which run at 1280px, keep testing the same thing: the narrow
path is new, the desktop path is not.

**The red run is the `before` column**, from the real pre-fix build with the same
probe.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.

## A regression this fix caused, found and fixed the same day

Making the rails `collapsible` walked straight into the upstream bug
[P07 recorded](../07-kaiho-freight-dashboard.md) against `silicaui-panels` — and
made it worse, because it put it on the desktop layout where nothing had asked
for it.

`react-resizable-panels`' `calculateAriaValues` derives a separator's range from
the neighbour's `minSize` and `maxSize` **and never reads `collapsedSize`**:

```js
const { maxSize = 100, minSize = 0 } = constraints;
currentMinSize = minSize;
const valueMin = Math.max(currentMinSize, 100 - totalMaxSize);
```

So a collapsible panel declares a floor it can go straight through. Measured at
1440px, pressing `Home` on every separator:

```
before   separator 0: now=0  min=12 max=32   <-- OUTSIDE ITS OWN RANGE
after    separator 0: now=12 min=12 max=32
```

**Fixed at the source of the lie rather than by patching the attribute.** Two
halves:

- **`collapsible={narrow}`** — on only at the width that needs it, so the desktop
  layout is byte-identical to what it was before this issue was opened.
- **`minSize={narrow ? 0 : 12}`** — at that width the rail really can be nothing,
  so the declared minimum is **true** rather than merely consistent. That
  distinction is why P07 declined to patch the same family of bug from the
  wrapper, and it is why this one could be.

The 240px floor is unaffected: it is held by `min-w-60` while the rail is shown,
which is the pixel quantity [040](040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md)
asked for and the thing that was doing the work all along.

Confirmed at both widths, driving every separator to both ends:

```
1440px   no separator ever left its declared range
 390px   separator 0: now=0 min=0 max=32      <- collapsible, and it says so
         no separator ever left its declared range
```
