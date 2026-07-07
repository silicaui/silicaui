import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  disabled?: boolean;
  color?: SilicaColor;
  size?: SilicaSize;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);

export type RadioGroupOrientation = "vertical" | "horizontal";

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with the newly-selected value. */
  onValueChange?: (value: string) => void;
  /** Shared radio `name` (auto-generated if omitted). */
  name?: string;
  /** Stack (`vertical`, default) or row (`horizontal`). */
  orientation?: RadioGroupOrientation;
  /** Disable every option. */
  disabled?: boolean;
  /** Default accent color for the options. */
  color?: SilicaColor;
  /** Default size for the options. */
  size?: SilicaSize;
}

/**
 * Silica RadioGroup — a managed set of radios (native inputs, so arrow-key
 * navigation comes free). Pair with `RadioOption`s.
 *
 *   <RadioGroup defaultValue="card" name="pay">
 *     <RadioOption value="card">Card</RadioOption>
 *     <RadioOption value="ach">Bank transfer</RadioOption>
 *   </RadioGroup>
 */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  orientation = "vertical",
  disabled,
  color,
  size,
  className,
  children,
  ...rest
}: RadioGroupProps) {
  const sc = useSilicaClass();
  const autoName = React.useId();
  const [internal, setInternal] = React.useState<string | undefined>(
    defaultValue,
  );
  const current = value !== undefined ? value : internal;

  const select = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange],
  );

  const ctx = React.useMemo<RadioGroupContextValue>(
    () => ({ name: name ?? autoName, value: current, select, disabled, color, size }),
    [name, autoName, current, select, disabled, color, size],
  );

  return (
    <RadioGroupContext.Provider value={ctx}>
      <div
        role="radiogroup"
        data-orientation={orientation}
        className={cx(sc("radio-group"), className)}
        {...rest}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioOptionProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  /** This option's value. */
  value: string;
  disabled?: boolean;
  color?: SilicaColor;
  size?: SilicaSize;
}

/** One labeled radio within a RadioGroup. */
export function RadioOption({
  value,
  disabled,
  color,
  size,
  className,
  children,
  ...rest
}: RadioOptionProps) {
  const sc = useSilicaClass();
  const group = React.useContext(RadioGroupContext);
  const c = color ?? group?.color;
  const s = size ?? group?.size ?? "md";
  const isDisabled = disabled ?? group?.disabled;
  const radioClasses = cx(
    sc("radio"),
    c && sc(`radio-${c}`),
    s !== "md" && sc(`radio-${s}`),
  );
  return (
    <label className={cx(sc("radio-option"), className)} {...rest}>
      <input
        type="radio"
        className={radioClasses}
        name={group?.name}
        value={value}
        checked={group ? group.value === value : undefined}
        onChange={group ? () => group.select(value) : undefined}
        disabled={isDisabled}
      />
      {children != null && <span>{children}</span>}
    </label>
  );
}
