---
"@wizeworks/silicaui-builder": patch
---

Restructure `silicaui-builder`'s source tree to make room for an email editor alongside the existing site editor: editor-agnostic chrome (icon system, `Icon`, `ErrorBoundary`) moved to `src/shared/`, and the site editor's engine + React chrome moved to `src/site/`. The public API (`@wizeworks/silicaui-builder` and `@wizeworks/silicaui-builder/react`) is unchanged — internal move only, verified against the full e2e suite.
