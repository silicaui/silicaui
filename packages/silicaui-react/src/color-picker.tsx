import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import {
  MAX_CHROMA,
  oklchToHex,
  hexToOklch,
  formatOklch,
  parseOklch,
  type Oklch,
} from "./lib/oklch";

export type ColorPickerFormat = "oklch" | "hex";

/** `"panel"` (default) is the full slider panel inline. `"swatch"` is a compact
 * chip that opens the same panel in a popover — for toolbars and dense forms. */
export type ColorPickerVariant = "panel" | "swatch";

export interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  /** Controlled color (an `oklch(…)` or `#hex` string). */
  value?: string;
  /** Uncontrolled initial color. Default `oklch(0.7 0.15 250)`. */
  defaultValue?: string;
  /** Fires with the formatted string AND the raw OKLCH on every change. */
  onValueChange?: (value: string, oklch: Oklch) => void;
  /** Output format handed to `onValueChange`. Default `"oklch"`. */
  format?: ColorPickerFormat;
  /** Show the hex read/write field. Default `true`. */
  showHex?: boolean;
  /** Default `"panel"`. */
  variant?: ColorPickerVariant;
  disabled?: boolean;
}

const DEFAULT: Oklch = { l: 0.7, c: 0.15, h: 250 };
const clamp = (x: number, lo: number, hi: number) =>
  x < lo ? lo : x > hi ? hi : x;

function parseInput(s: string | undefined): Oklch {
  if (!s) return DEFAULT;
  return parseOklch(s) ?? hexToOklch(s) ?? DEFAULT;
}

interface ColorSliderProps {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  trackStyle: React.CSSProperties;
  disabled?: boolean;
  onChange: (v: number) => void;
}

/** One channel slider: a gradient track with a draggable, keyboard-nav thumb. */
function ColorSlider({
  label,
  valueText,
  min,
  max,
  step,
  value,
  trackStyle,
  disabled,
  onChange,
}: ColorSliderProps) {
  const sc = useSilicaClass();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    onChange(min + ratio * (max - min));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = step * 10;
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    else if (e.key === "PageDown") next = value - big;
    else if (e.key === "PageUp") next = value + big;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next !== null) {
      e.preventDefault();
      onChange(clamp(next, min, max));
    }
  };

  return (
    <div
      ref={trackRef}
      className={cx(sc("color-picker-track"))}
      style={trackStyle}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={disabled ? undefined : onKeyDown}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        setFromClientX(e.clientX);
      }}
    >
      <span
        className={cx(sc("color-picker-thumb"))}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

/**
 * ColorPicker — an OKLCH-native color editor. SilicaUI's tokens are OKLCH, so
 * the picker edits Lightness / Chroma / Hue directly (each slider's track shows
 * the live ramp), previews the result, and reads/writes hex. Controlled via
 * `value`/`onValueChange` or uncontrolled via `defaultValue`.
 */
