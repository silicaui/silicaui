import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `horizontal` (default) or `vertical` (for row layouts). */
  orientation?: DividerOrientation;
}

/**
 * Silica Divider — a plain or labeled separator.
 *
 *   <Divider />              // plain rule
 *   <Divider>OR</Divider>    // centered label with rules on each side
 *   <Divider orientation="vertical" />   // vertical rule inside a flex row
 */
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  function Divider({ orientation = "horizontal", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        role="separator"
        className={cx(
          sc("divider"),
          orientation === "vertical" && sc("divider-vertical"),
          className,
        )}
        {...rest}
      />
    );
  },
);
