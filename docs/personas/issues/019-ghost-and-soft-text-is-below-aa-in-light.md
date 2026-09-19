# 019 — In light mode most `soft`/`outline`/`ghost` labels are below the contrast floor

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 6
**Surface:** `@wizeworks/silicaui` — the non-solid colour variants, light mode, every family
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** — (was: scope. Done in act 7 as its own pass, which is what it was held for.)

## What happened

Chasing issue 018 (`neutral` unreadable in dark) I extended the token-contrast probe with
the direction it never tested — *a role colour used as INK on the page* — and it went red
in **light** mode for five roles. Measured again in the browser, on real rendered buttons
rather than on tokens, to be sure the probe was not naive:

**Light mode, contrast of the label against the surface it sits on:**

| role | soft | outline | ghost |
| --- | --- | --- | --- |
| primary | 6.18 | 7.99 | 7.99 |
| secondary | **3.75** | 4.58 | 4.58 |
| accent | **2.55** | **2.96** | **2.96** |
| info | **2.34** | **2.67** | **2.67** |
| success | **2.13** | **2.41** | **2.41** |
| **warning** | **1.64** | **1.78** | **1.78** |
| error | **3.66** | **4.42** | **4.42** |

**Fifteen of twenty-one below AA's 4.5.** `warning` at 1.64 is amber text on near-white —
effectively unreadable. Only `primary` passes everywhere.

The browser and the probe agree to two decimals (probe: `warning` 1.77 on base-100;
browser: 1.78 for outline/ghost), so this is the tokens, not a rendering quirk.

**`soft` is consistently the worst of the three, and for a separate reason.** `outline`
and `ghost` paint the raw token on the page; `soft` also tints the *background* toward the
colour, which lifts the surface and closes the gap further. `secondary` is the case that
separates them — 4.58 as outline/ghost, which passes, and **3.75** as soft, which does
not. So the fix has to cover the tint as well as the ink, and a probe that only measures
the raw token against `base-100` will call `secondary` clean. It is exempt from the
tracked list for that reason, and it is still a real failure in its `soft` form.

## What should have happened

A button label is normal text and needs 4.5:1. `variant="soft"` is a de-emphasis of
*weight*, not permission to drop below the readability floor — and RULE #3 says exactly
that: soft is a deliberate signal, never an excuse for ink a person cannot read.

## How to reproduce

1. Light theme. `<Button color="warning" variant="ghost">Hold</Button>` on the base surface.
2. Measure the computed `color` against the page background: **1.78:1**.
3. Every width, every family — `badge-*`, `alert-*`, `link-*` share the same var-setters.

## Why it matters

Bigger reach than issue 018, lower urgency for *this* persona. Peregrine runs dark, so
Dilnoza's own console is not hurt — the failing combinations are the light ones. It
matters because it is the whole library's light mode, it is the default theme, and it is
the mode every review is done in.

## Where it lives

`packages/silicaui/src/colors.js` — the light palette is tuned for roles used as
**fills**, where a light amber with dark `warning-content` on it is correct and measures
8.78:1. The same value used as **ink** on a 97.7% surface is 1.78:1.

## Do the siblings have it too?

**Yes, and that is the shape of the problem** — the colour classes are pure var-setters
shared through `COLOR_VARIANTS`, so every family that has a soft/outline/ghost form takes
the same value: Badge, Alert, Link, Tabs, Pagination, Filter, Dock and the rest.

**Dark mode is NOT affected** for the chromatic roles. Measured: primary 7.87, secondary
9.70, accent 8.18, info 8.55, success 9.12, warning 11.45, error 5.72 — all pass. The dark
palette lightens every role, which happens to be exactly what makes them work as ink.
`neutral` was the one dark failure and is issue 018.

## The fix

**A theme-aware lightness clamp, in CSS relative-colour syntax** — the same technique
`autoContent` already uses, so it works for a colour invented at runtime too:

```css
light:  oklch(from var(--color-X) min(l, 0.50) c h)
dark:   oklch(from var(--color-X) max(l, 0.66) c h)
```

