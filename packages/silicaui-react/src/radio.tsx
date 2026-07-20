import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";
import { CaptionedControl } from "./lib/captioned-control";

export interface RadioProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `radio-<color>` (checked dot + focus ring). */
  color?: SilicaColor;
  /** Default `md`. */
  size?: SilicaSize;
  /** Caption. Wraps the control in a `<label>` so the text is a click target. */
  children?: React.ReactNode;
}

/**
 * Silica Radio — a restyled native `<input type="radio">`. Group them by giving
 * several the same `name`. All native attributes pass through.
 *
 *   <Radio name="plan" value="pro">Pro</Radio>
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  function Radio({ color, size = "md", className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("radio"),
      color && sc(`radio-${color}`),
      size !== "md" && sc(`radio-${size}`),
      className,
    );
    return (
      <CaptionedControl
        input={<input ref={ref} type="radio" className={classes} {...rest} />}
      >
        {children}
      </CaptionedControl>
    );
  },
);
