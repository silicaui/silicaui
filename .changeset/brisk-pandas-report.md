---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-charts": minor
"@wizeworks/silicaui-table": minor
"@wizeworks/silicaui-dnd": minor
"@wizeworks/silicaui-panels": patch
---

The five opt-in packages, driven by an engineer who reads `package.json` before the README and measures everything he is told: five engines on one screen, a keyboard instead of a mouse, a wall screen and a phone

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
declared pair and names both the number and the way out: *"black measures 6.14:1
here"*.

**`SortableList` paints a row and a drag handle, and said so nowhere.** Following
its README produced a bordered box inside a bordered box whose contents fell 258px
short of a 467px row, and a hand-rolled grip with no focus ring — because
`.sortable-handle` exists, is prefix-dependent, and was not mentioned in the
README, the props table or the types. `ctx.handleProps` carries the handle's class
now, a single wrapper fills its row, `itemClassName` reaches the `<li>`, and the
README describes the component.

**Reordering without a mouse announced the database key.** *"Draggable item
v-santa-catarina was moved over droppable area v-5"* was the entire feedback
channel for someone who cannot see the list move. A new `getItemLabel` gives the
announcements a name and a position: *"MV Santa Catarina do Sul Navegação Costeira
moved to position 2 of 9."* The grip itself went from 45% ink to 65% — 2.88:1 to
5.31:1 in the light theme.

**And the smaller ones.** The resize divider moved 10% of the screen per arrow
press, leaving a keyboard user six positions in the whole range; it is 1% now, and
51. A numeric column could not put its header over its numbers — `meta.align`
moves both. The sort control was 20px tall. The chart's tooltip ran off the edge
of a 278px chart and took the series names with it; it is confined. The table now
sets `aria-busy` while it loads, and its `sortable` doc describes what it actually
does.
