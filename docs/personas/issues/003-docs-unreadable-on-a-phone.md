# 003 — The docs are unreadable on a phone: the sidebar takes 71% of the screen

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 1
**Surface:** silicaui.com › Docs (`/docs`) and all 116 component doc pages — **and the `Sidebar` component itself**
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** driven at 360px — opened the drawer, tapped a component, landed on it. See below
**Blocked on:** — (was `decision`; Brandon chose "fix it all" on 2026-09-18, and C′ was taken)

## What happened

Dilnoza opened the docs at 360px, the width the rulebook holds every screen to and the
width her own build has to work at.

The sidebar stayed at its full desktop width. Measured inside a 360px frame, not
eyeballed:

| | Measured |
| --- | --- |
| Viewport | 360px |
| Sidebar width | **256px** |
| Sidebar as a share of the screen | **71%** |
| Left for the actual documentation | ~90px |
| Horizontal page overflow | **48px** |

At 90px the docs index body renders roughly one word per line:

> SilicaUI / is / a / CSS- / first / Tailwind / compo… / library / built / on / Base /
> UI / behavio… / and / OKLCH / design / tokens.

The page is not tight at that width, it is unusable. And the whole page also scrolls
sideways by 48px, so the content that is left will not sit still while she reads it.

## What should have happened

At 360px the navigation should get out of the way — collapsed, behind the trigger that
is already in the header, or over the content as a drawer — and the documentation
should have the screen.

Nothing here is exotic. The component **already has** a collapsed state and a trigger
to reach it. It simply never reaches for it on its own, at any width.

## How to reproduce

1. `pnpm site:dev`, then open `http://localhost:4011/docs/` at a 360px viewport
   (device emulation, or an iframe — not by resizing a real window).
2. Read the first paragraph.
3. Any component page does the same; `/docs/components/button` was checked.
4. Every time.

```js
// inside a 360px frame
document.documentElement.clientWidth                              // 360
document.documentElement.scrollWidth                              // 408  → 48px sideways
document.querySelector('.sidebar').getBoundingClientRect().width  // 256  → 71% of the screen
```

## Why it matters

A real job cannot be done: reading this library's documentation on a phone.

It also lands on the persona twice over. Dilnoza is judging whether this project was
thought through, and "we did not consider phones" is a loud answer. She is also about
to build an app whose own bar is 360px — and the thing telling her how to do that
cannot do it.

**And it is not the site's defect.** `apps/site/app/docs/docs-shell.tsx` builds the
docs out of silicaui's own `Sidebar`, `SidebarProvider` and `SidebarTrigger`. So every
consumer of the `Sidebar` component ships this, not just this site.

## Where it lives

- `packages/silicaui/src/components/sidebar.js:32` — `.sidebar` is
  `width: var(--sidebar-w)`, flat, with no media query and no container query anywhere
  in the file that narrows or collapses it.
- `packages/silicaui/src/components/sidebar.js:47` — `--sidebar-w-collapsed` exists and
  works, but is only ever entered by an explicit toggle.
- `apps/site/app/docs/docs-shell.tsx:54-84` — the site consuming it, with a
  `SidebarTrigger` already present in the header.

The file does carry `@media (prefers-reduced-motion: reduce)` at line 49 for its width
transition, so responsive thinking is present in the component — just not for width.

## Do the siblings have it too?

**Yes, and that is the important half of this issue.**

- Checked `/docs` and `/docs/components/button`: both identical, because both come from
  the one shell.
