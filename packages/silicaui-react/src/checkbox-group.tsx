import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

interface CheckboxGroupContextValue {
  value: string[];
  toggle: (value: string, checked: boolean) => void;
  disabled?: boolean;
  color?: SilicaColor;
  size?: SilicaSize;
}

const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextValue | null>(null);

export type CheckboxGroupOrientation = "vertical" | "horizontal";

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled array of checked values. */
  value?: string[];
  /** Uncontrolled initial checked values. */
  defaultValue?: string[];
  /** Fires with the new array of checked values. */
  onValueChange?: (value: string[]) => void;
  /** Stack (`vertical`, default) or row (`horizontal`). */
  orientation?: CheckboxGroupOrientation;
  /** Disable every option. */
  disabled?: boolean;
  /** Default accent color for the options. */
  color?: SilicaColor;
  /** Default size for the options. */
  size?: SilicaSize;
}

/**
 * Silica CheckboxGroup — a managed set of checkboxes whose value is the array of
 * checked items. Pair with `CheckboxOption`s.
 *
 *   <CheckboxGroup defaultValue={["email"]}>
 *     <CheckboxOption value="email">Email</CheckboxOption>
 *     <CheckboxOption value="sms">SMS</CheckboxOption>
 *   </CheckboxGroup>
 */
export function CheckboxGroup({
  value,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  disabled,
  color,
  size,
  className,
  children,
  ...rest
}: CheckboxGroupProps) {
  const sc = useSilicaClass();
  const [internal, setInternal] = React.useState<string[]>(defaultValue ?? []);
  const current = value !== undefined ? value : internal;

  const toggle = React.useCallback(
    (v: string, checked: boolean) => {
      const next = checked
        ? [...current, v]
        : current.filter((x) => x !== v);
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [current, value, onValueChange],
  );

  const ctx = React.useMemo<CheckboxGroupContextValue>(
    () => ({ value: current, toggle, disabled, color, size }),
    [current, toggle, disabled, color, size],
  );

  return (
    <CheckboxGroupContext.Provider value={ctx}>
      <div
        role="group"
        data-orientation={orientation}
        className={cx(sc("checkbox-group"), className)}
        {...rest}
      >
        {children}
      </div>
    </CheckboxGroupContext.Provider>
  );
}

export interface CheckboxOptionProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  /** This option's value. */
  value: string;
  disabled?: boolean;
  color?: SilicaColor;
  size?: SilicaSize;
}

/** One labeled checkbox within a CheckboxGroup. */
export function CheckboxOption({
  value,
  disabled,
  color,
  size,
  className,
  children,
  ...rest
}: CheckboxOptionProps) {
  const sc = useSilicaClass();
  const group = React.useContext(CheckboxGroupContext);
  const c = color ?? group?.color;
  const s = size ?? group?.size ?? "md";
  const isDisabled = disabled ?? group?.disabled;
  const checkboxClasses = cx(
    sc("checkbox"),
    c && sc(`checkbox-${c}`),
    s !== "md" && sc(`checkbox-${s}`),
  );
  return (
    <label className={cx(sc("checkbox-option"), className)} {...rest}>
      <input
        type="checkbox"
        className={checkboxClasses}
        value={value}
        checked={group ? group.value.includes(value) : undefined}
        onChange={
          group ? (e) => group.toggle(value, e.target.checked) : undefined
        }
        disabled={isDisabled}
      />
      {children != null && <span>{children}</span>}
    </label>
  );
}
