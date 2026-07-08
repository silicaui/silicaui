import * as React from "react";
import { Field as BaseField } from "@base-ui-components/react/field";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { InputGroup, InputGroupAddon } from "./input-group";
import { Loading } from "./loading";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type FieldStatusValue = "error" | "warning" | "success";

export interface FieldProps extends Styled<typeof BaseField.Root> {
  /** Validation status; drives the control's accent, trailing icon, and (with `statusMessage`) the message panel. */
  status?: FieldStatusValue;
  /** Shown via an auto-rendered `FieldStatus` when set (in addition to any `FieldStatus` you compose manually). */
  statusMessage?: React.ReactNode;
  /** Shows a spinner in the control's trailing slot, independent of `status`. */
  loading?: boolean;
  /** Shown next to a disabled control instead of a `Tooltip` (disabled elements don't fire hover events). */
  disabledMessage?: React.ReactNode;
}
export interface FieldLabelProps extends Styled<typeof BaseField.Label> {
  /** Appends a required-field asterisk after the label text. */
  required?: boolean;
}
export type FieldControlProps = Styled<typeof BaseField.Control>;
export type FieldDescriptionProps = Styled<typeof BaseField.Description>;
export type FieldErrorProps = Styled<typeof BaseField.Error>;

interface FieldStatusContextValue {
  status?: FieldStatusValue;
  loading?: boolean;
  disabled?: boolean;
  disabledMessage?: React.ReactNode;
}
const FieldStatusContext = React.createContext<FieldStatusContextValue>({});

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
  </svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
    <path d="M12 10v4" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const STATUS_ICONS: Record<FieldStatusValue, React.ReactNode> = {
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  success: <SuccessIcon />,
};

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
 *
 * Validation status (error/warning/success), a loading spinner, and a disabled
 * explanation compose onto the SAME `Input`/`Select`/`Textarea` — no special
 * "validated input" component:
 *
 *   <Field status="error" statusMessage="Please enter a valid email address.">
 *     <FieldLabel>Email</FieldLabel>
 *     <FieldControl type="email" />
 *   </Field>
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  { className, status, statusMessage, loading, disabled, disabledMessage, children, ...rest },
  ref,
) {
  const sc = useSilicaClass();
  const ctx = React.useMemo<FieldStatusContextValue>(
    () => ({ status, loading, disabled, disabledMessage }),
    [status, loading, disabled, disabledMessage],
  );
  return (
    <BaseField.Root
      ref={ref}
      disabled={disabled}
      className={cx(sc("field"), className)}
      {...rest}
    >
      <FieldStatusContext.Provider value={ctx}>
        {children}
        {statusMessage != null && <FieldStatus>{statusMessage}</FieldStatus>}
        {disabled && disabledMessage != null && (
          <FieldStatus attached={false}>{disabledMessage}</FieldStatus>
        )}
      </FieldStatusContext.Provider>
    </BaseField.Root>
  );
});

export const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  function FieldLabel({ required, className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseField.Label
        ref={ref}
        className={cx(sc("field-label"), className)}
        {...rest}
      >
        {children}
        {required && (
          <span className={cx(sc("label-required"))} aria-hidden="true">
            *
          </span>
        )}
      </BaseField.Label>
    );
  },
);

/**
 * The control. Defaults to a native input styled as a Silica `.input`; when you
 * pass `render` (a Textarea/Select/etc.), it carries its own styling instead.
 *
 * When the surrounding `Field` has an active `status` or `loading`, the control
 * automatically gets the matching accent color plus (for the default native-input
 * case) a trailing status icon in its `input-affix-end` slot — reusing the same
 * `InputGroup` mechanism `PasswordInput`/`SearchInput` use, not a special input.
 */
export const FieldControl = React.forwardRef<
  HTMLInputElement,
  FieldControlProps
>(function FieldControl({ className, render, disabled, ...rest }, ref) {
  const sc = useSilicaClass();
  const { status, loading, disabled: fieldDisabled } = React.useContext(
    FieldStatusContext,
  );
  const isDisabled = disabled ?? fieldDisabled;
  const statusClass = status && sc(`input-${status}`);

  const control = (
    <BaseField.Control
      ref={ref}
      render={render}
      disabled={isDisabled}
      data-status={status}
      className={cx(
        render ? undefined : sc("input"),
        !render && (loading || status) && sc("input-affix-end"),
        statusClass,
        className,
      )}
      {...rest}
    />
  );

  // Icon injection only applies to the default native-input render path — a
  // `render`-based custom control (Select/Textarea/etc.) already carries its
  // own styling and affix handling, if any.
  if (render || (!loading && !status)) return control;

  return (
    <InputGroup>
      {control}
      <InputGroupAddon placement="end">
        {loading ? (
          <Loading size="xs" />
        ) : (
          status && STATUS_ICONS[status]
        )}
      </InputGroupAddon>
    </InputGroup>
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

export interface FieldStatusProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Overrides the ambient `Field status`; only needed outside a `Field` or to show a different color than the field's own. */
  status?: FieldStatusValue;
  /**
   * Flush, colored panel directly under a bordered control (default, when inside
   * a `Field`). Set `false` for checkboxes/switches/custom controls where an
   * attached panel would visually overlap — renders a plain colored text row
   * instead. Astryx calls this split out explicitly; matches controls we already
   * ship (`Checkbox`/`Switch`/`Radio` want `attached={false}`).
   */
  attached?: boolean;
}

/**
 * Silica FieldStatus — the message half of the FieldStatus system (see `Field`'s
 * `status`/`statusMessage` for the auto-rendered case). Renders nothing when
 * `children` is empty, so an idle field never reserves layout space for it.
 *
 *   <FieldStatus attached={false}>This field is required</FieldStatus>
 */
export const FieldStatus = React.forwardRef<HTMLParagraphElement, FieldStatusProps>(
  function FieldStatus({ status, attached = true, className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const ctx = React.useContext(FieldStatusContext);
    const resolved = status ?? ctx.status;
    if (children == null || children === "") return null;
    return (
      <p
        ref={ref}
        className={cx(
          sc("field-status"),
          sc(`field-status-${attached ? "attached" : "detached"}`),
          resolved && sc(`field-status-${resolved}`),
          className,
        )}
        {...rest}
      >
        {resolved && !ctx.loading && (
          <span aria-hidden="true">{STATUS_ICONS[resolved]}</span>
        )}
        {children}
      </p>
    );
  },
);