- **Not checked, and stated rather than assumed (RULE #4):** the builder's own rails
  (`Site builder › Layers`, the email builder's panels) and sparx's and piggles'
  sidebars. They consume the same component, so the same fixed width is likely there —
  but this run did not open them. **P03 and P05 must check this on the builder**, and
  it is written into the handover below.
- The `AppShell` family more broadly was not examined.

## The fix

**Not made. `Blocked on: decision`** — and the reason is not that it is hard, it is that
`@wizeworks/silicaui` is published and in production. Changing when a `Sidebar`
collapses changes the layout of every app already using it, including sparx and
piggles, with no code change on their side. That is Brandon's call, not a run's.

The options:

**A. Auto-collapse below a container width, in the component.** The repo is
container-query-first (memory: `builder-ux-research`, "CQ = design once"), so the
honest version is a `@container` rule on `.sidebar`'s wrapper that drops it to
`--sidebar-w-collapsed` when there is not room. Fixes it everywhere at once, including
the builder, and needs no consumer change. **It also silently changes sparx's and
piggles' layouts on the next release** — so it wants a changeset that says so out loud.

**B. Same, but opt-in.** A `collapseWhenNarrow` prop / modifier class, defaulting off.
Nothing changes for existing consumers; the site opts in. Safe, but it leaves the
default broken, and every future consumer hits this once before finding the prop.

**C. Fix the site only.** The docs shell collapses its own sidebar under a breakpoint.
Fastest, and wrong in the way this repo has a memory note about — it fixes the call
site and leaves the affordance broken for everyone else.

**Recommendation: A, with the changeset spelling out the consumer impact.** A sidebar
that takes 71% of a phone is not a layout somebody chose, so "fixing" it is very
unlikely to break an intent anybody had. B is the cautious version if a release cannot
carry a visual change right now; C should not be the answer here, because the whole
point of finding it on the docs was that the docs are just one consumer.

The 48px horizontal overflow is probably the same root cause and is **not** filed
separately until A/B/C is decided — if it survives the sidebar fix, it gets its own
issue then.

## Update 2026-09-18 — auto-collapse was tried on the screen and is NOT a fix on its own

Brandon said "do the docs", so option A was taken to the screen before being written.
It does not work, and the options above were under-informed. Measured in a 360px frame
by putting `data-collapsed` on the live sidebar:

| | Result |
| --- | --- |
| Sidebar width | 256px → **72px** |
| Docs body | **becomes readable** — full sentences, no one-word lines |
| Sidebar items | **116** |
| Items with an icon | **0** (`hasSvg: false` on every one) |
| Item label when collapsed | `display: none` |

So collapsing trades one broken state for another: the documentation becomes readable,
and the navigation becomes **116 identical blank 32px boxes in a dead 72px column**.
Confirmed visually as well as measured — the rail renders completely empty apart from
its own scrollbar.

The cause is structural, not cosmetic: `.sidebar[data-collapsed]` is designed to fall
back to an **icon rail**, and these items are text-only. The component's own doc comment
says it "collapses IN PLACE to a narrow icon rail" and is "distinct from `Drawer`
(which overlays content)" — so for a text-only nav there is nothing for the collapsed
state to show.

There is also a copy consequence in that state: the docs body says *"pick one from the
sidebar, or jump in with search (⌘K)"* while the sidebar is showing nothing.

**This is why the fix is still not made.** Shipping auto-collapse would have closed the
issue with a straight face and left a dead rail on every phone, in this site and in
every consumer of the component.

### The real options, now that the behaviour is known

**A′. Auto-collapse, and give the docs items icons.** Keeps the component's stated
design (never overlay, collapse to an icon rail) and makes the rail meaningful. But it
needs an icon per component for 116 entries, and a 72px rail of 116 icons is not
navigation anybody can use either.

**B′. Auto-hide below a width, with the trigger opening it over the content.** The
sidebar goes to `width: 0` when there is no room, and the existing `SidebarTrigger`
opens it — overlaying, the way every docs site on a phone does it. **This contradicts
the component's "a Sidebar never overlays" rule**, so it is a deliberate amendment to
the component's design, not a bug fix. Best result for a reader; biggest decision.

**C′. The docs shell swaps components at narrow widths** — `Sidebar` on desktop,
`Drawer` (which already overlays and is already built for this) on a phone. Uses each
component as designed, changes no published behaviour, and touches only
`docs-shell.tsx`. It is a call-site fix, which this repo has a memory note against —
but here the call site is genuinely choosing between two components that both exist and
both work, which is different from patching around a broken affordance.

**D′. Leave the component alone; accept the docs are desktop-only.** Honest, cheap,
and bad for a library whose own bar is 360px.

**Recommendation is now C′, not A.** `Drawer` already exists, already overlays, and is
already the right component for navigation on a phone; the `Sidebar` is not broken so
much as being used at a width it was never designed for. C′ also unblocks the builder
question below rather than pre-empting it — the builder's rails may genuinely want a
different answer from a docs site's.

**Not done pending your pick.** A′ / B′ change a published component and therefore
sparx and piggles; C′ does not.

## The fix that was made — C′

`apps/site/app/docs/docs-shell.tsx`. **No published component's behaviour changed.**

The component list is written **once** as a `navPanel(onNavigate?)` and mounted twice:

- the persistent `Sidebar`, now `hidden md:block`, exactly as before on desktop
- inside a `Drawer` — silicaui's own component, the one already built to overlay —
  opened by a new menu button that is `md:hidden`

Each component is used as designed. `Sidebar` keeps its "never overlays" rule and its
desktop density; `Drawer` does the overlaying, which is what it is for. Nothing in
`packages/silicaui` was touched for this, so sparx and piggles are unaffected.

The drawer is **controlled** rather than using `DrawerTrigger`, because picking a
component has to close it — a drawer left sitting over the page you just navigated to
is the standard way this control is got wrong.

`<ThemeController>` went into the docs header on the same pass (issue #002).

**One thing this fix broke, found by re-reading the screen afterwards:** the docs body
said *"pick one from the sidebar, or jump in with search"*, and on a phone there is no
longer a sidebar to point at. Reworded to "pick one from the list". A fix that makes a
neighbouring sentence false is not finished.

## Confirmed by

Re-ran P01 act 1 at a true 360px viewport, OS dark, on a cleanly rebuilt server.

> **Docs at 360px:** the sidebar is not rendered (`offsetParent` null), the menu button
> is present and visible, **horizontal overflow is 0px** (was 48px), and the body reads
> in full sentences — *"SilicaUI is a CSS-first Tailwind component library built on Base
> UI behavior and OKLCH design tokens."* It was one word per line.
>
> **Tapped the menu button:** the drawer slid in over the content, 256px of a 360px
> screen, the full 116-item list readable in dark, the page dimmed behind it.
>
> **Tapped "Button" in the drawer:** landed on `/docs/components/button/`, `h1` reads
> **"Button"**, and the drawer had closed itself. Zero overflow on the new page.

**A false alarm, recorded because it nearly became a filed bug:** the first tap closed
the drawer *without* navigating. On the second attempt, with the drawer settled, the
same tap navigated correctly. The first tap landed during the slide-in animation. So
this is not a defect in the fix — but "a tap during the open animation does something
else" is a real characteristic of the pattern, and **P09 should tap it in anger** on a
device where the animation and the thumb are both real.

Desktop re-checked on the same pass: above `md` the `Sidebar` renders exactly as
before, so the fix is additive at narrow widths rather than a change to the layout
anybody currently sees.

Not a regression risk to an earlier persona: P01 is the first run, and nothing outside
`apps/site` changed for this issue.

## Handover

**P03** (site builder) and **P05** (host embed) must check the builder's rails at
narrow widths and link their result back here. **P09** (Gordon, 150% zoom) will hit the
same geometry from the other direction — a 256px sidebar at 150% zoom is effectively
this bug on a desktop.

## Rating effect

`silicaui.com › Docs` and `Button — component doc` both scored with this as the leading
deduction. See [rating.md](../rating.md).
