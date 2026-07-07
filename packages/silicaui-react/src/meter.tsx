import * as React from "react";
import { Meter as BaseMeter } from "@base-ui-components/react/meter";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type MeterColor = SilicaColor;
export type MeterSize = SilicaSize;

export interface MeterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** The current reading. */
  value: number;
  /** Range floor. Default `0`. */
  min?: number;
  /** Range ceiling. Default `100`. */
  max?: number;
  /** Fill color; maps to `meter-<color>`. */
  color?: MeterColor;
  /** Track height; default `md`. */
  size?: MeterSize;
  /** Optional label shown in the header row. */
  label?: React.ReactNode;
  /** Show the formatted value in the header row. Default `false`. */
  showValue?: boolean;
  /** `Intl.NumberFormat` options for the displayed value. */
  format?: Intl.NumberFormatOptions;
}

/**
 * Silica Meter — a static measurement within a known range (disk usage, score,
 * capacity). Behavior/accessibility from Base UI's Meter; look from Silica.
 *
 *   <Meter value={72} label="Storage" showValue color="warning" />
 */
export const Meter = React.forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    value,
    min = 0,
    max = 100,
    color,
    size = "md",
    label,
    showValue = false,
    format,
    className,
    ...rest
  },
  ref,
) {
  const sc = useSilicaClass();
  const showHeader = label != null || showValue;
  return (
    <BaseMeter.Root
      ref={ref}
      value={value}
      min={min}
      max={max}
      format={format}
      className={cx(
        sc("meter"),
        color && sc(`meter-${color}`),
        size !== "md" && sc(`meter-${size}`),
        className,
      )}
      {...rest}
    >
      {showHeader && (
        <div className={cx(sc("meter-header"))}>
          {label != null && (
            <BaseMeter.Label className={cx(sc("meter-label"))}>
              {label}
            </BaseMeter.Label>
          )}
          {showValue && <BaseMeter.Value className={cx(sc("meter-value"))} />}
        </div>
      )}
      <BaseMeter.Track className={cx(sc("meter-track"))}>
        <BaseMeter.Indicator className={cx(sc("meter-indicator"))} />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
});
