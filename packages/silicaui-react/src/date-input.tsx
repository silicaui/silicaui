import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { DateTimeSegment } from "./lib/date-time-segment";
import {
  type DateParts,
  type DateSegmentKey,
  daysInMonth,
  partsFromDate,
  dateFromParts,
  getDateTokens,
  dateOrder,
  parseDateString,
} from "./lib/date-parts";
import type { DateRange } from "./calendar";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type DateInputColor = SilicaColor;
export type DateInputSize = SilicaSize;

export interface DateInputProps {
  /** Controlled value. `null` clears the field. */
  value?: Date | null;
  defaultValue?: Date | null;
  /** Fires once every segment is filled with a valid date; `null` while incomplete/cleared. */
  onValueChange?: (value: Date | null) => void;
  /** Selectable bounds (inclusive); an out-of-range completed date is clamped. */
  min?: Date;
  max?: Date;
  /** BCP-47 locale — drives segment order (MM/DD/YYYY vs DD/MM/YYYY, …) and separators. */
  locale?: string;
  disabled?: boolean;
  color?: DateInputColor;
  size?: DateInputSize;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const SEGMENT_LABEL: Record<DateSegmentKey, string> = {
  month: "Month",
  day: "Day",
  year: "Year",
};

/**
 * Silica DateInput — a typeable, segmented date field (month/day/year cells
 * you type digits into directly, à la native `<input type="date">`), not a
 * calendar-only picker. Digits auto-advance to the next segment; Up/Down
 * steps the focused segment; arrow keys move between segments; pasting a
 * full date (any common format) autofills every segment at once.
 *
 * Segment order and separators come from `Intl` for the given `locale` —
 * never hardcoded to MM/DD/YYYY.
 *
 *   <DateInput value={date} onValueChange={setDate} />
 *   <DateInput locale="en-GB" min={today} />
 */
export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  function DateInput(
    {
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      locale,
      disabled,
      color,
      size = "md",
      className,
      id,
      "aria-label": ariaLabel,
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<DateParts>(() =>
      partsFromDate(value ?? defaultValue),
    );

    React.useEffect(() => {
      if (isControlled) setInternal(partsFromDate(value));
    }, [value, isControlled]);

    const parts = internal;
    const tokens = React.useMemo(() => getDateTokens(locale), [locale]);
    const order = React.useMemo(() => dateOrder(tokens), [tokens]);
    const segmentRefs = React.useRef<Partial<Record<DateSegmentKey, HTMLDivElement | null>>>({});

    function commit(next: DateParts) {
      if (!isControlled) setInternal(next);
      let date = dateFromParts(next);
      if (date) {
        if (min && date < min) date = min;
        if (max && date > max) date = max;
      }
      onValueChange?.(date);
    }

    function setSegment(key: DateSegmentKey, v: number | null) {
      const next: DateParts = { ...parts, [key]: v };
      if (next.day != null) {
        const dim = daysInMonth(next.year, next.month);
        if (next.day > dim) next.day = dim;
      }
      commit(next);
    }

    function focusSegment(key: DateSegmentKey) {
      segmentRefs.current[key]?.focus();
    }

    function navigate(fromKey: DateSegmentKey, dir: -1 | 1) {
      const idx = order.indexOf(fromKey);
      const next = order[idx + dir];
      if (next) focusSegment(next);
    }

    function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
      const text = e.clipboardData.getData("text");
      const parsed = parseDateString(text, order);
      if (parsed) {
        e.preventDefault();
        commit(parsed);
      }
    }

    return (
      <div
        ref={forwardedRef}
        className={cx(
          sc("segment-field"),
          color && sc(`segment-field-${color}`),
          size !== "md" && sc(`segment-field-${size}`),
          className,
        )}
        data-disabled={disabled || undefined}
        id={id}
        aria-label={ariaLabel}
        onPaste={handlePaste}
      >
        {tokens.map((t, i) =>
          "literal" in t ? (
            <span key={i} className={cx(sc("segment-field-literal"))} aria-hidden="true">
              {t.literal}
            </span>
          ) : (
            <DateTimeSegment
              key={t.key}
              segmentRef={(el) => {
                segmentRefs.current[t.key] = el;
              }}
              value={parts[t.key]}
              min={1}
              max={t.key === "year" ? 9999 : t.key === "month" ? 12 : daysInMonth(parts.year, parts.month)}
              digits={t.key === "year" ? 4 : 2}
              placeholder={t.key === "month" ? "mm" : t.key === "day" ? "dd" : "yyyy"}
              formatValue={(n) => String(n).padStart(t.key === "year" ? 4 : 2, "0")}
              disabled={disabled}
              onChange={(v) => setSegment(t.key, v)}
              onNavigate={(dir) => navigate(t.key, dir)}
              onComplete={() => navigate(t.key, 1)}
              aria-label={SEGMENT_LABEL[t.key]}
            />
          ),
        )}
      </div>
    );
  },
);

export interface DateRangeInputProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  min?: Date;
  max?: Date;
  locale?: string;
  disabled?: boolean;
  color?: DateInputColor;
  size?: DateInputSize;
  className?: string;
  "aria-label"?: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

/**
 * Silica DateRangeInput — two `DateInput`s (start/end), each independently
 * typeable. The end field's `min` follows the start value once it's set.
 *
 *   <DateRangeInput value={range} onValueChange={setRange} />
 */
export function DateRangeInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  locale,
  disabled,
  color,
  size,
  className,
  "aria-label": ariaLabel,
}: DateRangeInputProps) {
  const sc = useSilicaClass();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<DateRange>(defaultValue ?? EMPTY_RANGE);
  const current = isControlled ? value : internal;

  function commit(next: DateRange) {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div className={cx(sc("date-range-input"), className)} aria-label={ariaLabel}>
      <DateInput
        value={current.start}
        onValueChange={(d) => commit({ ...current, start: d })}
        min={min}
        max={current.end ?? max}
        locale={locale}
        disabled={disabled}
        color={color}
        size={size}
        aria-label="Start date"
      />
      <span className={cx(sc("date-range-input-sep"))} aria-hidden="true">
        –
      </span>
      <DateInput
        value={current.end}
        onValueChange={(d) => commit({ ...current, end: d })}
        min={current.start ?? min}
        max={max}
        locale={locale}
        disabled={disabled}
        color={color}
        size={size}
        aria-label="End date"
      />
    </div>
  );
}
