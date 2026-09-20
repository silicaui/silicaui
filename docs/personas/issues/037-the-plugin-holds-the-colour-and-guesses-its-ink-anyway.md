# 037 — The plugin is handed a colour's value at build time and guesses its ink anyway

**Status:** fixed
**Severity:** major
**Found by:** P06 · Nia Adeyemi · acts 1 and 6 — the question [032](032-the-n-color-demo-ships-below-aa.md) handed forward
**Surface:** `@wizeworks/silicaui` › `src/index.js`, `src/theme-plugin.js`, `src/lib/`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## The question that was handed here

Issue 032 ended with it, unanswered:

> *"**P06 is the N-color persona and this is its question:** a consumer invents a
> colour, does not declare an ink, and lands in the 2.3%. Today they get a silent
> sub-AA control."*

and it ruled out the obvious repair on measurement — `0.57` is the optimum for a
lightness-only rule and a chroma-aware variant more than doubles the wrong-ink
count — leaving three options, of which the first was uncertain:

> *"**Warn at build time.** The plugin is handed the colour's NAME but not its
> VALUE — the value is `:root` CSS it never parses — so it cannot measure. A colour
> declared in `@theme` *is* visible to Tailwind … whether it extends to a
> measurement is P06's to answer."*

## The answer: it has the value, in both documented ways of declaring a colour

Compiled through the real Tailwind compiler with a plugin that prints what it is
given:

```
@theme { --color-terracotta: oklch(0.62 0.14 38); }
@plugin "…" ;

  THEME(color) semantic entries:
  { "terracotta": "oklch(0.62 0.14 38)" }        ← the VALUE, not just the name
```

And the second path hands it over even more directly — in
`@plugin "@wizeworks/silicaui/theme" { --color-x: … }` the value **is** the option.

So `auto-content.js`'s own contract was being broken in both cases:

> *"Anything @wizeworks/silicaui can see at build time — a preset, a theme in the
> builder, **a declared plugin color** — should get a MEASURED foreground … and
> never reach this fallback."*

`032` proved it for the `@theme` path. This proves it for the theme-block path too,
where the line that does it was sitting in plain sight:

```js
if (!(contentKey in tokens)) tokens[contentKey] = autoContent(`var(${key})`);
//                                                ^ the value is in tokens[key],
//                                                  one variable away, unread.
```

## Three silent failures, measured

### 1. The ink the rule picks can be the failing one

`oklch(58% 0.24 320)` — the site's own `brand`. Black **4.28**, white **4.91**. The
rule takes black because `l = 0.58 ≥ 0.57`.

### 2. A role that cannot be read as TEXT on its own surface

Separate from the ink, and the one a lightness threshold can never reach. In the
hostile palette `atelier-signal` (brand `l = 0.58`, surface `l = 0.60`):

| | measured |
| --- | --- |
| the ink **on** the colour — a solid `btn-primary` | **4.85** ✅ |
| the colour **as text** — `text-primary`, `link-primary`, `btn-primary-ghost` | **2.77** ❌ |

Silica already defends this: `lib/ink.js` mixes the colour halfway toward
`--color-base-content` before painting it as text, which lifted it from 1.10 to
2.77 — a real 2.5× defence, and still under AA. Nothing said so.

### 3. A value that is not a colour at all compiles and paints nothing

```
@plugin "…" { colors: primary, terracotta; }
@theme { --color-terracotta: oklch(nonsense); }

  threw : no
  said  : NOTHING
  .btn-terracotta : present
```

Every class is emitted. The browser discards the fill. A control renders with no
colour and no message anywhere.

## The fix

**Measure what is already in hand, repair what can be repaired, and name the rest.**

`src/lib/measure-ink.js` — OKLCH/hex/rgb → sRGB → WCAG, plus the `lib/ink.js`
derivation recomputed in JS. `src/lib/warn-auto-ink.js` — the three findings and
their messages. Two call sites, and the asymmetry between them is deliberate:

