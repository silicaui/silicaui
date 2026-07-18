# @wizeworks/silicaui-react

## 0.25.1

### Patch Changes

- 3bd07b4: Make the `render` prop fail safely, and document that it's client-only.

  Passing `render={<a href="…" />}` from a React Server Component either threw
  React's opaque `Element type is invalid… got: undefined`, or silently produced
  a styled element with none of its own props — a link that looks right and
  navigates nowhere. The cause is structural: this package's main entry is a
  single `"use client"` module, so the element is serialized across the boundary
  and arrives with `type` and/or `props` missing.

  - The three `render` implementations (`Button`, `Badge`, `ClickableCard`) now
    share one audited helper, `composeRender`. It validates the element before
    cloning it and falls back to the component's own native element when the
    element is unusable, so a bad `render` can no longer take a page down.
  - Both failure modes now log an actionable `console.error` naming the
    component and pointing at `@wizeworks/silicaui-react/server`. They fire in
    production too — each mode is silent by nature, so a build that only warned
    in development would still ship dead links. The remediation detail is
    dev-gated and stripped from production bundles.
  - `mergeProps` keeps its public contract: called with a single argument (its
    documented `/server` usage) it stays silent.
  - The `render` JSDoc on all three components states the constraint and the
    fix, which also surfaces it in editor hover-hints and the `silicaui-mcp`
    catalog. The README gains a **Server Components** section covering the
    `"use client"` boundary and the `/server` class builders.
  - New `pnpm --filter @wizeworks/silicaui-react verify` probe covers all of the
    above against the built bundle, in both `NODE_ENV` modes.

## 0.25.0

## 0.24.0

### Minor Changes

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

### Minor Changes

- d0a6ca6: `Field` and `FieldStatus` now support a `floating` prop that takes the status panel out of flow (`position: absolute`, anchored under the field) so it never pushes sibling fields up or down as it appears, changes, or disappears — it overlays whatever's below instead. Off by default.

## 0.19.0

### Minor Changes

- 3893c74: Toast now supports a clickable action button. `useToast().add()` accepts `actionProps` (forwarded to Base UI's `Toast.Action`, rendered as a `<button>`) — commonly paired with `timeout: 0` so the toast doesn't auto-dismiss before the user can act: `toast.add({ title: "New version available", actionProps: { children: "Refresh", onClick: () => location.reload() }, timeout: 0 })`. Adds a `.toast-action` style (an outlined pill reading `currentColor`/`--toast-fg`, so it stays legible across every `data-type` and in dark mode) positioned between the toast content and the close button.

## 0.18.0

## 0.17.0

## 0.16.0

### Minor Changes

- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

## 0.15.0

## 0.14.0

### Patch Changes

- aa589af: `buttonClasses`, `badgeClasses`, and `clickableCardClasses` (added in 0.13.0) now actually work from a Server Component. They previously lived inside `button.tsx`/`badge.tsx`/`card.tsx`, part of the bundle `@wizeworks/silicaui-react`'s main entry stamps `"use client"` onto — importing them there handed a Server Component an unusable client reference, not a callable function. They now live in framework-agnostic `lib/` modules (no React dependency) exported from both the main entry and `@wizeworks/silicaui-react/server`, so `import { buttonClasses } from "@wizeworks/silicaui-react/server"` gets a real function.

## 0.13.0

### Minor Changes

- 386a0c1: `mergeProps` (the merge behind every component's `render` prop) now tolerates a `theirs` of `undefined`, so passing a Server Component's client-component element through `render` degrades gracefully instead of throwing — crossing that boundary serializes the element as a lazy client reference whose `.props` reads as `undefined`. `Validator`/`FloatingLabel`'s direct `children.props` reads get the same treatment.

  Also export `buttonClasses`, `badgeClasses`, and `clickableCardClasses` — the class-string logic behind `Button`, `Badge`, and `ClickableCard`, as standalone functions with no React context dependency. A Server Component can now style a plain element directly (e.g. `<Link className={buttonClasses({ color: "neutral", variant: "ghost" })}>`) instead of needing the client-side `render` composition.

## 0.12.0

## 0.11.0

## 0.10.1

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

### Patch Changes

- `ChatMessage` (the convenience wrapper, not the raw `Chat`/`ChatHeader`/`ChatFooter` primitives) now renders name/time _after_ the bubble instead of before it, matching a modern messaging-app read where the message is the point and the timestamp is a quiet trailing detail. The avatar's alignment flips from bottom- to top-anchored (`.chat-image` `align-self: start`) so it lines up with whatever's first in the group — the bubble in `ChatMessage`'s new order, or a `ChatHeader` name/time row for anyone composing the primitives directly (e.g. a Slack-style header-above layout) — instead of hanging toward a short trailing metadata line.

## 0.5.0

### Minor Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

## 0.4.0

### Patch Changes

- 18da685: Fix `@wizeworks/silicaui-mcp`'s catalog generator so it can't silently drift out of sync again:

  - `behaviors.json` is now derived from `silicaui-behaviors`' real `HANDLERS` dispatch table instead of a hand-maintained file list — all 30 registered `BehaviorType`s are covered (previously only 11, missing `form` and every behavior added since).
  - `components.json` now also covers `silicaui-html`'s `ComponentDef` macro registry (208 framework-neutral components — Dialog, Popover, Combobox, etc.), not just `silicaui-react`. Each macro's real `BehaviorType`(s) are discovered by actually calling its `expand()`, not guessed. `get_component` now takes an optional `package` argument to disambiguate names that exist in both packages.
  - The generator now warns at `gen` time if a `silicaui-react` component's export has no matching row in the README's component table, instead of silently omitting it from the catalog forever.
  - `silicaui-react/README.md`'s component table gets 28 real components it was missing (`Timestamp`, `InputGroup`, `PasswordInput`, `MultiSelect`, `AppShell`, `PowerSearch`, the `DateInput`/`TimeInput` family, and others).
