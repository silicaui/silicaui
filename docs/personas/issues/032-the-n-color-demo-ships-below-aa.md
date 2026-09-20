# 032 — The button demonstrating the N-color claim measured 4.30:1, and a passing ink was sitting unused

**Status:** fixed
**Severity:** major
**Found by:** P02 · Tomás Ferreiro · act 3 (scoring `/` at 360px under RULE #6)
**Surface:** `apps/site` › `app/globals.css`; the engine question handed to **P06**
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —
**Followed up by:** [037](037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md) — P06 answered the question below and the plugin now measures

## What happened

Scoring the home page at 360px in both themes turned up `btn-brand` and `badge-brand` at
**4.30:1** — under WCAG AA's 4.5.

`brand` is the site's invented colour, and its comment says exactly why it exists:

> *"`brand` is not one of silicaui's roles — it's invented here, by this site, exactly the
> way a consumer would invent one. … The landing page demonstrates that claim with this very
> token, so the demo cannot be true on the page and false in a consumer's app."*

So the element demonstrating the product's headline claim was the element failing AA.

The cause is precise:

| | |
| --- | --- |
| `--color-brand` | `oklch(58% 0.24 320)` |
| `--color-brand-content` | **not declared** — so `autoContent` guesses |
| how it guesses | black if OKLCH `l` ≥ `0.57`, white below |
| `brand`'s lightness | **0.58** — a hair over |
| ink it picked | **black**, at **4.30:1** |
| ink it rejected | **white**, at **4.88:1** |

A passing ink existed and the rule chose the failing one.

## What should have happened

`lib/auto-content.js` already says, in its own words, that this should not have been reached:

> *"the LAST RESORT, for a color nothing had a chance to measure … Anything
> @wizeworks/silicaui can see at build time — a preset, a theme in the builder, **a declared
> plugin color** — should get a MEASURED foreground … and never reach this fallback."*

`brand` **is** a declared plugin colour: it is in the `colors:` list. It reached the fallback
anyway, because the plugin is given the colour's NAME in its options while the VALUE is
declared in `:root` in CSS the plugin never parses. The contract in that comment is true of
presets and of builder themes; it is not true of a colour declared this way, and nothing
says so.

## How to reproduce

1. Register a colour whose OKLCH lightness is just over `0.57` with meaningful chroma —
   `oklch(58% 0.24 320)` is the live example.
2. Do not declare `--color-<name>-content`.
3. `<button class="btn btn-brand">` measures **4.30:1**.

## Why it matters

It fails in the quietest possible way. There is no build error, no console warning, and the
button looks deliberate — a strong purple with black text reads as a design choice rather
than as a coin-flip that landed wrong.

And the reach is the point of the feature: **every** `btn-`, `badge-`, `alert-` and the rest
for that colour inherits the same ink, so one unlucky hue is wrong everywhere at once.

## Do the siblings have it too?

**No — and this is the only class of `brand` that was failing.** Measured on the same page:

| | light | dark |
| --- | --- | --- |
| `btn-brand`, `badge-brand` | **4.30** | **4.30** |
| `text-brand` | 7.78 | 7.78 |
| `border-brand` | 15.75 | 15.75 |

Only the two that paint the colour as a SURFACE and need an ink on top of it. `text-brand`
uses the ink derivation from issue 026 and is fine.

**The built-in roles are unaffected.** `verify-token-contrast.mjs` measures all 40 colour ×
style pairs across the shipped presets and is green; those have authored `-content` tokens
and never reach the fallback. This bites invented colours only — which is to say, the
feature's own audience.

## The threshold is not the bug, and that was measured, not assumed

The tempting fix is a better constant, or making the rule chroma-aware. **Both were tested
over a 51,480-point sweep of the l/c/h space, scored against the ink WCAG actually prefers,
and both were rejected.**

Making it chroma-aware (`l − k·c`) is **worse**, badly:

| k | colours given an avoidable sub-AA ink |
| --- | --- |
| **0 — today's rule** | **1,182** |
| 0.1 | 1,813 |
| 0.2 | 2,909 |
| 0.4 | 5,417 |

And `0.57` is the optimum for a lightness-only rule, not a guess:

| threshold | avoidable failures |
| --- | --- |
| 0.55 | 1,752 |
| 0.56 | 1,334 |
| **0.57** | **1,182** ← minimum |
| 0.58 | 1,410 |
| 0.60 | 2,550 |
| 0.68 (the old default) | 8,753 |

That independently confirms the constant the file already chose against the four shipped
presets, and confirms its own history note that 0.68 was badly wrong.

**So ~2.3% of colour space gets the wrong ink and no constant fixes it**, because CSS cannot
compute a contrast ratio. `brand` is in that 2.3%.

## The fix

State the ink instead of letting it be guessed — which is what `auto-content.js` prescribes
for anything the build can see:

```css
--color-brand-content: oklch(100% 0 0);
```

`100%` is the best available ink for this hue, not a default: a sweep of grey inks from 0%
to 100% against `brand` peaks at white, 4.91.

`--color-brand` itself is **unchanged**. Re-tuning the demo's colour until the guess came out
right would have hidden the finding rather than fixed it.

## Confirmed by

Read off the rendered home page, both themes, after the change:

| | before | after |
| --- | --- | --- |
| `btn-brand` | **4.30** | **4.91** |
| `badge-brand` | **4.30** | **4.91** |
| `text-brand` / `border-brand` | 7.78 / 15.75 | unchanged |
| elements below AA on the page | 14 | **12** |

The remaining 12 are all `.calendar-day[data-outside]` — days from the adjacent month, at
40% alpha and `tabindex="-1"`. That is RULE #3's sanctioned case (*"a de-emphasized
duplicate"*), they are out of the tab order, and `verify-readable-ink.mjs` is green on them.
Measured and deliberately left alone rather than counted as failures.

**Two of my own readings were withdrawn getting here**, and both were probe bugs, not page
bugs:

1. A first pass reported **289 of 406** below AA with a worst of exactly `1.00`. The page
   reveals sections on scroll; 30 wrappers were still at `opacity: 0`, so their descendants
   composited to exactly their own background. Fixed by scrolling the document through the
   viewport before measuring, and by skipping anything whose effective opacity is 0.
2. The next pass reported a `.multi-select-chip` at **1.16**, in both themes. The kit was
   dividing `getImageData` values by alpha — but `getImageData` already returns straight,
   non-premultiplied RGBA, so a 15%-alpha light background read as `rgb(1127, 1262, 1396)`.
   The chip actually measures **7.46**. The kit now validates that no channel exceeds 255,
   which is the check that would have caught it.

Both were found because a number looked impossible, not because anything flagged them. The
kit is validated on five facts before each run: white-on-black = 21.00, 50% black over white
= 127, 50% white over black = 128, an unparsable value returns `null` rather than a colour,
and no channel exceeds 255.

## Handed to P06 — ANSWERED, see [037](037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md)

> **P06 measured it: the plugin holds the VALUE, in both documented ways of declaring
> a colour.** `theme("color")` returns `{ terracotta: "oklch(0.62 0.14 38)" }`, and a
> `@plugin ".../theme"` block receives the value as the option itself. So option one
> below was achievable, and it shipped — plus a repair for the theme path, where the
> ink can safely be substituted rather than only warned about.
>
> **Two numbers in this file are 0.02 out and are corrected here.** Black on `brand`
> is **4.28**, not 4.30, and white is **4.91**, not 4.88. The source was
> `silicaui-html``s `contrastRatio`, which measured continuous floats instead of the
> 8-bit colour a screen receives; it now rounds first, and two independent
> implementations plus Chromium`s own `getImageData` agree to 0.00. The conclusion is
> unchanged: black fails, white passes, and the gap is real.

**P06 is the N-color persona and this is its question:** a consumer invents a colour, does
not declare an ink, and lands in the 2.3%. Today they get a silent sub-AA control.

The options, with what is already known about each:

- **Warn at build time.** The plugin is handed the colour's NAME but not its VALUE — the
  value is `:root` CSS it never parses — so it cannot measure. A colour declared in `@theme`
  *is* visible to Tailwind, and getting-started already promises a build-time message for
  that case; whether it extends to a measurement is P06's to answer.
- **Measure at runtime** in `silicaui-html`'s `deriveContent`, and have consumers emit tokens
  from it — correct, but only for consumers who run a build step, which excludes P02's whole
  path.
- **Say so in the docs.** Cheapest, and today's honest position: the derivation is an
  approximation with a known ~2.3% error band, so declare `-content` for any colour that
  matters.

## Rating effect

`/` is re-scored in [rating.md](../rating.md) by this act.
