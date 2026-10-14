---
"@wizeworks/silicaui": patch
---

A listbox Select's placeholder sits at the start of the trigger, where its value would. While nothing was chosen, Base UI still rendered the empty value span, and the trigger's `space-between` layout spread it, the placeholder and the chevron apart, so the placeholder floated in the middle of the box. The empty value now leaves the row while a placeholder shows. New check: `pnpm verify:select-placeholder`.
