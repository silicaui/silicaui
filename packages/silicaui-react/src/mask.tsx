import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type MaskVariant =
  | "squircle"
  | "heart"
  | "circle"
  | "hexagon"
  | "hexagon-2"
  | "triangle"
  | "triangle-2"
  | "triangle-3"
  | "triangle-4"
  | "diamond"
  | "pentagon"
  | "star"
  | "star-2"
  | "decagon"
  | "parallelogram";

export interface MaskProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The shape to clip to. */
  variant: MaskVariant;
}

/**
 * Silica Mask — clips its content (usually an `<img>`) to a shape.
 *
 *   <Mask variant="hexagon" className="w-24 h-24">
 *     <img src={photo} alt="" className="w-full h-full object-cover" />
 *   </Mask>
 *
 * Give the mask a size (via `className`/`style`); the shape scales to fill it.
 * You can also apply the classes directly to an `<img>` if you prefer.
 */
export const Mask = React.forwardRef<HTMLDivElement, MaskProps>(function Mask(
  { variant, className, ...rest },
  ref,
) {
  const sc = useSilicaClass();
  return (
    <div
      ref={ref}
      className={cx(sc("mask"), sc(`mask-${variant}`), className)}
      {...rest}
    />
  );
});
