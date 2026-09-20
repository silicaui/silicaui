---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui-react": patch
---

Measure a declared colour's ink instead of guessing it, and repair five controls that were smaller than WCAG's minimum target.

**The colour engine now uses the value it already holds.** `theme("color")` hands the
Tailwind plugin each registered colour's VALUE, and a `@plugin ".../theme"` block
hands it over even more directly — yet both fell through to a CSS lightness rule that
cannot compare contrast. For roughly 2.3% of the colour space that rule picks the
failing ink while a passing one sits unused (4.28:1 where white gives 4.91:1). A
theme block now substitutes the measured ink, but **only** where the rule's pick is
below AA, so every other emitted token is byte-identical to before. A colour declared
in `@theme` is warned about instead of rewritten, because it is global and an ink
emitted at `:root` would outlive any theme that later re-declares the colour.

Two further silences are now named at build time: a role whose TEXT form cannot be
read on its own surface (`text-<role>`, `link-<role>`, `btn-<role>-ghost`), and a
value that is not a parseable colour at all — which previously emitted every class
and painted a fill the browser discards, with no message anywhere. All of this is
silent on the twenty shipped presets in both modes.

**Five controls were under WCAG 2.2 SC 2.5.8's 24 x 24 px minimum** — the chip
removes in `TagInput`, `MultiSelect` and `PowerSearch`, the `Carousel` dot and the
`TreeView` toggle. Each keeps its drawn size and gains a full-size hit area, so
nothing redraws. The carousel's indicator gap widened from `0.4rem` to `1rem` because
neighbouring hit areas were overlapping by 9.6px.

**Contrast repairs found alongside them:** `TagInput` and `MultiSelect` chips painted
the raw role colour as text (2.78:1 in light) where the identical rule in
`PowerSearch` already used the derived ink (6.42:1); an inactive `Carousel` dot used
`--color-base-300`, the darkest surface in BOTH modes, so it measured 1.96:1 against
a dark page. Five more rules painting a raw role as text were found in
`CommandPalette`, `DataTable`, `SegmentField` and `Stat` once the guard meant to
catch them was widened to see the accent-variable idiom the components actually use.

`@wizeworks/silicaui-html`'s `contrastRatio` now quantises to 8 bits before
measuring, matching what a screen receives — it was off by up to 0.09, though this
changes no verdict across all 320 shipped token pairs.

`@wizeworks/silicaui-react`: the fifteen portalled components that never mentioned it
now carry the note that a popup leaves its `[data-theme]` island, and how to bring it
back. Documentation only, no behaviour change.
