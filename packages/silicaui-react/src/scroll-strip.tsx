import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { useScrollStrip, type UseScrollStrip } from "./lib/use-scroll-strip";
import type { SilicaSize } from "./lib/tokens";

export interface ScrollStripProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onScroll"> {
  /**
   * What the strip holds, as a plural noun — it names the controls ("Scroll
   * **tabs** forward") and the scroll region itself. Required: a bare chevron
   * with no accessible name is the most common way this pattern ships broken.
   */
  label: string;
  /** Control size on the `xs`–`xl` scale. Default `md`. */
  size?: SilicaSize;
  /**
   * Also fade the clipped edge, as a second and quieter signal — the controls
   * say the strip CAN scroll, the fade says the content continues right there.
   * Off by default: a strip that fits must not look dimmed at the edges.
   */
  fade?: boolean;
  /**
   * Fraction of the visible width moved per press, `0`–`1`. Default `0.8` —
   * deliberately not a full screenful, because the sliver of overlap is what
   * makes it read as the strip moving rather than jumping somewhere new.
   */
  step?: number;
  /**
   * Render the prev/next controls. Default `true`. Setting `false` keeps the
   * scroller (and its keyboard reachability) but drops the buttons — for a
   * strip whose overflow is already advertised some other way.
   */
  controls?: boolean;
  /** Extra classes for the scroller itself, e.g. `gap-2 py-1`. */
  trackClassName?: string;
}

const ChevronIcon = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={back ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The prev/next button, shared with `TabsList`.
 *
 * Mounting a control narrows the scroller, which can CREATE the overflow that
 * justifies it — remove it and the overflow goes, so it comes back, forever.
 * So overflow decides whether the PAIR is mounted and position decides only
 * whether each is disabled. Removing the pair strictly widens the scroller, so
 * it can never re-trigger its own condition; a disabled control keeping its
 * footprint is what buys that.
 *
 * @internal — not exported from the package barrel.
 */
export function ScrollStripControl({
  direction,
  label,
  strip,
}: {
  direction: -1 | 1;
  label: string;
  strip: UseScrollStrip;
}) {
  const sc = useSilicaClass();
  return (
    <button
      type="button"
      className={cx(sc("scroll-strip-control"))}
      disabled={direction === -1 ? strip.atStart : strip.atEnd}
      aria-label={`Scroll ${label} ${direction === -1 ? "back" : "forward"}`}
      onClick={() => strip.nudge(direction)}
    >
      <ChevronIcon back={direction === -1} />
    </button>
  );
}

/**
 * Silica ScrollStrip — a horizontal strip that says so when there is more of
 * it off-screen.
 *
 *   <ScrollStrip label="filters" trackClassName="gap-2">
 *     {filters.map((f) => <Badge key={f}>{f}</Badge>)}
 *   </ScrollStrip>
 *
 * `overflow-x-auto` alone is a trap on anything that can be dragged narrow:
 * the content is reachable, but the only thing announcing it exists is a
 * scrollbar that overlay-scrollbar platforms never draw. This mounts real
 * in-flow prev/next controls the moment the content stops fitting — in flow,
 * not overlaid, so they never cover the edge item you were trying to read.
 *
 * `Tabs` already does this on its own (see `TabsList`'s `scrollable`); reach
 * for this for any other row — filter chips, a toolbar, a card rail.
 *
 * Use `Carousel` instead when the content is a deck of full-width slides that
 * should snap one at a time; this is for a row of many small things where the
 * scroll position is continuous and every item is meant to be visible at once.
 */
export const ScrollStrip = React.forwardRef<HTMLDivElement, ScrollStripProps>(
  function ScrollStrip(
    { label, size, fade, step = 0.8, controls = true, className, trackClassName, children, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const strip = useScrollStrip(step, children);
    const showControls = controls && strip.overflows;

    return (
      <div
        ref={ref}
        className={cx(
          sc("scroll-strip"),
          size && sc(`scroll-strip-${size}`),
          fade && sc("scroll-strip-faded"),
          className,
        )}
        data-at-start={strip.atStart || undefined}
        data-at-end={strip.atEnd || undefined}
        {...rest}
      >
        {showControls && <ScrollStripControl direction={-1} label={label} strip={strip} />}
        <div
          ref={strip.ref as React.RefObject<HTMLDivElement>}
          className={cx(sc("scroll-strip-track"), trackClassName)}
          onScroll={strip.measure}
          tabIndex={strip.needsTabStop ? 0 : undefined}
          role={strip.needsTabStop ? "group" : undefined}
          aria-label={strip.needsTabStop ? label : undefined}
        >
          {children}
        </div>
        {showControls && <ScrollStripControl direction={1} label={label} strip={strip} />}
      </div>
    );
  },
);
