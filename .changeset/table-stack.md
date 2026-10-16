---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-mcp": minor
---

A table can stack its rows into blocks when its container is narrow, so a list fits a narrow pane instead of running past it and hiding its right-hand state and button. Add `table-stack` to a `.table` (or `<Table stack>` in React): while the table's container is narrower than 36rem, the header is visually hidden (a screen reader still reads it), each row wraps its cells with the first on a line of its own and the last at the end, and a cell with `data-label="Total"` shows that label before its value. Wider than that, it is an ordinary table. `table-stack-sm`, `-md`, `-lg`, `-xl`, `-2xl` and `-3xl` (or `stack="lg"` and so on) switch at 24, 28, 32, 36, 42 or 48rem instead, the same widths as Tailwind's container sizes. The switch is a container query, not a viewport one, and the table's parent becomes the query container by itself, so no `@container` is needed above it. Works with zebra, hover, every size, tfoot, light and dark.

The React `<Table>` wrapper now carries a new `table-scroll` class instead of an inline `overflow-x: auto` style; it renders the same. Table sizes now set cell padding through `--table-pad-x` and `--table-pad-y`, at the same values as before. `TABLE_STACK_BREAKPOINTS` and the `TableStackBreakpoint` type are exported from `@wizeworks/silicaui-react`. New checks: `pnpm --filter @wizeworks/silicaui verify:table-stack`, `node verify-table-stack.mjs` in silicaui-react, and the browser probe `examples/playground/e2e/table-stack.spec.ts`.