Measured across all eight roles, this clears AA everywhere and **only bites where a colour
was already illegible**:

| | worst role after the clamp |
| --- | --- |
| light, `min(l, 0.50)` | accent **5.06** |
| dark, `max(l, 0.66)` | neutral **6.24** |

In dark, primary/secondary/accent/info/success/warning/error come out byte-identical —
their lightness is already above the floor, so nothing moves but `neutral`.

**Why this is not a one-line change, and why it is filed rather than done.** The clamped
value is correct for the label and the outline border, and **wrong for a fill**:
`btn-outline` fills with `--btn-accent` on hover and puts `--btn-accent-content` on top,
where that content ink was derived for the *original* colour. Clamping the shared variable
would fix the resting label and break the hover state.

So it needs a genuine split — a `--<c>-ink` beside the existing `--<c>-accent`, with only
the `color:` declarations moved over — across roughly 28 component families. That is a
deliberate, wide, visual change to the default theme, and it deserves to be its own piece
of work rather than a side effect of a shipments table.

**Issue 018's narrower fix is already in and does not conflict**: `neutral` re-points its
ink to `--color-base-content` through `FILL_ONLY_ROLES`, which this clamp would later
subsume.

## What was actually done

**Not the clamp this issue proposed.** The clamp was `min(l, 0.50)` in light and
`max(l, 0.66)` in dark, which needs to know which way to go — a per-theme flag. The
plugin ships two themes and could set it; a host theme from `themeTokenCss` would have
to set it too, and a hand-rolled one would omit it and get the clamp **backwards**,
darkening ink on an already-dark page. `light-dark()` was considered and rejected for the
same reason: it keys off `color-scheme`, which `themeTokenCss` does not emit.

**Mixing halfway toward `--color-base-content` needs no flag at all.** Base-content is
dark on a light surface and light on a dark one, by definition, in every theme including
one invented at runtime. So the direction comes free:

```js
const inkOf = (c) =>
  `oklch(from color-mix(in oklab, ${c} 50%, var(--color-base-content)) l calc(c * 2) h)`;
```

The mix costs about half the chroma — amber would go olive — so the second step
multiplies it back. Lightness and hue are the mix's; only chroma is restored, and an
out-of-gamut result clamps, which `oklch()` does anyway. Measured chroma retained across
both palettes: **89–134%** of the original. Nothing washes out.

`50%` and `×2` were chosen by search, not by feel. At 55%/×1.8 the worst case is 4.92
and `warning soft` is 4.55 — passing, but with no margin for a palette tweak. At 50%/×2
the worst is **5.58** and soft is **5.16**.

**The split is a new variable, not a changed one.** `--<root>-accent` still holds the raw
colour and still drives every fill and tint. `--<root>-ink` is new and holds the derived
value, and only the declarations that paint TEXT moved to it — 19 `color:` rules, the
three button spinners, and the resting `outline`/`dash` borders on Button, Badge and
Alert. A border drawn around a label in the label's own colour has to move with it, or
the control shows two different ambers.

**What deliberately did NOT move:** the `soft` background tint, every `ghost`/`dash` hover
tint, `btn-outline:hover`'s solid fill and its edge, the focus ring, and `fieldBorder()`.
The hover fill is the case this issue predicted would break under a naive clamp — it
fills with the raw colour and carries the declared `-content` derived for that colour, and
both are untouched.

**The ink var is emitted once, for every family, from the existing loop:** any var key
ending `-accent` gets a matching `-ink`. A component added later is covered without anyone
remembering this, and `customColorCss` — the builder's runtime cascade — produces the
identical pair for a live colour because it calls the same generator.

**`FILL_ONLY_ROLES` survives but is no longer load-bearing.** Run through the formula,
`neutral` clears AA on its own (dark **1.53 → 5.45**). It is kept because "neutral ink on
a neutral surface" is the surface's own ink, which measures **15.75** — a better answer
than the general formula, for the one role that has one. Issue 018's fix is preserved
exactly, and improved: `--<root>-accent` goes back to being real `neutral`, so a
`btn-neutral btn-outline` now hovers to a neutral fill instead of to the page's ink.

