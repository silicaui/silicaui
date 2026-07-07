import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Calendar } from "./calendar";
import type {
  CalendarColor,
  CalendarValue,
  DateRange,
  Weekday,
} from "./calendar";
import type { SilicaSize } from "./lib/tokens";

type PositionerProps = React.ComponentProps<typeof BasePopover.Positioner>;
export type DatePickerSide = NonNullable<PositionerProps["side"]>;
export type DatePickerAlign = NonNullable<PositionerProps["align"]>;
export type DatePickerColor = CalendarColor;
export type DatePickerSize = SilicaSize;

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

interface TriggerShellProps {
  color?: DatePickerColor;
  size?: DatePickerSize;
  disabled?: boolean;
  placeholder?: React.ReactNode;
  label: React.ReactNode | null;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/** The `.input`-styled button that opens the calendar popover. */
function DateTrigger({
  color,
  size = "md",
  disabled,
  placeholder,
  label,
  className,
  id,
  ariaLabel,
}: TriggerShellProps) {
  const sc = useSilicaClass();
  return (
    <BasePopover.Trigger
      id={id}
      disabled={disabled}
      aria-label={ariaLabel}
      data-placeholder={label == null ? "" : undefined}
      className={cx(
        sc("input"),
        color && sc(`input-${color}`),
        size !== "md" && sc(`input-${size}`),
        sc("date-field"),
        className,
      )}
    >
      <span className={cx(sc("date-field-value"))}>{label ?? placeholder}</span>
      <span className={cx(sc("date-field-icon"))}>
        <CalendarIcon />
      </span>
    </BasePopover.Trigger>
  );
}

interface PopupShellProps {
  side: DatePickerSide;
  align: DatePickerAlign;
  sideOffset: number;
  popupClassName?: string;
  children: React.ReactNode;
}

function DatePopup({
  side,
  align,
  sideOffset,
  popupClassName,
  children,
}: PopupShellProps) {
  const sc = useSilicaClass();
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BasePopover.Popup className={cx(sc("calendar-popup"), popupClassName)}>
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

// ---------------------------------------------------------------------------
// DatePicker (single)
// ---------------------------------------------------------------------------

export interface DatePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  weekStartsOn?: Weekday;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  locale?: string;
  /** Intl options for the trigger label (default `{ dateStyle: "medium" }`). */
  formatOptions?: Intl.DateTimeFormatOptions;
  color?: DatePickerColor;
  size?: DatePickerSize;
  side?: DatePickerSide;
  align?: DatePickerAlign;
  sideOffset?: number;
  className?: string;
  popupClassName?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * Silica DatePicker — an input that opens a `Calendar` popover to pick one date.
 *
 *   <DatePicker value={date} onValueChange={setDate} placeholder="Pick a date" />
 */
export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  weekStartsOn,
  min,
  max,
  isDateDisabled,
  locale,
  formatOptions = { dateStyle: "medium" },
  color,
  size,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  className,
  popupClassName,
  id,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internal, setInternal] = React.useState<Date | null>(
    defaultValue ?? null,
  );
  const current = value !== undefined ? value : internal;

  const fmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, formatOptions),
    [locale, formatOptions],
  );
  const label = current ? fmt.format(current) : null;

  function handleChange(v: CalendarValue) {
    const date = (v as Date | null) ?? null;
    if (value === undefined) setInternal(date);
    onValueChange?.(date);
    setOpen(false);
  }

  return (
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      <DateTrigger
        color={color}
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        label={label}
        className={className}
        id={id}
        ariaLabel={ariaLabel}
      />
      <DatePopup
        side={side}
        align={align}
        sideOffset={sideOffset}
        popupClassName={popupClassName}
      >
        <Calendar
          mode="single"
          value={current}
          onValueChange={handleChange}
          weekStartsOn={weekStartsOn}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          locale={locale}
          color={color}
        />
      </DatePopup>
    </BasePopover.Root>
  );
}

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

export interface DateRangePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  numberOfMonths?: number;
  weekStartsOn?: Weekday;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  locale?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
  color?: DatePickerColor;
  size?: DatePickerSize;
  side?: DatePickerSide;
  align?: DatePickerAlign;
  sideOffset?: number;
  className?: string;
  popupClassName?: string;
  id?: string;
  "aria-label"?: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

/**
 * Silica DateRangePicker — an input that opens a two-month `Calendar` to pick a
 * start/end range. Closes once both ends are chosen.
 *
 *   <DateRangePicker value={range} onValueChange={setRange} />
 */
export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a range",
  disabled,
  numberOfMonths = 2,
  weekStartsOn,
  min,
  max,
  isDateDisabled,
  locale,
  formatOptions = { dateStyle: "medium" },
  color,
  size,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  className,
  popupClassName,
  id,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internal, setInternal] = React.useState<DateRange>(
    defaultValue ?? EMPTY_RANGE,
  );
  const current = value !== undefined ? value : internal;

  const fmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, formatOptions),
    [locale, formatOptions],
  );
  const label =
    current.start && current.end
      ? `${fmt.format(current.start)} – ${fmt.format(current.end)}`
      : current.start
        ? `${fmt.format(current.start)} – …`
        : null;

  function handleChange(v: CalendarValue) {
    const next = (v as DateRange) ?? EMPTY_RANGE;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    if (next.start && next.end) setOpen(false);
  }

  return (
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      <DateTrigger
        color={color}
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        label={label}
        className={className}
        id={id}
        ariaLabel={ariaLabel}
      />
      <DatePopup
        side={side}
        align={align}
        sideOffset={sideOffset}
        popupClassName={popupClassName}
      >
        <Calendar
          mode="range"
          numberOfMonths={numberOfMonths}
          value={current}
          onValueChange={handleChange}
          weekStartsOn={weekStartsOn}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          locale={locale}
          color={color}
        />
      </DatePopup>
    </BasePopover.Root>
  );
}
