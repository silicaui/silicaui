import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaSize } from "./lib/tokens";

export type TableSize = SilicaSize;

/**
 * The container widths a stacked table can switch at, smallest first. Named
 * after Tailwind's container sizes: `sm` 24rem, `md` 28rem, `lg` 32rem, `xl`
 * 36rem, `2xl` 42rem, `3xl` 48rem. Kept equal to the CSS plugin's own list by
 * `verify-table-stack.mjs`.
 */
export const TABLE_STACK_BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl", "3xl"] as const;

/** One of `TABLE_STACK_BREAKPOINTS`. */
export type TableStackBreakpoint = (typeof TABLE_STACK_BREAKPOINTS)[number];

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Striped rows. */
  zebra?: boolean;
  /** Highlight the row under the cursor. */
  hover?: boolean;
  /** Default `md`. Scales cell padding + type. */
  size?: TableSize;
  /**
   * Stack the rows into blocks while the table's container is narrow, so a
   * list fits a narrow pane instead of running past it. The header is visually
   * hidden (a screen reader still reads it), each row wraps its cells with the
   * first on a line of its own and the last at the end, and a cell with
   * `data-label="Total"` shows that label before its value.
   *
   * `true` stacks below a 36rem container. A breakpoint (`"sm"` 24rem, `"md"`
   * 28rem, `"lg"` 32rem, `"xl"` 36rem, `"2xl"` 42rem, `"3xl"` 48rem) stacks
   * below that width instead, the same widths as Tailwind's `@sm:` to `@3xl:`.
   * Wider than the breakpoint it is an ordinary table. The container is the
   * table's own wrapper, so no `@container` is needed above it. Default `false`.
   */
  stack?: boolean | TableStackBreakpoint;
  /**
   * Class for the wrapper `<div>`. It scrolls a wide table sideways, and it is
   * the container a stacked table measures.
   */
  wrapperClassName?: string;
}

/**
 * Silica Table — a styled `<table>`. Compose it from plain semantic rows; the
 * CSS styles the native elements, so no per-cell classes are needed:
 *
 *   <Table zebra hover>
 *     <thead>
 *       <tr><th>Name</th><th>Role</th></tr>
 *     </thead>
 *     <tbody>
 *       <tr><td>Ada</td><td>Engineer</td></tr>
 *     </tbody>
 *   </Table>
 *
 * Auto-wrapped in a `table-scroll` container so a wide table scrolls instead of
 * blowing out the page; `ref`/`className` land on the `<table>`. A list that
 * has to fit a narrow pane takes `stack`, and its rows become blocks below the
 * container width.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  function Table(
    {
      zebra = false,
      hover = false,
      size = "md",
      stack = false,
      className,
      wrapperClassName,
      ...rest
    },
    ref,
  ) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("table"),
      stack === true && sc("table-stack"),
      typeof stack === "string" && sc(`table-stack-${stack}`),
      zebra && sc("table-zebra"),
      hover && sc("table-hover"),
      size !== "md" && sc(`table-${size}`),
      className,
    );
    return (
      <div className={cx(sc("table-scroll"), wrapperClassName)}>
        <table ref={ref} className={classes} {...rest} />
      </div>
    );
  },
);
