---
"@wizeworks/silicaui-mcp": minor
---

The MCP server advertises the theme layer.

It didn't. `get_tokens` returned a `light` map and a `dark` map and never said how either one is
turned ON — `data-theme` appeared nowhere in the catalog, the tools, or the routing preamble. So an
agent could learn the eight semantic roles, learn how to register a ninth, and still have no way to
learn that a different palette is an attribute on a wrapper. Asked for a dark section, the only
thing left to reach for is a hardcoded hex or a bespoke stylesheet: it looks right in a screenshot
and can never respond to the theme it ends up inside. It also undersold the product — twenty
considered themes, swappable per-section, were invisible.

**Two new tools.** `list_themes` returns the mechanism plus every shipped preset with what it's
actually for (the prose above each preset's own `name:`, so twenty names like `clay`/`dune`/`frost`
are pickable). `get_theme({ name, mode? })` returns one preset's **resolved** token map — dark
deltas already merged over the base tokens and every `-content` ink derived by measured contrast,
i.e. what a browser computes rather than the authored bag — with the literal attribute to write.

**`get_tokens` gained `theming`**, so the mechanism is reachable from the tool an agent already
calls when it asks about color: the `data-theme` selectors, what the bare `[data-theme]` rule
paints (and why a wrapper is therefore enough), that dark mode is a theme and not a `.dark` class,
the `@plugin "@wizeworks/silicaui/theme"` options, the runtime `Theme` object a builder/CMS stores,
and the `@wizeworks/silicaui-html/theme` pair that lets a color named at runtime behave like a
declared one. The routing preamble gained one rule to the same effect, and `search_docs` now
answers "dark mode", "data-theme", "theming" and a preset's character text ("terracotta" → `clay`).

Everything is derived, never described: the selectors come from calling the plugin's own
`buildBase()`, the `@plugin` options from the plugin's own `options` accesses, the `Theme` shape
from a TS AST over its source, and each preset from the real `THEME_PRESETS` run through
`resolveThemeTokens` — plus `contrastWarnings` actually executed per mode, so a preset this catalog
vouches for is one it has measured.

Also fixes a latent bug in the catalog generator: the scoping helper wasn't idempotent, so prose
already written as `@wizeworks/silicaui-charts` got scoped a second time and nine component
descriptions shipped naming `@wizeworks/@wizeworks/silicaui-charts` — a package that does not
exist, in the one file whose whole job is to not invent names.
