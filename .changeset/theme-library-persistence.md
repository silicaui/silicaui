---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
---

The Theme editor's "This site" saved-theme library is now real, host-persistable site data instead of an in-memory-only convenience. `Site` gains an optional `savedThemes` field; saving/deleting a named theme now flows through `Builder`'s `onChange` and local crash-recovery same as any other edit, so a theme an author starts (e.g. a "Christmas" theme built months ahead) survives a reload and round-trips through a host's own persistence — same as the rest of the site. The shipped `THEME_PRESETS` starting points are unaffected.
