/**
 * The selection chrome shared by both editors' canvases — a Figma/Framer-style
 * overlay drawn OVER the canvas, not baked into the node's classes: a crisp 1px
 * accent frame, four corner handles, and a floating element-name tag. It measures
 * the selected node's real rect (relative to the scrolling board, found via
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
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  selectedId: string | undefined;
  label: string | undefined;
  /** Any value that changes when the board's content changes — triggers a re-measure. */
  version: unknown;
}) {
  const [box, setBox] = React.useState<Box | null>(null);

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
      // inside the board so it scrolls with the content.
      setBox({ top: r.top - b.top, left: r.left - b.left, width: r.width, height: r.height });
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
  // Inflate the frame a few px beyond the node so it reads as "around" the element,
  // not painted on its edge.
  const INSET = 4;
  // Each handle is anchored to a corner and pulled back by half its own size, so it
  // sits centered on the corner regardless of handle size (no magic offsets).
  const handle = "absolute size-1.5 rounded-[2px] bg-base-100 border border-primary shadow-sm";
  return (
    <div
      className="pointer-events-none absolute z-20 border border-primary rounded-[4px]"
      style={{
        top: box.top - INSET,
        left: box.left - INSET,
        width: box.width + INSET * 2,
        height: box.height + INSET * 2,
      }}
      aria-hidden
    >
      {label && (
        <span className="absolute -top-[21px] left-0 max-w-[180px] truncate rounded-[3px] bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-content shadow-sm">
          {label}
        </span>
      )}
      <span className={`${handle} top-0 left-0 -translate-x-1/2 -translate-y-1/2`} />
      <span className={`${handle} top-0 right-0 translate-x-1/2 -translate-y-1/2`} />
      <span className={`${handle} bottom-0 left-0 -translate-x-1/2 translate-y-1/2`} />
      <span className={`${handle} bottom-0 right-0 translate-x-1/2 translate-y-1/2`} />
    </div>
  );
}
