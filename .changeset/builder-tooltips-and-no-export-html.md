---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-react": minor
---

Every button in both builders says what it does on hover; the email builder's Export HTML button is gone

### Export HTML is removed (BREAKING — a minor, since SilicaUI is pre-1.0)

The email builder shipped an **Export HTML** toolbar button that did two things: triggered a
client-side `Blob` download of the projected markup, and called an optional `onExport` prop with the
same string. Both are gone, along with the `onExport` prop.

Projecting a document is the HOST's job, not a button in the chrome. A host already owns the send
path, the storage, and the filename; the builder handing the browser a `subject-slug.html` download
was a fourth, uncoordinated answer to a question the host had already answered. The projector itself
is untouched and still public:

```ts
import { toEmailHtml } from "@wizeworks/silicaui-builder/email";
const html = toEmailHtml(doc, { resolver: host, frame });
```

That is the same one projector Preview and Send test use, so nothing about the output changes.

**Migrating from `onExport`:** render your own action in `toolbarSlot` and call `toEmailHtml`
yourself. The prop only ever fired on that button's click, so there is no other behaviour to
replace. The site builder had no export or import button and is unaffected — `Publish` is its
terminal action and stays.

There was never an Import HTML anywhere in either builder. (The site Theme editor's paste-CSS →
**Apply** flow imports *theme CSS*, not document HTML, and is deliberately untouched.)

### Tooltips on every chrome button

Roughly thirty icon-only buttons across both builders had no hover help at all, and every other
button relied on the native `title` attribute — which has an unconfigurable ~1s delay, no styling,
no theme, no touch support, and is announced inconsistently by screen readers (often twice, once as
the name and once as the description). Icon-only controls in a dense tool UI are exactly the case a
real tooltip exists for.

New shared primitives in the builder — `Hint`, `IconButton`, `BuilderTooltipProvider` — replace
every `title` on a control. Three rules they enforce that a per-call-site `<Tooltip>` would not:

- **One string, both consumers.** `IconButton` takes one `label` and emits both the tooltip and the
  `aria-label`, so they can't drift. Several swatch grids were empty `<button>`s carrying only a
  `title` — no accessible name at all — and now have real ones.
- **Themed.** Base UI portals the popup to `document.body`, outside the chrome's `[data-theme]`
  island, where `--color-*` resolves against nothing. `Hint` re-stamps the studio theme, the same
  fix `DialogContent` and `Select`'s `popupProps` already use. `StudioThemeProvider` moved to
  `shared/react/` and is now mounted in the email shell too (it was site-only, and the email builder
  hand-threaded `studioTheme` as a prop through each panel).
- **Disabled controls still explain themselves.** "Why can't I click this" is the hover people
  actually make, and it's the one Base UI drops by default since a disabled `<button>` emits no
  pointer events. Disabled buttons now carry their reason: *A row holds at most 6 columns*, *This
  block is locked by the host*, *Publishing isn't available here — this editor's host hasn't wired
  it up*.

Tooltips add the CONSEQUENCE rather than repeating a visible label — "Delete component" gets *every
instance is unlinked into a real copy*; a value chip that already reads "Bold" gets nothing, because
a popup echoing the word on the button is noise.

Two accessible names changed, both improvements: the rich-text toolbar's buttons are named `Bold` /
`Italic` (the shortcut moved to its own tooltip line, out of the accessible name), and swatches are
named for what they set (`Medium corners`, `Base 200`) instead of carrying a bare `title`.

### silicaui-react

- `Tooltip` gains **`popupProps`** — the escape hatch `Select` and `Combobox` already had, for
  re-stamping a theme on the portalled popup.
- `DialogTrigger` **forwards its props** to Base UI's trigger instead of dropping everything but
  `children`, and accepts `nativeButton`. A trigger wrapper that silently swallows props is
  indistinguishable from a broken dialog at the call site: nothing errors, the button just stops
  opening anything.

### Verified

A new `tooltips` e2e spec asserts the parts that regress silently: that the popup is themed
(`data-theme="studio"`), that no `title` survives beside it (both would show, staggered), that a
disabled button still opens one, that an unlabelled swatch has an accessible name — and that neither
builder has an Export or Import button. Full builder suite: 199 passing.

One trap worth recording, since it cost a full red suite: **two Base UI triggers cannot render the
same element.** A tooltip trigger nested with a dialog trigger clones the child twice and the second
clobbers the first's ref, so the dialog stops opening with no error anywhere. Where both are needed,
the tooltip owns a wrapper `<span>` and the dialog owns the real button.
