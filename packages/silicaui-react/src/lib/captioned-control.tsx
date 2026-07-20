import * as React from "react";
import { cx } from "./cx";
import { useSilicaClass } from "./config";

/**
 * Shared rendering for the three controls that are a restyled native
 * `<input>` but read naturally with a caption: `Checkbox`, `Radio`, `Toggle`.
 *
 * Without children the control renders bare, exactly as before — a consumer
 * pairing it with their own `<label htmlFor>` is unaffected.
 *
 * With children the control is wrapped in a `<label>` so the caption is a real
 * click target. This mirrors what `silicaui-html` already lowers
 * `CheckboxOption` / `RadioOption` to (`component.ts`), so the two layers
 * agree on one DOM shape rather than each having its own.
 *
 * `className` stays on the `<input>` — it's the control's class, and moving it
 * to the wrapper on the children path would make the same prop mean two
 * different things depending on an unrelated argument.
 */
export function CaptionedControl({
  input,
  children,
}: {
  input: React.ReactElement;
  children?: React.ReactNode;
}) {
  const sc = useSilicaClass();
  if (children === undefined || children === null || children === false) {
    return input;
  }
  return (
    <label className={cx(sc("label"), sc("label-control"))}>
      {input}
      {children}
    </label>
  );
}
