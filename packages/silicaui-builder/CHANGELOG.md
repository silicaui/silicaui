# @wizeworks/silicaui-builder

## 0.21.0

### Minor Changes

- 9e0027d: Media, icons, and rich-text/embed support for the framework-neutral renderer.

  - **Video / audio**: `<video>` and `<audio>` now render through `toHtml` (added to the raw-element floor with their full attribute set — `poster`, `controls`, `autoplay`, `muted`, `loop`, `playsinline`, `preload`, sizing, `crossorigin`; `<source>` kept). New first-class **Video** component (palette + Inspector). Previously both coerced to `<div>`.
  - **Icons on static pages**: `toHtml` now inlines an SVG glyph for `Icon` (`data-icon`) spans via a new `icons` resolver that **defaults to a bundled Lucide set**, so a published page is self-contained (no icon runtime/font). Pass a custom `Record<name, markup>` / function to override, or `icons: false` for the bare span. Core stays icon-agnostic; the builder canvas uses the same resolver (preview == production). Exported: `LUCIDE_ICONS`, `iconSvg`, `IconResolver`.
  - **Data-bound trusted HTML**: new `DataBinding` kind `{ kind: "html"; ref }` and **RichText** component for CMS long-form / rich text. `resolveTree` fills a render-time `rawHtml` that `toHtml` emits unescaped — the host sanitizes the value at its data boundary (same trust model as `dangerouslySetInnerHTML`). Unresolved binds lower to an inert `data-sui-html` marker.
  - **Embed**: new curated **Embed** component (YouTube / Vimeo / Google Maps) that emits a sandboxed `<iframe>` to an allowlisted host only, normalizing share URLs to their embed form; unknown hosts fall back to a link. `<iframe>` is still not in the raw-element floor — arbitrary authored iframes continue to downgrade to `<div>`.
  - **Broader inline-SVG allowlist**: pasted logos/illustrations survive — added `defs`, `use`, `symbol`, `title`, `desc`, `ellipse`, `text`, `tspan`, `clipPath`, `mask`, `pattern`, `linearGradient`, `radialGradient`, `stop`, `image`, plus a shared presentation-attribute set. Security is unchanged: `script`/`style`/`foreignObject` still downgrade, `on*` fails closed, inline `style` is stripped, and `use`/gradient/pattern `href` is restricted to internal fragment references.

### Patch Changes

- Updated dependencies [9e0027d]
  - @wizeworks/silicaui-html@0.21.0
  - @wizeworks/silicaui@0.21.0
  - @wizeworks/silicaui-panels@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [d0a6ca6]
  - @wizeworks/silicaui@0.20.0
  - @wizeworks/silicaui-panels@0.20.0
  - @wizeworks/silicaui-html@0.20.0

## 0.19.0

### Patch Changes

