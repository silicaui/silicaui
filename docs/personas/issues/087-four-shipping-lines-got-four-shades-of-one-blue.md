# 087 — Four shipping lines got four shades of one blue, and series five would have been green

**Status:** fixed
**Severity:** high
**Found by:** P07 · Hiroshi Tanabe · act 2, the chart and the theme
**Surface:** `@wizeworks/silicaui-charts` › `buildSilicaEChartsTheme`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Kaihō's throughput chart draws four shipping lines. The dashboard is read on a
wall screen at the end of a dark operations room all night, and the whole point
of four lines is that a duty officer can say which is which.

The palette the theme handed them:

```
Kaihō Line       oklch(70% 0.14 245)
Pacific Bridge   oklch(55% 0.035 255)
Nordhaven        oklch(64% 0.13 211)
Litoral          oklch(68% 0.1 232)

hue angles used — [211, 232, 245, 255]   span 44 degrees of 360
the two hardest to tell apart — Kaihō Line vs Litoral:
    13 degrees apart, 2% lightness, 0.04 chroma
```

**Four series inside a 44-degree arc of a 360-degree wheel**, two of them
thirteen degrees apart at the same lightness. On that wall screen those two lines
are the same colour.

## Why it matters

Two separate problems, and the second is worse than the first.

**The palette does not spread.** It was the theme's semantic roles in
declaration order:

```ts
const palette = [
  "--color-primary", "--color-secondary", "--color-accent",
  "--color-info", "--color-success", "--color-warning", "--color-error",
].map((n) => readVar(cs, n, "")).filter(Boolean);
```

Kaihō's `midnight` theme declares one brand colour. The plugin derives
`secondary`, `accent` and `info` from it — correctly, that is what those roles
are for — so the first four chart series came out as four shades of the same
blue. **Any theme built around a single brand colour gets this**, which is most
of them.

**And the roles mean things.** `success` is green because something is good;
`error` is red because something is wrong. A fifth shipping line would have been
green and a seventh red — on a dashboard whose own rule is that colour is
reserved for delay severity and nothing else. It is a sentence nobody wrote and
nobody can unsee: *that line is fine, that one is in trouble.*

## Where it lives

[packages/silicaui-charts/src/theme.ts](../../../packages/silicaui-charts/src/theme.ts) — `buildSilicaEChartsTheme`

## The fix

A categorical palette is **built**, not borrowed. Anchor on the theme's own
`primary` — so series one still looks like the brand — and walk the hue wheel:

```ts
const SERIES_COUNT = 8;

function categoricalPalette(primary: string): string[] | null {
  const base = parseOklch(primary);
  if (!base) return null;
  const step = 360 / SERIES_COUNT;
  const L = Math.min(92, Math.max(38, base.L));
  const C = Math.max(0.08, Math.min(0.2, base.C));
  return Array.from({ length: SERIES_COUNT }, (_, i) => {
    if (i === 0) return primary;
    const h = (base.h + i * step) % 360;
    // Alternate the lightness a little, so adjacent series differ on a second
    // axis as well as hue.
    const l = Math.min(94, Math.max(34, L + (i % 2 === 0 ? -6 : 6)));
    return `oklch(${…}% ${…} ${Math.round(h)})`;
  });
}
```

Three deliberate choices:

- **It keeps the theme's weight.** Lightness and chroma come from the theme's own
  primary, clamped, so a dark theme's series sit on a dark surface and a light
  theme's on a light one. The palette is generated, not imported from somewhere
  with its own opinion about brightness.
- **Lightness alternates.** Hue alone is not enough for a reader with a
  colour-vision deficiency, and two adjacent series now differ on a second axis
  as well.
- **A theme whose `primary` is not an `oklch()` value falls back to the old role
  list.** Guessing a hue out of `color-mix()` or a named colour would be worse
  than a palette that is merely narrow, so it is not attempted.

`success`, `warning` and `error` are left alone — free to go on meaning what they
mean, which is what Kaihō's delay badges use them for on the same screen.

## Confirmed by

```
Kaihō Line       oklch(70% 0.14 245)
Pacific Bridge   oklch(76% 0.14 290)
Nordhaven        oklch(64% 0.14 335)
Litoral          oklch(76% 0.14 20)

hue angles used — [20, 245, 290, 335]   span 315 degrees of 360
the two hardest to tell apart — Kaihō Line vs Pacific Bridge:
    45 degrees apart, 6% lightness, 0 chroma
✓ four series get four distinguishable colours
```

Thirteen degrees became forty-five, and the span went from 44 degrees to 315.

The check is written in **OKLCH**, which is the right space for it: `L` is
perceptual lightness, `C` is how colourful, `h` is the hue angle, and two series
are tellable apart when they differ enough on at least one. It passes if any one
of the three gaps clears its threshold, rather than on a single Euclidean
distance that would let three tiny differences add up to a pass.

**Deliberately broken to watch it fail**: `categoricalPalette` made to return
`null`, the check went red at 13 degrees; restored, green at 45. `pnpm verify`
exit 0, workspace build clean.

The rest of act 2 held throughout — the chart redraws on a theme flip with no
colour written by hand (axis ink 238 → 26 mean luminance), and the strike month
and the outage month stay different things end to end:

```
hovering the OUTAGE month — "2026-07 … Pacific Bridge  not measured …"
hovering the STRIKE month — "2026-03 … Nordhaven 0 …"
```

## Two of my own checks were measuring nothing

Both read as passes, and both are the same shape as defects this framework
exists to catch:

- **A literal BACKSPACE byte in two regexes.** Writing `\b` through a shell
  heredoc emitted the byte it names, so `/Nordhaven:?\s*0<U+0008>/` could never
  match. One check went red and was investigated; the other was a **negated**
  test, so it passed having tested nothing at all. Same defect as
  [078](078-two-regexes-that-could-never-match.md), this time in a probe the
  repo's own control-character verifier does not scan. Both rewritten with no
  escape sequence anywhere.
- **A rebuilt package that never reached the app.** `pnpm install` with a
  `file:` dependency reused its cached copy, so a fix looked like it had not
  worked; and a `vite` child survived a task stop, kept the port, and went on
  serving the old module — which made the same fix look like it had not worked a
  second time. Both now handled by copying `dist` over the installed copy and
  restarting the server by port.

## Also recorded, not fixed

**Eight colours, then it repeats.** ECharts cycles the palette, so a ninth series
reuses the first. Eight is a deliberate stopping point — beyond that a
categorical palette stops being readable whatever you do, and a chart with nine
categories needs a different design, not a ninth colour.

**The chart engine is 336 kB gzipped.** `import * as echarts from "echarts"`
pulls the whole library — every chart type, both renderers — because a wrapper
that accepts an arbitrary `EChartsOption` cannot know which parts the consumer
will use. Measured here and carried to act 10, where the persona states plainly
what the five engines cost.

## Rating effect

`Charts` in [rating.md](../rating.md), once P07's screens are scored.
