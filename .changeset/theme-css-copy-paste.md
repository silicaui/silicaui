---
"@wizeworks/silicaui-builder": minor
---

The Theme editor's "CSS" button now opens a modal instead of just copying to the clipboard: the theme's CSS custom properties are shown editable in place, with Copy, Reset, and a new Apply that parses pasted CSS back into the theme. Apply only accepts exactly what the theme's own CSS export produces (one `[data-theme]` block, optionally a dark `@media` block) — anything else (an extra selector, `url()`, a comment) is rejected with an inline error and never touches the live theme. Theme names are also now sanitized to a safe charset as you type.
