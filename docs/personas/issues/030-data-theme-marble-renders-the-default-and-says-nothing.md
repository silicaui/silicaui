# 030 — `data-theme="marble"` rendered the default palette and nothing anywhere said why

**Status:** fixed
**Severity:** major
**Found by:** P02 · Tomás Ferreiro · act 4
**Surface:** `@wizeworks/silicaui-mcp` › `list_themes` / `get_theme`, and `apps/site` › getting-started
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

The build asks for **marble** in light and **carbon** in dark — chosen from the twenty named
presets rather than left on the default, because picking a theme is the point of having
twenty.

`get_theme("marble")` answers with the palette, the type faces, the shape tokens, and this:

```
"applyAs": "data-theme=\"marble\"",
"apply": "Put it on <html> to theme a whole page: `<html data-theme=\"dark\">`.",
"tokensNote": "… Apply the theme with the attribute — do not paste these values into
               CSS, or the result stops tracking the theme."
```

So: `<html lang="pt-PT" data-theme="marble">`, rebuild, reload. **The page renders in the
default quartz palette.** No error, no console warning, no build warning.

Measured on the rendered page:

| | |
| --- | --- |
| attribute on `<html>` | `marble` |
| `--color-primary` | `oklch(42% 0.055 252)` — **quartz's**, not marble's `oklch(34% 0.04 265)` |
| a `<div data-theme="marble">` vs a plain `<div>` | **identical** computed `--color-primary` |
| `[data-theme="marble"]` rules in any stylesheet | **0** |
| heading font | the system stack, not Cormorant Garamond |

`data-theme="marble"`, `data-theme="banana"` and no attribute at all are three ways of
getting exactly the same page.

## What should have happened

The two sentences the tool gives you are, together, a guaranteed failure on the CSS path.
`applyAs` is half an instruction; the other half — *something has to emit that theme* — is in
a different tool's output (`get_tokens → theming.declaring`), and the half that IS present
actively steers away from it: *"do not paste these values into CSS."*

## How to reproduce

1. A project with only `@wizeworks/silicaui` and the Tailwind CLI. No React, no node tree.
2. `@plugin "@wizeworks/silicaui" { colors: …; }` and nothing else.
3. `<html data-theme="marble">`.
4. Build, reload. Default palette, silently.

## Why it matters

This is the framework's **"absence behaves like fine"** row, and the sharpest instance of it
so far: a missing theme renders identically to a correct one. Nothing is broken enough to
look for.

It also bites the reader most likely to hit it. On React and the node tree the host emits
the preset for you, so this failure is **specific to the CSS-only path** — the path with no
build step to warn from and no framework to do it silently correctly.

## Where it lives

- `packages/silicaui-mcp/src/server.ts` — `list_themes` and `get_theme`
- `apps/site/app/docs/getting-started/page.mdx` — **there was no theming section at all**

## Do the siblings have it too?

**The mechanism exists and works.** `@plugin "@wizeworks/silicaui/theme" { name: marble; … }`
declares a theme entirely in CSS, and the site's own `globals.css` uses it three times. It
was never the missing piece.

**Where it is written down, and where it is not:**

| place | says how a preset gets emitted? |
| --- | --- |
| `get_tokens → theming.declaring` | yes |
| `get_theme`'s not-found error | yes — *"an app declares its own with `@plugin …/theme`"* |
| **`list_themes`** | **no** |
| **`get_theme`, when the preset EXISTS** | **no** |
| **silicaui.com** | **no theming page at all** — "marble" appears nowhere on the site |

So the answer was reachable from two places, and absent from the two you actually call when
you are picking a theme. The not-found branch is the tell: ask for a theme that does not
exist and you are told how to declare one; ask for one that does and you are not.

## The fix

**One constant, read by both tools** — the split is how the two halves drifted apart:

> A preset is a token bag; something has to EMIT it. The Tailwind plugin
> `@wizeworks/silicaui` emits only `[data-theme="light"]` and `[data-theme="dark"]` — no
> preset name. Putting `data-theme="marble"` on a page that never emitted marble is silent:
> it matches the bare `[data-theme]` rule, every token resolves to the default, and the page
> renders with no error. On the CSS path, emit it yourself from the token map this tool
> returns: `@plugin "@wizeworks/silicaui/theme" { name: marble; … }`, loaded after the main
> plugin. On the React and node-tree paths the host emits it for you.

**`tokensNote` was rewritten**, because "do not paste these values into CSS" forbade the one
move that works. It now separates hardcoding a token onto a component (wrong, and what the
warning was for) from declaring it once under a theme name (the sanctioned mechanism).

**The site got a Themes section**, covering the attribute, the nesting idiom, the two names
the plugin emits, how to declare a third, `prefersdark` for following the OS — and, in its
own bullet, that an undeclared name fails quietly and is worth checking first.

## Confirmed by

Three checks added to `packages/silicaui-mcp/verify.mjs`, run over real stdio:

```
✓ list_themes says who EMITS a preset, not just how to apply it
✓ get_theme says who EMITS a preset
✓ get_theme's tokensNote does not forbid declaring the theme in CSS
```

**Proved by breaking it**: both `emittedBy` lines removed from the source, rebuilt, and the
first two checks go **red** (`❌ 2 check(s) failed`, exit 1). Restored, rebuilt, green again.

A first attempt at that proof "passed" with the fix supposedly removed — because the edit
had not matched and the file was unchanged. That run proved nothing and was redone with a
line-based removal that was confirmed with `grep -c` before the probe was trusted.

**And the theme now works on the page it failed on.** `marble` and `carbon` declared in
`input.css` from the `get_theme` maps, rebuilt with the Tailwind CLI:

| | |
| --- | --- |
| `[data-theme="marble"]` rules in the built CSS | **1** (was 0) |
| `[data-theme="carbon"]` rules | **1** |
| `@media (prefers-color-scheme: dark)` | **1** — carbon follows the OS, no script |
| `--color-primary` on the page | `oklch(34% 0.04 265)` — **marble's** |
| rendered `<h1>` font | `"Cormorant Garamond", serif` |

## Rating effect

The menu page is scored in [rating.md](../rating.md) in both themes at 360px.
