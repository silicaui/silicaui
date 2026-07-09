# @wizeworks/silicaui-builder

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