| | `theme-plugin.js` | `index.js` |
| --- | --- | --- |
| a failing ink | **substituted** with the measured one | **warned**, with the line to paste |
| why | the colour and its ink are scoped together under one `[data-theme]` | a colour in `@theme` is GLOBAL — emitting `--color-x-content` at `:root` would outlive any theme that later re-declares `--color-x` and paint the old ink on the new colour |

The substitution is narrow on purpose: it replaces the CSS rule **only** when the
rule's pick is below AA. Everywhere else the emitted token is byte-identical to
what it has always been, so a theme somebody tuned by eye does not move.

### A theorem fell out of it, and it deleted a branch

The first version carried a `hopeless` case — "no ink can sit on this colour". It is
unreachable. For any colour with relative luminance `L`:

```
contrast(L, black) × contrast(L, white) = (L + 0.05)/0.05 × 1.05/(L + 0.05) = 21
```

for every `L`, so the better of the two is never below `√21 = 4.5826` — above AA's
4.5. A 72,720-sample sweep of the l/c/h space agrees: product `21 ± 4e-15`, lowest
best-of-two **4.5829**.

**Every failing pick is therefore one declared token away from passing**, which is
why every message can end by naming that token, and why the branch was deleted
rather than left as dead code with a comment.

## The check that was wrong, and how that was caught

The first version of the surface test compared the role's **fill** to the surface
against WCAG 1.4.11's 3:1. Run against a real palette it warned on **five
well-chosen colours at once** — a verdigris at 2.77, an amber `warning` at 2.36 —
which is simply what a mid-tone accent measures against a near-white page, and is
not a defect at all.

It was rewritten to measure the value actually painted: `lib/ink.js`'s derivation
against `--color-base-100`, at WCAG 1.4.3's 4.5 for body text. No invented constant,
and it separates cleanly:

| palette | as text | verdict |
| --- | --- | --- |
| terracotta / clay | 7.76 | quiet |
| verdigris / clay | 6.33 | quiet |
| amber `warning` / clay | 6.01 | quiet |
| terracotta / **signal** | 2.77 | **named** |
| verdigris / **signal** | 2.56 | **named** |

## Confirmed by

**A new probe, `verify-auto-ink.mjs`, wired into `pnpm verify`** — 22 checks:

```
✅ auto ink: the rule's picks are measured, and the checks are quiet on everything that is fine
```

**The arithmetic is pinned to a browser, not to itself.** Every number in it was
read out of Chromium with `getImageData` first: **0.00** disagreement on contrast
and **0** on every channel across 16 colours including out-of-gamut ones, and
**0.03** on the derived text ink across 7 palettes.

**Calibration is the reason it is shippable:** silence on all **20 shipped presets
in both modes** (40 combinations), and silence on a well-chosen custom palette.

**Proved by breaking it,** twice, with the edit confirmed present before trusting
the result:
- revert the theme-plugin substitution → `✗ an avoidable color gets the MEASURED ink`
- widen the text check's floor to 0 → `✗ names every role of a palette whose colors sit on their own surface`

**A second implementation was pinned to the first, and it disagreed.**
`@wizeworks/silicaui-html`'s `contrastRatio` measured continuous 0..1 floats, never
quantised to the 8 bits a screen actually receives — off by up to **0.09**, and the
source of `032`'s recorded `4.30 / 4.88` where the screen shows `4.28 / 4.91`. It now
rounds before measuring. Across all 320 shipped token pairs this changes **no
verdict** (none sits within 0.05 of 4.5), and the two implementations now agree to
**0.0000**.

**On the build it was found on:** `atelier-clay` and `atelier-ink` compile silently;
`atelier-signal` names 8 roles. One line was true of the good palette too —

```
[silicaui] bone (oklch(0.94 0.012 85)) cannot be read as TEXT on this theme's
surface in theme "atelier-clay": 3.7:1, under WCAG AA (4.5).
```

— and it is right: `bone` is a surface, not an ink. Nia added it to the kit's
"where this palette should not be used" page **because the build told her**, with
the number. That is the whole point of the change.

## Rating effect

None directly — this is the engine. Its effect shows up wherever a consumer invents
a colour.
