import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type ProgressColor = SilicaColor;

export type ProgressSize = SilicaSize;

export interface ProgressProps
  // Omit the native string `color` so our token union wins.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "children"> {
  /** Fill color; maps to `progress-<color>`. Omit for a neutral bar. */
  color?: ProgressColor;
  /** Default `md`. Height lines up with same-size fields. */
  size?: ProgressSize;
  /**
   * Current value, from 0 to `max`. Omit entirely for an indeterminate
   * (unknown-duration) loading bar.
   */
  value?: number;
  /** Upper bound of `value`. Default `100`. */
  max?: number;
}

/**
 * Silica Progress — a task-completion bar (div-based, so it renders identically
 * across engines; see the CSS component for why not native `<progress>`).
 *
 *   <Progress value={60} />                  // 60%
 *   <Progress color="success" value={3} max={4} />
 *   <Progress />                             // indeterminate
 *
 * Exposes the ARIA `progressbar` role with the right value bounds; an
 * indeterminate bar omits `aria-valuenow` so assistive tech announces it as
 * busy rather than a fixed percentage.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  function Progress({ color, size = "md", value, max = 100, className, ...rest }, ref) {
    const sc = useSilicaClass();
    const indeterminate = value == null;

    // Clamp to [0, max] and guard a zero/negative max before dividing.
    const pct =
      indeterminate || max <= 0
        ? 0
        : Math.max(0, Math.min(100, (value / max) * 100));

    const classes = cx(
      sc("progress"),
      color && sc(`progress-${color}`),
      size !== "md" && sc(`progress-${size}`),
      indeterminate && sc("progress-indeterminate"),
      className,
    );

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        className={classes}
        {...rest}
      >
        <div
          className={cx(sc("progress-bar"))}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    );
  },
);
