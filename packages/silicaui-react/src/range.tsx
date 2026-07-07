import * as React from "react";
import { Slider as BaseSlider } from "@base-ui-components/react/slider";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type RangeColor = SilicaColor;

export interface RangeProps extends Styled<typeof BaseSlider.Root> {
  /** Accent color for the filled track + thumb. Default primary. */
  color?: RangeColor;
}

/**
 * Silica Range — a slider (Base UI behavior).
 *
 *   <Range defaultValue={40} onValueChange={setV} />
 *   <Range defaultValue={[20, 60]} color="success" />   // two thumbs
 *
 * Pass an array value/defaultValue for a multi-thumb range.
 */
export function Range({ color, className, value, defaultValue, ...rest }: RangeProps) {
  const sc = useSilicaClass();
  const vals = value ?? defaultValue;
  const thumbCount = Array.isArray(vals) ? vals.length : 1;

  return (
    <BaseSlider.Root
      value={value}
      defaultValue={defaultValue}
      className={cx(sc("range"), color && sc(`range-${color}`), className)}
      {...rest}
    >
      <BaseSlider.Control className={cx(sc("range-control"))}>
        <BaseSlider.Track className={cx(sc("range-track"))}>
          <BaseSlider.Indicator className={cx(sc("range-indicator"))} />
          {Array.from({ length: thumbCount }, (_, i) => (
            <BaseSlider.Thumb
              key={i}
              index={thumbCount > 1 ? i : undefined}
              className={cx(sc("range-thumb"))}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
