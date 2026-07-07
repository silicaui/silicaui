import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface DiffProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The "before" layer (clipped from the split leftward). */
  before: React.ReactNode;
  /** The "after" layer (revealed to the right of the split). */
  after: React.ReactNode;
  /** Controlled split position, 0–100 (percent from the left edge). */
  position?: number;
  /** Uncontrolled initial split position, 0–100. Default `50`. */
  defaultPosition?: number;
  /** Fires with the new split position (0–100) as it changes. */
  onPositionChange?: (position: number) => void;
}

function DiffArrows() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="m9 7-5 5 5 5M15 7l5 5-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Silica Diff — a draggable before/after comparison.
 *
 *   <Diff
 *     before={<img src={before} alt="before" />}
 *     after={<img src={after} alt="after" />}
 *     className="aspect-video"
 *   />
 *
 * Drag the handle (or click anywhere) to move the split; the handle is a slider,
 * so ←/→ nudge it (Shift for larger steps), Home/End snap to the edges.
 */
export const Diff = React.forwardRef<HTMLElement, DiffProps>(function Diff(
  {
    before,
    after,
    position,
    defaultPosition = 50,
    onPositionChange,
    className,
    style,
    ...rest
  },
  ref,
) {
  const sc = useSilicaClass();
  const [internal, setInternal] = React.useState(clamp(defaultPosition));
  const pos = position === undefined ? internal : clamp(position);

  const rootRef = React.useRef<HTMLElement | null>(null);
  const dragging = React.useRef(false);

  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  const commit = (next: number) => {
    const clamped = clamp(next);
    if (position === undefined) setInternal(clamped);
    onPositionChange?.(clamped);
  };

  const positionFromClientX = (clientX: number) => {
    const el = rootRef.current;
    if (!el) return pos;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return pos;
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    commit(positionFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    commit(positionFromClientX(e.clientX));
  };
  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") commit(pos - step);
    else if (e.key === "ArrowRight") commit(pos + step);
    else if (e.key === "Home") commit(0);
    else if (e.key === "End") commit(100);
    else return;
    e.preventDefault();
  };

  const styleVars = {
    ...style,
    ["--diff-pos"]: `${pos}%`,
  } as React.CSSProperties;

  return (
    <figure
      ref={setRefs}
      className={cx(sc("diff"), className)}
      style={styleVars}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...rest}
    >
      <div className={cx(sc("diff-item-1"))}>{before}</div>
      <div className={cx(sc("diff-item-2"))}>{after}</div>
      <div
        className={cx(sc("diff-resizer"))}
        role="slider"
        tabIndex={0}
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
      >
        <span className={cx(sc("diff-grip"))}>
          <DiffArrows />
        </span>
      </div>
    </figure>
  );
});
