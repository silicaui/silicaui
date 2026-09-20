# 038 — Five controls are smaller than WCAG's minimum target, and two chip removes measured 2.78:1

**Status:** fixed
**Severity:** major
**Found by:** P06 · Nia Adeyemi · act 9, scoring the built kit at 360px
**Surface:** `@wizeworks/silicaui` › `tag-input`, `multi-select`, `power-search`, `carousel`, `tree-view`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Scoring the kit at 360px turned up 20 interactive targets under 24 × 24 CSS px.
Twelve were `sr-only` inputs whose label is the real target, and four were this
persona's own raw `<input type="radio">`. Four were not.

Sweeping the plugin source for every rule that is interactive **and** small or faded
found nine, and the same shape three times:

```
multi-select.js   -chip-remove   1rem × 1rem   opacity 0.7   no focus rule
power-search.js   -chip-remove   1rem × 1rem   opacity 0.7   no focus rule
tag-input.js      -remove        1rem × 1rem   opacity 0.7   no focus rule
carousel.js       -dot           0.5rem square
tree-view.js      -toggle        1.1rem square
alert.js          -close         1.5rem square  opacity 0.7
collapsible.js    -trigger-icon  1.5rem square  opacity 0.7
toast.js          -close         1.5rem square  opacity 0.7
color-picker.js   -track         0.9rem tall
```

Measured on the real build, both themes, with the fill measured as a fill and the
ink as an ink:

| control | drawn | light | dark | |
| --- | --- | --- | --- | --- |
| `.tag-input-remove` | **16 × 16** | **2.78** | 6.06 | size **and** contrast |
| `.multi-select-chip-remove` | **16 × 16** | **2.78** | 6.06 | size **and** contrast |
| `.power-search-chip-remove` | **16 × 16** | 6.42 | 8.38 | size only |
| `.carousel-dot` (fill) | **24 × 8** | 4.43 | **1.96** | size, and invisible in dark |
| `.tree-toggle` | **17.6 × 17.6** | 3.54 | 5.21 | size only |
| `.alert-close` | 24 × 24 ✅ | 5.95 | 8.71 | fine — left alone |
| `.collapsible-trigger-icon` | 24 × 24 ✅ | 14.50 | 15.06 | fine — left alone |
| `.toast-close` | 24 × 24 ✅ | 13.25 | 15.86 | fine — left alone |

Three separate defects, and the last three rows are the control group: `opacity: 0.7`
is **not** the problem by itself. It is only a problem on top of a low-contrast
accent.

## 1. Five targets under 24 × 24 — WCAG 2.2 SC 2.5.8, level AA

The criterion is about the **target**, not the paint, and making the marks bigger
would be wrong: a 24px × swallows a 23px chip, and a 24px carousel dot stops reading
as a dot.

`src/lib/tap-target.js` — a shared `hitArea(width, height)` that emits an
absolutely-positioned `::after` centred on the control, sized to 24px, inheriting
the border radius and painting nothing. The pseudo-element is a child of the button,
so a pointer landing on it hits the button. No JavaScript, **no layout shift, no
visual change at all** — which is what let it be applied to five shipped components
at once without any of them redrawing.

**The dots needed one more thing, and it is arithmetic rather than taste.** The
indicator row's gap was `0.4rem` = 6.4px. Two 8px dots each growing 8px per side
overlapped by 9.6px, so a tap near the edge activated the wrong slide. At `1rem` =
16px the hit areas exactly meet and never cross.

## 2. Two chip removes at 2.78:1 — and the cause was not the opacity

Removing `opacity: 0.7` did **not** move the number, which is how the real cause
surfaced: the chip paints `color: accent` — the raw role colour as text.

```js
const accent = "var(--tag-accent, var(--color-primary))";
…
color: accent,          // the FILL form, painted as TEXT
```

`color-variants.js` has emitted `--tag-ink` and `--multi-select-ink` for every
colour all along, and **nothing read them**. `power-search.js` — the third copy of
the identical rule — used `inkOfRole("primary")`, which is exactly why it measured
6.42 where the other two measured 2.78. The system had the right answer, in a
sibling, and two of three copies never got it.

The `opacity: 0.7` came off all three anyway: an × is not less important than the
word it removes, it is already smaller, and that is where the hierarchy belongs
(root `CLAUDE.md` RULE #3).

That the guard meant to catch this could not see it is
[039](039-the-ink-guard-could-not-see-the-idiom-the-components-use.md).

## 3. A carousel dot at 1.96:1 in dark

```js
backgroundColor: "var(--color-base-300)",
```

`--color-base-300` is the **darkest** surface in both modes. On a light page it sits
below `base-100` and reads (4.43); on a dark page it also sits below `base-100`, so
an inactive dot is darker than the page behind it — **1.96:1**, on the control that
navigates the carousel.

Fixed with an ink at reduced strength rather than a surface token:
`color-mix(in oklab, var(--color-base-content) 45%, transparent)`, which reverses
direction with the theme — the same reasoning `lib/ink.js` already gives for why a
mix beats a lightness clamp.

## Confirmed by

Re-measured on the rebuilt kit, both themes:

| | before | after |
| --- | --- | --- |
| `.tag-input-remove` | 16×16, **2.78** / 6.06 | hit **24×24**, **6.23** / **7.97** |
| `.multi-select-chip-remove` | 16×16, **2.78** / 6.06 | hit **24×24**, **6.23** / **7.97** |
| `.power-search-chip-remove` | 16×16, 6.42 / 8.38 | hit **24×24**, unchanged colours |
| `.carousel-dot` | 24×8, 4.43 / **1.96** | hit **24×24**, **3.28** / **7.69** |
| `.tree-toggle` | 17.6×17.6 | hit **24×24**, unchanged colours |

`pnpm verify` is green across the workspace, including `verify-token-contrast`,
`verify-readable-ink` and `verify-field-border`, none of which moved.

**Two of my own readings were withdrawn getting here, and both were probe bugs.**

1. The first pass reported `tree-view-toggle` at 11 × 24 with contrast 14.5. There
   is no such class — the selector is `.tree-toggle`, and my markup was measuring an
   unstyled `<button>`. Every selector in that probe is now checked against the
   built CSS before a number is printed, and the real control is 17.6 × 17.6.
2. `carousel-dot` was reported at 1.96 **after** the fix as well, because the kit
   reads `color` — meaningless on a filled dot that paints no text. It now measures
   a fill as a fill and **says which** it measured.

## Measured and deliberately NOT filed

- **`.segment-field-literal` at 2.72 / 3.90** — the `/` separators in a date field,
  at the same 45% mix as a placeholder, `user-select: none`, not announced by the
  segments' own labels. Incidental text by WCAG's definition, and a judgement call
  rather than a defect. Left for **P09**, whose whole subject is this kind of edge.
- **`.pagination` at 376px inside a 320px column** — the component offers
  `siblingCount` and `boundaryCount` for exactly this, and the page contains it
  without overflowing (`scrollWidth === clientWidth === 360`).
- **`.alert-close`, `.toast-close`, `.collapsible-trigger-icon`** — 24 × 24 already,
  5.95 at worst. The `opacity: 0.7` on them is doing no harm, and changing it would
  be a look change with no measurement behind it.

## Rating effect

None — these are components, not screens. The kit's own screens are scored in
[rating.md](../rating.md) by act 9.
