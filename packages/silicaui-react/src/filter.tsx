import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

interface FilterContextValue {
  value: string | undefined;
  select: (value: string | undefined) => void;
  disabled?: boolean;
}

const FilterContext = React.createContext<FilterContextValue | null>(null);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

export interface FilterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
  /** Controlled selected value (`undefined` = nothing selected). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with the new value, or `undefined` when reset. */
  onValueChange?: (value: string | undefined) => void;
  /** Accent for the selected chip. */
  color?: SilicaColor;
  /** Disable every chip + the reset. */
  disabled?: boolean;
  /** Render the reset (×) once something is selected (default true). */
  showReset?: boolean;
  /** Accessible label for the reset control. */
  resetLabel?: string;
}

/**
 * Silica Filter — a single-select row of chips with a reset, for faceted
 * product/category filtering. Radio semantics: one chip at a time; the reset
 * clears the choice. Pair with `FilterItem`s.
 *
 *   <Filter defaultValue="all" color="primary">
 *     <FilterItem value="all">All</FilterItem>
 *     <FilterItem value="apparel">Apparel</FilterItem>
 *     <FilterItem value="gear">Gear</FilterItem>
 *   </Filter>
 */
export function Filter({
  value,
  defaultValue,
  onValueChange,
  color,
  disabled,
  showReset = true,
  resetLabel = "Reset filter",
  className,
  children,
  ...rest
}: FilterProps) {
  const sc = useSilicaClass();
  const [internal, setInternal] = React.useState<string | undefined>(
    defaultValue,
  );
  const current = value !== undefined ? value : internal;

  const select = React.useCallback(
    (v: string | undefined) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange],
  );

  const ctx = React.useMemo<FilterContextValue>(
    () => ({ value: current, select, disabled }),
    [current, select, disabled],
  );

  return (
    <FilterContext.Provider value={ctx}>
      <div
        role="radiogroup"
        className={cx(sc("filter"), color && sc(`filter-${color}`), className)}
        {...rest}
      >
        {showReset && current != null && (
          <button
            type="button"
            className={cx(sc("filter-reset"))}
            aria-label={resetLabel}
            onClick={() => select(undefined)}
            disabled={disabled}
          >
            <CloseIcon />
          </button>
        )}
        {children}
      </div>
    </FilterContext.Provider>
  );
}

export interface FilterItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** This chip's value. */
  value: string;
}

/** One selectable chip within a Filter. */
export const FilterItem = React.forwardRef<HTMLButtonElement, FilterItemProps>(
  function FilterItem({ value, disabled, className, children, onClick, ...rest }, ref) {
    const sc = useSilicaClass();
    const group = React.useContext(FilterContext);
    const selected = group?.value === value;
    const isDisabled = disabled ?? group?.disabled;
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        data-selected={selected ? "" : undefined}
        disabled={isDisabled}
        className={cx(sc("filter-item"), className)}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) group?.select(value);
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
