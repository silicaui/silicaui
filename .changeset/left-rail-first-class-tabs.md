---
"@wizeworks/silicaui-builder": patch
---

Layers and Insert are first-class tabs at the top of the left rail — in both the
site and the email builder.

They were a small segmented pill group sitting under whatever the rail's real
header happened to be (Pages, Layout, Components, Templates), which said the
switcher outranked them and made the two most-used destinations in the editor
look like a filter on a panel. They now use the same `PanelTabs` strip the
Inspector uses on the right: an underline tab list that IS the rail's header, at
the same 40px row on both sides of the app. First-level navigation is a tab, not
a pill — the rule the Inspector already followed, now applied to the other rail.

The switcher above them moves INSIDE the Layers tab, where it belongs: Pages,
Layouts, Components and email Templates all choose which tree the layers show, so
they are a child of that tab rather than a fixture that outranks both. The Insert
palette gets the full height of the rail as a result. The layer-depth toggle
follows its tab, off the end of the strip, via a new `actions` slot on
`PanelTabs`; a `testIdPrefix` prop keeps the two strips' test ids distinct
(`left-tab-*` vs `inspector-tab-*`).

In Component mode with nothing open there is still nothing to insert into, so
only Layers is offered and an author who left Insert open falls back to it rather
than landing on a dead panel.

E2E specs that reached these by `getByRole("button", { name: "Layers" })` now use
`getByRole("tab", …)`, which is what the strip actually exposes.
