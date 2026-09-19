# 013 — In OS dark, silicaui.com is not actually silicaui's dark colour

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 4, RULE #7 regression check on issue 002's fix
**Surface:** `@wizeworks/silicaui` plugin — any app with `prefersdark: true` and no `data-theme`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 4, on `localhost:4011`

## What happened

Re-proving the plugin change from issue 011 against the earlier surface, I cleared the
stored theme on silicaui.com and reloaded `/docs/getting-started/` with the OS in dark.

It *looked* right. It is not. Measured off `document.documentElement`:

| | value |
| --- | --- |
| `prefers-color-scheme: dark` | `true` |
| `data-theme` attribute | `null` — correct, nothing chose |
| `--color-base-100` | `oklch(16% 0.01 255)` — the dark token, correctly re-pointed |
| `--color-base-content` | `oklch(93% 0.006 250)` — likewise |
| paragraph ink | `oklch(0.93 0.006 250)` — **the token is being used** |
| **`<html>` background** | **`rgba(0, 0, 0, 0)` — transparent** |

Then the same element with the attribute forced on:

```js
h.setAttribute('data-theme','dark') → background  oklch(0.16 0.01 255)
h.removeAttribute('data-theme')     → background  rgba(0, 0, 0, 0)
```

So `prefersdark` re-points every colour token to dark, and **never paints the page**.
What the visitor sees behind the text is Chrome's own default dark canvas, produced by
`color-scheme: dark` — not `--color-base-100`. The grain (`--noise`) is not applied
either; it hangs off the same rule.

The light ink is readable only because the UA happened to darken its canvas. Silica's
own surface colour is never used.

## What should have happened

`prefersdark: true` means *follow the OS into dark*. A visitor in OS dark should get the
theme's surface — `oklch(16% 0.01 255)`, a cool blue-black — the same one they get from
`data-theme="dark"`. The two routes into dark must land on the same page.

## How to reproduce

1. OS / browser set to dark.
2. `localStorage.removeItem('silica-theme')` on `localhost:4011`, then reload
   `/docs/getting-started/`.
3. `getComputedStyle(document.documentElement).backgroundColor` → `rgba(0, 0, 0, 0)`.
4. Every time. Any page of the site. Any width.

## Why it matters

This is the product's own marketing site failing to show the product's own colour, on the
route most visitors arrive by — an OS-dark visitor who has never clicked the toggle.
Dilnoza came to answer one question, *"does the theming actually work"*, and the surface
colour is the most visible token there is.

It is not only silicaui.com. It is **every app that turns `prefersdark` on and does not
set `data-theme`** — which is precisely the configuration the option exists for.

## Where it lives

`packages/silicaui/src/theme.js`. Two rules that must agree and do not:

- the **tokens** are emitted for three selectors — `:root` (light), `[data-theme="…"]`,
  and `:root:not([data-theme])` inside the `prefers-color-scheme: dark` block;
- the **paint** — background, ink, grain, `--font-sans`, the 16px anchor — exists for
  `[data-theme]` only.

The third selector gets dark tokens and no surface.

## Do the siblings have it too?

**This IS the sibling case, and it is the reason the defect exists.** Issue 002 added the
`prefersdark` block next to the `[data-theme]` blocks and gave it the tokens; the paint
rule sitting forty lines below was not updated to match. A fix that left its neighbour
behind — the failure shape the rulebook names.

**Checked, and NOT affected:**

- `data-theme="dark"` → paints `oklch(0.16 0.01 255)`. Correct.
- `data-theme="light"` → paints. Correct.
- OS **light**, `prefersdark: true`, no attribute → also unpainted, but the tokens stay
  light, so dark ink lands on the UA's white canvas and nothing is wrong to look at. Real
  but invisible, and it is the deliberate embeddable default — Silica must not repaint a
  host page nobody opted into.

The asymmetry is the tell: the dark branch is the one that changes the ink out from under
an unpainted background.

## The fix

Extract the five declarations that make up "a themed surface" into one `surface()` helper
in `theme.js`, and use it in **both** places that establish a Silica surface —
`[data-theme]` and the `prefersdark` `:root:not([data-theme])` block. One definition, so
the two cannot drift apart again; adding a sixth property later reaches both for free.

Painting under `prefersdark` does not weaken the embeddability rule the old comment
protects. That rule is *never repaint a host page you did not opt into* — and
`prefersdark: true` is the opt-in. An app that does not set it is untouched.

No class name, token name or prop changed.

## Confirmed by

**Re-ran the same step on silicaui.com**, cold build (`rm -rf apps/site/.next`, restart —
a plugin edit does not hot-reload), OS in dark, `silica-theme` cleared, at
`localhost:4011/docs/getting-started/`.

`<html>` now computes `oklch(0.16 0.01 255)` — Silica's own dark surface, the value the
explicit theme has always produced — with ink `oklch(0.93 0.006 250)` and `font-size:
16px`. Read on screen, not only in the console: the page renders in the quartz dark
surface, the getting-started copy from act 3 reading normally over it.

**All four routes measured in one pass, because the fix moved a rule that three of them
also depend on:**

| route | background | ink |
| --- | --- | --- |
| OS dark, no attribute | `oklch(0.16 0.01 255)` | `oklch(0.93 0.006 250)` |
| `data-theme="dark"` | `oklch(0.16 0.01 255)` | `oklch(0.93 0.006 250)` |
| `data-theme="light"` | `oklch(0.98 0.003 250)` | `oklch(0.21 0.012 255)` |
| light island inside the dark page | `oklch(0.98 0.003 250)` | `oklch(0.21 0.012 255)` |

The first two rows are now identical, which is the whole point: the two routes into dark
land on the same page. Scoped islands still work, so extracting `surface()` did not
narrow the rule.

**A probe, because the structural fix stops drift but does not prove it stopped.**
`packages/silicaui/scripts/verify-surface-paint.mjs` asserts that every selector setting
`--color-base-content` also has a background, with `:root` named as the deliberate
embeddable exception and `[data-theme="light"|"dark"]` resolved through the general rule
that covers them.

**The probe was proved to fail before it was trusted.** Removed the `...surface()` line
and re-ran:

> `❌ surface paint: ink re-pointed without a background`
> `  prefersdark: true — :root:not([data-theme]) sets --color-base-content but nothing
> paints it.`

Restored, green again. Wired into `pnpm verify`, which is exit 0.

## Rating effect

—
