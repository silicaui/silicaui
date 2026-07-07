import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface FieldsetProps
  extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {}

/**
 * Silica Fieldset — a labeled, vertically-stacked group of form controls.
 *
 *   <Fieldset>
 *     <FieldsetLegend>Profile</FieldsetLegend>
 *     <Input placeholder="Name" />
 *     <FieldsetLabel>Your full legal name.</FieldsetLabel>
 *   </Fieldset>
 *
 * Renders a native `<fieldset>` (chrome reset in CSS) so `disabled` cascades to
 * every control inside it for free.
 */
export const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <fieldset ref={ref} className={cx(sc("fieldset"), className)} {...rest} />
    );
  },
);

export interface FieldsetLegendProps
  extends React.HTMLAttributes<HTMLLegendElement> {}

/** The group heading. Renders a native `<legend>`. */
export const FieldsetLegend = React.forwardRef<
  HTMLLegendElement,
  FieldsetLegendProps
>(function FieldsetLegend({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <legend ref={ref} className={cx(sc("fieldset-legend"), className)} {...rest} />
  );
});

export interface FieldsetLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

/** Muted helper/hint text under a control. */
export const FieldsetLabel = React.forwardRef<
  HTMLSpanElement,
  FieldsetLabelProps
>(function FieldsetLabel({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <span ref={ref} className={cx(sc("fieldset-label"), className)} {...rest} />
  );
});
