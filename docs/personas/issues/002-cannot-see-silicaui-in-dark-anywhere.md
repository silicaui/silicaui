# 002 — Dilnoza came to check the dark theme and there is no way to see it

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 1
**Surface:** silicaui.com — **every screen**: Home, About, Docs, and all 116 component doc pages
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** measured on the running site in both directions — see below
**Blocked on:** — (was `decision`; Brandon chose "fix it all" on 2026-09-18)

## What happened

Dilnoza's two operators run her console in dark from 22:00. Dark is not a preference
for her, it is the primary theme, and evaluating it is the reason she opened the site.
The front page told her:

> **Same components. Any theme.**
>
> Every tile below is a live SilicaUI component — the exact markup you'd ship, not a
> screenshot. Switch the theme and watch them re-tint together: one token swap, no
> per-theme CSS, no rebuild.

She went looking for the switch. There isn't one.

Measured on the running site rather than guessed:

| | Home `/` | Docs `/docs` | Button `/docs/components/button` |
| --- | --- | --- | --- |
| Her OS is set to dark (`prefers-color-scheme: dark`) | **true** | **true** | **true** |
| What `<html data-theme>` resolves to | `light` | `light` | `light` |
| Stylesheet rules mentioning `prefers-color-scheme` | **0** | **0** | — |
| Theme control anywhere on the page | **none** | **none** | **none** |

The only "Dark" control on the entire site is a `toggle-group-item` inside the
front page's demo band ("Theme these components: Quartz · Dark · Ocean · Grape ·
Sunset"). It re-tints **the six demo tiles** in that one section. It does not touch the
page, and there is nothing like it on `/docs` or on any component page.

So the page demonstrates theme switching on six tiles, inside a site that cannot
switch its own theme, to a visitor whose operating system already asked it to.

## What should have happened

She should have been able to see a Button — any component — in dark, on the site that
sells dark, without installing anything.

At minimum the site should not *ignore* a preference her OS is actively sending. Not
one rule in any stylesheet on the page mentions `prefers-color-scheme`; this is not a
dark theme that is hard to reach, it is a site with no dark rendering at all.

## How to reproduce

1. Set the OS / Chrome to dark appearance.
2. `pnpm site:dev`, open `http://localhost:4011/`.
3. The page is light. Look for a theme control in the header, the footer, anywhere.
4. Go to `/docs`, then `/docs/components/button`. Same.
5. Every time, at any width, in any browser.

Read it back yourself rather than trusting the eye:

```js
matchMedia('(prefers-color-scheme: dark)').matches          // true
document.documentElement.getAttribute('data-theme')          // "light"
[...document.styleSheets].reduce((n,s)=>{try{return n+[...s.cssRules]
  .filter(r=>r.cssText.includes('prefers-color-scheme')).length}catch(e){return n}},0)  // 0
```

## Why it matters

This is the product's headline claim, unverifiable on the product's own site, by the
exact visitor the claim is aimed at.

For Dilnoza it is decisive rather than annoying. She is auditing a 0.x project with one
maintainer for signs of care, her whole use case is dark, and the answer she leaves
with is "I could not check." She will either install it locally to find out — the cost
the site exists to remove — or pick something else.

It is `major` and not `design`: the rule being broken is not a styling rule, it is that
a real job cannot be finished the way a person would do it.

**It is not cosmetic and not a one-screen problem.** It is every one of the 142 screens
in [rating.md](../rating.md) that belongs to the site, which is 121 of them — and it
means RULE #6's "score it in light and dark" cannot be honoured for any site screen
until this is resolved. Every site row in the rating file is currently a light-only
score, and they are marked as such.

## Where it lives

- `apps/site/app/layout.tsx:79` — `<html lang="en" data-theme="light">`. Hardcoded, no
  OS read, no persistence, nothing to change it.

Worth saying plainly, because it changes the fix: **the light page is deliberate art
direction, not an oversight.** The front page is composed as a light page with
`data-theme="dark"` islands — the hero (`sections.tsx:29`, `:64`, `:133`), the story
panel (`story.tsx:110`) and the theme wall (`theme-wall.tsx:40`). That composition is
doing real work and showing off theme islands. A global dark switch is therefore not a
one-line change; it needs a designed dark counterpart for those sections, or they stop
being islands and become the whole page.

## Do the siblings have it too?

**Yes — it is universal, which is why this is filed as one issue and not three.**
Checked on the running site: `/` , `/about`, `/docs`, and `/docs/components/button` all
resolve `data-theme="light"` with no control present. The docs shell has its own header
(with Search ⌘K) and no toggle in it either.

