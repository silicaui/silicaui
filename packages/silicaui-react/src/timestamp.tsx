import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { formatAbsoluteTime, formatRelativeTime } from "./lib/relative-time";

export type TimestampFormat = "auto" | "relative" | "absolute";

export interface TimestampProps
  extends Omit<React.HTMLAttributes<HTMLTimeElement>, "children"> {
  /** The moment to display. */
  value: Date | string | number;
  /**
   * `"relative"` ("2 minutes ago"), `"absolute"` ("2:30 PM" / "Jul 8"), or
   * `"auto"` (default) — relative within `relativeThreshold`, absolute beyond it.
   */
  format?: TimestampFormat;
  /** `"auto"`'s relative/absolute cutoff, in ms. Default 24 hours. */
  relativeThreshold?: number;
  /** Refresh interval for a relative label, in ms. Default 60s; `0` disables. */
  refreshInterval?: number;
}

/**
 * Silica Timestamp — dependency-free relative/absolute time formatting
 * (`Intl.RelativeTimeFormat` / `Intl.DateTimeFormat`, no date library), so every
 * callsite renders "2 minutes ago" / "2:30 PM" the same way instead of each
 * hand-rolling slightly different math.
 *
 *   <Timestamp value={message.sentAt} />                    // auto
 *   <Timestamp value={message.sentAt} format="relative" />
 */
export const Timestamp = React.forwardRef<HTMLTimeElement, TimestampProps>(
  function Timestamp(
    {
      value,
      format = "auto",
      relativeThreshold = 24 * 60 * 60 * 1000,
      refreshInterval = 60_000,
      className,
      ...rest
    },
    ref,
  ) {
    const sc = useSilicaClass();
    const date = value instanceof Date ? value : new Date(value);

    // Tick so a relative label ("2 minutes ago") stays fresh without a re-render
    // from the parent.
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
      if (format === "absolute" || refreshInterval <= 0) return;
      const id = setInterval(() => setTick((t) => t + 1), refreshInterval);
      return () => clearInterval(id);
    }, [format, refreshInterval]);

    const now = new Date();
    const useRelative =
      format === "relative" ||
      (format === "auto" && Math.abs(now.getTime() - date.getTime()) < relativeThreshold);
    const text = useRelative ? formatRelativeTime(date, now) : formatAbsoluteTime(date, now);

    return (
      <time
        ref={ref}
        dateTime={date.toISOString()}
        title={format === "auto" ? formatAbsoluteTime(date, now) : undefined}
        className={cx(sc("timestamp"), className)}
        {...rest}
      >
        {text}
      </time>
    );
  },
);
