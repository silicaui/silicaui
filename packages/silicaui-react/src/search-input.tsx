import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";
import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";

export type SearchInputColor = SilicaColor;
export type SearchInputSize = SilicaSize;

export interface SearchInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "color" | "type"
  > {
  /** Accent color; maps to `input-<color>` (border + focus ring). */
  color?: SearchInputColor;
  /** Default `md`. Matches same-size Button/Input heights. */
  size?: SearchInputSize;
  /** Show the trailing clear (×) button once there's a value. Default `true`. */
  clearable?: boolean;
  /** Fires with the next string on every keystroke and on clear. */
  onValueChange?: (value: string) => void;
  /** Fires when the clear (×) button is pressed. */
  onClear?: () => void;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

/**
 * Silica SearchInput — an `Input` with a leading search icon and a trailing
 * clear button that appears once there's a value. Controlled via
 * `value`/`onChange` (or `onValueChange`) like a native input, or uncontrolled
 * via `defaultValue`.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      onClear,
      color,
      size = "md",
      clearable = true,
      className,
      disabled,
      placeholder = "Search…",
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);

    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(
      defaultValue != null ? String(defaultValue) : "",
    );
    const current = isControlled ? String(value) : uncontrolled;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolled(e.target.value);
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) setUncontrolled("");
      onValueChange?.("");
      onClear?.();
      innerRef.current?.focus();
    };

    const showClear = clearable && current.length > 0;

    const classes = cx(
      sc("input"),
      sc("input-affix-start"),
      showClear && sc("input-affix-end"),
      color && sc(`input-${color}`),
      size !== "md" && sc(`input-${size}`),
      className,
    );

    return (
      <InputGroup>
        <InputGroupAddon placement="start">
          <SearchIcon />
        </InputGroupAddon>
        <input
          ref={innerRef}
          type="search"
          className={classes}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          {...rest}
        />
        {showClear && (
          <InputGroupAddon placement="end">
            <InputGroupButton
              disabled={disabled}
              aria-label="Clear search"
              onClick={handleClear}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  },
);
