---
"@wizeworks/silicaui": minor
---

Add an opt-in `components` option to the Tailwind plugin: `@plugin "@wizeworks/silicaui" { components: button, card; }` emits only those component stylesheets, in the same order as the full build. With no option the output is unchanged. Also add `chunkmarkers` (build tooling) that tags where each component starts.
