---
"@wizeworks/silicaui-builder": minor
---

A `toolbarStatusSlot` on both builders — status chrome, distinct from the action slot.

`toolbarSlot` renders at ONE fixed position, immediately before Publish (Send test/Export
HTML, in email). A host with both kinds of header chrome therefore had to put them in one
place: a presence pill and a saved/unsaved badge landed between the engine's controls on
their left and the host's own buttons on their right, reading as a gap in a run of controls
rather than as state.

`toolbarStatusSlot` renders at the head of the right-hand cluster — after the spacer that
ends the engine's left-hand controls, before the shortcut hint and the light/dark toggle —
with no control beside it. `toolbarSlot` is unchanged and stays what it always was: actions,
grouped with Publish, in a stable order someone can build muscle memory for.

Two slots rather than one because status and actions want different placement rules, and a
single slot forces every host to render one of them in the wrong place. It also can't be
faked host-side: the header is a single flex container, so CSS `order` only sorts against
the whole set (`-1` lands left of the mode switcher, `1` lands right of Publish) — there is
no value that reaches mid-container. And a host that got close with `order` would move a
control visually without moving it in the DOM, so a keyboard user meets the theme toggle
before something that appears ahead of it (WCAG 2.4.3). A real slot puts status in the right
place in both orders at once, and because the content is non-interactive it adds no tab stop
at all. The remaining alternative — portalling into the engine's header DOM at a computed
index — breaks silently the first time that header's child order changes.

Same slot on `EmailBuilder`, in the same position for the same reasons.
