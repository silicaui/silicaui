# 094 — A shipping line was painted the colour of a critical delay

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 7, looking at the screen as a designer
**Surface:** `@wizeworks/silicaui-charts` › `buildSilicaEChartsTheme`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Kaihō's dashboard has one rule about colour, and it is written into the persona:
**colour means how late a ship is, and nothing else.** Green is on time, amber is
late, red is in trouble. The delay badges say so on every row of an 800-row
table and on all nine watchlist rows.

The chart sits above them, and its fourth line was this:

```
the four shipping lines
  Litoral          oklch(76% 0.14 20)    L 76  C 0.14  h 20

what colour already means on this screen
  critical (error)  oklch(0.66 0.2 25)   L 66  C 0.2   h 25    e.g. "112h late"

closest: "Litoral" and critical (error) - 5 degrees of hue
```

**Five degrees.** One of the four shipping lines was painted the colour the same
screen uses for *this ship is in serious trouble*.

## This was my own fix doing it

Issue [087](087-four-shipping-lines-got-four-shades-of-one-blue.md) found the
opposite problem: four series that were four shades of one blue, thirteen degrees
apart, indistinguishable on a wall screen. The fix spread them across the whole
hue wheel.

The whole hue wheel goes through the reds and the ambers. That is where
`success`, `warning` and `error` live. So the fix for "these four look the same"
created "this one looks like a warning" — and it will do it in any app that
reserves colour for meaning, which is most dashboards.

Worth saying plainly: the first fix was right and incomplete. A categorical
series is a NAME. A semantic role is a JUDGEMENT. A palette generator that knows
about both should not hand a name a judgement's colour.

## Where it lives

[packages/silicaui-charts/src/theme.ts](../../../packages/silicaui-charts/src/theme.ts) — `categoricalPalette`, `spreadHues`

## The fix

**The reserved hues come from the theme, not from a constant** — a theme is free
to make its `error` orange, and then orange is what has to be avoided:

```ts
const reservedHues = ["--color-success", "--color-warning", "--color-error"]
  .map((n) => parseOklch(readVar(cs, n, "")))
  .filter((c) => c !== null)
  .map((c) => c.h);
```

**The series are spread over what is left**, rather than over the whole circle:

```ts
const RESERVED_ARC = 22;

function spreadHues(startHue, reserved, count) {
  const free = [];
  for (let h = 0; h < 360; h++) {
    if (reserved.every((r) => hueGap(h, r) > RESERVED_ARC)) free.push(h);
  }
  if (free.length < count) { /* a theme with roles all over the wheel: even spread */ }
  // Start from wherever the brand colour sits, so series two follows series one
  // round the wheel rather than jumping to an arbitrary origin.
  …
}
```

**And the palette got smaller, from eight colours to six.** That is the part
worth reading:

| | free arc | series | apart |
| --- | --- | --- | --- |
| before | 360 degrees | 8 | 45 degrees |
| reserved arcs, 8 series | ~228 degrees | 8 | **28 degrees** |
| reserved arcs, 6 series | ~228 degrees | 6 | **38 degrees** |

Act 2's bar for two series being tellable apart is 25 degrees of hue. Eight
series clears it by **three degrees**, which is no margin at all for a theme
whose brand colour sits somewhere else. Six clears it by thirteen.

The seventh series now repeats the first, and that is the better failure: **a
repeated colour is obviously wrong, while two series 28 degrees apart are quietly
confusable** — which is the exact defect 087 existed to fix. A chart with seven
categories needs a different design, not a seventh colour.

## Confirmed by

```
the four shipping lines:
  Kaihō Line       oklch(70% 0.14 245)   L 70 C 0.14 h 245
  Pacific Bridge   oklch(76% 0.14 283)   L 76 C 0.14 h 283
  Nordhaven        oklch(64% 0.14 320)   L 64 C 0.14 h 320
  Litoral          oklch(76% 0.14 358)   L 76 C 0.14 h 358

closest: "Litoral" and critical (error) - 27 degrees, 10% lightness, 0.06 chroma
✓ no line reads as a severity
```

**Five degrees became twenty-seven**, and 087's own check still holds with more
room than before:

```
the two hardest to tell apart - {"pair":"Kaihō Line vs Pacific Bridge","dL":6,"dC":0,"dh":38}
✓ four series get four distinguishable colours - 38 degrees apart, 6% lightness
```

**Deliberately broken to watch it fail**: `RESERVED_ARC` to 0 and `SERIES_COUNT`
back to 8 — the closest pair returned to **6 degrees** and the check went red.
Restored: 27 degrees, and act 2 green at 38.

## The check that judged this had to be narrowed, and that is deliberate

The first version of this check compared **sRGB hue only** and called 23 degrees
a collision — one distance standing in for a colour, which is the mistake 087's
own notes warn about.

The second version used act 2's three-axis test: tellable if hue, lightness OR
chroma clears a bar. **That version would have passed the original defect.** The
failing case was 5 degrees of hue with 10% lightness and 0.06 chroma already
between them, and 0.06 clears the chroma bar exactly — so an OR over three axes
says "fine" about a red line beside a red badge.

So this check asks a narrower question on purpose: *does a shipping line read as
a severity?* That is a question about the **colour family**, and it is judged on
hue. Act 2's broader question — *can a duty officer tell two lines apart?* — is
still judged on all three, because there a lightness difference genuinely does
the job. Two different questions, two different tests, and using one for the
other is how a check comes back green about something you can see with your eyes.

## Rating effect

`Charts` in [rating.md](../rating.md), once P07's screens are scored.
