import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";
import { CaptionedControl } from "./lib/captioned-control";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `checkbox-<color>` (checked fill + focus ring). */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
  /** Caption. Wraps the control in a `<label>` so the text is a click target. */
  children?: React.ReactNode;
}

/**
 * Silica Checkbox — a restyled native `<input type="checkbox">`. All native
 * attributes (`checked`, `defaultChecked`, `onChange`, `disabled`, …) pass
 * through.
 *
 *   <Checkbox />                       // bare; pair with your own <label htmlFor>
 *   <Checkbox>Run tests</Checkbox>     // captioned; the whole row is clickable
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ color, size = "md", className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("checkbox"),
      color && sc(`checkbox-${color}`),
      size !== "md" && sc(`checkbox-${size}`),
      className,
    );
    return (
      <CaptionedControl
        input={<input ref={ref} type="checkbox" className={classes} {...rest} />}
      >
        {children}
      </CaptionedControl>
    );
  },
);
