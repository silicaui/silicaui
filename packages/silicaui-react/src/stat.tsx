import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface StatsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack the blocks vertically instead of inline. */
  vertical?: boolean;
}

/** Container for a row (or column) of `<Stat>` blocks. */
export const Stats = React.forwardRef<HTMLDivElement, StatsProps>(
  function Stats({ vertical = false, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("stats"), vertical && sc("stats-vertical"), className)}
        {...rest}
      />
    );
  },
);

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Silica Stat — a single metric block. Compose from parts:
 *
 *   <Stats>
 *     <Stat>
 *       <StatFigure><ChartIcon /></StatFigure>
 *       <StatTitle>Revenue</StatTitle>
 *       <StatValue>$42.8k</StatValue>
 *       <StatDesc>↗︎ 12% this month</StatDesc>
 *     </Stat>
 *   </Stats>
 */
export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  function Stat({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("stat"), className)} {...rest} />;
  },
);

/** Muted label above the value. */
export const StatTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StatTitle({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return <div ref={ref} className={cx(sc("stat-title"), className)} {...rest} />;
});

/** The headline metric. */
export const StatValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StatValue({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return <div ref={ref} className={cx(sc("stat-value"), className)} {...rest} />;
});

/** Secondary line under the value (trend, context). */
export const StatDesc = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StatDesc({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return <div ref={ref} className={cx(sc("stat-desc"), className)} {...rest} />;
});

/** Trailing figure/icon, centered beside the text (defaults to primary). */
export const StatFigure = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StatFigure({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div ref={ref} className={cx(sc("stat-figure"), className)} {...rest} />
  );
});
