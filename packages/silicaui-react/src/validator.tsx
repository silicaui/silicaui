import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface ValidatorProps {
  /** A single form control to apply validity-driven coloring to. */
  children: React.ReactElement<{ className?: string }>;
}

/**
 * Silica Validator — recolors its child control by validity.
 *
 *   <Validator><Input required type="email" /></Validator>
 *   <ValidatorHint>Enter a valid email address.</ValidatorHint>
 *
 * Adds the `validator` class to the child so the field flips to error/success
 * on `:user-invalid` / `:user-valid` (after the user interacts) or on an
 * explicit `aria-invalid`. For the hint to reveal itself, render `<ValidatorHint>`
 * as the immediate next sibling of the control.
 */
export function Validator({ children }: ValidatorProps) {
  const sc = useSilicaClass();
  if (!React.isValidElement(children)) return <>{children}</>;
  return React.cloneElement(children, {
    className: cx(sc("validator"), children.props.className),
  });
}

export interface ValidatorHintProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/** Error message that stays hidden until the preceding control is invalid. */
export const ValidatorHint = React.forwardRef<
  HTMLParagraphElement,
  ValidatorHintProps
>(function ValidatorHint({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <p ref={ref} className={cx(sc("validator-hint"), className)} {...rest} />
  );
});
