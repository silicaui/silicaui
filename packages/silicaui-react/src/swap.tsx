import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type SwapVariant = "fade" | "rotate" | "flip";

export interface SwapProps
  extends Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange"> {
  /** Shown when active (checked). */
  on: React.ReactNode;
  /** Shown when inactive. */
  off: React.ReactNode;
  /** Controlled active state. */
  active?: boolean;
  /** Initial state when uncontrolled. */
  defaultActive?: boolean;
  /** Called when toggled. */
  onActiveChange?: (active: boolean) => void;
  /** Transition style. `fade` (default), `rotate`, or `flip`. */
  variant?: SwapVariant;
  /** Accessible label. */
  label?: string;
}

/**
 * Silica Swap — cross-fades (or rotates/flips) between two icons on toggle.
 *
 *   <Swap variant="rotate" on={<CloseIcon />} off={<MenuIcon />} label="Menu" />
 */
export function Swap({
  on,
  off,
  active,
  defaultActive,
  onActiveChange,
  variant = "fade",
  label,
  className,
  ...rest
}: SwapProps) {
  const sc = useSilicaClass();
  const isControlled = active !== undefined;
  const [internal, setInternal] = React.useState(defaultActive ?? false);
  const checked = isControlled ? active : internal;

  return (
    <label
      className={cx(sc("swap"), variant !== "fade" && sc(`swap-${variant}`), className)}
      {...rest}
    >
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.checked);
          onActiveChange?.(e.target.checked);
        }}
      />
      <span className={cx(sc("swap-on"))}>{on}</span>
      <span className={cx(sc("swap-off"))}>{off}</span>
    </label>
  );
}