Not checked: the remaining 115 component doc pages individually. They share one layout
with the Button page, so the finding is the layout's, but this run did not open them
and is not claiming anything about them beyond that (RULE #4).

## The fix

**Not made. This is `Blocked on: decision`** — it is Brandon's marketing site and his
art direction, and the cheap version and the right version differ a lot. The options,
smallest first:

**A. Docs only.** Put silicaui's own `ThemeController` in the docs shell header, beside
Search. The docs pages are plain light surfaces with no island composition, so they can
take a global theme with little design work — and the docs are where a developer
actually evaluates components. The marketing page keeps its art direction untouched.
*Smallest change, and it solves Dilnoza's actual job.*

**B. Docs, plus respect the OS on first load.** As A, and `data-theme` initialises from
`prefers-color-scheme` rather than the literal `"light"`, persisting the visitor's
choice after that. Costs a small inline theme script to avoid a flash.

**C. Whole site.** A dark composition designed for the marketing page too — the islands
need to invert or be re-cut. Real design work, and it risks the front page's whole
light/dark contrast story.

**D. Deliberately none.** The site stays light by design; the copy stops implying the
visitor can switch it, and the demo band's "Dark" button is relabelled so it does not
read as a site-wide control.

**Recommendation: B.** It gives Dilnoza the thing she came for, it dogfoods a component
the library already ships (`theme-controller.tsx` in `silicaui-react`, and the
`theme-toggle` behavior in `silicaui-behaviors` — both shipped, both currently unused by
the site itself), and it leaves the front page's art direction alone. D is honest but
concedes the point; C is the only one that makes the front page itself switchable, and
it is the most expensive by a wide margin.

## What was actually done — and it was bigger than option B

Brandon's call was "fix it all", so the whole site switches, not just the docs. Three
changes, and the important one is that **two of them are library defects, not site
defects** — the site was only where they became visible.

**1. The plugin gains an opt-in `prefersdark`.** `packages/silicaui/src/theme.js` +
`index.js`. `@plugin "@wizeworks/silicaui" { prefersdark: true; }` emits

```css
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { …dark tokens } }
```

Pure CSS, so there is **no theme script**: no flash of the wrong theme, and nothing for
a strict CSP to refuse — which matters on a product that advertises "no inline script
in the static output" two sections above the stats band. Default **off**, so sparx and
piggles see no change at all unless they ask for it.

**2. `<html data-theme="light">` removed** from `apps/site/app/layout.tsx`. That
attribute made `:root:not([data-theme])` permanently unmatchable, which is the entire
reason a dark-OS visitor got a white page.

**3. `ThemeController` no longer stamps a theme nobody chose.** This is the one worth
reading twice. `packages/silicaui-react/src/theme-controller.tsx` had:

```js
React.useEffect(() => {
  const el = getTarget();
  if (el) el.dataset.theme = current;   // runs on mount, always
}, [current, getTarget]);
```

With nothing stored, `current` falls back to `themes[0]` — `"light"`. So **merely
rendering the control wrote `data-theme="light"` and silently overrode the visitor's
operating system.** Adding the toggle to fix this issue would have re-broken it, in a
way with no symptom except a light page on a dark machine.

It now tracks whether anything has actually *chosen* — a controlled `value`, an explicit
`defaultValue`, a stored choice, an attribute already present, or a click — and writes
nothing until something has. It also reads the OS once post-mount so the control
*displays* the right icon without writing. This is a straight bug fix: every case that
previously wrote still writes, and only the "nobody chose" case changed.

The toggle itself is silicaui's own `<ThemeController>`, in both the landing header and
the docs header. The library was shipping the component and the behavior and using
neither on its own site.

**The landing page needed no dark redesign.** The worry in option C was that its
`data-theme="dark"` islands would stop reading as islands. Walked the whole page in
dark: the hero and nav islands stay dark by definition, every other section re-tinted
through its tokens, and it holds. The token system did the work — which is the claim
the page makes about itself.

## Confirmed by

Re-ran P01 act 1 on the running site, OS set to dark, **with the stored theme cleared**
so the default path was the one under test.

> **First paint, nothing stored:** `matchMedia('(prefers-color-scheme: dark)')` = true,
> `<html>` has **no** `data-theme` attribute, `colorScheme` resolves **dark**,
> `--color-base-100` = `oklch(16% 0.01 255)`. One `prefers-color-scheme` rule now in the
> stylesheet, where there were **zero**.
>
> **Clicked the toggle in the header:** `data-theme="light"`, `localStorage
> silica-theme = "light"`, `--color-base-100` = `oklch(98% 0.003 250)`. So the
> visitor's choice outranks their OS, which is the correct precedence.

Walked the page in dark and **measured contrast off the computed styles** rather than
eyeballing — with the instrument sanity-checked first (white on black = 21.0):

| Text | Size | Contrast | AA |
| --- | --- | --- | --- |
| "Start with one line." on `bg-primary` | 72px | **8.10** | pass |
| its subhead | 20px | **8.10** | pass |
| stat label "Documented components" | 16px | **16.31** | pass |
| ecosystem body | 18px | **15.75** | pass |
| FAQ question | 16px | **15.75** | pass |
| footer tagline | 16px | **15.75** | pass |

**A wrong measurement was caught and thrown away**, which is worth recording: the first
contrast pass returned 1.02–1.03 for everything and "fails AA" across the board. That
was the instrument, not the page — this site's computed colors come back as `oklch()`
and the function was parsing them as RGB. Re-done by converting through a canvas, with
a known-answer check first. **The page was never broken; the first set of numbers was.**

`/docs` and `/docs/components/button` re-checked at 360px: `colorScheme` dark, no
`data-theme` written, theme toggle present in the docs header.

Not a regression risk to an earlier persona: P01 is the first run. The two library
changes are additive-opt-in and a bug fix respectively, but **P03 and P05 should still
watch for the `ThemeController` change** in the builder, which mounts one.

## Rating effect

Blocks a complete score on every site screen. Home, About, Docs and Button are scored
in [rating.md](../rating.md) **light-only**, each flagged `#002`, because the second
theme cannot currently be looked at (RULE #4 — not scored is not the same as fine).
