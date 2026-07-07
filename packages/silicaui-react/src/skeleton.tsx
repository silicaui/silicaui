import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type SkeletonShape = "block" | "circle" | "text";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `block` (default, `--radius-field`), `circle` (avatar/dot placeholder), or
   * `text` (a pill-rounded line sized in `em`). Give it dimensions with
   * utilities or inline `style`.
   */
  shape?: SkeletonShape;
}

/**
 * Silica Skeleton — an animated placeholder for loading content.
 *
 *   <Skeleton className="h-32 w-full" />              // block
 *   <Skeleton shape="circle" className="h-12 w-12" /> // avatar placeholder
 *   <Skeleton shape="text" className="w-40" />        // one line of text
 *
 * Owns only the fill, radius, and shimmer — size it yourself. Marked
 * `aria-hidden` by default (it's decorative; announce loading with an
 * `aria-busy` region around it); override via props if you need otherwise.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ shape = "block", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("skeleton"),
      shape === "circle" && sc("skeleton-circle"),
      shape === "text" && sc("skeleton-text"),
      className,
    );
    return <div ref={ref} aria-hidden className={classes} {...rest} />;
  },
);