- d0d7cc6: `SCALAR_TOKENS` (the theme's non-color knobs — radius/border/size/depth/noise/focus-width/disabled-opacity) now carries a `doc` string per entry describing what it actually affects, surfaced through the MCP's `get_tokens` and documented in `docs/silicaui-architecture.md` §5.1. Also fixes a stale ThemeEditor tooltip ("3D depth on fields & selectors") that no longer matched what `--depth` controls (Card/Button shadow), and regenerates the MCP catalog to pick up previously-uncataloged package versions and the Combobox `popupProps` prop.
- Updated dependencies [d0d7cc6]
- Updated dependencies [3893c74]
  - @wizeworks/silicaui-html@0.19.0
  - @wizeworks/silicaui@0.19.0
  - @wizeworks/silicaui-panels@0.19.0

## 0.18.0

### Minor Changes

- 66ee29f: A `collection` data bind can now opt out of the "zero items renders the authored children once, as a placeholder" convention: `DataBinding`'s collection variant gains an optional `omitWhenEmpty` flag, and both the site and email resolvers honor it identically — a collection resolving to zero items with `omitWhenEmpty: true` drops the node (and its subtree) entirely, the same way a `value` bind's `visible: false` does, instead of rendering the placeholder row. Both Inspectors' Data binding section gain a matching "Omit when empty" toggle on a collection bind.
- 66ee29f: `EmailBuilder` gains a `toolbarSlot` prop, mirroring the site `Builder`'s: arbitrary host UI (a save-status badge, a template lifecycle strip) renders in the header immediately before the Send test/Export HTML buttons, instead of a host having to render its own chrome outside the builder entirely.

### Patch Changes

- Updated dependencies [66ee29f]
  - @wizeworks/silicaui-html@0.18.0
  - @wizeworks/silicaui@0.18.0
  - @wizeworks/silicaui-panels@0.18.0

## 0.17.0

### Minor Changes

- aadc8f6: Mirrors the site engine's dynamic-content marker (`DataBinding`/`setData`/`ancestorsOf`) and host-catalog merge pattern into the email builder: Text/Button/Section/collection-repeat nodes can now carry a `DataBinding`, wired into the Inspector's new Data binding section, and `toEmailHtml` accepts an optional resolver so preview and static export share one resolving code path instead of drifting.
- aadc8f6: The email builder's `TextNode.html`, `ButtonNode.label`, `subject`, and `preheader` now resolve inline `{{ref}}` merge tokens against the host's `resolveBinding`, independent of any whole-field `data` bind on the same node — a sentence like "Hi {{customer.firstName}}, your order shipped" has no single field to bind wholesale, so each token resolves on its own. Typing `{{` in the Canvas's rich-text editor or the Inspector's Subject/Preview text/Button label fields now opens a filterable autocomplete sourced from the host's `dataSources()`. Tokens inside a `data-scope="collection"` repeat resolve per item, and `HtmlNode.html` is never token-substituted (raw passthrough stays raw).

### Patch Changes

- @wizeworks/silicaui@0.17.0
- @wizeworks/silicaui-html@0.17.0
- @wizeworks/silicaui-panels@0.17.0

## 0.16.0

### Minor Changes

- 8b540c0: Both builder shells' left/right rails (site `Builder` and `EmailBuilder`) are now resizable via `@wizeworks/silicaui-panels`, with widths persisted locally per-browser (`autoSaveId`) independent of the document itself — useful once a tree gets deep enough that the fixed 264px/320px rails felt cramped. The `IconItem`/`PanelHead` chrome primitives shared by both builders were also consolidated into one `shared/react/chrome.tsx` so a tweak to one applies to both instead of silently drifting apart.
- 8b540c0: `EmailBuilder`'s `theme` prop is now live, not read-once-at-mount: every Text/Button/Divider/Section/Body color that's still on its brand default repaints when the host hands down an updated `Theme` (e.g. a theme edited in the site builder elsewhere), so an open email stays on-brand instead of drifting. A field freezes the moment a user picks its own color, so a live theme update never clobbers a deliberate choice. Also moves the email's Subject and Preview text fields into the toolbar (previously buried in a truncated label) and swaps the header/footer branding for a `silicaui.com` link, matching the site builder's chrome.
- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

- 8b540c0: The Theme editor's "CSS" button now opens a modal instead of just copying to the clipboard: the theme's CSS custom properties are shown editable in place, with Copy, Reset, and a new Apply that parses pasted CSS back into the theme. Apply only accepts exactly what the theme's own CSS export produces (one `[data-theme]` block, optionally a dark `@media` block) — anything else (an extra selector, `url()`, a comment) is rejected with an inline error and never touches the live theme. Theme names are also now sanitized to a safe charset as you type.
- 8b540c0: The Theme editor's "This site" saved-theme library is now real, host-persistable site data instead of an in-memory-only convenience. `Site` gains an optional `savedThemes` field; saving/deleting a named theme now flows through `Builder`'s `onChange` and local crash-recovery same as any other edit, so a theme an author starts (e.g. a "Christmas" theme built months ahead) survives a reload and round-trips through a host's own persistence — same as the rest of the site. The shipped `THEME_PRESETS` starting points are unaffected.

### Patch Changes

- 8b540c0: The Navigator tree's root row now reads "Site root" in Layout mode instead of its bare tag name (e.g. "div") — the frame root has no useful ancestor context to hint at what it is, unlike a page root which already carries an explicit "Page" label.
- Updated dependencies [8b540c0]
- Updated dependencies [8b540c0]
  - @wizeworks/silicaui-html@0.16.0
  - @wizeworks/silicaui-panels@0.16.0
  - @wizeworks/silicaui@0.16.0

## 0.15.0

### Minor Changes

- de20e1b: Add `<Builder onActivePageChange>` — fires on mount and whenever the active page's identity (switch, rename, slug edit) changes, with `{id, name, slug}`. Lets a host key its own page-scoped UI (e.g. an SEO/metadata drawer rendered via `toolbarSlot`) to whichever page the author has open, without adding any domain fields to the `Page` schema itself.

### Patch Changes

- @wizeworks/silicaui@0.15.0
- @wizeworks/silicaui-html@0.15.0

## 0.14.0

### Minor Changes

- aa589af: `DataBinding`'s `value` kind gains an optional `attr?: string`. When set, `resolveTree`'s `fillValue` writes the resolved value onto exactly that attribute (element) or prop (component) — e.g. a product card's own `<a>` binding `href` — instead of relying on the auto-detected primary slot (which only ever covered `img`/`source`→`src`, `input`→`value`, and a component's `label`/`text`/`src`). Omitting `attr` keeps today's auto-detection unchanged.

  The site builder's Inspector gains a "Target attribute" field on `value` bindings, next to the existing kind/reference picker, following the same pattern as the `action` kind's "Fallback href".

