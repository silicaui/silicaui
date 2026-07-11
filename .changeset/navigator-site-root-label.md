---
"@wizeworks/silicaui-builder": patch
---

The Navigator tree's root row now reads "Site root" in Layout mode instead of its bare tag name (e.g. "div") — the frame root has no useful ancestor context to hint at what it is, unlike a page root which already carries an explicit "Page" label.
