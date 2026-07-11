---
"@wizeworks/silicaui-builder": minor
---

Both builder shells' left/right rails (site `Builder` and `EmailBuilder`) are now resizable via `@wizeworks/silicaui-panels`, with widths persisted locally per-browser (`autoSaveId`) independent of the document itself — useful once a tree gets deep enough that the fixed 264px/320px rails felt cramped. The `IconItem`/`PanelHead` chrome primitives shared by both builders were also consolidated into one `shared/react/chrome.tsx` so a tweak to one applies to both instead of silently drifting apart.
