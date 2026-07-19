---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui": minor
---

ToggleGroup gains `size` and `color` props

The CSS already carried a size vocabulary (`toggle-group-xs|sm|lg`, `md` default)
and a colored active pill, but the React wrapper exposed neither — you had to hand-write
the class. It now takes `size` (`xs | sm | md | lg`) and `color`, matching Button's prop shape.

The colored pill is also no longer limited to three hard-coded roles: `toggleGroup()` now
takes the plugin's `colors` list and emits a class per registered color, so any custom color
works. Colors apply orthogonally — the color class only sets `--toggle-group-pill-*`, which
the base `[data-pressed]` rule reads.
