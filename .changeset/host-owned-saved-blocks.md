---
"@wizeworks/silicaui-builder": minor
---

Email builder: a host can own the saved-block library.

**Feature.** `<EmailBuilder>` gains `savedBlocks` + `onSavedBlocksChange`, making
the Insert palette's Saved section a controlled collection. Supply it and the
library can be account-level and server-backed — following an author across
devices and sharable between them — instead of the browser-local `localStorage`
list it has been, which survives a reload but not a device or user change.

It is a controlled `value`/`onChange` pair rather than a `catalog()`-style read
plus separate save/rename/delete write hooks. Those would leave the builder
holding an optimistic shadow list with no defined reconciliation: a
server-assigned id, a rejected save, or a second author's concurrent edit would
each drift the palette away from the account with nothing to correct it. With the
host's persisted list rendered directly, all three reconcile by re-rendering. The
`change` argument (`save`/`rename`/`delete`) carries the author's intent, so a
host persists one row instead of diffing two arrays.

Two shapes fall out of the same pair: `savedBlocks` with no `onSavedBlocksChange`
is an insert-only curated library (Save/rename/delete are hidden, not inert), and
an empty `savedBlocks` array is a real empty account library — presence of the
prop, not its contents, transfers ownership.

`readLocalSavedBlocks()` / `clearLocalSavedBlocks()` are the one-time migration
seam, so blocks an author saved before the host took over aren't orphaned.

Fully backward compatible: omit both props and behavior is unchanged. Also fixes
a latent SSR warning — the store's server snapshot returned a fresh `[]` per
call, breaking `useSyncExternalStore`'s cached-snapshot invariant.
