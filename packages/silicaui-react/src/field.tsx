import * as React from "react";
import { Field as BaseField } from "@base-ui-components/react/field";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type FieldProps = Styled<typeof BaseField.Root>;
export type FieldLabelProps = Styled<typeof BaseField.Label>;
export type FieldControlProps = Styled<typeof BaseField.Control>;
export type FieldDescriptionProps = Styled<typeof BaseField.Description>;
export type FieldErrorProps = Styled<typeof BaseField.Error>;

/**
 * Silica Field — an accessible form field. Base UI wires the label, control,
 * description, and error together (ids, aria, validity tracking); Silica styles
 * them. Wrap any Silica control.
 *
 *   <Field name="email">
 *     <FieldLabel>Email</FieldLabel>
 *     <FieldControl type="email" required placeholder="you@example.com" />
 *     <FieldDescription>We'll never share it.</FieldDescription>
 *     <FieldError />
 *   </Field>
 *
 * For a non-input control, pass it via `render`:
 *   <FieldControl render={<Textarea />} />
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  { className, ...rest },
  ref,
) {
  const sc = useSilicaClass();
  return (
    <BaseField.Root ref={ref} className={cx(sc("field"), className)} {...rest} />
  );
});

export const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  function FieldLabel({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseField.Label
        ref={ref}
        className={cx(sc("field-label"), className)}
        {...rest}
      />
    );
  },
);

/**
 * The control. Defaults to a native input styled as a Silica `.input`; when you
 * pass `render` (a Textarea/Select/etc.), it carries its own styling instead.
 */
export const FieldControl = React.forwardRef<
  HTMLInputElement,
  FieldControlProps
>(function FieldControl({ className, render, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseField.Control
      ref={ref}
      render={render}
      className={cx(render ? undefined : sc("input"), className)}
      {...rest}
    />
  );
});

export const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FieldDescriptionProps
>(function FieldDescription({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseField.Description
      ref={ref}
      className={cx(sc("field-description"), className)}
      {...rest}
    />
  );
});

/** Error message; renders only when the field is invalid. */
export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  function FieldError({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseField.Error
        ref={ref}
        className={cx(sc("field-error"), className)}
        {...rest}
      />
    );
  },
);
