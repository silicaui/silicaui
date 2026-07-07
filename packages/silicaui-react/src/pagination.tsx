import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type PaginationColor = SilicaColor;
export type PaginationSize = "xs" | "sm" | "md" | "lg";

export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  count: number;
  /** Called with the new page. */
  onChange?: (page: number) => void;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages shown at the start/end. Default 1. */
  boundaryCount?: number;
  /** Show prev/next arrows. Default `true`. */
  controls?: boolean;
  color?: PaginationColor;
  size?: PaginationSize;
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/** MUI-style page list with ellipses. */
function paginationItems(
  page: number,
  count: number,
  siblingCount: number,
  boundaryCount: number,
): (number | "ellipsis")[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const firstEndPage = endPages.length > 0 ? (endPages[0] as number) : count + 1;
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? firstEndPage - 2 : count - 1,
  );

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ["ellipsis" as const]
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? ["ellipsis" as const]
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];
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
 * Silica Pagination — page controls with prev/next and ellipsis.
 *
 *   <Pagination page={page} count={12} onChange={setPage} color="primary" />
 */
export function Pagination({
  page,
  count,
  onChange,
  siblingCount = 1,
  boundaryCount = 1,
  controls = true,
  color,
  size,
  className,
  ...rest
}: PaginationProps) {
  const sc = useSilicaClass();
  const items = paginationItems(page, count, siblingCount, boundaryCount);
  const go = (p: number) => {
    const clamped = Math.max(1, Math.min(count, p));
    if (clamped !== page) onChange?.(clamped);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cx(
        sc("pagination"),
        color && sc(`pagination-${color}`),
        size && sc(`pagination-${size}`),
        className,
      )}
      {...rest}
    >
      {controls && (
        <button
          type="button"
          className={cx(sc("pagination-item"))}
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <PrevIcon />
        </button>
      )}

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className={cx(sc("pagination-ellipsis"))} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cx(
              sc("pagination-item"),
              item === page && sc("pagination-item-active"),
            )}
            onClick={() => go(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      {controls && (
        <button
          type="button"
          className={cx(sc("pagination-item"))}
          onClick={() => go(page + 1)}
          disabled={page >= count}
          aria-label="Next page"
        >
          <NextIcon />
        </button>
      )}
    </nav>
  );
}
