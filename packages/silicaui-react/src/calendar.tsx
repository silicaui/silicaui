import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor } from "./lib/tokens";

export type CalendarColor = SilicaColor;
export type CalendarMode = "single" | "range";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateRange {
  start: Date | null;
  end: Date | null;
}
export type CalendarValue = Date | DateRange | null;

// ---------------------------------------------------------------------------
// Date helpers — day-granular, local time (a calendar has no clock).
// ---------------------------------------------------------------------------
const REF_SUNDAY = new Date(2023, 0, 1); // Jan 1 2023 is a Sunday.

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function isSameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
/** -1 if a<b, 0 if same day, 1 if a>b. */
function compareDay(a: Date, b: Date): number {
  const x = startOfDay(a).getTime();
  const y = startOfDay(b).getTime();
  return x < y ? -1 : x > y ? 1 : 0;
}
function clampDay(d: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDay(d, min) < 0) return startOfDay(min);
  if (max && compareDay(d, max) > 0) return startOfDay(max);
  return startOfDay(d);
}
function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function asRange(v: CalendarValue): DateRange {
  if (v && v instanceof Date) return { start: v, end: null };
  if (v && typeof v === "object") return v as DateRange;
  return { start: null, end: null };
}
function orderedRange(a: Date, b: Date): DateRange {
  return compareDay(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface CalendarProps {
  /** `single` (default) selects one date; `range` selects a start/end pair. */
  mode?: CalendarMode;
  /** Controlled selection — a `Date` in single mode, a `DateRange` in range mode. */
  value?: CalendarValue;
  /** Uncontrolled initial selection. */
  defaultValue?: CalendarValue;
  /** Fires with the new selection. */
  onValueChange?: (value: CalendarValue) => void;
  /** Controlled visible (left-most) month. */
  month?: Date;
  /** Uncontrolled initial visible month. */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** How many month grids to show side by side (default 1; 2 for range). */
  numberOfMonths?: number;
  /** 0 = Sunday (default) … 6 = Saturday. */
  weekStartsOn?: Weekday;
  /** Selectable bounds (inclusive). */
  min?: Date;
  max?: Date;
  /** Per-date disable predicate. */
  isDateDisabled?: (date: Date) => boolean;
  /** BCP-47 locale for month/weekday names (default: runtime locale). */
  locale?: string;
  /** Accent for the selection. */
  color?: CalendarColor;
  className?: string;
  "aria-label"?: string;
}

/**
 * Silica Calendar — a from-scratch month-grid date picker (single date or a
 * range), with full keyboard navigation (arrows, PageUp/Down, Home/End,
 * Enter/Space). The primitive behind `DatePicker` / `DateRangePicker`; render it
 * inline when you want an always-visible calendar.
 *
 *   <Calendar value={date} onValueChange={setDate} />
 *   <Calendar mode="range" numberOfMonths={2} value={range} onValueChange={setRange} />
 */
export function Calendar({
  mode = "single",
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  numberOfMonths = 1,
  weekStartsOn = 0,
  min,
  max,
  isDateDisabled,
  locale,
  color,
  className,
  ...aria
}: CalendarProps) {
  const sc = useSilicaClass();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const shouldFocusRef = React.useRef(false);
  const today = React.useMemo(() => startOfDay(new Date()), []);

  // --- selection (controlled/uncontrolled) ---
  const [internalValue, setInternalValue] = React.useState<CalendarValue>(
    defaultValue ?? (mode === "range" ? { start: null, end: null } : null),
  );
  const current = value !== undefined ? value : internalValue;
  const range = asRange(current);

  // --- visible month (controlled/uncontrolled) ---
  const initialMonth =
    defaultMonth ??
    (range.start ? startOfMonth(range.start) : startOfMonth(today));
  const [internalMonth, setInternalMonth] = React.useState<Date>(initialMonth);
  const viewMonth = month !== undefined ? startOfMonth(month) : internalMonth;

  const setView = React.useCallback(
    (m: Date) => {
      const next = startOfMonth(m);
      if (month === undefined) setInternalMonth(next);
      onMonthChange?.(next);
    },
    [month, onMonthChange],
  );

  // --- keyboard focus target + range hover preview ---
  const [focusedDate, setFocusedDate] = React.useState<Date>(() =>
    clampDay(range.start ?? today, min, max),
  );
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

  // Move DOM focus to the focused day, but only right after a keyboard move.
  React.useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    const el = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${isoDate(focusedDate)}"][data-in-month]`,
    );
    el?.focus();
  }, [focusedDate]);

  const weekdayLabels = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(addDays(REF_SUNDAY, (weekStartsOn + i) % 7)).slice(0, 2),
    );
  }, [locale, weekStartsOn]);

  const titleFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );

  function isDisabled(d: Date): boolean {
    if (min && compareDay(d, min) < 0) return true;
    if (max && compareDay(d, max) > 0) return true;
    return isDateDisabled?.(d) ?? false;
  }

  function commit(next: CalendarValue) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  }

  function selectDay(d: Date) {
    if (isDisabled(d)) return;
    const day = startOfDay(d);
    if (mode === "range") {
      const r = range;
      if (!r.start || (r.start && r.end)) {
        commit({ start: day, end: null });
      } else {
        commit(orderedRange(r.start, day));
      }
    } else {
      commit(day);
    }
    setFocusedDate(day);
    if (!isSameMonth(day, viewMonth)) setView(day);
  }

  function moveFocus(next: Date) {
    const clamped = clampDay(next, min, max);
    shouldFocusRef.current = true;
    setFocusedDate(clamped);
    // Keep the focused day visible across the shown month span.
    const firstVisible = viewMonth;
    const lastVisible = addMonths(viewMonth, numberOfMonths - 1);
    if (compareDay(clamped, firstVisible) < 0) setView(clamped);
    else if (compareDay(clamped, addMonths(lastVisible, 1)) >= 0)
      setView(addMonths(clamped, -(numberOfMonths - 1)));
  }

  // Prev/next buttons: shift the view AND keep the roving focus target inside
  // the visible span (so a keyboard user always lands on an in-month day). Does
  // not steal DOM focus (shouldFocusRef stays false).
  function shiftView(delta: number) {
    const nextView = addMonths(viewMonth, delta);
    setView(nextView);
    const dim = new Date(
      nextView.getFullYear(),
      nextView.getMonth() + 1,
      0,
    ).getDate();
    const target = new Date(
      nextView.getFullYear(),
      nextView.getMonth(),
      Math.min(focusedDate.getDate(), dim),
    );
    setFocusedDate(clampDay(target, min, max));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const key = e.key;
    let next: Date | null = null;
    if (key === "ArrowLeft") next = addDays(focusedDate, -1);
    else if (key === "ArrowRight") next = addDays(focusedDate, 1);
    else if (key === "ArrowUp") next = addDays(focusedDate, -7);
    else if (key === "ArrowDown") next = addDays(focusedDate, 7);
    else if (key === "PageUp") next = addMonths(focusedDate, -1);
    else if (key === "PageDown") next = addMonths(focusedDate, 1);
    else if (key === "Home") next = addDays(focusedDate, -((focusedDate.getDay() - weekStartsOn + 7) % 7));
    else if (key === "End") next = addDays(focusedDate, 6 - ((focusedDate.getDay() - weekStartsOn + 7) % 7));
    else if (key === "Enter" || key === " ") {
      e.preventDefault();
      selectDay(focusedDate);
      return;
    } else {
      return;
    }
    e.preventDefault();
    moveFocus(next);
  }

  // Effective range for painting (live preview while picking the end).
  const paintRange: DateRange =
    mode === "range" && range.start && !range.end && hoveredDate
      ? orderedRange(range.start, hoveredDate)
      : range;

  function renderMonth(offset: number) {
    const m = addMonths(viewMonth, offset);
    const first = startOfMonth(m);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const gridStart = addDays(first, -lead);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const showPrev = offset === 0;
    const showNext = offset === numberOfMonths - 1;

    const prevDisabled =
      !!min && compareDay(startOfMonth(m), startOfMonth(min)) <= 0;
    const nextDisabled =
      !!max && compareDay(startOfMonth(m), startOfMonth(max)) >= 0;

    return (
      <div className={cx(sc("calendar-month"))} key={offset}>
        <div className={cx(sc("calendar-header"))}>
          {showPrev ? (
            <button
              type="button"
              className={cx(sc("calendar-nav"))}
              aria-label="Previous month"
              disabled={prevDisabled}
              onClick={() => shiftView(-1)}
            >
              <ChevronLeftIcon />
            </button>
          ) : (
            <span className={cx(sc("calendar-nav"))} aria-hidden="true" />
          )}
          <div className={cx(sc("calendar-title"))} aria-live="polite">
            {titleFmt.format(m)}
          </div>
          {showNext ? (
            <button
              type="button"
              className={cx(sc("calendar-nav"))}
              aria-label="Next month"
              disabled={nextDisabled}
              onClick={() => shiftView(1)}
            >
              <ChevronRightIcon />
            </button>
          ) : (
            <span className={cx(sc("calendar-nav"))} aria-hidden="true" />
          )}
        </div>

        <div className={cx(sc("calendar-weekdays"))} aria-hidden="true">
          {weekdayLabels.map((w, i) => (
            <div className={cx(sc("calendar-weekday"))} key={i}>
              {w}
            </div>
          ))}
        </div>

        <div className={cx(sc("calendar-grid"))} role="grid">
          {cells.map((cell) => {
            const inMonth = isSameMonth(cell, m);
            const disabled = isDisabled(cell);
            const selected = mode === "single" && isSameDay(cell, range.start);
            const isStart = mode === "range" && isSameDay(cell, paintRange.start);
            const isEnd = mode === "range" && isSameDay(cell, paintRange.end);
            const inRange =
              mode === "range" &&
              !!paintRange.start &&
              !!paintRange.end &&
              compareDay(cell, paintRange.start) > 0 &&
              compareDay(cell, paintRange.end) < 0;
            const isFocused = isSameDay(cell, focusedDate);
            return (
              <button
                key={isoDate(cell) + (inMonth ? "" : "-o")}
                type="button"
                className={cx(sc("calendar-day"))}
                data-date={isoDate(cell)}
                data-in-month={inMonth ? "" : undefined}
                data-outside={!inMonth ? "" : undefined}
                data-today={isSameDay(cell, today) ? "" : undefined}
                data-selected={selected ? "" : undefined}
                data-range-start={isStart ? "" : undefined}
                data-range-end={isEnd ? "" : undefined}
                data-in-range={inRange ? "" : undefined}
                data-disabled={disabled ? "" : undefined}
                aria-disabled={disabled || undefined}
                aria-pressed={selected || isStart || isEnd || undefined}
                tabIndex={inMonth && isFocused ? 0 : -1}
                onClick={() => selectDay(cell)}
                onMouseEnter={
                  mode === "range" ? () => setHoveredDate(cell) : undefined
                }
                onFocus={() => setFocusedDate(startOfDay(cell))}
              >
                {cell.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cx(
        sc("calendar"),
        color && sc(`calendar-${color}`),
        className,
      )}
      onKeyDown={onKeyDown}
      onMouseLeave={mode === "range" ? () => setHoveredDate(null) : undefined}
      {...aria}
    >
      <div className={cx(sc("calendar-months"))}>
        {Array.from({ length: Math.max(1, numberOfMonths) }, (_, i) =>
          renderMonth(i),
        )}
      </div>
    </div>
  );
}
