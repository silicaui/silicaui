---
"@wizeworks/silicaui-builder": patch
---

Sixty-nine of the builder's own labels were faded text, on words a person reads to operate it

RULE #3, in the repo's own words: never `soft`, `muted`, `/opacity` or a
`color-mix(…, transparent)` ink on anything a person is meant to READ. Faded text
is for text deliberately not meant to be read — a watermark, a disabled control,
a de-emphasised duplicate.

P04 found this in the email builder and fixed eleven. It counted **63 more in the
site builder and left them**, because those screens belonged to another persona's
run — which is the "a fix leaves its neighbour behind" shape, sitting in the
ledger with a number against it. That run is complete, so the neighbour is done.
By then the count had grown to **69**.

```
57  ->  the real ink token
12  ->  deliberately left faded
```

The twelve are the cases the rule names: eight icons, three icon-only controls,
and the `silicaui` attribution mark that restores on hover. Three more needed a
decision rather than a rule — the Inspector's `hidden (visible: false)` and
`empty` markers, which are the ONLY thing on the row when a bound value is
missing and are therefore the last text that should be hard to read; and two
`<code>` tokens inside an explanatory line, which would otherwise have ended up
fainter than the prose around them.

**This was never a contrast failure and is not being sold as one.** `/70` reads
at 4.77:1 at its worst across all 120 shipped theme-and-mode combinations —
`verify-chrome-ink.mjs` has guarded that since P03's earlier run. It was a rule
breach, and the rule is about whether fading is doing work, not about whether
people can squint.

Confirmed by reading what is **painted** rather than what was typed: every leaf
element in the chrome, its computed colour pushed through a canvas so the number
is real sRGB bytes. Four inks, all at full alpha, in both themes — the readable
ink, the inverse ink on filled controls, primary on the selected crumb, and error
on "Delete". Hierarchy from scale, weight and colour, which is what the rule asks
for instead.
