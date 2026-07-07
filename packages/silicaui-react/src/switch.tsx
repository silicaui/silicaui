import * as React from "react";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type SwitchColor = SilicaColor;
export type SwitchSize = SilicaSize;

export interface SwitchProps
  extends Omit<Styled<typeof BaseSwitch.Root>, "color"> {
  /** Accent for the checked track. */
  color?: SilicaColor;
  /** Track height (width follows at 1.75×). */
  size?: SilicaSize;
}

/**
 * Silica Switch — an accessible on/off toggle (Base UI: `role="switch"` with a
 * hidden real input, so it submits in a form and pairs with `Field`). The CSS
 * cousin `Toggle` is a bare restyled checkbox; reach for `Switch` when you want
 * proper switch semantics or form integration.
 *
 *   <Switch defaultChecked color="success" />
 *   <Switch checked={on} onCheckedChange={setOn} />
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof BaseSwitch.Root>,
  SwitchProps
>(function Switch({ color, size = "md", className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseSwitch.Root
      ref={ref}
      className={cx(
        sc("switch"),
        color && sc(`switch-${color}`),
        size !== "md" && sc(`switch-${size}`),
        className,
      )}
      {...rest}
    >
      <BaseSwitch.Thumb className={cx(sc("switch-thumb"))} />
    </BaseSwitch.Root>
  );
});
