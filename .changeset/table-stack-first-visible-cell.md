---
"@wizeworks/silicaui": patch
---

A stacked table now skips hidden cells when it picks the row's first and last cells. A list that hides a column below a pane width with Tailwind's `hidden` plus a container variant (`hidden @xl:table-cell`), or with the `hidden` attribute, used to hand the name's own line to that hidden first cell, and a hidden last cell kept the button from the end. Now the first cell that shows takes the line and the last cell that shows sits at the end, however many hidden cells lead or trail the row. Tables with no hidden cells and no selection cell stack exactly as before.

A first cell that only picks the row, a lone checkbox or radio (the bare `<Checkbox>`), stays at the start of the name's line instead of taking a line to itself: the name fills the rest of that line, the other cells move below, and the row is as tall as one without the checkbox. A cell that wraps its control in more markup opts in with `data-stack="select"`. When that cell is hidden, the name gets its own line as usual.

"Hidden" is read from the `hidden` class or attribute, not from the computed display, so a cell that carries `hidden` counts as hidden even at a width where a variant shows it. Keep the stack breakpoint at or below the width where such a column appears (for example `table-stack` with `@xl:table-cell`). A Tailwind prefix such as `tw:hidden` is not recognized; use the `hidden` attribute there.
