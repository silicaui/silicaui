---
"@wizeworks/silicaui": patch
---

A stacked table now stays a block in an app that also uses Tailwind's own `table` class. The word `table` is a Tailwind utility too (`display: table`), and any app whose code contains it gets that utility, which outranked the stack's `display: block`. The rows still wrapped, but the table grew to fit its longest line, so a list with long names ran far past a narrow pane and scrolled sideways (one list measured 1040px wide in a 323px pane). The stacked table's `display: block` is now `!important`, below the breakpoint only, for `table-stack` and every `table-stack-sm` to `table-stack-3xl`. Wider than the breakpoint it is an ordinary table, as before.

A stacked table that is hidden stays hidden: the important block skips a table with the `hidden` class or attribute, or a variant or important form of the class (`md:hidden`, `hidden!`). To hide a stacked table at some widths only, hide its wrapper instead of the table. Cells, rows, the body and the footer are unchanged, so a cell or row hidden with `hidden` still stays hidden.
