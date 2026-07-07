import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type NativeSelectColor = SilicaColor;

export type NativeSelectSize = SilicaSize;

export interface NativeSelectProps
  // Omit the native numeric `size` and string `color` so our token unions win.
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "color"> {
  /** Accent color; maps to `select-<color>` (border + focus ring). */
  color?: NativeSelectColor;
  /** Default `md`. Matches same-size Input/Button heights. */
  size?: NativeSelectSize;
}

/**
 * Silica NativeSelect — a native `<select>` restyled to the field tier. Thin,
 * presentational wrapper: pass `<option>`s as children and all native
 * attributes (`value`, `defaultValue`, `onChange`, `disabled`, …) through.
 *
 * For a rich, searchable, fully-styled listbox (custom popup, groups, keyboard
 * typeahead, multi-select), use `Select` (the Base UI listbox) instead.
 */
export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(function NativeSelect({ color, size = "md", className, children, ...rest }, ref) {
  const sc = useSilicaClass();
  const classes = cx(
    sc("select"),
    color && sc(`select-${color}`),
    size !== "md" && sc(`select-${size}`),
    className,
  );

  return (
    <select ref={ref} className={classes} {...rest}>
      {children}
    </select>
  );
});
