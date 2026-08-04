---
"@wizeworks/silicaui": patch
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": minor
---

Motion is themeable, and the focus ring has both of its knobs.

Measured by what the components actually read versus what the theme editor wrote, three tokens were
live in CSS and reachable from nothing. `--duration` and `--ease` are read by **86 declarations
across 38 components** — every hover, focus, open/close and checked transition in the library —
which made snappy-vs-relaxed, a real brand axis, the single largest unthemeable surface in the
system. `--focus-offset` left the focus control half-finished: "Focus ring" wrote `--focus-width`
and `--disabled-opacity`, so a ring could be thickened but never moved off the control it outlines,
which is the adjustment that makes a ring legible against a filled Button.

All three join `SCALAR_TOKENS`, which lights them up in the builder's Theme panel and the MCP's
`get_tokens` at once: a new **Motion** group (Speed: off/snappy/base/relaxed → `--duration`; Easing:
standard/linear/out/spring → `--ease`) and a **Focus gap** row beside the existing width. The panel's
Motion group is deliberately distinct from the Inspector's `Animate ▸ Speed`, which sets
`sui-duration-*` on ONE node's entrance animation — this is the resting transition speed of every
control on the page. `SCALAR_TOKENS` gained an exported `ScalarToken` type, since `--ease` is the
first entry whose value isn't a number and so carries `options` instead of a `min`/`max`/`step`.

**Fixes an accessibility hole this would otherwise have opened.** `theme.js` flattened motion for
`prefers-reduced-motion: reduce` by setting `--duration: 0.01ms` on `:root` — which a theme island
defeats, and not through specificity: a custom property declared on a DESCENDANT shadows the
inherited value for that entire subtree, so a `[data-theme]` element carrying its own `--duration`
keeps animating no matter what the `:root` rule says. Exposing a speed control would have handed
every theme author a way to override a user's stated accessibility preference without knowing it.
The guard now matches `:root, [data-theme]` and is `!important`, so it also beats the inline `style`
a live editor writes on the island. `e2e/theme-motion.spec.ts` asserts a relaxed theme still
flattens under reduced motion — and that test was confirmed to fail against the old `:root`-only
rule before the fix landed.
