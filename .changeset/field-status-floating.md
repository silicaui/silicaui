---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
---

`Field` and `FieldStatus` now support a `floating` prop that takes the status panel out of flow (`position: absolute`, anchored under the field) so it never pushes sibling fields up or down as it appears, changes, or disappears — it overlays whatever's below instead. Off by default.
