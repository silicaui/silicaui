/**
 * The selection chrome shared by both editors' canvases — drawn OVER the canvas,
 * not baked into the node's classes. It mimics silicaui's own focus ring (same
 * `--focus-width`/`--focus-offset` gap, same accent color) rather than an
 * invented style, and matches the selected node's own corner radius so a
 * rounded card gets a rounded ring. No corner handles: the builder doesn't
 * support drag-resize, so we don't draw an affordance for it. It measures the
 * selected node's real rect (relative to the scrolling board, found via
 * `[data-sui-id="<selectedId>"]`) and re-measures on any edit / device / resize,
 * so it tracks reflow. Pointer-inert, so it never eats clicks meant for a node.
 */
import * as React from "react";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SelectionOverlay({
  boardRef,
  selectedId,
  label,
  version,
  color,
  labelInk,
  dashed = false,
  z = 20,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  selectedId: string | undefined;
  label: string | undefined;
  /** Any value that changes when the board's content changes — triggers a re-measure. */
  version: unknown;
  /**
   * Ring + label color. Defaults to the theme's `primary` — the LOCAL selection,
   * which is the only ring that belongs to the design system.
   *
   * A PEER's ring passes an explicit identity color instead, and that is not a
   * lapse in the token rule: a peer painted from the theme disappears into a
   * document built on that theme, and two peers from an eight-role palette
   * collide. See `site/peers.ts`.
   */
  color?: string;
  /** Ink for the label, when `color` is set. Measured by the caller. */
  labelInk?: string;
  /** Dashed ring — a peer's selection, so it never reads as your own. */
  dashed?: boolean;
  /** Stacking order. Peers sit UNDER the local ring: when you and someone else
   *  are on the same node, yours is the one that must stay readable. */
  z?: number;
}) {
  const [box, setBox] = React.useState<Box | null>(null);
  // The selected node's own corner radius, so the ring rounds the same way the
  // element itself does — read fresh on every measure since it can change (e.g.
  // switching an element's rounding in the inspector).
  const [radius, setRadius] = React.useState("0px");

  React.useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board || !selectedId) {
      setBox(null);
      return;
    }
    const measure = () => {
      const el = board.querySelector<HTMLElement>(`[data-sui-id="${CSS.escape(selectedId)}"]`);
      if (!el) {
        setBox(null);
        return;
      }
      const b = board.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // rect diff is scroll-agnostic (both shift together), and the overlay lives
      // inside the board so it scrolls with the content. `board`'s own border
      // (rounded-box border-base-300) is included in its bounding rect but NOT in
      // an absolutely-positioned child's coordinate space (that's the padding
      // box) — subtract `clientTop`/`clientLeft` (the border widths) or every
      // overlay lands a border-width too far down/right, e.g. the ring would sit
      // 1px closer to the node on top/left than on bottom/right.
      setBox({
        top: r.top - b.top - board.clientTop,
        left: r.left - b.left - board.clientLeft,
        width: r.width,
        height: r.height,
      });
      setRadius(getComputedStyle(el).borderRadius);
    };
    measure();
    // Late layout (web fonts, images, async reflow) → re-measure.
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    const el = board.querySelector<HTMLElement>(`[data-sui-id="${CSS.escape(selectedId)}"]`);
    if (el) ro.observe(el);
    return () => ro.disconnect();
    // `version` is in deps so a committed edit re-measures.
  }, [boardRef, selectedId, version]);

  if (!box) return null;
  return (
    <div
      // Same token-driven gap as every other silicaui focus ring — an `outline`
      // (not a border/box-shadow) so it sits outside the node's own box without
      // affecting layout, offset by `--focus-offset` for the gap.
      className={`pointer-events-none absolute ${color ? "" : "outline-primary"} outline${dashed ? " outline-dashed" : ""}`}
      style={{
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        borderRadius: radius,
        zIndex: z,
        outlineWidth: "var(--focus-width, 2px)",
        outlineOffset: "var(--focus-offset, 2px)",
        ...(color ? { outlineColor: color } : null),
      }}
      aria-hidden
    >
      {label && (
        <span
          className={`absolute max-w-[180px] truncate rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium leading-none shadow-sm ${
            color ? "" : "bg-primary text-primary-content"
          }`}
          // Sits on the ring's own top edge — bottom flush with the ring's
          // outward reach (offset + width) so the tag reads as attached to the
          // ring, not floating above it. The `- 1px` overlaps by a hair to weld
          // that seam shut regardless of sub-pixel/anti-aliasing rounding.
          // Left is nudged in past the ring's own corner curve (rather than
          // flush with its outer-left edge) so the tag doesn't overhang the
          // curve at an angle.
          style={{
            bottom: "calc(100% + var(--focus-offset, 2px) + var(--focus-width, 2px) - 1px)",
            left: "6px",
            ...(color ? { backgroundColor: color, color: labelInk } : null),
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
