---
"@wizeworks/silicaui-builder": patch
---

The canvas drop indicator is a target you can aim at, on both builders.

It was a 2px accent bar spliced in between the hovered node's siblings. Three
problems, in ascending order of how much they cost:

**It read as a hairline.** A 2px rule states the seam exactly and tells the
author nothing about how much slack surrounds it, so a drop felt like threading a
needle even though the hit band was always half the node (or a 24px end band on a
container). The marker is now a 22px accent zone with a solid bar and end caps,
centered on the edge the node will land at and spanning the node it belongs to —
the size of the affordance now matches the size of the target.

**It was drawn on the wrong axis.** `computeEdge` read `clientY` unconditionally.
That is right for a stack and meaningless in a flex row, where the entire top
half of every sibling meant "before", the pointer's horizontal position — the
only thing the author is aiming with — was discarded, and the indicator was a
horizontal rule between two side-by-side cards, pointing at nothing. A new
`siblingAxis` reads the target's real DOM neighbours (the parent's
`flex-direction`, else a measured comparison against an actual sibling), so a
row is aimed at horizontally and drawn with a vertical bar. Email columns and
the site's flex/grid rows both get this.

**In a flex row it fought the pointer.** A marker spliced between two children of
a flex container is itself a flex item, so it claims a share of the container's
`gap`: the very node being aimed at slid out from under the cursor, the pointer
landed on the container, the drop re-resolved to INSIDE and the marker vanished —
with the author holding still. (Measured on the seeded hero's CTA row: the marker
appeared at the target's left edge and was gone 4px later. In a grid container it
was worse — the marker ate a whole cell.) It is now drawn as a measured overlay
over the board, the same way `SelectionOverlay` draws the selection ring, so a
pending drop costs the layout nothing and what you are aiming at never moves.

`renderChildren` no longer interleaves anything, and `RenderCtx.lineGap` is gone
from both canvases. `e2e/drop-target.spec.ts` covers all of it, including walking
the pointer across the row seam that used to lose the drop.
