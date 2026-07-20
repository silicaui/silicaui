import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { VoidElementProps } from "./lib/void-element";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type InputColor = SilicaColor;

export type InputSize = SilicaSize;

export interface InputProps
  // Omit the native numeric `size` and string `color` so our token unions win.
  extends VoidElementProps<
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "color">
  > {
  /** Accent color; maps to `input-<color>` (border + focus ring). */
  color?: InputColor;
  /** Default `md`. Matches same-size Button heights. */
  size?: InputSize;
}

/**
 * Silica Input — a single-line text field. Thin, presentational wrapper around a
 * native `<input>`, so all native attributes (`type`, `value`, `onChange`,
 * `placeholder`, `disabled`, …) pass straight through.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ color, size = "md", className, type, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("input"),
      color && sc(`input-${color}`),
      size !== "md" && sc(`input-${size}`),
      className,
    );

    return (
      <input ref={ref} type={type ?? "text"} className={classes} {...rest} />
    );
  },
);