## Confirmed by

**In the browser, on silicaui.com's Button page, opened cold** after
`rm -rf apps/site/.next`. Every `color × variant` pair on the page read off the computed
style, with ancestor alpha composited; converter checked at `#fff` on `#000` = 21.00.

**40 role × variant pairs in light: every one passes AA.** Worst five, before → after:

| pair | before | after |
| --- | --- | --- |
| `warning soft` | **1.64** | **5.15** |
| `warning outline` / `ghost` / `dash` / `link` | **1.78** | **5.60** |
| `success soft` | **2.13** | 5.71 |
| `accent soft` | **2.55** | 5.94 |
| `info soft` | **2.34** | 6.04 |

**40 pairs in dark: every one passes**, worst `error soft` at 7.30.

The JS model predicted 5.58 and 5.16; the browser returned **5.60** and **5.15**. Two
decimals apart, which is the check that the CSS is doing what the search said it would.

**The hover case was tested with a real mouse hover, not a synthetic class.** A first
attempt injected a `.__force` rule, lost the specificity fight and reported a ratio
against a transparent background — a meaningless number, discarded rather than published.
Hovering `btn-warning btn-outline` for real (`el.matches(":hover") === true`) fills with
`oklch(0.8 0.11 85)` — the **raw** amber — and puts `oklch(0.24 0.04 85)` on it at
**8.72:1**. The prediction in this issue was that a clamp would break exactly this. It did
not break, because the fill never moved.

**Seen, not only measured.** Light and dark screenshots of the solid / outline / soft /
ghost rows: solid is visibly unchanged, and every non-solid label reads as its own role —
amber still amber, success still green, error still red. The two custom roles that page
registers (`brand`, `brand-duck`) and `silica` get the same treatment, which is the
N-colour promise holding through a derived value.

**RULE #7 — and a correction.** This was first written as "re-proved on P01's own
console, rebuilt cold". **That claim was wrong and is withdrawn.** The console declares
`"@wizeworks/silicaui": "^0.55.0"` and is installed with a plain `npm install`, so its
`node_modules` holds a real installed COPY, not a workspace symlink — correct for the
persona, who installs the published package like any customer. `rm -rf .next` does not
touch it. The app was running a snapshot taken before this fix existed, so the numbers it
returned (15.75 on the neutral ghost headers) confirmed issue **018** and could not have
exercised issue 019's new variable at all. They were real readings of the wrong build.

Found in act 8, when a Dialog fix was made, the app rebuilt cold, and the screen came back
unchanged. `sync-silica.mjs` now copies the workspace build in and prints whether the ink
split actually landed, so the step cannot be silent again.

**Re-proved properly after that**, in the hardest configuration — **no `data-theme`, dark
from the OS**: the stylesheet the page serves contains `--btn-ink`, the sortable headers
still measure **15.75**, and the required-field asterisk went **4.42 → 9.57** in light
once act 8's issue 024 routed it through the same derivation.

The silicaui.com confirmation above was never affected: that app builds from the workspace
source directly.

**The probe was re-pointed, and tied to the CSS.** `verify-token-contrast.mjs` measured
the raw token, which *was* the ink until this change; left alone it would have gone on
reporting `warning` at 1.77 while the screen showed 5.60, and stayed green through a
regression in the derivation itself. It now simulates `inkOf` — and reads the mix ratio
and chroma multiplier back out of the **generated CSS** and fails if they disagree.
Proved by changing `calc(c * 2)` to `calc(c * 1.4)` in the source: the probe names the
mismatch and **exits 1**. Restored: exits 0.

`TRACKED_BELOW_AA` is now empty. Its self-cleaning check — a tracked entry that starts
passing fails the build — is what forced it to be emptied rather than left as a stale
exemption.

`pnpm verify` across the workspace: **exit 0**.

## Rating effect

No console screen moved; P01's app runs dark, where these pairs already passed. The change
lands on every light-mode surface in the library. silicaui.com's own doc pages are not
scored from this pass — see the note in [rating.md](../rating.md).

## Rating effect

—
