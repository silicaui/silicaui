import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaSize } from "./lib/tokens";

export type TableSize = SilicaSize;

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Striped rows. */
  zebra?: boolean;
  /** Highlight the row under the cursor. */
  hover?: boolean;
  /** Default `md`. Scales cell padding + type. */
  size?: TableSize;
  /** Class for the horizontal-scroll wrapper (the outer `<div>`). */
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
 * Auto-wrapped in an `overflow-x: auto` container so a wide table scrolls
 * instead of blowing out the page; `ref`/`className` land on the `<table>`.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  function Table(
    { zebra = false, hover = false, size = "md", className, wrapperClassName, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("table"),
      zebra && sc("table-zebra"),
      hover && sc("table-hover"),
      size !== "md" && sc(`table-${size}`),
      className,
    );
    return (
      <div className={wrapperClassName} style={{ overflowX: "auto" }}>
        <table ref={ref} className={classes} {...rest} />
      </div>
    );
  },
);
