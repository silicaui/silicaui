import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type TimelineOrientation = "vertical" | "horizontal";

export interface TimelineProps extends React.HTMLAttributes<HTMLUListElement> {
  /** `vertical` (default) or `horizontal`. */
  orientation?: TimelineOrientation;
}

/**
 * Silica Timeline — a sequence of dated events with a connecting rail.
 *
 *   <Timeline>
 *     <TimelineItem>
 *       <TimelineStart>2021</TimelineStart>
 *       <TimelineMiddle />
 *       <TimelineEnd box>Founded</TimelineEnd>
 *     </TimelineItem>
 *     <TimelineItem>
 *       <TimelineStart>2024</TimelineStart>
 *       <TimelineMiddle />
 *       <TimelineEnd box>Shipped 1.0</TimelineEnd>
 *     </TimelineItem>
 *   </Timeline>
 *
 * Renders `<ul>` / `<li>`. Any slot is optional — omit `<TimelineStart>` for a
 * one-sided timeline. `<TimelineMiddle>` renders a default dot when empty.
 */
export const Timeline = React.forwardRef<HTMLUListElement, TimelineProps>(
  function Timeline({ orientation = "vertical", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <ul
        ref={ref}
        className={cx(
          sc("timeline"),
          orientation === "horizontal" && sc("timeline-horizontal"),
          className,
        )}
        {...rest}
      />
    );
  },
);

export type TimelineItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  function TimelineItem({ className, ...rest }, ref) {
    return <li ref={ref} className={className} {...rest} />;
  },
);

export type TimelineStartProps = React.HTMLAttributes<HTMLDivElement>;

/** The opposite-side label (e.g. a date). */
export const TimelineStart = React.forwardRef<HTMLDivElement, TimelineStartProps>(
  function TimelineStart({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <div ref={ref} className={cx(sc("timeline-start"), className)} {...rest} />;
  },
);

export type TimelineMiddleProps = React.HTMLAttributes<HTMLDivElement>;

/** The marker on the rail. Renders a default dot when given no children. */
export const TimelineMiddle = React.forwardRef<HTMLDivElement, TimelineMiddleProps>(
  function TimelineMiddle({ className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div ref={ref} className={cx(sc("timeline-middle"), className)} {...rest}>
        {children ?? <span className={cx(sc("timeline-dot"))} />}
      </div>
    );
  },
);

export interface TimelineEndProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Wrap the content in a bordered card. */
  box?: boolean;
}

/** The event content. Set `box` to wrap it in a bordered card. */
export const TimelineEnd = React.forwardRef<HTMLDivElement, TimelineEndProps>(
  function TimelineEnd({ box, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("timeline-end"), box && sc("timeline-box"), className)}
        {...rest}
      />
    );
  },
);
