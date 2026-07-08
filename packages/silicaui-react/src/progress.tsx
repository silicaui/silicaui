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
  /** Show a value label above the bar (skipped while indeterminate). Default `false`. */
  showValue?: boolean;
  /** Format the label. Default: rounded percentage, e.g. `"60%"`. */
  formatValue?: (value: number, max: number) => React.ReactNode;
  /** Optional leading label shown beside the value, e.g. `"Uploading"`. */
  label?: React.ReactNode;
}

function defaultFormatValue(value: number, max: number): string {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100);
  return `${pct}%`;
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
  function Progress(
    { color, size = "md", value, max = 100, showValue, formatValue, label, className, ...rest },
    ref,
  ) {
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

    const bar = (
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

    if (!showValue) return bar;

    return (
      <div className={cx(sc("progress-wrapper"))}>
        <div className={cx(sc("progress-label-row"))}>
          {label != null && <span className={cx(sc("progress-label"))}>{label}</span>}
          {!indeterminate && (
            <span className={cx(sc("progress-value"))}>
              {(formatValue ?? defaultFormatValue)(value, max)}
            </span>
          )}
        </div>
        {bar}
      </div>
    );
  },
);
