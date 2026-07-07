import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type IndicatorPlacement =
  | "top-end"
  | "top-start"
  | "bottom-end"
  | "bottom-start";

export interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * Silica Indicator — pins an overlay to a corner of its content.
 *
 *   <Indicator>
 *     <IndicatorItem><Badge color="error" size="xs">3</Badge></IndicatorItem>
 *     <Button variant="outline">Inbox</Button>
 *   </Indicator>
 *
 * The item comes first; the element it decorates follows.
 */
export const Indicator = React.forwardRef<HTMLSpanElement, IndicatorProps>(
  function Indicator({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <span ref={ref} className={cx(sc("indicator"), className)} {...rest} />
    );
  },
);

export interface IndicatorItemProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which corner. Default `top-end`. */
  placement?: IndicatorPlacement;
}

/** The pinned overlay (usually a Badge or dot). */
export const IndicatorItem = React.forwardRef<
  HTMLSpanElement,
  IndicatorItemProps
>(function IndicatorItem({ placement = "top-end", className, ...rest }, ref) {
  const sc = useSilicaClass();
  const start = placement === "top-start" || placement === "bottom-start";
  const bottom = placement === "bottom-end" || placement === "bottom-start";
  return (
    <span
      ref={ref}
      className={cx(
        sc("indicator-item"),
        start && sc("indicator-start"),
        bottom && sc("indicator-bottom"),
        className,
      )}
      {...rest}
    />
  );
});
