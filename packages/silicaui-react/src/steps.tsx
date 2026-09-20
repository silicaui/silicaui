import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type StepColor = SilicaColor;

export interface StepsProps extends React.OlHTMLAttributes<HTMLOListElement> {
  /**
   * Stack the steps down the page instead of across it.
   *
   * Spelled the same as `Stats`, which has had this since it shipped. Added
   * after a daisyUI migration needed an order's progress down the side of a
   * card and found `steps-vertical` had no equivalent here at all
   * (docs/personas/issues/100).
   */
  vertical?: boolean;
}

/**
 * Silica Steps — a progress tracker. Children are `<Step>`s; color the ones up
 * to (and including) the current step to show completion.
 *
 *   <Steps>
 *     <Step color="primary" data-content="✓">Cart</Step>
 *     <Step color="primary">Shipping</Step>
 *     <Step>Payment</Step>
 *     <Step>Done</Step>
 *   </Steps>
 *
 *   <Steps vertical>…</Steps>   // down a narrow column instead of across
 */
export const Steps = React.forwardRef<HTMLOListElement, StepsProps>(
  function Steps({ vertical = false, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <ol
        ref={ref}
        className={cx(sc("steps"), vertical && sc("steps-vertical"), className)}
        {...rest}
      />
    );
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
