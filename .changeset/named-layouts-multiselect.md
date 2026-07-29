---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
---

Named layouts and multi-select — the two follow-ups left open from the host-seam batch.

**Named layouts.** `Site.frames` was already resolvable and page-selectable; now it's
authorable. Layout mode gets a switcher (`LayoutsPanel`) to create, rename, delete and
switch which shell it edits, `Frame.name` carries the label separately from the key so a
rename can't break the `Page.frameId`s pointing at it, and `OpTarget` for `frame` gained
an optional `id`. That last one is load-bearing: without it an edit to a named layout
emitted ops a peer applied to the DEFAULT shell, silently rewriting the wrong tree on
every other client. New ops `frame.create` / `frame.rename` / `frame.delete`, all
invertible; deleting a layout returns its pages to the site default rather than to
`null`, and the delete op carries the reassigned page ids so undo can put them back.

Fixes a real bug this surfaced: `useActiveRoot` resolved the frame case from
`doc.frame` — the layout of the ACTIVE PAGE — which stopped meaning "the layout being
edited" as soon as a site could have more than one. Layout mode rendered, and let you
click, a tree the Inspector wasn't writing to.

**Multi-select.** `Editor.selectedIds` is the full selection with `selection` as its
primary (the last added), plus `selectMany` / `toggleSelect`. Shift/Cmd-click on the
canvas toggles membership, `Cmd+A` selects every SIBLING — the level the author is
looking at, rather than a flat set whose members are each other's ancestors — and the
Inspector's Design controls write to the whole set while reading the primary, with a
header saying so. Set-aware commands (`removeMany`, `duplicateMany`,
`setClassTokenMany`, `selectSiblings`) run inside one `batch`, so a six-node gesture is
one undo step. Removing one member of a selection now prunes just that member instead of
replacing the whole set with its parent.

The Navigator stays single-select: `TreeView` has a single-id selection API, and
widening it is a silicaui component change rather than a builder one.
