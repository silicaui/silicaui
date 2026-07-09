---
"@wizeworks/silicaui-builder": minor
---

Fill the site builder's Insert palette with the high-value components added to `silicaui-html` that were previously unreachable from the UI: overlay/modal family (Dialog, Drawer, AlertDialog, Popover, Tooltip, CommandPalette, PreviewCard), form composites and standalone inputs (checkbox/radio/toggle groups, date pickers, dropzone, combobox, autocomplete, multi-select, slider, rating, phone/search/password/pin inputs, calendar, and more), data/nav additions (TreeView, Wizard, Collapsible, stats, toolbar, dock, menubar, navigation-menu), media (Carousel, Lightbox, mockups, mask, diff), and layout/content/feedback rounding-out entries (hero, app-shell, scroll-area, prose, empty-state, meter, and more).

Along the way, fixed a button-in-button nesting bug in the Dialog/Drawer/AlertDialog/Popover trigger and close macros, a Lightbox/Drawer/Dialog/CommandPalette canvas positioning bug that let a revealed overlay panel block the entire builder UI, a Wizard palette entry that inserted with an empty-placeholder instead of Back/Next buttons, and a React `defaultSelected` console warning on canvas-rendered `<option>` elements.
