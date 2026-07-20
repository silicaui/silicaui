import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type CarouselSnap = "start" | "center" | "end";
export type CarouselOrientation = "horizontal" | "vertical";

export interface CarouselProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Snap alignment of items. `start` (default), `center`, or `end`. */
  snap?: CarouselSnap;
  /** `horizontal` (default) or `vertical`. */
  orientation?: CarouselOrientation;
  /** Show prev/next controls. Default `true`. */
  controls?: boolean;
  /** Bottom indicators: `dots` (default), `numbers` (paged), or `false` to hide. */
  indicators?: boolean | "dots" | "numbers";
  /** Wrap around past the first/last slide. Default `false`. */
  loop?: boolean;
  /** Auto-advance every N ms (pauses on hover/focus). Off by default. */
  autoplay?: number;
  /** Called with the active slide index whenever it changes. */
  onValueChange?: (index: number) => void;
  /**
   * @deprecated Use `onValueChange`. `onChange` is reserved for the native DOM
   * handler on components that wrap a real form element; still honored here so
   * this isn't a breaking change.
   */
  onChange?: (index: number) => void;
  /**
   * Extra class, applied to BOTH the outer root (so e.g. a width constraint
   * like `max-w-lg` actually shrinks the carousel — the prev/next controls
   * are positioned relative to the root, not the scroll surface) and the
   * scroll surface itself (so e.g. `gap-4`/`rounded-box` still style the
   * strip/items as before). A plain single-target `className` would have to
   * pick one, and picking the scroll surface silently breaks control
   * positioning for the single most common use — constraining overall width.
   */
  className?: string;
}

const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Silica Carousel — a scroll-snap strip driven by real prev/next controls and
 * dot indicators (with optional loop + autoplay), not just a scrollable list.
 *
 *   <Carousel loop autoplay={4000} className="gap-4 rounded-box">
 *     <CarouselItem className="w-full"><img … /></CarouselItem>
 *     <CarouselItem className="w-full"><img … /></CarouselItem>
 *   </Carousel>
 */
export function Carousel({
  snap = "start",
  orientation = "horizontal",
  controls = true,
  indicators = true,
  loop = false,
  autoplay,
  onValueChange,
  onChange,
  className,
  children,
  ...rest
}: CarouselProps) {
  const sc = useSilicaClass();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const horizontal = orientation !== "vertical";
  const count = React.Children.count(children);
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const goTo = React.useCallback(
    (i: number) => {
      const container = scrollRef.current;
      if (!container) return;
      const last = container.children.length - 1;
      const target = loop
        ? (i + container.children.length) % container.children.length
        : Math.max(0, Math.min(last, i));
      const el = container.children[target] as HTMLElement | undefined;
      if (!el) return;
      container.scrollTo({
        left: horizontal ? el.offsetLeft - container.offsetLeft : 0,
        top: horizontal ? 0 : el.offsetTop - container.offsetTop,
        behavior: "smooth",
      });
    },
    [horizontal, loop],
  );

  // Keep the active index in sync with manual scrolling / swiping.
  const handleScroll = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const kids = Array.from(container.children) as HTMLElement[];
    const pos = horizontal ? container.scrollLeft : container.scrollTop;
    let nearest = 0;
    let best = Infinity;
    kids.forEach((k, i) => {
      const off = horizontal ? k.offsetLeft - container.offsetLeft : k.offsetTop - container.offsetTop;
      const d = Math.abs(off - pos);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setActive((prev) => (prev === nearest ? prev : nearest));
  }, [horizontal]);

  // Notify on real index CHANGES only. Two things this guards against, both of
  // which the naive `[active, onChange]` version got wrong: firing once on
  // mount (reporting a change that never happened), and re-firing on every
  // render when the caller passes an inline arrow, whose identity is new each
  // time — which turns a parent `setState` in the handler into a render loop.
  const notifyRef = React.useRef(onValueChange ?? onChange);
  notifyRef.current = onValueChange ?? onChange;
  const lastActive = React.useRef(active);
  React.useEffect(() => {
    if (lastActive.current === active) return;
    lastActive.current = active;
    notifyRef.current?.(active);
  }, [active]);

  React.useEffect(() => {
    if (!autoplay || paused || count <= 1) return;
    const id = window.setInterval(() => {
      const next = active + 1 > count - 1 ? (loop ? 0 : active) : active + 1;
      if (next !== active) goTo(next);
      else if (loop) goTo(0);
    }, autoplay);
    return () => window.clearInterval(id);
  }, [autoplay, paused, active, count, loop, goTo]);

  const atStart = active === 0;
  const atEnd = active === count - 1;
  const indi = indicators === true ? "dots" : indicators;

  return (
    <div
      className={cx(sc("carousel-root"), className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {controls && count > 1 && (
        <button
          type="button"
          className={cx(sc("carousel-control"), sc("carousel-prev"))}
          onClick={() => goTo(active - 1)}
          disabled={!loop && atStart}
          aria-label="Previous slide"
        >
          <PrevIcon />
        </button>
      )}

      <div
        ref={scrollRef}
        className={cx(
          sc("carousel"),
          snap !== "start" && sc(`carousel-${snap}`),
          orientation === "vertical" && sc("carousel-vertical"),
          className,
        )}
        onScroll={handleScroll}
        {...rest}
      >
        {children}
      </div>

      {controls && count > 1 && (
        <button
          type="button"
          className={cx(sc("carousel-control"), sc("carousel-next"))}
          onClick={() => goTo(active + 1)}
          disabled={!loop && atEnd}
          aria-label="Next slide"
        >
          <NextIcon />
        </button>
      )}

      {indi && count > 1 && (
        <div className={cx(sc("carousel-indicators"))}>
          {Array.from({ length: count }, (_, i) =>
            indi === "numbers" ? (
              <button
                key={i}
                type="button"
                className={cx(sc("carousel-number"), i === active && sc("carousel-number-active"))}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
              >
                {i + 1}
              </button>
            ) : (
              <button
                key={i}
                type="button"
                className={cx(sc("carousel-dot"), i === active && sc("carousel-dot-active"))}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export type CarouselItemProps = React.HTMLAttributes<HTMLDivElement>;

export const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  function CarouselItem({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("carousel-item"), className)} {...rest} />;
  },
);
