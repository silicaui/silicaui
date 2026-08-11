import * as React from "react";

/**
 * The measuring half of `ScrollStrip`, separated from its markup so a component
 * that already OWNS its scroller element can wear the same behavior.
 *
 * `Tabs` is the reason this is a hook. A tab strip is the canonical case for
 * "there is more of this off-screen", and making every caller remember to wrap
 * `<TabsList>` by hand is precisely the papercut the component exists to remove
 * — but `TabsList` renders Base UI's own `Tabs.List` element, which it cannot
 * hand over to `ScrollStrip` to render. Both mount this one implementation
 * instead, so the two can't drift.
 */

/** Sub-pixel layout rounding routinely leaves `scrollLeft` a hair short of the
 *  maximum; without slack a control stays enabled at a hard stop. */
const EDGE_SLACK = 2;

/**
 * Anything the browser already hands a tab stop to. Errs toward matching: a
 * false positive costs nothing, a false negative adds a redundant tab stop in
 * front of every item in the strip.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "audio[controls]",
  "video[controls]",
  "details",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(",");

export interface ScrollStripMetrics {
  overflows: boolean;
  atStart: boolean;
  atEnd: boolean;
  rtl: boolean;
  /** The strip's own contents are tabbable, so the scroller needn't be. */
  reachable: boolean;
}

const INITIAL: ScrollStripMetrics = {
  overflows: false,
  atStart: true,
  atEnd: true,
  rtl: false,
  reachable: true,
};

export interface UseScrollStrip extends ScrollStripMetrics {
  /** Attach to the scrolling element. */
  ref: React.RefObject<HTMLElement | null>;
  /** Wire to the scroller's `onScroll`. */
  measure: () => void;
  /** `-1` toward the start, `1` toward the end. Logical, so RTL is handled. */
  nudge: (direction: -1 | 1) => void;
  /** The scroller needs its own tab stop — nothing inside it has one. */
  needsTabStop: boolean;
}

/**
 * @param step     fraction of the visible width moved per nudge
 * @param contents re-measure when this changes (pass the rendered children)
 */
export function useScrollStrip(step: number, contents?: unknown): UseScrollStrip {
  const ref = React.useRef<HTMLElement>(null);
  const [m, setM] = React.useState<ScrollStripMetrics>(INITIAL);

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // Under RTL `scrollLeft` runs 0 → -max, so the absolute value is the only
    // reading that means "distance from the start" on both directions.
    const pos = Math.abs(el.scrollLeft);
    const next: ScrollStripMetrics = {
      overflows: max > EDGE_SLACK,
      atStart: pos <= EDGE_SLACK,
      atEnd: pos >= max - EDGE_SLACK,
      rtl: typeof window !== "undefined" && window.getComputedStyle(el).direction === "rtl",
      reachable: el.querySelector(FOCUSABLE) !== null,
    };
    // Bail on an unchanged reading: this runs on every scroll frame, and a
    // fresh object each time would re-render the whole strip mid-flick.
    setM((prev) =>
      prev.overflows === next.overflows &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd &&
      prev.rtl === next.rtl &&
      prev.reachable === next.reachable
        ? prev
        : next,
    );
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    // Both are needed. The container is resizable, which changes the element's
    // size with no scroll event; and the CONTENT changes too as items gain
    // counts or dirty markers, which resizes children rather than the container.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [measure, contents]);

  const nudge = React.useCallback(
    (direction: -1 | 1) => {
      const el = ref.current;
      if (!el) return;
      // No `behavior` on purpose: the default resolves to the CSS
      // `scroll-behavior`, which the stylesheet already drops to `auto` under
      // prefers-reduced-motion — so there is no motion branch to keep in sync.
      el.scrollBy({ left: (m.rtl ? -1 : 1) * direction * el.clientWidth * step });
    },
    [m.rtl, step],
  );

  return {
    ...m,
    ref,
    measure,
    nudge,
    // A scroll region with nothing tabbable inside is unreachable by keyboard
    // entirely — arrow keys only scroll what has focus. Give it a tab stop in
    // that case ONLY, so a strip of real tabs gains no redundant one.
    needsTabStop: m.overflows && !m.reachable,
  };
}
