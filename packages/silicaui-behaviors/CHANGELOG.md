# silicaui-behaviors

## 1.1.1

### Patch Changes

- d8f6911: Align every Silica UI package on one version number, including the not-yet-released builder. The whole family now versions in lockstep (a single fixed changesets group) so this drift can't recur.

## 1.1.0

### Minor Changes

- 8b9ff8e: Add three new components — `Wordmark` (brand logotype), `SelectionList` (single-/multi-select list), and a persistent collapsible `Sidebar` (`SidebarProvider`/`Sidebar`/`SidebarHeader`/`SidebarContent`/`SidebarFooter`/`SidebarGroup`/`SidebarItem`/`SidebarTrigger`) — across the CSS plugin, React wrappers, the `silicaui-html` component registry, and the `silicaui-behaviors` vanilla runtime (new `sidebar` and `selection-list` behavior types). Wired into the site builder's insert palette and Inspector, and into the MCP catalog.
