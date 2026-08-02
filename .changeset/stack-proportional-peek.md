---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-mcp": patch
---

`stack` now peeks at any card size, and the fan is tunable

`.stack` layers its children into a peeking deck. The nudge that produced the peek was a fixed
`1.5rem` while the shrink that fights it — `scale()` against `place-items: center` — is
**proportional**, pulling each edge in by `size × (1 − scale) / 2`. So the two crossed over:

```
2nd card:  12px > h × 0.0375  →  h < 320px
3rd card:  24px > h × 0.075   →  h < 320px
```

Above ~320px in the peeking dimension every edge went negative and the deck rendered as a single
card — no warning, no documented ceiling. It looked correct everywhere it was exercised because the
only specimens were 128×192, comfortably under the ceiling; it failed the first time a card was
given real content. Reported from sparx's pricing hero at 480×448, where the back cards sat 6px and
12px *inside* the front one. Below the ceiling it was not much better: at `w-48` the peek was a ~5px
sliver, not a fanned deck.

Both terms are now proportional. Each transform pays back its own shrink first — the `3.75%` /
`7.5%` terms cancel it exactly — and only then translates by `--stack-peek`:

```css
& > *              { transform: translateY(calc(-7.5%  - var(--stack-peek) * 2)) scale(0.85);  }
& > *:nth-child(2) { transform: translateY(calc(-3.75% - var(--stack-peek) * 1)) scale(0.925); }
```

A percentage in a translate resolves against the element's own border box (`translateY` against
height, `translateX` against width), so one declaration fans identically at every size, and
`--stack-peek` is the **real, visible** peek rather than a number that has to out-run the scale.
`-bottom` / `-start` / `-end` use the same figures — the scale is uniform.

### New

- **`--stack-peek`** on `.stack`, the visible peek per step (2nd card one step, 3rd two, so the deck
  fans evenly). Defaults to `5%`. Accepts any length, so `--stack-peek: 12px` works too, and it is
  reachable as a Tailwind arbitrary property: `className="[--stack-peek:4%]"`.
- **`stack-xs` … `stack-xl`** (2% / 3.5% / 5% / 7% / 9%), and a matching **`size`** prop on the
  React `<Stack>`. Orthogonal to direction, so `stack stack-end stack-lg` is a wide sideways fan.
  A hero deck and a notification pile want visibly different fans; neither could ask for one before.

### Behavior change

A deck's fan is now a share of the card rather than a constant, so existing decks shift: at the
128×192 the old demo used, the peek moves from 7.2px/14.4px to 6.4px/12.8px — near-identical — while
anything larger goes from *nothing* to a real fan. Pin the old look on a small deck with
`stack-lg`, or set `--stack-peek` to an explicit length.

### Watch out when sizing a deck

Children stretch to the deck's **width** but keep their own height, so a height class belongs on the
card and a width class on the deck. `place-items: center` is deliberate — a block-axis stretch would
squash a deck of `<img>`. A height on the `.stack` itself is an empty box around content-height
cards, and since the peek is a share of the card, it also reads as a much smaller fan than asked
for. The demo had this backwards and has been corrected.

Covered by `examples/playground/e2e/stack-peek.spec.ts`, which measures real browser geometry at
480×448 — the size that used to collapse. jsdom does no layout, so this class of defect is only
catchable in a browser.
