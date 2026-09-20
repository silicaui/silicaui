# 101 — The builder's toolbar throws away its controls as the window narrows, and Publish is the first one gone

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 10, the deferred 360px pass
**Surface:** `@wizeworks/silicaui-builder` — the toolbar, both builders
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Marlene's run was scored at 1280px in light, and the 360px/dark pass was deferred.
This is that pass. She opened the builder on her phone, and then — because the
first reading looked too bad to be only a phone problem — the same reading was
taken at every width between a desktop and a phone.

The toolbar is one flex row with no wrap, no overflow and no width behaviour at
all. When the spacer between its two clusters runs out, the right-hand cluster
simply continues past the right edge of the window and is **clipped by an
ancestor**. Nothing scrolls. Nothing collapses. Nothing says a control is gone.

```
CONTROL A  1440px must lose nothing -> lost 0  ok
CONTROL B  1440px canvas visible    -> 880px of 880px

 1280px  canvas 765px of 765px    chrome controls lost:  0
 1024px  canvas 509px of 509px    chrome controls lost:  1  Publish
  900px  canvas 385px of 385px    chrome controls lost:  2  Dark, Publish
  768px  canvas 253px of 253px    chrome controls lost:  3  Light, Dark, Publish
  600px  canvas  85px of  85px    chrome controls lost:  5  Tablet, Mobile, Light, Dark, Publish
  480px  canvas  64px of  64px    chrome controls lost:  6  Desktop, Tablet, Mobile, Light, Dark, Publish
  414px  canvas  64px of  64px    chrome controls lost:  8  Redo, Desktop, Tablet, Mobile, Light, Dark, Publish, Settings
  390px  canvas  64px of  64px    chrome controls lost:  8  Redo, Desktop, Tablet, Mobile, Light, Dark, Publish, Settings
  360px  canvas  64px of  64px    chrome controls lost:  9  Undo, Redo, Desktop, Tablet, Mobile, Light, Dark, Publish, Settings
```

At 1024px the Publish button is rendered at `left=990 right=1055` in a 1024px
window. It is not small, not greyed and not behind a menu. It is **off the end of
the world.**

## Why it matters

**1024px is not a phone.** It is a browser window at half of a 1920 screen, an
iPad in landscape, a laptop with a dock pinned open, a builder embedded in a host
that keeps a sidebar. The builder is designed to EMBED — the harness frames it in
an inset box specifically to prove it fills its container rather than owning the
viewport — so its real width is whatever its host gives it, and 1024 is an
ordinary number for that.

**And Publish is the only way to publish.** There is no command, no menu item and
no shortcut:

```
grep for onPublish across src/site/react and src/shared/react
  Builder.tsx:165   onPublish,                     <- the prop
  Builder.tsx:234   await onPublish({ site, … })   <- the call
  Builder.tsx:447   !onPublish ? "…hasn't wired it up" : …
```

One call site, and it is the clipped button. So at 1024px the work is done and
cannot be shipped, and the screen gives no reason — the button was there at the
last width and is simply absent at this one. That is the "absence behaves like
fine" shape: a missing control and a control that never existed render
identically.

It is `major` and not `critical` only because widening the window restores it —
if you work out that width is the cause.

## How this was measured, and two instruments that were wrong

Worth recording, because both looked right and both would have printed a clean
bill of health.

**`document.scrollWidth > 360` — always false.** Nothing overflows, because an
ancestor clips. A control 695px past the right edge and a control that does not
exist are the same number to this check.

**`el.scrollIntoView()` then re-measure — always "reachable".** A browser will
scroll an `overflow:hidden` box when SCRIPT asks it to; a person dragging it
cannot. The instrument had powers the user does not, so it reported every clipped
button as fine.

What the sweep above actually does is walk each off-screen control's ancestors to
the box that is clipping it and read that box's `overflow-x`. `auto`/`scroll` is
swipeable; `hidden`/`clip`/`visible` is lost. The classifier is shown to say both
words before it is believed:

```
CONTROL A  "Theme" must be ON SCREEN  -> ON SCREEN  ok
CONTROL B  injected must be CLIPPED   -> CLIPPED    ok
CONTROL C  injected must be SWIPEABLE -> SWIPEABLE  ok
```

