# 036 — A dialog opened inside a theme island renders in the page's theme, and 15 of 18 portalled components never say so

**Status:** fixed
**Severity:** major
**Found by:** P06 · Nia Adeyemi · act 4
**Surface:** `apps/site` › getting-started; `@wizeworks/silicaui-react` › the 18 portalled components
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 4 is the nested island, and the island itself is flawless. Two cards carrying
**exactly the same classes**, one inside `data-theme="atelier-clay"` and one inside
`data-theme="atelier-ink"`:

| | surface | ink | contrast | `terracotta` button |
| --- | --- | --- | --- | --- |
| clay card | `oklch(0.975 0.006 85)` | `oklch(0.26 0.03 48)` | 14.50 | `oklch(0.62 0.14 38)` at 5.44 |
| ink card | `oklch(0.19 0.012 48)` | `oklch(0.93 0.01 85)` | 15.06 | `oklch(0.72 0.13 38)` at 8.07 |

No per-theme CSS, no props, nothing but the attribute on the wrapper. That is the
claim and it holds.

**Then open a dialog from inside the dark card.** Its own title says
`atelier-ink — l'îlot`, and it renders in `atelier-clay`:

```
portalled out of the island : true
parent chain               : BODY > DIV > DIV        ← no [data-theme] anywhere
nearest [data-theme]       : atelier-clay            ← the one on <html>
surface                    : oklch(0.975 0.006 85)   ← the LIGHT surface
button fill                : oklch(0.62 0.14 38)     ← clay's terracotta, not ink's
```

Nothing errors and nothing is unreadable — 14.50 and 5.44, both fine. It is simply
the wrong theme, on a panel that announces the right one.

## What should have happened

The page that teaches the idiom is the page that sets the expectation.
`/docs/getting-started` §4 says nesting **is** the idiom:

> *"Put it on `<html>` for the whole page, or on any wrapper for one section —
> nesting is the intended idiom, and a section needs no CSS of its own."*

A reader who nests a dark panel and opens a dialog from it has done exactly what
that paragraph told them to.

## Why it happens, and why it is not a bug in the portal

A dialog, menu, select, tooltip or toast portals to `document.body` on purpose — to
escape `overflow` clipping and stacking contexts. Its nearest `[data-theme]` is
therefore the one on `<html>`. That is correct behaviour for the portal and wrong
for the author, and the gap between those two is where the defect lives.

## The escape hatches existed. Almost nothing said so.

Both answers are already implemented and both work:

- `popupProps={{ "data-theme": "…" }}` — re-states the theme on one popup's root.
- `PortalContainerProvider` — points every portalled surface below it at an element
  inside the island. `portal-container.tsx` even documents this exact use: *"That is
  how a pane, workspace, or module region gets its dialogs and menus to inherit its
  own theme island."*

**Of the 18 components that portal, 3 mentioned it** — `select.tsx`,
`combobox.tsx`, `tooltip.tsx`, each in a `popupProps` description, which is why that
sentence reaches their props tables on the site.

The other 15 said nothing: `dialog`, `alert-dialog`, `drawer`, `popover`,
`dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `command-palette`,
`autocomplete`, `multi-select`, `date-picker`, `lightbox`, `preview-card`, `toast`.
**Dialog is the common case and was in the silent group.**

And the general answer was worse off than the specific one: `PortalContainerProvider`
appears **nowhere on the docs site** — not in getting-started, not in a component
page, not in search.

```
grep -rn "PortalContainer" apps/site/app apps/site/src   →   no matches
curl /docs/components/dialog | grep "PortalContainer"    →   no matches
```

## The fix

**One place that teaches it, and fifteen places that point at it.**

1. A new subsection in `/docs/getting-started#themes-and-popups`, immediately after
   the nesting paragraph that creates the expectation — why a popup leaves the
   island, both escape hatches, and the two container caveats (`overflow: hidden`
   and fixed-positioning containing blocks) that turn the general fix into a
   differently-broken popup.
2. The same note added to the main component in each of the 15 silent files, so it
   reaches a developer on hover without them going to the site at all.

No behaviour changed. Making `Dialog` copy the trigger's `data-theme`
automatically was considered and rejected for this run: it would alter what every
existing portalled surface renders as, across 18 components, to fix something that
already has two working answers. What it did not have was anybody being told.

## Confirmed by

**On the screen it was found on** — the kit's act-4 section, both cards side by
side, measured above, and the dialog reproduced from the dark card.

**The docs path, re-walked:** `/docs/getting-started#themes-and-popups` renders, and
`grep "THEME ISLANDS" packages/silicaui-react/src/*.tsx` now returns **18 of 18**
portalled components (the 15 added plus the 3 that already carried it in a prop
description).

`pnpm --filter @wizeworks/silicaui-react typecheck` passes.

## Also measured, and NOT a defect

The nested island itself: the inner theme wins for everything inside it and nothing
outside it. Two cards, identical class strings, 14.50 and 15.06, and each one's
`terracotta` resolves to its own theme's ramp. That half is exactly as advertised.

## Rating effect

`/docs/getting-started` is re-scored in [rating.md](../rating.md) by this act.
