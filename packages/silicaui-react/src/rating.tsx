import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { useControllableState } from "./lib/use-controllable-state";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type RatingColor = SilicaColor;
export type RatingSize = SilicaSize;

export interface RatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled value (number of filled stars). */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Called with the new rating whenever it changes. */
  onValueChange?: (value: number) => void;
  /**
   * @deprecated Use `onValueChange`. `onChange` is reserved for the native DOM
   * handler on components that wrap a real form element; still honored here so
   * this isn't a breaking change.
   */
  onChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** Accent color for filled stars. Default warning (gold). */
  color?: RatingColor;
  /** Star size. */
  size?: RatingSize;
  /** Render non-interactive. */
  readOnly?: boolean;
  /** Custom star icon (defaults to a filled star). */
  icon?: React.ReactNode;
  /** Accessible label for the group. */
  label?: string;
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/**
 * Silica Rating — a row of star buttons.
 *
 *   <Rating defaultValue={3} onValueChange={setStars} />
 *   <Rating value={4.5 | 4} color="warning" readOnly />
 *
 * Keyboard: arrow keys change the value; Home/End jump to 1/max.
 */
export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  onChange,
  max = 5,
  color,
  size,
  readOnly,
  icon,
  label = "Rating",
  className,
  ...rest
}: RatingProps) {
  const sc = useSilicaClass();
  const [current, commit] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange ?? onChange,
  });
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? current;
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const setValue = (v: number) => {
    if (readOnly) return;
    commit(v === current ? 0 : v); // click the current star to clear
  };

  const focusStar = (i: number) => {
    const clamped = Math.max(1, Math.min(max, i));
    refs.current[clamped - 1]?.focus();
    commit(clamped);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (readOnly) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      focusStar(i + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      focusStar(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusStar(1);
    } else if (e.key === "End") {
      e.preventDefault();
      focusStar(max);
    }
  };

  const activeIndex = current > 0 ? current - 1 : 0;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        sc("rating"),
        color && sc(`rating-${color}`),
        size && sc(`rating-${size}`),
        readOnly && sc("rating-readonly"),
        className,
      )}
      onMouseLeave={() => setHover(null)}
      {...rest}
    >
      {Array.from({ length: max }, (_, idx) => {
        const starValue = idx + 1;
        return (
          <button
            key={starValue}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={current === starValue}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            tabIndex={readOnly ? -1 : idx === activeIndex ? 0 : -1}
            disabled={readOnly}
            data-filled={starValue <= shown}
            className={cx(sc("rating-item"))}
            onClick={() => setValue(starValue)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onKeyDown={(e) => onKeyDown(e, starValue)}
          >
            {icon ?? <StarIcon />}
          </button>
        );
      })}
    </div>
  );
}
