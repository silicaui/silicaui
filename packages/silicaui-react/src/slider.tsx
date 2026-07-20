import * as React from "react";
import { Slider as BaseSlider } from "@base-ui-components/react/slider";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type SliderColor = SilicaColor;
export type SliderSize = SilicaSize;

export interface SliderProps
  extends Omit<Styled<typeof BaseSlider.Root>, "color"> {
  /** Accent for the filled track + thumb(s). */
  color?: SilicaColor;
  /** Rail thickness + thumb diameter. */
  size?: SliderSize;
  /** Show a live numeric readout beside the track. */
  showValue?: boolean;
}

/**
 * Silica Slider — a rich range input (Base UI behavior). Pass a number for a
 * single thumb, or a tuple for a two-thumb range selection; the number of thumbs
 * follows the shape of `value`/`defaultValue`.
 *
 *   <Slider defaultValue={40} color="primary" showValue />
 *   <Slider defaultValue={[20, 60]} min={0} max={100} step={5} />
 *   <Slider orientation="vertical" defaultValue={50} />
 */
export const Slider = React.forwardRef<
  React.ComponentRef<typeof BaseSlider.Root>,
  SliderProps
>(function Slider(
  { color, size = "md", showValue, className, value, defaultValue, ...rest },
  ref,
) {
  const sc = useSilicaClass();
  const src = value ?? defaultValue;
  const thumbCount = Array.isArray(src) ? Math.max(src.length, 1) : 1;

  return (
    <BaseSlider.Root
      ref={ref}
      value={value as number | readonly number[] | undefined}
      defaultValue={defaultValue as number | readonly number[] | undefined}
      className={cx(
        sc("slider"),
        color && sc(`slider-${color}`),
        size !== "md" && sc(`slider-${size}`),
        className,
      )}
      {...rest}
    >
      {showValue && <BaseSlider.Value className={cx(sc("slider-value"))} />}
      <BaseSlider.Control className={cx(sc("slider-control"))}>
        <BaseSlider.Track className={cx(sc("slider-track"))}>
          <BaseSlider.Indicator className={cx(sc("slider-indicator"))} />
          {Array.from({ length: thumbCount }, (_, i) => (
            <BaseSlider.Thumb key={i} className={cx(sc("slider-thumb"))} />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
});
