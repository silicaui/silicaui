---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
---

Remove named layouts and per-page frames — one shell per site again.

The feature was built without being asked for, and it expanded the schema in both
directions to pay for itself. This takes all of it back out.

**Gone from the shared schema (`@wizeworks/silicaui-html`):**

- `Site.frames` — the map of additional named shells
- `Page.frameId` — the tri-state (absent = default, `null` = bare, string = named)
- `Frame.name` — the label a named layout carried separately from its key
- the `frameFor` and `frameDiagnostic` exports

`Site.frame` stays and is the whole story: one shell, wrapping every page. A site
with no `frame` renders its pages bare. `renderPage` and `pageDocument` both read
that single field, so the canvas and the publish path still cannot disagree.

**Gone from the builder's op vocabulary:**

- `page.setFrame`, `frame.create`, `frame.rename`, `frame.delete`
- the optional `id` on a `{ scope: "frame" }` op target, which existed only to
  disambiguate which named layout an edit addressed

**Gone from `Editor`:** `setPageFrame`, `createLayout`, `renameLayout`,
`deleteLayout`, `editLayout`, `layouts`, `frameChoices`, `editingLayoutId`, and
`PageMeta.frameId`. `setFrameEditable` and `frameRoot()` remain, now reading
`Site.frame` directly.

**Chrome:** Layout mode still edits the site shell. The left rail names it
instead of offering a switcher, and the Pages panel no longer carries a per-page
layout picker.

**Compatibility.** A stored site carrying `frames` or `frameId` still loads — the
fields are simply ignored, and every page renders in `Site.frame`. A page that
was set to `frameId: null` (bare) or to a named layout will now render in the
site shell instead; nothing crashes, but that is a visible change for any such
page. A host that called the removed `Editor` methods or matched on the removed
op kinds must drop those call sites.
