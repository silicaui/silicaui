import * as React from "react";
import { NumberField as BaseNumberField } from "@base-ui-components/react/number-field";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export interface NumberFieldProps extends Styled<typeof BaseNumberField.Root> {
  /** Accessible label for the input. */
  label?: string;
}

/**
 * Silica NumberField — a stepper input (Base UI: clamping, keyboard, scrub).
 *
 *   <NumberField defaultValue={1} min={0} max={10} onValueChange={setQty} />
 */
export function NumberField({ className, label, ...rest }: NumberFieldProps) {
  const sc = useSilicaClass();
  return (
    <BaseNumberField.Root className={cx(sc("number-field"), className)} {...rest}>
      <BaseNumberField.Group className={cx(sc("number-field-group"))}>
        <BaseNumberField.Decrement
          className={cx(sc("number-field-button"), sc("number-field-decrement"))}
        >
          <MinusIcon />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input
          aria-label={label}
          className={cx(sc("number-field-input"))}
        />
        <BaseNumberField.Increment
          className={cx(sc("number-field-button"), sc("number-field-increment"))}
        >
          <PlusIcon />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
