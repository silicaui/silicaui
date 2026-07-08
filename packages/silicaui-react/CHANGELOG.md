# @wizeworks/silicaui-react

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
