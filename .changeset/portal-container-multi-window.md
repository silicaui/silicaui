---
"@wizeworks/silicaui-react": minor
---

Add `PortalContainerProvider` / `usePortalContainer` for multi-window apps.

Every portalled surface (DropdownMenu, ContextMenu, Menubar, Select, Combobox,
MultiSelect, Autocomplete, DatePicker, Dialog, AlertDialog, Drawer, Lightbox,
CommandPalette, NavigationMenu, Popover, PreviewCard, Tooltip, Toast) now
resolves its portal container from the new context before falling back to Base
UI's default `document.body`. Apps that render part of their React tree into a
second browser window (`window.open` + `createPortal` popouts) wrap that
subtree in `<PortalContainerProvider container={childDocument.body}>` so menus,
dialogs, and toasts opened there appear in the window that triggered them
instead of the opener. No provider — or `container={null}` — keeps today's
behaviour exactly.

The container is any `HTMLElement`, not only a document body, so the same
provider scopes portalled surfaces to an in-page region — a pane, workspace, or
module shell. A dialog portalled into that element resolves its `--color-*`
against the region's `[data-theme]` island, so a scoped surface inherits the
region's palette without per-instance styling. Note the container must not
establish a containing block for fixed positioning (`transform`, `filter`,
`contain`, `backdrop-filter`) or clip with `overflow: hidden`, or the centered
popup will position against the region instead of the viewport, or be cut off.
