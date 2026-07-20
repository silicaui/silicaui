---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-charts": patch
"@wizeworks/silicaui-table": patch
"@wizeworks/silicaui-editor": patch
"@wizeworks/silicaui-dnd": patch
"@wizeworks/silicaui-panels": patch
---

First-five-minutes hardening pass — four defects that shipped to npm and one
latent projection bug, all in the surface a new adopter hits before anything
else.

**`<Checkbox>Run tests</Checkbox>` no longer crashes the page.** `Checkbox`,
`Radio`, and `Toggle` now accept `children` as a caption, wrapping the control
in a `<label>` so the text is a real click target. Previously the types
permitted `children` (inherited from `React.InputHTMLAttributes`) while React
threw *"input is a void element tag and must neither have `children`"* at
runtime — a type-checks-clean white screen. Passing no children is unchanged,
so pairing with your own `<label htmlFor>` still works exactly as before.

**The four components where a caption is meaningless now reject `children` at
the type level** — `Input`, `FileInput`, `PasswordInput`, `SearchInput`. The
last two were the sneakiest: their root JSX is a `<div>`, so the mistake looked
safe while `{...rest}` landed the `children` on the inner `<input>` anyway.

**Five packages were missing their `'use client'` directive.**
`@wizeworks/silicaui-charts`, `-table`, `-editor`, `-dnd`, and `-panels` all use
hooks but shipped without the directive, so importing any of them from a
Next.js App Router page threw. The prepend logic is now one shared build helper
instead of being re-derived per package, and a new `verify:packaging` CI step
asserts the directive is present in every client bundle — and absent from
`silicaui-react/server`, whose entire purpose is being server-safe.

**`peerDependenciesMeta` no longer dangles.** `@wizeworks/silicaui-react`
declared `@wizeworks/silicaui` as an optional peer with no matching
`peerDependencies` entry, which npm and pnpm both accept silently — so the
intended "you're missing the CSS package" warning never fired. The same CI step
now catches this class of no-op.

**`CheckboxOption` / `RadioOption` rendered an unstyled native control in
static output.** The expansion routed the node's class to the wrapping
`<label>`, leaving the actual `<input>` with no `.checkbox` / `.radio` class at
all. The control class now stays on the input, and `Checkbox` / `Radio` /
`Toggle` in `silicaui-html` gained the same optional caption as their React
counterparts — so both layers now emit byte-identical markup for identical
authoring. `Toggle` also picked up the `role="switch"` that React already had.

**New `.label-control` class** for a label that wraps its own control: the whole
row is the click target, and the caption gets real ink rather than the muted
field-caption color `.label` uses, since it's text meant to be read.

### Documentation

The `@source` directive is now documented in both READMEs. Tailwind v4 never
scans `node_modules`, so without it the plain utilities used inside
`silicaui-react` never compile — producing a *partial* break (buttons and cards
look right; dialog footers don't align, `Lightbox` has no size, `soft`/`glass`
sit inert) that reads like a library bug rather than a one-line config gap.
This affected every consumer, not just monorepos.
