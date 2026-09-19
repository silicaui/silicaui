# 015 — Every heading in Dilnoza's console renders as body text

**Status:** fixed
**Severity:** blocker
**Found by:** P01 · Dilnoza Karimova · act 5
**Surface:** `@wizeworks/silicaui` plugin — any app using `prefersdark` without `data-theme`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 5, on `localhost:4099`

## What happened

Built the console shell and put the act-5 heading on the overview:

```tsx
<Heading level={1} className="text-balance">
  Live shipments awaiting customs clearance or consignee confirmation
</Heading>
```

It rendered at the same size and weight as the paragraph under it. Measured off the
computed style at `localhost:4099`:

| | font-size | font-weight | class emitted |
| --- | --- | --- | --- |
| `<Heading level={1}>` | **16px** | **400** | *none* |
| `<Heading level={2}>` | **16px** | **400** | *none* |
| a `<p>` beside them | 16px | 400 | — |

The `<h1>`, the `<h2>` and the body copy are typographically identical. There is no
hierarchy on the page at all.

Toggling one attribute on `<html>` fixes everything at once:

```
no data-theme         h1  16px / 400     h2  16px / 400
data-theme="dark"     h1  36px / 700     h2  30px / 700
data-theme="light"    h1  36px / 700     h2  30px / 700
no data-theme         h1  16px / 400     h2  16px / 400
```

**The entire type ramp lives behind `[data-theme]`, and `prefersdark` requires that the
attribute NOT be set.** The two features cannot both be on.

## What should have happened

An `<h1>` should be an `<h1>`. Turning on the documented way to follow the operating
system should not silently remove the typography.

## How to reproduce

1. A Next.js app with `@plugin "@wizeworks/silicaui" { prefersdark: true; }` and no
   `data-theme` anywhere — exactly what the option is for.
2. Render `<Heading level={1}>anything</Heading>`.
3. `getComputedStyle(h1).fontSize` → `16px`. Every time, both OS modes, every width.

## Why it matters

**Blocker, and the reason is that nothing reports it.** `<Heading>` is imported
correctly, typechecks, renders the right tag, and produces a page with no hierarchy.
Dilnoza's reasonable conclusion is not "a scoping rule missed a selector" — it is
*"silicaui's typography does not work"*, on the screen she is building to decide whether
to adopt it.

It also punishes the right choice. She left `data-theme` off **deliberately**, because
the night shift needs the console to already be dark at 22:00 — the exact thing
`prefersdark` was added for in act 2. Doing the documented thing removed her headings.

## Where it lives

`packages/silicaui/src/components/typography.js`. Six rule groups, every one of them
scoped to the attribute:

```
[data-theme] :where(h1, h2, h3, h4, h5, h6)     the shared heading treatment
[data-theme] :where(h1) … :where(h6)            each step's size/weight/tracking
[data-theme] :where(p)                          line-height
[data-theme] :where(small)                      caption size
[data-theme] :where(blockquote)                 pull-quote treatment
[data-theme] :where(blockquote > footer, cite)
```

`Heading` itself is not at fault and needs no change. Its doc is explicit —
*"With no `size`, a heading just inherits its tag's global default"* — and it correctly
emits no class. The global default is simply unreachable.

## Do the siblings have it too?

**This is the same root cause as issue 013, found in a second place — which means the
inventory matters more than either fix.**

`prefersdark` re-points the colour tokens at `:root:not([data-theme])`. Everything else
that makes a page a *Silica* page is scoped to `[data-theme]`, and `prefersdark` reaches
none of it. Counted, not estimated — every rule in the plugin scoped that way:

| Scoped to `[data-theme]` | Reached by `prefersdark`? |
| --- | --- |
| the surface paint (`theme.js`) | **no** → issue 013, fixed |
| the type ramp, six groups (`typography.js`) | **no** → this issue |
| reduced motion (`theme.js`) | **yes** — already written `:root, [data-theme]` |

The reduced-motion rule is the tell: somebody writing that one line already knew both
selectors were needed. Nothing carried that knowledge to the other two.

`typography.js`'s own header comment states the principle it then fails to hold:

> *"Global element defaults are scoped to `[data-theme]` — **the same opt-in surface
> @wizeworks/silicaui paints (theme.js)** — so @wizeworks/silicaui NEVER restyles a host page's
> headings you didn't opt into."*

Typography is supposed to follow the surface. Issue 013 changed what the surface is, and
typography did not follow. Fixing this one selector without fixing the *rule* would leave
the next person to add a `[data-theme]` rule making the same mistake a fourth time.

## The fix

**One exported list of the selectors that establish a Silica surface**, in `theme.js`,
derived from `prefersDark` and used by everything that scopes to it — the paint and the
type ramp both. Adding a third such rule later means using the list, not remembering a
second selector.

`prefersdark: true` means *Silica manages this page*, so `:root:not([data-theme])` joins
`[data-theme]` as a surface. An app that does not set the option is untouched, and the
embeddable promise the comment protects is unchanged: both are still opt-ins.

The surface paint also moves **out** of the `prefers-color-scheme: dark` media query
while doing this. It reads `var(--color-base-100)`, and only the token values are
OS-dependent — so declaring the paint once covers both modes and fixes the light side,
which issue 013 left unpainted and recorded as a known asymmetry.

## Confirmed by

**Re-ran act 5 on Dilnoza's own console**, cold build, `prefersdark: true`, no
`data-theme` anywhere — the configuration that had no typography at all:

| | before | after |
| --- | --- | --- |
| `<h1>` | 16px / 400 | **36px / 700** |
| `<h2>` | 16px / 400 | **30px / 700** |
| `<p>` | 16px / 400 | 14px / 400 (the app's own `text-sm`) |
| `<html>` background | — | `lab(3.68 …)`, the dark surface |

Read on screen, not only in the console: the overview page now has real hierarchy —
title, section heading, body — where before all three were the same line of text.

**All four theme routes re-measured**, because the fix moved a selector three of them
share. `data-theme="dark"`, `data-theme="light"`, no-attribute-OS-dark and a nested light
island all render the correct surface and the correct ramp; the no-attribute and explicit
cases are now identical, which is the whole point.

**The light half of issue 013 closed at the same time.** Moving the paint out of the
media query fixed the asymmetry that issue recorded as known — `prefersdark` in OS-light
now paints `oklch(98% …)` instead of leaving the browser's white.

**Probed, and the probe was proved to fail first.** `verify-surface-paint.mjs` grew a
second part that runs `typography()` in both modes and asserts every scoped rule carries
every surface selector. Reverting one rule to the hardcoded `[data-theme]`:

> `❌ surface scoping`
> `  prefersdark: true — typography rule :where(p) is missing the surface
> :root:not([data-theme]). Build the key with surfaceScopes(), not a hardcoded selector —
> that is how the whole type ramp went missing.`

Restored, green. `pnpm verify` exit 0.

**Second confirmation (RULE #7 — the fix touched the plugin).** Below.

## Rating effect

—
