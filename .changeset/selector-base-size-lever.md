---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": minor
---

The theme editor can size the selector tier, not just fields.

Silica sizes controls off **two** base units: `--size-field` for anything with a field height
(Input, Select, Textarea, Button, FileInput) and `--size-selector` for the square/round controls
(Checkbox, Radio, Switch, Toggle, Badge). Every one of those components has read
`calc(var(--size-selector, 0.25rem) * N)` since the first release — but `--size-selector` was never
listed in `SCALAR_TOKENS`, so the token was invisible to everything downstream of that list. The
builder's Theme panel offered a "Field base size" step and nothing for selectors, and the MCP's
`get_tokens` didn't know the token existed. Radius already split all three ways in the same panel
(Boxes / Fields / **Selectors**), which made the missing size lever read as a deliberate omission
rather than a gap: a theme could round its checkboxes but not shrink them.

`--size-selector` joins `SCALAR_TOKENS` with the same `0.15–0.4rem` range and default as its field
counterpart, which lights it up in all three consumers at once — the builder's Theme panel now has
**Field base size** and **Selector base size** as a pair, and `get_tokens` advertises it. The two
stay independent on purpose: a dense checkbox beside a large input is the reason these are separate
tokens, and `e2e/theme-sizes.spec.ts` asserts the rendered box of each tier moves with its own lever
and holds still for the other one.
