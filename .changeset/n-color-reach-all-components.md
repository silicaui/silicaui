---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui-mcp": patch
---

**A color you invent now reaches every component, not just buttons.**

Silica's core promise is that N named colors cascade through everything — invent
`brand` and you get `btn-brand`, `badge-brand`, `alert-brand`, and the rest for
free. That held at build time and quietly collapsed at runtime, in the one place a
color is actually invented: the builder's theme editor.

Two defects, both fixed here:

1. **Only `btn-` regenerated.** Each component carried its own inline
   `for (const name of colors)` loop — 35 copies of the same shape, private to 35
   module scopes. Button alone had ever been factored out, so the builder's runtime
   cascade could re-emit exactly one family. A live `brand` painted buttons and
   silently skipped Badge, Alert, Input, Tabs and 30 others. The mappings now live
   in one declarative `color-variants.js` table that both callers — the plugin at
   build time and `customColorCss` at runtime — drive from the same generator, so a
   live color is byte-for-byte a declared one. `verify-color-reach.mjs` fails the
   build if a factory takes `colors` without registering there, so a new colored
   component can't silently drop out of the cascade.

2. **Colors added in dark mode were invisible.** `rolesOf` scanned `theme.tokens`
   only, so a color created while the theme editor was in dark mode landed in
   `theme.dark` and never appeared — no palette tile, no Inspector swatch, no
   generated utilities — even though the token was really there and the color
   picker could still edit it. It now scans both: a role is a role regardless of
   which mode declares it.

Every entry stays a pure var-setter (a color class assigns `--<c>-*` and paints
nothing), so color still composes with style and size classes without specificity
fights. A snapshot diff of the generated CSS confirmed the refactor is
byte-identical for the shipped colors — this adds reach, it does not restyle
anything.

The MCP catalog picks up the same table, so `list_classes` / `get_component` now
report the full color-variant set per component.
