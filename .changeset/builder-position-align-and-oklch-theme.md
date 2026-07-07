---
"silicaui": minor
"silicaui-react": minor
"silicaui-html": minor
"silicaui-behaviors": minor
"silicaui-mcp": minor
"silicaui-charts": minor
"silicaui-dnd": minor
"silicaui-editor": minor
"silicaui-panels": minor
"silicaui-table": minor
"silicaui-builder": minor
---

Add Position and Self align controls to the builder's Design panel, so a
width/max-width-constrained node can be centered (or left/right-aligned via
auto margins) and cross-axis aligned within a flex/grid parent, without
dropping to the raw class field.

Extend silicaui-mcp's `search_docs` tool to also match literal CSS class
names and semantic color tokens, not just components/blocks/behaviors.

Migrate the builder's default and studio-chrome theme presets from hex to
OKLCH color tokens for perceptually consistent palettes.
