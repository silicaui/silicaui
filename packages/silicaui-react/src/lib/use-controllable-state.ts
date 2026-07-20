import * as React from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When present, the hook mirrors this instead of internal state. */
  value?: T;
  /** Uncontrolled initial value. */
  defaultValue: T;
  onChange?: (value: T) => void;
}

/**
 * The controlled/uncontrolled pattern (`value !== undefined` ? mirror it : own
 * state), as one hook — for Silica's own components and for yours.
 *
 *   const [value, setValue] = useControllableState({ value: propValue, defaultValue: "", onChange: onValueChange });
 *   setValue("next");                 // or setValue((prev) => prev + "!")
 *
 * Note the callback a Silica component exposes for this is named
 * **`onValueChange`**, not `onChange` — `onChange` stays reserved for the
 * native DOM handler on components that wrap a real form element. Pass it
 * through as the `onChange` option here.
 *
 * Adoption inside Silica is partial and ongoing: components written before
 * this hook existed still hand-roll the same logic inline. New components
 * should use it, and existing ones are being migrated as they're touched —
 * `rating.tsx` is the reference.
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
