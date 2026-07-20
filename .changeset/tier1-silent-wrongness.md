---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": patch
---

Three defects that produced no error — the page rendered, and was wrong.

**`Alert` with `dismissible` now works outside React.** The React layer had
`dismissible`/`onDismiss`, `silicaui-behaviors` shipped a working `dismiss`
handler, and the `.alert-close` CSS existed — but the `silicaui-html` macro
emitted a bare `<div role="alert">`, so a static or Sparx-rendered page got no
close button at all. The macro now emits the button, the inlined close icon,
and the `data-sui-behavior="dismiss"` marker. Verified across the whole chain
(schema → `toHtml` → `hydrate` → click → removed) rather than by asserting the
markup, since a structural check alone would have passed before the fix too.

**`Swap` and `Stat` sized their icons.** Neither declared `width`/`height` for
its `svg`, violating the project's own rule. This is the worst failure mode
available: an unsized inline `<svg>` has no intrinsic size, so it can render
correctly in Playwright's Chromium and collapse or balloon in a real browser —
invisible to CI, including screenshots. `Swap` is entirely an icon component,
and `stat-figure` defines an implicit grid column, so its glyph shifts the whole
component's layout rather than just itself. A new `verify:icon-sizing` probe
asserts every icon slot declares both dimensions.

**A theme color that isn't registered with the plugin now says so.** Adding a
color takes two steps, and doing only the first produces the most confusing
possible result: `bg-brand` and `text-brand` work (Tailwind emits those), while
`btn-brand`, `badge-brand`, and `alert-brand` silently render in the default
color. Every instinct says the color is broken; it isn't, only the registration
is missing. The plugin now detects this at build time and prints the exact
fix line, ready to paste:

```
[silicaui] Theme color brand is declared in @theme but not registered with the plugin.
  Fix: @plugin "@wizeworks/silicaui" { colors: primary, …, brand; }
```

Best-effort by design: the plugin runs at its own position in the stylesheet, so
this only sees `@theme` blocks declared *before* the `@plugin` line. Colors
registered through Silica's own `@plugin "@wizeworks/silicaui/theme"` block
correctly stay silent — that path registers them by construction.

### CI

Six packages shipped verify suites that **CI never ran**, so a regression any of
them was written to catch could still reach `main`. A root `pnpm verify` now
runs all of them plus the byte-identical HTML golden, and CI runs it.
