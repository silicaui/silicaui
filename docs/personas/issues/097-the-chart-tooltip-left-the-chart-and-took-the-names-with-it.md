# 097 — On a phone the chart's tooltip ran off the edge and took the series names with it

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 9, the phone
**Surface:** `@wizeworks/silicaui-charts` › `buildSilicaEChartsTheme`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The duty officer opens the same dashboard on a phone. The chart is 278px wide.
Tapping it brings up the tooltip — which is the whole point, because there is no
hover on a phone and the tooltip is the only way to read the numbers.

What the tooltip said:

```
9
ō Line          97,369
c Bridge        68,659
haven           70,255
al              87,512
```

**The figures were fine and every name was cut in half.** `Kaihō Line` read as
`ō Line`, `Pacific Bridge` as `c Bridge`, `Nordhaven` as `haven`, `Litoral` as
`al`. On a chart whose entire job is telling four shipping lines apart, the
tooltip gave four numbers and no way to know whose they were.

ECharts places the tooltip beside the pointer and lets it run past the edge of
the chart. On a wide screen there is room and nobody notices; at 278px there is
not.

## Why it matters

A tooltip that leaves its container is never what anyone wanted. It is not a
trade-off between placement and containment — it is a placement that fails at
narrow widths and works everywhere else by luck.

And the failure is worst exactly where the tooltip matters most: on the phone,
where it is the only way in.

## Where it lives

[packages/silicaui-charts/src/theme.ts](../../../packages/silicaui-charts/src/theme.ts) — the `tooltip` block

## The fix

One line in the theme, as a **default** rather than an option:

```ts
tooltip: {
  …
  // Keep the tooltip inside the chart's own box.
  confine: true,
  …
}
```

`confine` is ECharts' own answer and it has been there all along; the Silica
theme simply never turned it on. A consumer who wants the old behaviour can still
set `confine: false` in their own option, because a theme is a default.

## Confirmed by

The same tap on the same 360px screen:

```
· what a TAP on the chart produced —
  ["2025-09  Kaihō Line 97,369  Pacific Bridge 68,659  Nordhaven 70,255  Litoral 87,512"]
✓ the chart gives up its numbers to a tap, not only to a hover
```

Four complete names, four figures, inside the chart.

## Two of my own checks were measuring nothing

- **The tap landed off the screen.** The chart sits below the fold on a 360x780
  phone; the probe tapped at y=895 in a 780px viewport and then reported that
  the chart does not answer a tap at all. It scrolls to the chart first now —
  and only then was the real defect, the clipped names, visible.
- **The tooltip detector looked for the wrong thing** afterwards, matching on
  computed `position: absolute` plus a text pattern, and found nothing even when
  the tooltip was on screen. It reads the `style` attribute and filters on
  visibility now, checked against three ways of summoning it — a held
  `touchstart`, a full tap, and a mouse hover — so a failure on one is
  distinguishable from the tooltip being broken.

## Also fixed, in the dashboard rather than the library

The chart's own option had two narrow-width faults that are the consumer's to fix
and are recorded here because they were found in the same minute:

- **The `TEU` axis name sat on top of the legend**, and the y-axis labels under
  it. Removed — the card above the chart already says "Monthly TEU throughput",
  so the axis name was the same word twice.
- **The legend band was 36px**, one line tall, and four names wrap to two at
  360px. Now 72px, with a plain wrapping legend. `type: "scroll"` was tried first
  and is worse: it showed two of the four lines behind a `1/3` pager, on a
  dashboard whose whole point is comparing four shipping lines.

## Rating effect

`Charts` in [rating.md](../rating.md), once P07's screens are scored.
