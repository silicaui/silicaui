# @wizeworks/silicaui-dnd

## 0.57.0

### Minor Changes

- 9accc71: The five opt-in packages, driven by an engineer who reads `package.json` before the README and measures everything he is told: five engines on one screen, a keyboard instead of a mouse, a wall screen and a phone

  Found by the P07 persona run — Hiroshi Tanabe, 41, data-platform engineer at a
  logistics analytics firm in Yokohama, whose users read the dashboard on a wall
  screen in a dark operations room all night and on a phone over a ship's satellite
  link. Ten acts, thirteen defects, all fixed.

  **"Kept out of core so it stays lean" is true again.** Everything Silica wrote
  across all five opt-in packages weighs **29.6 kB** in a real build — a
  `SortableList`, a `DataTable`, a `RichTextEditor`, a `Chart` and a
  `ResizablePanelGroup` together, for less than a third of what `react` alone costs
  — and their CSS adds 0.5 kB gzipped. The claim was true about the design and false
  about the artifact when this run opened: one `Button` cost 301 kB because
  `silicaui-react` shipped as a single pre-bundled file no consumer's bundler could
  tree-shake. Fixed in act 1; 538 kB of JavaScript became 234 kB.

  **A refresh moved the selection to a different ship and told the app it had
  not.** `DataTable` never set `getRowId`, so row selection was keyed by position in
  the array. A fleet feed that drops a berthed vessel out of the middle shifts every
  row after it — the tick then belonged to a row number, not a ship. And the
  `onSelectionChange` effect did not depend on `data`, so the caller went on holding
  the row objects it was handed before the refresh, with a delay figure the table
  itself no longer showed. Rows with an `id` are identified by it now; a new
  `getRowId` prop covers data whose identity is something else.

  **A shipping line was painted the colour of a critical delay.** An earlier fix in
  this run spread the chart palette across the whole hue wheel, which runs straight
  through the reds and the ambers where `success`, `warning` and `error` live — five
  degrees from the theme's own "this is critical" red. The palette now reads the
  reserved hues out of the theme and spreads over what is left, and dropped from
  eight colours to six, because eight across the remaining arc is 28 degrees apart
  and only three degrees above the bar. A seventh series repeating the first is the
  better failure: obviously wrong beats quietly confusable.

  **Twenty-seven controls wore the browser's focus ring instead of the system's.**
  `.rich-text-editor-btn` had no `:focus-visible` rule, so it fell back to
  `outline-style: auto` — a value nothing in this codebase authors. Sweeping all 116
  component pages found the same thing on 26 more, across 17 families: carousel
  arrows and dots, number-field steppers, power-search chips, the tree toggle, the
  dropzone, wizard steps, dock items, the sidebar trigger, chip removes, the outline
  link, the diff resizer, range, stack and wordmark. All 27 now draw the system's
  ring, in the theme's colour, at the system's width. (Chromium adapts its own ring,
  so these were visible — this is consistency, not an accessibility failure, and the
  issue says so.)

  **A `-content` colour you write yourself was never checked.** The engine measures
  the ink it derives for you and accepted without a glance the ink you picked by
  eye — which is the one more likely to be wrong. A hand-authored
  `--color-error-content` measured 3.22:1 on its own `--color-error`, on the badge
  that says a ship is in serious trouble. The theme plugin now measures every
  declared pair and names both the number and the way out: _"black measures 6.14:1
  here"_.

  **`SortableList` paints a row and a drag handle, and said so nowhere.** Following
  its README produced a bordered box inside a bordered box whose contents fell 258px
  short of a 467px row, and a hand-rolled grip with no focus ring — because
  `.sortable-handle` exists, is prefix-dependent, and was not mentioned in the
  README, the props table or the types. `ctx.handleProps` carries the handle's class
  now, a single wrapper fills its row, `itemClassName` reaches the `<li>`, and the
  README describes the component.

  **Reordering without a mouse announced the database key.** _"Draggable item
  v-santa-catarina was moved over droppable area v-5"_ was the entire feedback
  channel for someone who cannot see the list move. A new `getItemLabel` gives the
  announcements a name and a position: _"MV Santa Catarina do Sul Navegação Costeira
  moved to position 2 of 9."_ The grip itself went from 45% ink to 65% — 2.88:1 to
  5.31:1 in the light theme.

  **And the smaller ones.** The resize divider moved 10% of the screen per arrow
  press, leaving a keyboard user six positions in the whole range; it is 1% now, and 51. A numeric column could not put its header over its numbers — `meta.align`
  moves both. The sort control was 20px tall. The chart's tooltip ran off the edge
  of a 278px chart and took the series names with it; it is confined. The table now
  sets `aria-busy` while it loads, and its `sortable` doc describes what it actually
  does.

## 0.56.0

## 0.55.0

## 0.54.0

## 0.53.0

## 0.52.0

## 0.51.0

## 0.50.0

## 0.49.0

## 0.48.0

## 0.47.0

## 0.46.0

## 0.45.0

## 0.44.0

## 0.43.1

## 0.43.0

## 0.42.0

## 0.41.0

## 0.40.0

## 0.39.0

## 0.38.0

## 0.37.0

## 0.36.0

## 0.35.0

## 0.34.2

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.1

## 0.32.0

## 0.31.0

## 0.30.0

### Patch Changes

- a90b819: First-five-minutes hardening pass — four defects that shipped to npm and one
  latent projection bug, all in the surface a new adopter hits before anything
  else.

  **`<Checkbox>Run tests</Checkbox>` no longer crashes the page.** `Checkbox`,
  `Radio`, and `Toggle` now accept `children` as a caption, wrapping the control
  in a `<label>` so the text is a real click target. Previously the types
  permitted `children` (inherited from `React.InputHTMLAttributes`) while React
  threw _"input is a void element tag and must neither have `children`"_ at
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
  `silicaui-react` never compile — producing a _partial_ break (buttons and cards
  look right; dialog footers don't align, `Lightbox` has no size, `soft`/`glass`
  sit inert) that reads like a library bug rather than a one-line config gap.
  This affected every consumer, not just monorepos.

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

## 0.10.1

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

## 0.5.0

## 0.4.0
