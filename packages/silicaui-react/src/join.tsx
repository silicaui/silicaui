import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type JoinOrientation = "horizontal" | "vertical";

export interface JoinProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `horizontal` (default) or `vertical`. */
  orientation?: JoinOrientation;
}

/**
 * Silica Join — merges its children into one seamless segmented group.
 *
 *   <Join>
 *     <Button>Day</Button>
 *     <Button>Week</Button>
 *     <Button>Month</Button>
 *   </Join>
 *
 *   <Join>
 *     <Input placeholder="Search…" />
 *     <Button color="primary">Go</Button>
 *   </Join>
 */
export const Join = React.forwardRef<HTMLDivElement, JoinProps>(
  function Join({ orientation = "horizontal", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(
          sc("join"),
          orientation === "vertical" && sc("join-vertical"),
          className,
        )}
        {...rest}
      />
    );
  },
);
