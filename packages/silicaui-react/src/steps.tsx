import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type StepColor = SilicaColor;

export interface StepsProps extends React.OlHTMLAttributes<HTMLOListElement> {}

/**
 * Silica Steps — a horizontal progress tracker. Children are `<Step>`s; color
 * the ones up to (and including) the current step to show completion.
 *
 *   <Steps>
 *     <Step color="primary" data-content="✓">Cart</Step>
 *     <Step color="primary">Shipping</Step>
 *     <Step>Payment</Step>
 *     <Step>Done</Step>
 *   </Steps>
 */
export const Steps = React.forwardRef<HTMLOListElement, StepsProps>(
  function Steps({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <ol ref={ref} className={cx(sc("steps"), className)} {...rest} />;
  },
);

export interface StepProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Paints the node + incoming connector; maps to `step-<color>`. */
  color?: StepColor;
  /** Glyph shown in the node instead of its number (e.g. a check). */
  "data-content"?: string;
}

/** A single node + label in a `<Steps>` track. */
export const Step = React.forwardRef<HTMLLIElement, StepProps>(
  function Step({ color, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <li
        ref={ref}
        className={cx(sc("step"), color && sc(`step-${color}`), className)}
        {...rest}
      />
    );
  },
);
