---
"@wizeworks/silicaui-mcp": patch
---

Both theme tools now say who EMITS a preset, instead of half an instruction that fails silently

Found by the P02 persona run — a developer building a restaurant menu on the CSS-only path,
with the Tailwind CLI and no React and no node tree. He picked `marble` for light and
`carbon` for dark out of the twenty named presets, wrote `<html data-theme="marble">`, rebuilt,
and got the default quartz palette. No error, no console warning, no build warning.
`data-theme="marble"`, `data-theme="banana"` and no attribute at all were three ways of
rendering the same page.

**A preset is a token bag, and nothing in the CSS path emits it.** The Tailwind plugin emits
`[data-theme="light"]` and `[data-theme="dark"]` only, so an undeclared name matches the bare
`[data-theme]` rule and every token resolves to the default. The mechanism to declare a third
name has always existed — `@plugin "@wizeworks/silicaui/theme" { name: marble; … }`, used three
times in the site's own `globals.css`. It was never the missing piece.

What was missing is where it is written down. `get_tokens → theming.declaring` says it, and so
does `get_theme`'s **not-found** error — ask for a theme that does not exist and you are told
how to declare one. `list_themes` and `get_theme`-when-the-preset-exists, the two calls you
actually make while picking a theme, said nothing. Both now carry an `emittedBy` note, from a
single constant read by both, because the split is how the two halves drifted apart.

**`tokensNote` was rewritten.** It said *"do not paste these values into CSS"*, which forbids
the one move that makes a preset work on this path. It now separates hardcoding a token onto a
component — wrong, and what the warning was always for — from declaring it once under a theme
name, which is the sanctioned mechanism.

Three checks added to `verify.mjs`, run over real stdio and each watched fail first: removing
both `emittedBy` lines turns two red, and the old `tokensNote` wording turns the third red. No
tool, argument or response field was removed; `emittedBy` is additive.
