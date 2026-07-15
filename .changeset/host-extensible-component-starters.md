---
"@wizeworks/silicaui-builder": minor
---

Host-extensible New-component starter picker — a host can now contribute its own base composites (e.g. a product card) as starters authors begin an editable component from.

- `componentStarterGroups(opts?)` accepts `{ catalogExtend?, starters? }`. A host's `catalog().extend` groups **auto-surface** as starter groups with their `key` + `label` preserved verbatim (a "Commerce" Insert group becomes a "Commerce" starter group — no second declaration).
- New optional `BuilderHost.componentStarters?(): { extend?, hide? }` curates on top: `extend` merges by group key, `hide` prunes item **or** whole group keys (defaults included, applied last so it wins).
- Boundary preserved by construction: only `catalog().extend` (editable node-trees) auto-surfaces — `hostComponents()` (locked/opaque `HostNode`s, prop-config only) never becomes a starter. "Exposed for editing" is the schema-block/starter path, not the host-node path.
- `NewComponentButton` reads the host adapter via `useHost()`; `componentStarterGroups` and the `StarterGroup` / `StarterContribution` / `StarterOptions` types are exported from the builder's React entry.