### Patch Changes

- Updated dependencies [aa589af]
  - @wizeworks/silicaui-html@0.14.0
  - @wizeworks/silicaui@0.14.0

## 0.13.0

### Patch Changes

- @wizeworks/silicaui@0.13.0
- @wizeworks/silicaui-html@0.13.0

## 0.12.0

### Minor Changes

- 9c716c3: Fix `resolveTree`'s data-fill for form controls: a bound value on an `<input>` now sets its `value` attribute instead of its children, which `toHtml` silently drops for void elements (the bound value previously vanished from the rendered output with no error).

  Add `<Builder toolbarSlot>` — a header extension point (rendered next to Publish) for host-owned UI like a save-status badge, since the builder itself has no way to know whether a host's own persistence succeeded, failed, or is pending. Also widen `<Builder document>` to accept `Document | Site` directly (the `Editor` already did), dropping a cast some hosts needed.

### Patch Changes

- Updated dependencies [9c716c3]
  - @wizeworks/silicaui-html@0.12.0
  - @wizeworks/silicaui@0.12.0

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

### Patch Changes

- Updated dependencies [970bb4b]
  - @wizeworks/silicaui@0.11.0
  - @wizeworks/silicaui-html@0.11.0

## 0.10.1

### Patch Changes

- 7e6966e: Fix `@wizeworks/silicaui-builder` being non-consumable: it imports `@wizeworks/silicaui-react` at runtime (Toolbar, Button, Select, TreeView, etc. from `/react` and `/email/react`) but never declared it as a dependency, so a fresh install left that import unresolved. It's now a peer dependency, matching the other component-wrapping packages.

  The MCP package catalog also still listed `silicaui-builder` as `private: true` / `install: null` from before it became a publicly installable package — corrected to a real install command and current version.

  - @wizeworks/silicaui@0.10.1
  - @wizeworks/silicaui-html@0.10.1

## 0.10.0

### Minor Changes

- 8e7b6ed: Add the builder host adapter seam (builder-contract.md §5): `<Builder host={...}>` now accepts `catalog` (Insert-palette merge), `dataSources` (a real binding picker via engine-owned `scopeAt`), `validateClass` (composes with a new non-optional built-in class-string floor), `inspectorPanels` (additive host panels writing through the shared mutation primitives), and `pickAsset` (a new asset-picker Inspector control).

  Add the data-resolution keystone: `resolveTree(tree, host, scope?)` in `@wizeworks/silicaui-html` — one synchronous walker resolving `value`/`collection` bindings (including nested repeats), directly usable by a host's own live-render path (`toHtml(resolveTree(root, host))`). The Inspector's Data binding panel gained a live "Preview" row using the same host resolvers.

  Fix: the raw-element/attribute security floor (`sanitizeElement`, closed tag+attribute whitelist) is now enforced unconditionally in both `toHtml` and the live editor canvas — the canvas previously had no sanitization at all, a more exploitable gap than the publish path since it's the builder's own browser session.

### Patch Changes

- Updated dependencies [8e7b6ed]
  - @wizeworks/silicaui-html@0.10.0
  - @wizeworks/silicaui@0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

### Patch Changes

- Updated dependencies [e8bd507]
  - @wizeworks/silicaui@0.9.0
  - @wizeworks/silicaui-html@0.9.0

