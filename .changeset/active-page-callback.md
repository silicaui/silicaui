---
"@wizeworks/silicaui-builder": minor
---

Add `<Builder onActivePageChange>` — fires on mount and whenever the active page's identity (switch, rename, slug edit) changes, with `{id, name, slug}`. Lets a host key its own page-scoped UI (e.g. an SEO/metadata drawer rendered via `toolbarSlot`) to whichever page the author has open, without adding any domain fields to the `Page` schema itself.
