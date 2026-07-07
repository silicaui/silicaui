import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type CountdownUnit = "days" | "hours" | "minutes" | "seconds";

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target time (a Date or epoch-ms timestamp). */
  to: Date | number;
  /** Which units to show. Default all four. */
  units?: CountdownUnit[];
  /** Drop the boxes for an inline number run. */
  plain?: boolean;
  /** Called once when the countdown reaches zero. */
  onComplete?: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Silica Countdown — a live days/hours/minutes/seconds display.
 *
 *   <Countdown to={launchDate} />
 *   <Countdown to={Date.now() + 90_000} units={["minutes", "seconds"]} plain />
 *
 * Client-only (ticks every second); render under a `"use client"` boundary.
 */
export function Countdown({
  to,
  units = ["days", "hours", "minutes", "seconds"],
  plain,
  onComplete,
  className,
  ...rest
}: CountdownProps) {
  const sc = useSilicaClass();
  const target = typeof to === "number" ? to : to.getTime();
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, target - now);
  const done = remaining === 0;

  const completedRef = React.useRef(false);
  React.useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
    if (!done) completedRef.current = false;
  }, [done, onComplete]);

  const total = Math.floor(remaining / 1000);
  const values: Record<CountdownUnit, number> = {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };

  return (
    <div
      className={cx(sc("countdown"), plain && sc("countdown-plain"), className)}
      role="timer"
      {...rest}
    >
      {units.map((u) => (
        <div key={u} className={cx(sc("countdown-unit"))}>
          <span className={cx(sc("countdown-value"))}>
            {u === "days" ? values[u] : pad(values[u])}
          </span>
          <span className={cx(sc("countdown-label"))}>{u}</span>
        </div>
      ))}
    </div>
  );
}