## 0.8.0

### Minor Changes

- 494e058: Fill the site builder's Insert palette with the high-value components added to `silicaui-html` that were previously unreachable from the UI: overlay/modal family (Dialog, Drawer, AlertDialog, Popover, Tooltip, CommandPalette, PreviewCard), form composites and standalone inputs (checkbox/radio/toggle groups, date pickers, dropzone, combobox, autocomplete, multi-select, slider, rating, phone/search/password/pin inputs, calendar, and more), data/nav additions (TreeView, Wizard, Collapsible, stats, toolbar, dock, menubar, navigation-menu), media (Carousel, Lightbox, mockups, mask, diff), and layout/content/feedback rounding-out entries (hero, app-shell, scroll-area, prose, empty-state, meter, and more).

  Along the way, fixed a button-in-button nesting bug in the Dialog/Drawer/AlertDialog/Popover trigger and close macros, a Lightbox/Drawer/Dialog/CommandPalette canvas positioning bug that let a revealed overlay panel block the entire builder UI, a Wizard palette entry that inserted with an empty-placeholder instead of Back/Next buttons, and a React `defaultSelected` console warning on canvas-rendered `<option>` elements.

### Patch Changes

- @wizeworks/silicaui@0.8.0
- @wizeworks/silicaui-html@0.8.0

## 0.7.0

### Minor Changes

- 309e377: Complete the email editor's feature set to parity with the site builder (no longer a starter slice): real drag-and-drop (drag-from-palette + drag-to-reorder, extracted `shared/dnd`), nested column groups, dynamic column add/duplicate/remove with automatic width rebalancing, section background images (with an Outlook VML fallback), Social/Video/Custom-HTML block kinds, a rich-text formatting toolbar (bold/italic/link/list) on text blocks, brand-theme-aware default colors (`EmailBuilder`'s new `theme` prop resolves OKLCH tokens to hex for new inserts), local crash-recovery autosave (extracted a generic `shared/persistence` `DraftStore<T>` and `shared/react/RecoveryBanner`, now used by both editors), saved/reusable blocks, a real-HTML preview mode (an iframe rendering the actual projected `toEmailHtml` output, not the live-DOM approximation), and a host-delegated `onSendTest` hook with a built-in send dialog.

### Patch Changes

- @wizeworks/silicaui@0.7.0
- @wizeworks/silicaui-html@0.7.0

## 0.6.0

### Minor Changes

- 1735d12: Add a first email editor, a peer of the site builder (new `@wizeworks/silicaui-builder/email` + `/email/react` entry points): a closed node schema (body → section → columns/column → text/image/button/divider/spacer), an `EmailEditor` engine (insert/move/duplicate/undo-redo), a `toEmailHtml` projector that emits real table-based, fully inline-styled markup with Outlook MSO conditional fallbacks and mobile column-stacking, and an `EmailBuilder` React chrome (click-to-insert palette, a live-DOM-approximation canvas with inline text editing, and a per-block-kind Inspector). Extracted a shared `SelectionOverlay` (used by both editors' canvases) and added the email-related baked icons.

### Patch Changes

- @wizeworks/silicaui@0.6.0
- @wizeworks/silicaui-html@0.6.0

## 0.5.2

### Patch Changes

- a39ad19: Restructure `silicaui-builder`'s source tree to make room for an email editor alongside the existing site editor: editor-agnostic chrome (icon system, `Icon`, `ErrorBoundary`) moved to `src/shared/`, and the site editor's engine + React chrome moved to `src/site/`. The public API (`@wizeworks/silicaui-builder` and `@wizeworks/silicaui-builder/react`) is unchanged — internal move only, verified against the full e2e suite.
  - @wizeworks/silicaui@0.5.2
  - @wizeworks/silicaui-html@0.5.2

## 0.5.1

### Patch Changes

- Updated dependencies
  - @wizeworks/silicaui@0.5.1
  - @wizeworks/silicaui-html@0.5.1

## 0.5.0

### Patch Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

- Updated dependencies
  - @wizeworks/silicaui@0.5.0
  - @wizeworks/silicaui-html@0.5.0

## 0.4.0

### Patch Changes

- @wizeworks/silicaui@0.4.0
- @wizeworks/silicaui-html@0.4.0
