---
"@wizeworks/silicaui-builder": patch
---

Email inspector: color swatches key by role, not hex — no duplicate-key warning.

**Fix.** `SwatchGroup` rendered its 13 palette swatches with `key={o.hex}`, which
assumes every theme role resolves to a distinct color. Real themes routinely
collide — a dark neutral doubling as base content (`neutral` and `baseContent`
both `#0f172a` is the common case) — so React logged "Encountered two children
with the same key" and could drop or duplicate a swatch. The role name is the
stable identity of a swatch and is already carried on every option, so it is now
the key. Order and behavior are unchanged; the colliding roles still render as
two separate (identically colored) swatches, each picking its own role.