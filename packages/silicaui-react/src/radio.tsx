import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export interface RadioProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `radio-<color>` (checked dot + focus ring). */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
}

/**
 * Silica Radio — a restyled native `<input type="radio">`. Group them by giving
 * several the same `name`. All native attributes pass through.
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  function Radio({ color, size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("radio"),
      color && sc(`radio-${color}`),
      size !== "md" && sc(`radio-${size}`),
      className,
    );
    return <input ref={ref} type="radio" className={classes} {...rest} />;
  },
);
