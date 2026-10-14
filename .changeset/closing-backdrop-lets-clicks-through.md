---
"@wizeworks/silicaui": patch
---

A closing dialog, drawer, command palette or lightbox lets clicks through. Base UI keeps the backdrop and popup mounted for their exit transition, and while they faded out they still covered the page: a click in that window landed on a backdrop that was already leaving and did nothing. Pressing Escape on a search and clicking the search box again at once opened nothing, and everything typed next was lost. Every backdrop and popup now drops pointer events while `[data-ending-style]` is set. New check: `pnpm verify:closing-overlays`.
