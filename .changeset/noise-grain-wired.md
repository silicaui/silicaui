---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui-builder": patch
"@wizeworks/silicaui-mcp": patch
---

`--noise` paints grain. It had never painted anything.

The token, the builder's Effects ▸ Noise switch and the "Grain on surfaces" caption all shipped;
no CSS read the token, so the control was decoration. It now paints a tiling SVG turbulence grain on
the themed surface.

**Where.** The `[data-theme]` rule — the single declaration that defines "surface" in this system, so
one rule covers the page and every scoped island, and a Card keeps its clean opaque fill: a raised
surface sitting ON textured paper, which is the effect grain is for.

**How it's gated.** `background-size: calc(var(--noise, 0) * 128px)`. A zero-sized background image
is never painted, so `--noise: 0` costs nothing — and unlike an `::after` overlay this needs no
`position: relative` on every `[data-theme]`, which would silently re-parent any absolutely
positioned descendant resolving against an ancestor outside the island. A theme must not move a
consumer's layout.

**Why the filter chain looks the way it does.** Three things were found by measuring pixels, not by
reading specs:

- `color-interpolation-filters='sRGB'` is load-bearing. SVG filters default to linearRGB, which
  pushed the layer's mean off mid-grey and made every hand-derived coefficient wrong. Pinned to
  sRGB the flattened layer measures mean **128.0** exactly.
- The noise is composited onto an opaque `feFlood` **before** any `feColorMatrix`/
  `feComponentTransfer`. Those primitives operate on un-premultiplied color, and `feTurbulence`
  emits a noisy ALPHA channel — run directly on turbulence they divide RGB by a near-zero alpha and
  clamp to white. Two earlier cuts did exactly that and washed a base-200 surface **+7.7/255**
  lighter while carrying a standard deviation of **0.5** — all haze, no grain, and every
  computed-style assertion passed the whole time.
- Contrast is stretched about 0.5 because that is the identity point of `overlay`
  (`b<0.5 → 2bs = b`, `b>=0.5 → 1-2(1-b)(1-s) = b`). Centering there is what lets grain add texture
  without moving the surface color a designer chose.

Measured on the real board, the shipped version is **Δmean 0.11 with sd 2.99** on a light surface and
**Δmean 0.05 with sd 1.44** on a dark one. `e2e/theme-noise.spec.ts` asserts those two numbers by
decoding actual screenshot pixels — the computed-style assertions alongside them could not see the
defect that was hit twice.

Also gives the Theme panel's Effects switches an `aria-label`. They shipped with no accessible name,
which a screen reader announces as a bare "switch".
