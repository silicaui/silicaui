# 096 — The engine measures the ink it picks for you and never looks at the one you picked yourself

**Status:** fixed
**Severity:** high
**Found by:** P07 · Hiroshi Tanabe · act 9, the wall screen
**Surface:** `@wizeworks/silicaui` › the theme plugin
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Measuring delay-severity colours off the computed style at 2560px, on the wall
screen the operations room runs all night:

```
"on time"    (early or on time)  8.33:1
"14h late"   (late)              9.88:1
"112h late"  (critical)          3.22:1
```

**The one badge on the dashboard that has to be readable measured 3.22:1** —
under WCAG AA — and it is the one that says *this ship is in serious trouble*.

Kaihō's `midnight` theme declares the pair by hand:

```css
--color-error: oklch(66% 0.20 25);
--color-error-content: oklch(98% 0.01 25);
```

A near-white ink on a mid red. The light theme had the same shape of mistake on
amber: `--color-warning-content: oklch(99% 0.01 78)` on `oklch(62% 0.14 78)`,
**3.60:1**.

## Why it matters, and why nothing caught it

This engine has a good story about ink. `auto-content.js` derives a `-content`
from lightness; `measure-ink.js` measures the derivation and substitutes a better
pure ink where the lightness rule cannot be right; `warn-auto-ink.js` names a
role whose text form vanishes into the surface. Three checks, all working.

All three open with the same sentence:

> A color whose `-content` is declared alongside it never reaches the rule.

That is correct — nothing is being derived, so there is nothing to check about
the derivation. The consequence had not been followed through: **the engine
measures the ink it chooses for you, and accepts without a glance the ink you
chose yourself.**

Which is backwards. A derived ink comes from a rule that was validated over a
51,480-sample sweep. A declared ink came from a person picking a colour by eye,
at night, from a swatch — and is therefore the one more likely to be wrong. Both
values are literals in the same theme block, so measuring the declared pair costs
exactly one contrast calculation and needs nothing the block does not already
have.

It is `high` because of the blast radius: a role cascades through every family at
once, so a bad declared pair is wrong on `btn-error`, `badge-error`, `alert-error`
and everything else simultaneously — and it looks deliberate, because somebody
did type it.

## Where it lives

[packages/silicaui/src/lib/warn-auto-ink.js](../../../packages/silicaui/src/lib/warn-auto-ink.js) — `findDeclaredContentProblems`, `warnDeclaredContentProblems`
[packages/silicaui/src/theme-plugin.js](../../../packages/silicaui/src/theme-plugin.js) — where the loop skips declared roles

## The fix

A new check, run from the theme block right after the existing one, at the exact
point the derivation loop says `if (contentKey in tokens) continue;`:

```js
export function findDeclaredContentProblems(tokens) {
  for (const key of Object.keys(tokens)) {
    …
    const declared = tokens[`--color-${role}-content`];
    if (typeof declared !== "string") continue;
    const ratio = contrast(fill.rgb, ink.rgb);
    if (ratio >= AA) continue;
    // …and what the engine would have chosen if it had been left to choose.
    const verdict = inkVerdict(tokens[key]);
    out.push({ role, fill, content: declared, ratio, best, bestInk });
  }
}
```

The warning names the pair, the number, the classes it reaches, and the way out:

```
[silicaui] --color-error-content (oklch(98% 0.01 25)) measures 3.22:1 on
--color-error (oklch(66% 0.20 25)) — under WCAG AA (4.5) in theme "midnight".
  This pair is DECLARED, so nothing derived it and nothing else checks it: every
  btn-error, badge-error and alert-error paints this text at 3.22:1.
  Fix: remove --color-error-content and let it be derived (black measures 6.14:1
  here), or darken the fill.
```

Telling the author what the derivation *would* have given is the useful half:
`3.22` on its own is a complaint, `black measures 6.14 here` is an answer.

## Confirmed by

The check, run against Kaihō's two themes, with a control:

```
findings: [{"role":"error","fill":"oklch(66% 0.20 25)","content":"oklch(98% 0.01 25)",
            "ratio":3.22,"best":6.14,"bestInk":"black"}]
cobalt:   [{"role":"warning","fill":"oklch(62% 0.14 78)","content":"oklch(99% 0.01 78)",
            "ratio":3.6,"best":5.65,"bestInk":"black"}]

--- control: a pair that is fine must be silent ---
good pair findings: []
```

**3.22 is the number the browser measured independently**, off the computed style
of the real badge on the real wall screen. The static check and the rendered page
agree to two decimals, which is what says the check is measuring the thing.

Kaihō's themes then fixed — `error` from 66% to 55% lightness (a near-white ink
now measures **5.07:1**), and cobalt's amber given the dark ink it always needed
(**5.06:1**, where white was 3.60) — and re-measured on the rendered page at both
sizes:

```
2560px   "on time" 8.33:1   "14h late" 9.88:1   "112h late" 5.07:1   ✓
360px    "on time" 8.33:1   "14h late" 9.88:1   "112h late" 5.07:1   ✓
```

## The design decision inside the fix

Amber cannot carry white text. `oklch(62% 0.14 78)` with a near-white ink is
3.60:1 and with a near-black ink is 5.06:1, and no amount of nudging the amber
fixes the first without making it not amber. The light theme now uses a dark ink
on `warning`, matching what the dark theme already did — which is the convention
every design system arrives at for this hue, for this reason.

## Rating effect

Affects every themed surface in [rating.md](../rating.md); scored with P07's
screens.
