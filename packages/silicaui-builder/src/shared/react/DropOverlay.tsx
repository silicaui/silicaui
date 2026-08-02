/**
 * The canvas drop indicator, shared by both builders (site `Canvas.tsx` and email
 * `Canvas.tsx`) so a tweak to one applies to both instead of the two drifting.
 *
 * WHY IT'S AN OVERLAY. The obvious implementation — splice a marker element in
 * between the target's siblings — cannot be made to work, and the failure is not
 * cosmetic. A marker between two children of a flex row is itself a flex ITEM, so
 * it claims a share of the container's `gap`: the very node the author is pointing
 * at slides out from under the cursor, the pointer lands on the container instead,
 * the drop re-resolves to INSIDE, and the marker disappears — all without the
 * author moving the mouse. (Measured on the seeded hero's button row: the marker
 * showed at the target's left edge and vanished 4px later.) A grid container is
 * worse, where the marker eats a whole cell. Measured over the board — the same
 * thing `SelectionOverlay` does for the selection ring — it costs the layout
 * nothing, so what the author is aiming at never moves.
 *
 * WHY IT'S A ZONE, NOT A RULE. A 2px line states the seam precisely and says
 * nothing about how much slack there is around it, so a drop feels like threading
 * a needle. The tinted band is the affordance; the bar and its end caps say
 * exactly where the node lands inside it.
 *
 * `axis` is the direction the target's SIBLINGS flow (see `siblingAxis`), so a
 * stack gets a horizontal bar and a flex row a vertical one — a horizontal rule
 * dropped between two side-by-side cards points at nothing.
 */
import * as React from "react";
import type { Axis, DropEdge } from "../dnd";

export interface DropHint {
  /** The node the pointer is over — the marker draws on one of ITS edges. */
  targetId: string;
  edge: DropEdge;
  axis: Axis;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Band thickness, and how far the band overhangs the target's cross-axis ends —
 *  enough to read as "spanning this node" rather than "clipped to it". */
const THICK = 22;
const OVERHANG = 4;

/** The end cap. `bg-base-100` (not white) so it stays a hole punched in the bar
 *  inside a `data-theme` island, where the surface underneath is dark. */
const CAP = "size-2.5 shrink-0 rounded-full border-2 border-accent bg-base-100";

export function DropOverlay({
  boardRef,
  hint,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  /** Absent, or `edge: "inside"` — nothing to draw. INSIDE is shown by the
   *  container's own dashed ring, which already tracks the container's shape. */
  hint: DropHint | undefined;
}) {
  const [box, setBox] = React.useState<Box | null>(null);
  const targetId = hint?.targetId;
  const edge = hint?.edge;
  const axis = hint?.axis;

  React.useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board || !targetId || !edge || edge === "inside" || !axis) {
      setBox(null);
      return;
    }
    const el = board.querySelector<HTMLElement>(`[data-sui-id="${CSS.escape(targetId)}"]`);
    if (!el) {
      setBox(null);
      return;
    }
    // Rect diff is scroll-agnostic (both shift together) and the overlay lives
    // inside the board, so it scrolls with the content. Subtract the board's own
    // border widths: they're in its bounding rect but not in an absolutely
    // positioned child's coordinate space. Same correction `SelectionOverlay`
    // makes, for the same reason.
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const top = r.top - b.top - board.clientTop;
    const left = r.left - b.left - board.clientLeft;
    if (axis === "y") {
      const at = edge === "before" ? top : top + r.height;
      setBox({ top: at - THICK / 2, left: left - OVERHANG, width: Math.max(r.width, THICK) + OVERHANG * 2, height: THICK });
    } else {
      const at = edge === "before" ? left : left + r.width;
      setBox({ left: at - THICK / 2, top: top - OVERHANG, height: Math.max(r.height, THICK) + OVERHANG * 2, width: THICK });
    }
  }, [boardRef, targetId, edge, axis]);

  if (!box || !axis) return null;
  const horizontal = axis === "y";
  return (
    <div
      className={`pointer-events-none absolute z-30 flex items-center rounded-full bg-accent/25 ${
        horizontal ? "flex-row" : "flex-col"
      }`}
      style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
      data-testid="drop-marker"
      data-drop-axis={axis}
      aria-hidden
    >
      <span className={CAP} />
      <span className={horizontal ? "h-1 flex-1 bg-accent" : "w-1 flex-1 bg-accent"} />
      <span className={CAP} />
    </div>
  );
}
