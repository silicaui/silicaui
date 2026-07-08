import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

function useOverflowList<T>(items: T[], gap: number) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(items.length);

  React.useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    function recompute() {
      if (!container || !measure) return;
      const available = container.clientWidth;
      const itemEls = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-measure-item]"),
      );
      const overflowEl = measure.querySelector<HTMLElement>("[data-measure-overflow]");
      const widths = itemEls.map((el) => el.getBoundingClientRect().width);
      const overflowWidth = overflowEl ? overflowEl.getBoundingClientRect().width : 0;

      const totalWidth = widths.reduce((sum, w, i) => sum + w + (i > 0 ? gap : 0), 0);
      if (totalWidth <= available) {
        setVisibleCount(items.length);
        return;
      }

      const budget = available - overflowWidth - gap;
      let total = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = total + (widths[i] ?? 0) + (i > 0 ? gap : 0);
        if (next > budget) break;
        total = next;
        count = i + 1;
      }
      setVisibleCount(count);
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [items, gap]);

  return { containerRef, measureRef, visibleCount };
}

export interface OverflowListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Render the trailing overflow indicator given the items that didn't fit.
   * Default: a "+N" badge that opens a popover listing them (via `renderItem`).
   */
  renderOverflow?: (hiddenItems: T[]) => React.ReactNode;
  /** Gap between items, in px. Default `8`. */
  gap?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Silica OverflowList — a single-row list (avatars, tags, breadcrumbs-like
 * items) that measures the available width and folds whatever doesn't fit
 * into a "+N" indicator, instead of wrapping or clipping. Recomputes on
 * resize (`ResizeObserver`), so it adapts as the container's width changes.
 *
 *   <OverflowList
 *     items={assignees}
 *     renderItem={(person) => <Avatar key={person.id} src={person.photo} alt={person.name} />}
 *   />
 */
export function OverflowList<T>({
  items,
  renderItem,
  renderOverflow,
  gap = 8,
  className,
  "aria-label": ariaLabel,
}: OverflowListProps<T>) {
  const sc = useSilicaClass();
  const { containerRef, measureRef, visibleCount } = useOverflowList(items, gap);
  const visible = items.slice(0, visibleCount);
  const hidden = items.slice(visibleCount);

  const overflowContent =
    hidden.length > 0
      ? (renderOverflow
          ? renderOverflow(hidden)
          : (
              <Popover>
                <PopoverTrigger>
                  <button type="button" className={cx(sc("overflow-list-badge"))}>
                    +{hidden.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className={cx(sc("overflow-list-popup"))}>
                    {hidden.map((item, i) => (
                      <React.Fragment key={i}>{renderItem(item, visibleCount + i)}</React.Fragment>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ))
      : null;

  // The measurer always renders the "+N" against the FULL item count, since
  // that's the worst-case (widest) label the badge could ever show.
  const measureOverflow = renderOverflow ? (
    renderOverflow(items)
  ) : (
    <span className={cx(sc("overflow-list-badge"))}>+{items.length}</span>
  );

  return (
    <div
      ref={containerRef}
      className={cx(sc("overflow-list"), className)}
      style={{ gap }}
      aria-label={ariaLabel}
    >
      {visible.map((item, i) => (
        <React.Fragment key={i}>{renderItem(item, i)}</React.Fragment>
      ))}
      {overflowContent}

      <div ref={measureRef} className={cx(sc("overflow-list-measure"))} style={{ gap }} aria-hidden="true">
        {items.map((item, i) => (
          <div key={i} data-measure-item>
            {renderItem(item, i)}
          </div>
        ))}
        <div data-measure-overflow>{measureOverflow}</div>
      </div>
    </div>
  );
}
