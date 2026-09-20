# 092 — Twenty-seven controls wore the browser's focus ring instead of the design system's

**Status:** fixed
**Severity:** medium
**Found by:** P07 · Hiroshi Tanabe · act 7, five engines on one screen
**Surface:** `@wizeworks/silicaui` — 17 component families, and `@wizeworks/silicaui-editor`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 7 asks one question: put all five opt-in engines on one screen and find every
seam where one of them betrays itself. Tabbing across the dashboard, the focus
ring changed:

```
core     button   outline 2px solid oklch(0.95 0.008 250)  offset 2px
dnd      span     outline 2px solid oklch(0.7 0.14 245)    offset 2px
table    input    outline 2px solid oklch(0.7 0.14 245)    offset 2px
panels   div      outline 2px solid oklch(0.7 0.14 245)    offset -2px
editor   button   outline 1px auto  rgb(16, 16, 16)        offset 0px
```

Four of the five draw the system's ring. The editor's toolbar draws **`1px auto
rgb(16, 16, 16)`** — `outline-style: auto` is a value nothing in this codebase
authors. It only comes from the user-agent stylesheet, which means the component
drew no ring and the browser filled one in.

`.rich-text-editor-btn` has no `:focus-visible` rule. Forty-four other component
files do.

## That was not one component

`outline-style: auto` is an exact tell, so it can be swept for. A probe opened
**all 116 component pages** on the docs site, focused every focusable element in
the demo column, and compared the element, its ancestors and its descendants
unfocused against focused:

```
17 page(s), 27 distinct focusable element(s) with no focus signal of their own
```

| component | controls |
| --- | --- |
| carousel | `-control` (prev/next), `-dot`, `-number` |
| number-field | `-button` (increment/decrement), `-input` |
| power-search | `-chip-trigger`, `-chip-remove`, `-add` |
| tree-view | `-toggle` |
| dropzone / file-upload | `-input` |
| wizard | `-step` |
| dock | `-item` |
| sidebar / app-shell | `-trigger` |
| multi-select | `-chip-remove` |
| tag-input | `-remove` |
| outline | `-link` |
| diff | `-resizer` |
| range | the input |
| stack | the stack |
| wordmark | as a link |

## I was wrong about why this matters, and the correction is the point

The fix's first comment said the browser's ring "on a dark theme is black on
black and simply is not there." **That is false, and I only found out because I
went and looked at it** rather than filing the claim:

Chromium adapts its default ring — **white on a dark surface, black on a light
one.** Screenshotted on both themes before this issue was written. So none of
these 27 controls were invisible, and this is not an accessibility failure.

What it actually is:

- **1px where this system's ring is 2px**, with no offset where this system has
  one.
- **A colour that ignores the theme.** Every other ring on the page is
  `--color-primary`; these are black or white, whatever the browser decides.
- **A shape the browser chooses, not the system.** Everything above was measured
  in Chromium, which is the only engine this run opened; a UA ring is by
  definition whatever each browser decides, so it is not the same ring
  everywhere, and the design system's is. **The other engines were not
  measured** and no number is claimed for them.

On a screen already carrying five engines, focus is the last thing that should
change appearance depending on which control a person is standing on. That is a
`design` defect, which is exactly what act 7 exists to collect — and it is worth
saying plainly that it is that and not more.

## Where it lives

[packages/silicaui/src/components/](../../../packages/silicaui/src/components/) — carousel, stack, number-field, dock, diff, range, multi-select, outline, power-search, sidebar, tag-input, tree-view, dropzone, wizard, wordmark, rich-text-editor

## The fix

Each of the 17 families gained the system's own ring, with a note naming the
sweep:

```js
outline: "var(--focus-width, 2px) solid var(--color-primary)",
outlineOffset: "var(--focus-offset, 2px)",
```

Three shapes rather than one, for reasons that already existed in the system:

- **The standard ring, offset +2**, for anything with room around it.
- **Inset, offset -2**, for a control packed against its neighbours — a dock
  item, a wizard step, a number-field button, the diff resizer. The resize
  handle in `silicaui-panels` already insets its ring for the same reason.
- **On the parent, via `:has()`**, where the focusable element is not the thing a
  person sees: the dropzone rings its whole surface when its file input takes
  focus, and the input's own ring is then suppressed so there is one ring and not
  two. The editor's content area rings on `:focus-within` — scoped to the content,
  not the frame, because a frame-level `:focus-within` would also fire for every
  toolbar button and ring the editor twice.

## Confirmed by

The same sweep, over the same 116 pages, after:

```
116 component pages to open
control: .btn flagged? no

opened 116 pages, 0 would not load (not measured)
0 page(s), 0 distinct focusable element(s) with no focus signal of their own
```

**27 to 0**, and `.btn` — a control known to ring correctly — stays unflagged
throughout, which is what says the sweep is still looking.

On the Kaihō dashboard itself:

```
core     button   outline 2px solid oklch(0.95 0.008 250)  offset 2px
dnd      span     outline 2px solid oklch(0.7 0.14 245)    offset 2px
table    input    outline 2px solid oklch(0.7 0.14 245)    offset 2px
panels   div      outline 2px solid oklch(0.7 0.14 245)    offset -2px
editor   button   outline 2px solid oklch(0.7 0.14 245)    offset -1px
✓ no engine falls back to the browser's own focus ring
✓ every ring is at least 2px
✓ every ring is a theme colour, not a hardcoded one
```

`.btn`'s ring stays `base-content` on purpose and is not a seam: the rule is
`var(--btn-accent, var(--color-base-content))`, so the ring takes the button's
own role colour — a primary ring on a primary button would be invisible.

## Four versions of this sweep measured nothing

This probe was wrong four times before it was right, and every wrong version
produced a confident number:

1. **It scraped `/docs/components/` for links.** That page 404s. It found **0
   pages** and reported **0 problems** — a clean bill of health from a run that
   opened nothing. The slug list now comes from the catalog the site is generated
   from.
2. **It counted the documentation's own "show the code" `<summary>`** once per
   page and reported **108 pages with a finding** — one element wearing 116 hats.
3. **It called anything without an `outline` or a `box-shadow` unringed.** A
   component may signal focus with a background, a border or an ink change, and
   several do. It now snapshots ten properties unfocused and focused and reports
   only when nothing moves.
4. **It looked only at the element and its ancestors.** `li.tree-item:focus-visible
   > .tree-node` puts the ring on a CHILD, deliberately, because the item is a
   nested subtree — so the tree was reported as unringed when it is one of the
   components that gets this exactly right. Descendants are in the chain now.

Each version's number — 0, 108, 34, 29 — looked like an answer. The one that is
an answer is 27, and it has a control.

## Rating effect

Touches 17 component families in [rating.md](../rating.md); scored with P07's
screens.
