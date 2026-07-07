import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type StatusColor = SilicaColor;
export type StatusSize = SilicaSize;

export interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Dot color. */
  color?: StatusColor;
  /** Dot size. */
  size?: StatusSize;
  /** Add an expanding "ping" ring. */
  ping?: boolean;
  /** Accessible label (e.g. "Online"). */
  label?: string;
}

/**
 * Silica Status — a small status dot, optionally pinging.
 *
 *   <Status color="success" ping label="Online" />
 *   <Status color="warning" size="sm" />
 */
export const Status = React.forwardRef<HTMLSpanElement, StatusProps>(
  function Status({ color, size, ping, label, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <span
        ref={ref}
        role={label ? "status" : undefined}
        aria-label={label}
        className={cx(
          sc("status"),
          color && sc(`status-${color}`),
          size && sc(`status-${size}`),
          ping && sc("status-ping"),
          className,
        )}
        {...rest}
      />
    );
  },
);
