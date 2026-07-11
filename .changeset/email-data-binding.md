---
"@wizeworks/silicaui-builder": minor
---

Mirrors the site engine's dynamic-content marker (`DataBinding`/`setData`/`ancestorsOf`) and host-catalog merge pattern into the email builder: Text/Button/Section/collection-repeat nodes can now carry a `DataBinding`, wired into the Inspector's new Data binding section, and `toEmailHtml` accepts an optional resolver so preview and static export share one resolving code path instead of drifting.
