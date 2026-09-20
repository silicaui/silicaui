# 079 — The contract doc left out every step that stops it mounting, and promised two things that are not there

**Status:** fixed
**Severity:** high
**Found by:** P05 · Arvid Lindqvist · act 1, read the contract then embed it
**Surface:** `docs/builder-contract.md`, and the `@wizeworks/silicaui-builder/react` entry point
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 1 is *"follow builder-contract.md and get the builder mounted in their own
app — not the harness. **Done when:** it mounts, and every step the doc assumed
but did not say is an issue."*

A real Vite React app, an ordinary `file:` install of the published packages, and
the contract doc open beside it. Five things went wrong before anything rendered,
and none of the five is mentioned anywhere in 647 lines of contract.

## 1. It does not mount at all — four copies of React

```
  ✗ the builder's canvas mounted — 0 canvas element(s)
  · tabs on screen — []

console errors:
  Invalid hook call. Hooks can only be called inside of the body of a function
  component. […] 3. You might have more than one copy of React in the same app
  PAGEERROR Cannot read properties of null (reading 'useMemo')
```

The packages declare React as a **peer** dependency, which is right. But any
local link — `file:`, `npm link`, a monorepo checkout — resolves each linked
package's own `node_modules/react` instead of the app's:

```
react @ 19.3.0                                        (the app)
@wizeworks/silicaui-builder/node_modules/react @ 19.2.7
@wizeworks/silicaui-react/node_modules/react   @ 19.2.7
@wizeworks/silicaui-html/node_modules/react    @ 19.2.7
```

Four. The fix is one line — `resolve.dedupe: ["react", "react-dom"]` — and the
contract never says it.

This is not a package defect; it is the first five minutes of every evaluation.
Arvid has two weeks to decide whether this is real, and minute one is a blank
panel and a stack trace.

## 2. It mounts unstyled — nothing about CSS, anywhere

Grepping 647 lines of contract for `tailwind`, `@source`, `@plugin`,
`stylesheet` and `globals.css` returns **nothing at all**.

Tailwind v4 generates only the classes it can see, the builder's chrome is built
from literal class strings that live inside the installed package, and
`node_modules` is not scanned by default. Follow the contract to the letter and
you get a fully working, completely unstyled builder — which reads as broken.

Three `@source` lines fix it. Zero of them are documented.

## 3. A host cannot type its own host nodes

```
src/quarrystone-host.tsx(7,28): error TS2459: Module
'"@wizeworks/silicaui-builder/react"' declares 'HostComponentDef' locally,
but it is not exported.
```

`HostComponentDef`, `HostPropDef` and `HostRenderCtx` are declared in
`site/react/host.ts` and never re-exported. `hostComponents()` and
`renderHostNode()` are the entire host-node seam — the reason this persona
exists — and neither can be written with types.

The inspector seam right beside them **is** exported, with a comment saying
exactly why:

> The two-tier inspector seam: `InspectorPanel` is a section inside Settings,
> `InspectorTabDef` is a whole tab beside it. **A host implementing either needs
> these names**, so both tiers are exported together.

The identical reasoning, one interface away, not applied. The recurring shape of
this whole run: the fix exists in the sibling and did not travel.

## 4. `BuilderHandle.extract()` is on the done list and not on the handle

`builder-contract.md` §10, "the minimal buildable surface":

> - [ ] `mountBuilder(el, { document, host })` → `BuilderHandle` with
>   **`extract()` symmetric to load** (§4).

The shipped handle has `applyRemoteOps`, `replaceState`, `ackSeq` and
`setHistoryDelegate`. No `extract`.

`onChange` covers persistence, but it only fires on **change** — so a host that
wants the document at a moment of its own choosing (a Save button, a preview, a
"Send for review" action, a test) has to mirror every `onChange` into its own
state purely to have something to read.

## 5. `mountBuilder` does not exist either

The same line promises an imperative `mountBuilder(el, …)`. The package ships a
React `<Builder>` component. That is the right call — the builder was
deliberately rebuilt in React — but §10 was never updated, so the checklist a
reader is told is "the definition of done" describes an API that was replaced.

## Where it lives

[docs/builder-contract.md](../../builder-contract.md)
[packages/silicaui-builder/src/site/react/index.ts](../../../packages/silicaui-builder/src/site/react/index.ts)
[packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — `BuilderHandle.extract`
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the same, for parity

## The fix

**The three host-node types are exported**, beside the inspector ones, with the
reason written next to them.

**`extract()` is on the handle**, both handles. It returns a defensive clone of
the current document — `Site` for the site builder, `EmailProject` for the email
one — and `undefined` in the one window before the editor has booted, which is
the same window in which every other method there is already a no-op. The email
builder gets it at the same time rather than waiting for its own persona to find
the same gap.

**The contract doc gains a "Mounting it in your app" section** covering the two
undocumented steps and correcting the two wrong promises: React deduplication
with the exact one-liner, the `@source` lines, `<Builder>` instead of
`mountBuilder`, and `extract()` now being real.

## Confirmed by

The same app, unchanged except for the one `dedupe` line, after the export fix:

```
does it mount in somebody else's app
  ✓ the app's own chrome is there
  ✓ the builder's canvas mounted — 1 canvas element(s)
  · tabs on screen — ["Layers","Insert","Design","Settings"]

did our three blocks come through
  ✓ the compliance certificate renders through renderHostNode
  ✓ the plant statistics render
  ✓ the price enquiry form renders
  ✓ the real certificate number is on the canvas
  ✓ the 52-character Swedish plant name survived

is it STYLED, or just mounted
  ✓ a .btn actually has button styling — padding 0px 12px, radius 6px

does the studio theme island contain itself
  · theme islands on the page — ["quarrystone-studio","quarrystone"]
  · the app's own primary — oklch(58% 0.16 48)
  · the builder chrome's primary — oklch(45% 0.09 250)
  ✓ the builder chrome does NOT inherit our orange

both toolbar slots
  ✓ our action is in the toolbar
  ✓ our status is in the toolbar

console errors: none
```

The "Send for review" button in that toolbar is the proof of `extract()`: it
reads the document on demand, from a host that keeps no mirror of it.

## Also recorded, not fixed

**The dedupe line is a build-tool fact, not a package one.** Nothing in
`@wizeworks/silicaui-builder` can prevent a bundler resolving a linked package's
nested React; documenting it is the whole of the available fix. A registry
install does not hit it.

## Rating effect

None — the contract doc is not a screen. The embed itself is scored under P05's
own rows once they exist.
