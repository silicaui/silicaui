import * as React from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When present, the hook mirrors this instead of internal state. */
  value?: T;
  /** Uncontrolled initial value. */
  defaultValue: T;
  onChange?: (value: T) => void;
}

/**
 * The controlled/uncontrolled pattern every Silica component uses internally
 * (`value !== undefined` ? mirror it : own state), exposed so you can build
 * your own Silica-consistent components without reimplementing it.
 *
 *   const [value, setValue] = useControllableState({ value: propValue, defaultValue: "", onChange });
 *   setValue("next");                 // or setValue((prev) => prev + "!")
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const current = isControlled ? (value as T) : internal;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (!isControlled) setInternal(resolved);
      onChangeRef.current?.(resolved);
    },
    [current, isControlled],
  );

  return [current, setValue];
}
