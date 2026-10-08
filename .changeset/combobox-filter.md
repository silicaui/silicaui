---
"@wizeworks/silicaui-react": minor
---

`Combobox` takes a `filter` prop: decide whether an item matches what was typed.

By default an item matches when its label contains the query, and that is still
what happens without the prop. Pass `filter` when people type words that are not
in the label. In sparx, a picker item labeled "Order · Payment" has to come up for
"paid", which is one of its values; it showed "No results". `verify-combobox-filter.mjs`
types into a real Combobox and fails when the prop is not passed through.
