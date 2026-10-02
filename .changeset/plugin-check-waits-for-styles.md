---
"@wizeworks/silicaui-react": patch
---

The dev-only "CSS plugin is not loaded" check no longer fires on a correctly wired app.

It read `--sui-plugin` the moment the first Silica component rendered after the
page had loaded. On a client-side route change, the entered route's stylesheet
can still be on its way at that moment, so a working storefront logged the error
and showed the sentinel a moment later. The check now gives the sentinel 3 seconds
to appear. A plugin that is genuinely missing is still reported, once.
