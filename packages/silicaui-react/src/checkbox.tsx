import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `checkbox-<color>` (checked fill + focus ring). */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
}

/**
 * Silica Checkbox — a restyled native `<input type="checkbox">`. All native
 * attributes (`checked`, `defaultChecked`, `onChange`, `disabled`, …) pass
 * through. Pair it with your own `<label>` for a clickable caption.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ color, size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("checkbox"),
      color && sc(`checkbox-${color}`),
      size !== "md" && sc(`checkbox-${size}`),
      className,
    );
    return <input ref={ref} type="checkbox" className={classes} {...rest} />;
  },
);
