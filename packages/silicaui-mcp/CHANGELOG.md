# @wizeworks/silicaui-mcp

## 0.27.0

## 0.26.0

## 0.25.1

## 0.25.0

## 0.24.0

### Patch Changes

- 065d97b: Data-resolution honesty + a logo-capable brand mark + canvas binding resolution — three orthogonal fixes closing the gap between what the data layer promised and what it did. Design authority: `docs/data-resolution-and-brand-mark.md`.

  - **Resolution honesty (`@wizeworks/silicaui-html`)** — `ResolveHost`'s hooks now return `Resolved | undefined` (and `readonly unknown[] | undefined`), where a bare `undefined` means **"I don't know this ref"** and `{ value: undefined }` keeps its old meaning, **"I know it and it's empty"**. Those were previously the same value, so the walk _couldn't_ tell them apart and blanked the node either way. An unknown ref now **keeps the node's authored content** (marker included, so a re-resolve or a downstream runtime still sees the bind), never drops it, and reports a structured `ResolveDiagnostic` via the new optional `ResolveHost.onDiagnostic`. `omitWhenEmpty` deliberately does **not** apply to an unknown ref — "legitimately empty, render nothing" is a claim only a host that knows the ref can make. The core stays pure: no `console`, no `NODE_ENV` sniffing — loudness is the consumer's call. Widening the return type is source-compatible: an existing host's narrower return still typechecks and behaves exactly as before.

  - **Canvas resolution (`@wizeworks/silicaui-builder`)** — the canvas resolves bindings through the same `resolveTree` primitive `toHtml` uses, via a new `ResolveOptions.editing`. `editing` is a **destruction policy, not a second resolver**: same walker, same hooks, same refs, diverging only where production's answer is "show nothing" — which an editor can't render, because a dropped node can't be selected, inspected, or un-bound. So `visible:false` (and `omitWhenEmpty` at zero items) render **ghosted** and report `code: "hidden"`; unknown refs render their authored content wearing a warning outline plus a `data-sui-unresolved` hook. A **Data on/off toggle** (default on, shown only when the host resolves anything) flips back to the authored placeholder — which is what ships when data is absent, so it must stay visible and editable. Text showing **resolved** data is no longer `contentEditable` (committing it would overwrite the authored placeholder with host data); an unknown ref still shows authored text, so it stays editable. v1 resolves `value`/`html` binds only — a collection keeps its authored template unexpanded _and unresolved_, because cloning children clones their ids (which selection and React keys depend on), and resolving a nested field with no item in scope would blank the very placeholder being laid out.

  - **Brand mark (`@wizeworks/silicaui`, `@wizeworks/silicaui-react`, `@wizeworks/silicaui-html`)** — `Wordmark` can hold a logo. It was a text-only atom while its own CSS and React wrapper both already assumed a mark, so "put the logo in the wordmark" was impossible by construction. It's now a container with `src`/`alt`/`href` props (nesting an `Image`/`Icon` child remains the richer path and wins when present; `href` lowers the mark to an `<a>`, same sugar as `Button`). `alt` defaults to `""` — decorative, since the name renders beside it. The CSS mark rule generalizes from `& svg { width: 1.15em }` to `& :is(svg, img)` height-locked with **width auto**, so a non-square logo is no longer squashed to a square (square marks are unaffected). **Text-only Wordmark markup is byte-identical to before.**

  - **`ComponentDef.primary` (`@wizeworks/silicaui-html`)** — a component now declares which prop a bare `value` bind fills. This replaces `resolve.ts`'s hardcoded `Image`/`Avatar` name-list and its `"src" in props` sniff outright: the name-list meant every new bindable component needed a resolver edit, and the sniff was about to write a bound site **name** into a Wordmark's **logo URL**. `Image`/`Avatar` declare `primary: "src"`; `Wordmark` declares `primary: "text"`. Absent a declaration the old `label` → `text` fallback applies. Same coupling `ComponentDef.container` was introduced to kill.

  - **Host adapters extend, never re-declare** — `BuilderHost` and `EmailBuilderHost` both carried duplicate copies of the resolver hooks, so the widened signature didn't propagate and both Inspectors read `.value` off a possibly-`undefined` with the compiler silent. They now `extends ResolveHost` / `EmailResolveHost`. The builder's React entry also exports the `Editor` type (what `useEditor()` returns — a host couldn't name it), and `Canvas.isEmptyContainer` now asks a component's **expansion** rather than its authored children, so a prop-populated container is no longer painted over with an "empty — drop something here" placeholder.

## 0.23.0

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.0

### Patch Changes

- d0d7cc6: `SCALAR_TOKENS` (the theme's non-color knobs — radius/border/size/depth/noise/focus-width/disabled-opacity) now carries a `doc` string per entry describing what it actually affects, surfaced through the MCP's `get_tokens` and documented in `docs/silicaui-architecture.md` §5.1. Also fixes a stale ThemeEditor tooltip ("3D depth on fields & selectors") that no longer matched what `--depth` controls (Card/Button shadow), and regenerates the MCP catalog to pick up previously-uncataloged package versions and the Combobox `popupProps` prop.

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

### Patch Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

### Patch Changes

- 7e6966e: Fix `@wizeworks/silicaui-builder` being non-consumable: it imports `@wizeworks/silicaui-react` at runtime (Toolbar, Button, Select, TreeView, etc. from `/react` and `/email/react`) but never declared it as a dependency, so a fresh install left that import unresolved. It's now a peer dependency, matching the other component-wrapping packages.

  The MCP package catalog also still listed `silicaui-builder` as `private: true` / `install: null` from before it became a publicly installable package — corrected to a real install command and current version.

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

## 0.5.0

## 0.4.0

### Minor Changes

- 18da685: Fix `@wizeworks/silicaui-mcp`'s catalog generator so it can't silently drift out of sync again:

  - `behaviors.json` is now derived from `silicaui-behaviors`' real `HANDLERS` dispatch table instead of a hand-maintained file list — all 30 registered `BehaviorType`s are covered (previously only 11, missing `form` and every behavior added since).
  - `components.json` now also covers `silicaui-html`'s `ComponentDef` macro registry (208 framework-neutral components — Dialog, Popover, Combobox, etc.), not just `silicaui-react`. Each macro's real `BehaviorType`(s) are discovered by actually calling its `expand()`, not guessed. `get_component` now takes an optional `package` argument to disambiguate names that exist in both packages.
  - The generator now warns at `gen` time if a `silicaui-react` component's export has no matching row in the README's component table, instead of silently omitting it from the catalog forever.
  - `silicaui-react/README.md`'s component table gets 28 real components it was missing (`Timestamp`, `InputGroup`, `PasswordInput`, `MultiSelect`, `AppShell`, `PowerSearch`, the `DateInput`/`TimeInput` family, and others).
