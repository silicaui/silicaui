# 086 — One Button cost 301 kB, because the package shipped as a single pre-bundled file

**Status:** fixed
**Severity:** major
**Found by:** P07 · Hiroshi Tanabe · act 1, measure core alone
**Surface:** `@wizeworks/silicaui-react` — the published `dist`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P07's first act is a measurement, and it is the reason the persona exists:

> **What he is nervous about.** "Kept out of core so it stays lean" is a claim he
> has heard before from libraries that pull the entire chart engine in through a
> barrel import anyway. He is going to measure it.

His users read this dashboard over a ship's satellite link.

The core-only dashboard shell — a header, four KPI cards, a placeholder per
engine, five components imported from `@wizeworks/silicaui-react` — built to
**538 kB of JavaScript (172 kB gzipped)**.

Three builds, same toolchain, differing only in what they import:

```
  react only                         217.3 kB   gzip   67.7 kB
  + Button from the PUBLISHED dist   518.9 kB   gzip  165.5 kB   (+301.6 kB)
  + Button from SOURCE               219.3 kB   gzip   68.6 kB   (+2.0 kB)
```

**The component is two kilobytes. Publishing it made it three hundred.**

Importing four more components on top of the first added **0.1 kB** — the
signature of a package that is not being tree-shaken at all: the first import
pays for everything and the rest are already there.

## Why it matters

The good news first, because act 1 asks for it specifically: **none of the five
opt-in packages leaked in.** Charts, table, editor, dnd and panels were all
absent, so the package split itself holds.

But the same class of failure was inside core, where it is worse — you cannot
choose not to install core. Every consumer of `@wizeworks/silicaui-react` was
shipping the whole library to every visitor, no matter how little of it they
used. For Hiroshi's duty officer on a satellite link that is the difference
between a dashboard that loads and one that does not.

## The cause, and the wrong first answer

`sideEffects: false` was already declared. There were **776 `/*#__PURE__*/`
annotations** in the output and **zero top-level side-effecting statements**. By
every usual sign, this package should tree-shake.

A first look seemed to confirm it did: grepping the minified bundle for
`PinInput`, `Carousel`, `Calendar` found nothing. **That check was worthless** —
minification renames locals, so the absence of a name says nothing about the
absence of the code. Weighing the modules instead told the truth:

```
total rendered: 1505.1 kB across 309 modules

   629.5 kB  react-dom/cjs/react-dom-client.production.js
   170.6 kB  @wizeworks/silicaui-react/dist/index.js      ← for one Button
    27.5 kB  @base-ui/react/floating-ui-react/…/FloatingFocusManager.mjs
    20.4 kB  @base-ui/react/navigation-menu/…/NavigationMenuTrigger.mjs
    14.7 kB  @base-ui/react/select/popup/SelectPopup.mjs
    12.3 kB  @base-ui/react/slider/control/SliderControl.mjs
    11.0 kB  @base-ui/react/scroll-area/viewport/ScrollAreaViewport.mjs
```

A page with one button was carrying Select, Slider, NavigationMenu and
ScrollArea — through the library, which pulled them in as its own dependencies.

The cause is the shape of the artifact, not the source: **tsup bundled the whole
package into one `dist/index.js`.** A consumer's bundler then sees a single
enormous module and keeps what it cannot prove dead. The proof is the third row
of that table — the identical component, imported from `src`, costs 2 kB. The
source graph shakes perfectly. The published file cannot.

## Where it lives

[packages/silicaui-react/tsup.config.ts](../../../packages/silicaui-react/tsup.config.ts)
[scripts/tsup-use-client.mjs](../../../scripts/tsup-use-client.mjs)

## The fix

Mirror `src` into `dist` — one output file per source file — and hand the
consumer the real module graph:

```ts
entry: ["src/**/*.ts", "src/**/*.tsx"],
bundle: false,
```

That alone breaks two things, and both are the kind of breakage that only shows
up in someone else's app, so the build now puts them right and **proves** it:

**Relative imports need a file extension.** esbuild transforms each file on its
own and leaves `from "./button"` as written. A bundler resolves that; Node's own
ESM loader does not. The package would have imported cleanly in Vite and thrown
`ERR_MODULE_NOT_FOUND` under `node --input-type=module`, in a Jest ESM run, and
in any native SSR path. `addJsExtensions` rewrites them, resolving a directory
specifier to its `index.js`, and `assertResolvable` **throws the build** if a
single extensionless relative specifier survives.

**`'use client'` belongs on every client module, not just the entry.** Without it
a Next.js App Router consumer gets a hard error on import. But it must never
reach `server.js` or the pure helpers it uses — that entry exists precisely so a
Server Component can import `cx` and the class builders, and one stray directive
in that graph turns the whole thing into a client reference. `stampClientModules`
walks the server entry's own import graph first and skips everything in it.

## Confirmed by

```
  react only                         217.3 kB   gzip   67.7 kB
  + Button from the PUBLISHED dist   219.3 kB   gzip   68.6 kB   (+2.0 kB)
  + Button from SOURCE               219.3 kB   gzip   68.6 kB   (+2.0 kB)
```

The published package now costs **exactly what the source costs**. +301.6 kB
became +2.0 kB.

And Hiroshi's actual dashboard, the whole core-only shell:

```
before   538.24 kB   gzip  171.94 kB
after    233.88 kB   gzip   73.49 kB
```

**304 kB less JavaScript, 98 kB less over the wire**, for a screen that is read
over a satellite link.

Node's own ESM loader, on the server entry that must not become a client
reference:

```
$ node --input-type=module -e "import { cx, buttonClasses } from './dist/server.js'; …"
server entry loads under Node ESM: a b | btn btn-primary
```

`dist/button.js` carries `'use client'`; `dist/server.js` and `dist/lib/cx.js` do
not. Workspace build clean, `pnpm verify` exit 0, builder e2e green, and the
Next.js docs site cold-builds — which is the real test of the directive, since
that is an App Router app consuming this package.

## Also recorded, not fixed

**Every other package in the workspace still ships as a single bundle.**
`silicaui-html`, `silicaui-charts`, `silicaui-table`, `silicaui-editor`,
`silicaui-dnd` and `silicaui-panels` all use `entry: ["src/index.ts"]` with the
default bundling, so the same argument applies to each of them. It matters least
for the five opt-in engines — a consumer who installs the chart package wants the
chart engine — and most for `silicaui-html`, which sparx and the builder both
consume. Named here rather than changed in the same breath: each one needs its
own measurement before and after, and P07 has nine more acts that will install
five of them and produce exactly those numbers.

**`react-dom` is 629 kB of the remaining bundle** and is not ours to shrink.
Worth writing down so the next person reading "234 kB" knows what the floor is.

## Rating effect

Not a screen. This is the published artifact, which `rating.md` does not score.