export const ColorPicker = React.forwardRef<HTMLElement, ColorPickerProps>(
  function ColorPicker(
    {
      value,
      defaultValue,
      onValueChange,
      format = "oklch",
      showHex = true,
      variant = "panel",
      disabled,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<Oklch>(() =>
      parseInput(value ?? defaultValue),
    );
    const [hexDraft, setHexDraft] = React.useState<string | null>(null);

    // Keep internal state in step with a controlled `value`.
    React.useEffect(() => {
      if (isControlled) setInternal(parseInput(value));
    }, [value, isControlled]);

    const { l, c, h } = internal;

    const commit = (next: Oklch) => {
      if (!isControlled) setInternal(next);
      const out =
        format === "hex"
          ? oklchToHex(next.l, next.c, next.h)
          : formatOklch(next.l, next.c, next.h);
      onValueChange?.(out, next);
    };

    const hex = oklchToHex(l, c, h);
    const hexValue = hexDraft ?? hex;

    const commitHex = () => {
      if (hexDraft !== null) {
        const parsed = hexToOklch(hexDraft);
        if (parsed) commit(parsed);
        setHexDraft(null);
      }
    };

    // Live gradient tracks — the real OKLCH ramp for each channel.
    const lTrack = `linear-gradient(to right in oklch, oklch(0 ${c} ${h}), oklch(1 ${c} ${h}))`;
    const cTrack = `linear-gradient(to right in oklch, oklch(${l} 0 ${h}), oklch(${l} ${MAX_CHROMA} ${h}))`;
    const hTrack = `linear-gradient(to right in oklch, oklch(${l} ${c} 0), oklch(${l} ${c} 60), oklch(${l} ${c} 120), oklch(${l} ${c} 180), oklch(${l} ${c} 240), oklch(${l} ${c} 300), oklch(${l} ${c} 360))`;

    const panel = (
      <>
        <div className={cx(sc("color-picker-preview"))}>
          <span
            className={cx(sc("color-picker-swatch"))}
            style={{ backgroundColor: `oklch(${l} ${c} ${h})` }}
          />
          <div className={cx(sc("color-picker-values"))}>
            <span className={cx(sc("color-picker-value-oklch"))}>
              {formatOklch(l, c, h)}
            </span>
            <span className={cx(sc("color-picker-value-hex"))}>{hex}</span>
          </div>
        </div>

        <div className={cx(sc("color-picker-sliders"))}>
          <div className={cx(sc("color-picker-slider"))}>
            <span className={cx(sc("color-picker-slider-label"))}>L</span>
            <ColorSlider
              label="Lightness"
              valueText={l.toFixed(2)}
              min={0}
              max={1}
              step={0.01}
              value={l}
              trackStyle={{ background: lTrack }}
              disabled={disabled}
              onChange={(v) => commit({ l: v, c, h })}
            />
            <span className={cx(sc("color-picker-slider-value"))}>
              {l.toFixed(2)}
            </span>
          </div>

          <div className={cx(sc("color-picker-slider"))}>
            <span className={cx(sc("color-picker-slider-label"))}>C</span>
            <ColorSlider
              label="Chroma"
              valueText={c.toFixed(3)}
              min={0}
              max={MAX_CHROMA}
              step={0.005}
              value={c}
              trackStyle={{ background: cTrack }}
              disabled={disabled}
              onChange={(v) => commit({ l, c: v, h })}
            />
            <span className={cx(sc("color-picker-slider-value"))}>
              {c.toFixed(2)}
            </span>
          </div>

          <div className={cx(sc("color-picker-slider"))}>
            <span className={cx(sc("color-picker-slider-label"))}>H</span>
            <ColorSlider
              label="Hue"
              valueText={`${Math.round(h)}°`}
              min={0}
              max={360}
              step={1}
              value={h}
              trackStyle={{ background: hTrack }}
              disabled={disabled}
              onChange={(v) => commit({ l, c, h: v })}
            />
            <span className={cx(sc("color-picker-slider-value"))}>
              {Math.round(h)}°
            </span>
          </div>
        </div>

        {showHex && (
          <div className={cx(sc("color-picker-hex"))}>
            <span className={cx(sc("color-picker-hex-label"))}>HEX</span>
            <input
              type="text"
              className={cx(sc("color-picker-hex-input"))}
              value={hexValue}
              disabled={disabled}
              spellCheck={false}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitHex();
                }
              }}
            />
          </div>
        )}
      </>
    );

    if (variant === "swatch") {
      return (
        <Popover>
          <PopoverTrigger>
            <button
              ref={forwardedRef as React.Ref<HTMLButtonElement>}
              type="button"
              className={cx(sc("color-picker-swatch-trigger"), className)}
              data-disabled={disabled || undefined}
              disabled={disabled}
              {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            >
              <span
                className={cx(sc("color-picker-swatch-trigger-chip"))}
                style={{ backgroundColor: `oklch(${l} ${c} ${h})` }}
              />
              <span className={cx(sc("color-picker-swatch-trigger-label"))}>
                {hex}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className={cx(sc("color-picker-popover"))}>
            <div className={cx(sc("color-picker"))} data-disabled={disabled || undefined}>
              {panel}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div
        ref={forwardedRef as React.Ref<HTMLDivElement>}
        className={cx(sc("color-picker"), className)}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {panel}
      </div>
    );
  },
);
