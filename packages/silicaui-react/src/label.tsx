import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Appends a required-field asterisk after the label text. */
  required?: boolean;
}

/**
 * Silica Label — a plain, muted caption for a control.
 *
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" />
 *
 *   <Label htmlFor="email" required>Email</Label>   // "Email *"
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ required, className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <label ref={ref} className={cx(sc("label"), className)} {...rest}>
        {children}
        {required && (
          <span className={cx(sc("label-required"))} aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  },
);

export interface FloatingLabelProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "children"> {
  /** Caption text that floats onto the border when the field is focused/filled. */
  label: React.ReactNode;
  /** The control (an `<Input>`, `<Textarea>`, `<select>`, …). */
  children: React.ReactElement<{ placeholder?: string }>;
}

/**
 * Silica FloatingLabel — a caption that rests inside the field and floats up on
 * focus or when the field has a value.
 *
 *   <FloatingLabel label="Email">
 *     <Input type="email" />
 *   </FloatingLabel>
 *
 * The "filled" state relies on `:placeholder-shown`, so the control needs a
 * placeholder — one (a single space) is injected automatically if you don't set
 * your own.
 */
export const FloatingLabel = React.forwardRef<
  HTMLLabelElement,
  FloatingLabelProps
>(function FloatingLabel({ label, children, className, ...rest }, ref) {
  const sc = useSilicaClass();
  // Guarantee a placeholder so the at-rest (non-floated) state resolves.
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        placeholder: children.props.placeholder ?? " ",
      })
    : children;
  return (
    <label
      ref={ref}
      className={cx(sc("floating-label"), className)}
      {...rest}
    >
      {control}
      <span>{label}</span>
    </label>
  );
});