and confirmed with a real gesture — `wheel deltaX 400` over the toolbar moved it
**0px**.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx:327](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — the site toolbar
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx:257](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the email toolbar, same row, same defect
[packages/silicaui-builder/src/shared/react/chrome.tsx](../../../packages/silicaui-builder/src/shared/react/chrome.tsx) — `IconItem`, where both get their labels

Both headers are the same markup:
`flex items-center gap-2 h-12 flex-none px-3` — no `flex-wrap`, no `overflow`, no
`@container`, and no `matchMedia` anywhere in the chrome.

## How this gets fixed

At the shared point, not twice. Two changes, and the second is the one that makes
the guarantee absolute:

1. **Labels collapse to icons before anything is lost.** Container queries, not
   media queries — the builder is embedded, so the viewport is the wrong thing to
   ask; its own box is the right one, and CQ-first is the house style.
2. **The header wraps.** Whatever is left after collapsing, at any width down to
   zero, moves to a second row instead of over the edge. This is the backstop
   that makes "no control is ever silently dropped" true rather than true down to
   a tested width.

## Rating effect

Every builder row in [rating.md](../rating.md), which is the whole point: this is
why those rows could not be scored until the deferred pass ran.

## The fix

Two changes, at the shared point, so both builders get them:

**1. The words collapse before anything is lost.**
[`IconItem`](../../../packages/silicaui-builder/src/shared/react/chrome.tsx) hides
its label on a **container** query — `@container/toolbar` on the header, and
`hidden @4xl/toolbar:inline` on the word. A container query and not a media
query, because this builder embeds: its width is whatever its host hands it, and
the viewport is a different number.

`labelAt` is per group, because the icons are not equally self-explanatory.
Desktop/Tablet/Mobile and Light/Dark wait for `@6xl` — a monitor, a tablet, a
phone, a sun and a moon read without captions. The mode switcher keeps its words
down to `@4xl`, and below that carries a `hint` naming the **consequence**
("Colours and type for the whole site") rather than repeating the word, so a
mouse user left with four icons is not guessing.

`aria-label` carries the word whether or not it is painted. A control that is
"Theme" on a wide window and an unnamed icon on a narrow one is two different
controls to anyone not looking at it.

**2. The header wraps.** `flex-wrap` + `min-h-12`. This is what makes the
guarantee absolute rather than true down to a width somebody tested: whatever is
left after collapsing, at any width down to zero, moves to a second row instead
of over the edge.

## Confirmed by

The same sweep, unchanged, with its three controls still green — and a fourth
control added after the first attempt at this confirmation was vacuous (see
below):

```
CONTROL A  1440px must lose nothing  -> lost 0  ok
CONTROL B  1440px canvas visible     -> 880px of 880px
CONTROL C  1440px mode words painted -> 4/4  ok

 1280px  header  48px  words 4/4  lost: 0   in a closed rail: 0
 1024px  header  48px  words 4/4  lost: 0   in a closed rail: 0   <- Publish used to go here
  900px  header  48px  words 0/4  lost: 0   in a closed rail: 0   <- labels collapse, still one row
  768px  header  87px  words 0/4  lost: 0   in a closed rail: 4   <- the wrap takes over
  600px  header  89px  words 0/4  lost: 0   in a closed rail: 4
  480px  header  89px  words 0/4  lost: 0   in a closed rail: 4
  414px  header 129px  words 0/4  lost: 0   in a closed rail: 4
  390px  header 129px  words 0/4  lost: 0   in a closed rail: 4
  360px  header 129px  words 0/4  lost: 0   in a closed rail: 4
```

**The second column exists because the first run of this confirmation was taken
before [103](103-below-600px-the-builder-is-two-rails-and-a-64px-sliver-of-the-page.md)
was fixed, and went stale the moment it was.** Once the rails collapse, the four
tab-paging buttons inside a CLOSED rail are off screen — which is not a loss, it
is a drawer, and a toolbar toggle opens it. They are counted separately rather
than filtered out: an exclusion nobody can see is how a real defect gets hidden
inside a green number. `lost` is 0 at every width, and that is the claim.

Both mechanisms are visible and doing separate work: at 900px and 768px the
header is still **one 48px row** with the labels gone, so the collapse is
carrying it; from 600px the header grows and the wrap is carrying it.

And from the phone itself, 390×844 with touch:

```
Publish    reachable  66x32 at 101,90
Layers     reachable  32x32 at 170,7
Inspector  reachable  32x32 at 210,7
Undo       reachable  32x32 at 250,7
page errors: 0
```

**The red run is the table at the top of this issue**, taken with the same probe
and the same controls against the real pre-fix build. Nothing was broken on
purpose to manufacture it.

**My first confirmation was worthless and is left here rather than quietly
replaced.** To check the labels were still painted I counted `textContent`, which
reads straight through `display:none`. It printed `words 4/4` at 360px, where the
truth was 0 of 4 — and it would have printed 4/4 with the labels deleted
outright. Replaced with `getClientRects().length > 0`, which then read 8/4,
because the wrapper span carries the same text as the span inside it. Leaves
only. The number was real on the third attempt.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.
