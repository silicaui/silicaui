import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export interface ToggleProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `toggle-<color>` (checked track fill). */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
}

/**
 * Silica Toggle — a restyled native `<input type="checkbox">` presented as a
 * switch. Adds `role="switch"` for assistive tech; all native attributes
 * (`checked`, `onChange`, `disabled`, …) pass through.
 */
export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  function Toggle({ color, size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("toggle"),
      color && sc(`toggle-${color}`),
      size !== "md" && sc(`toggle-${size}`),
      className,
    );
    return (
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={classes}
        {...rest}
      />
    );
  },
);
