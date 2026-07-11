---
"@wizeworks/silicaui-builder": minor
---

`EmailBuilder` gains a `toolbarSlot` prop, mirroring the site `Builder`'s: arbitrary host UI (a save-status badge, a template lifecycle strip) renders in the header immediately before the Send test/Export HTML buttons, instead of a host having to render its own chrome outside the builder entirely.
