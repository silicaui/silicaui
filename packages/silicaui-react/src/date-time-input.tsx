import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { DateTimeSegment } from "./lib/date-time-segment";
import {
  type DateParts,
  type DateSegmentKey,
  daysInMonth,
  partsFromDate,
  getDateTokens,
  dateOrder,
  parseDateString,
} from "./lib/date-parts";
import {
  type TimeParts,
  resolveHour12,
  timeValueToParts,
  parseTimeString,
} from "./lib/time-parts";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type DateTimeInputColor = SilicaColor;
export type DateTimeInputSize = SilicaSize;

const DATE_LABEL: Record<DateSegmentKey, string> = { month: "Month", day: "Day", year: "Year" };
type TimeSegKey = "hour" | "minute" | "second" | "dayPeriod";
type AnySegKey = DateSegmentKey | TimeSegKey;

export interface DateTimeInputProps {
  /** Controlled value — a full `Date` (date + time together). `null` clears the field. */
  value?: Date | null;
  defaultValue?: Date | null;
  /** Fires once every segment (date + time, + AM/PM in 12h mode) is filled; `null` while incomplete/cleared. */
  onValueChange?: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  /** `12` or `24`. Default: derived from `locale`. */
  hourCycle?: 12 | 24;
  showSeconds?: boolean;
  locale?: string;
  disabled?: boolean;
  color?: DateTimeInputColor;
  size?: DateTimeInputSize;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

function composeDate(d: DateParts, t: TimeParts, hour12: boolean): Date | null {
  if (d.month == null || d.day == null || d.year == null) return null;
  if (t.hour == null || t.minute == null) return null;
  if (hour12 && t.dayPeriod == null) return null;
  let hour24 = t.hour;
  if (hour12) hour24 = t.dayPeriod === 1 ? (t.hour % 12) + 12 : t.hour % 12;
  return new Date(d.year, d.month - 1, d.day, hour24, t.minute, t.second ?? 0);
}

/**
 * Silica DateTimeInput — `DateInput` + `TimeInput` fused into one segmented
 * field sharing a single `Date` value, for the common "when exactly" case
 * (appointments, deadlines, scheduled posts) without stitching two widgets
 * together yourself.
 *
 *   <DateTimeInput value={when} onValueChange={setWhen} />
 *   <DateTimeInput hourCycle={24} showSeconds min={new Date()} />
 */
export const DateTimeInput = React.forwardRef<HTMLDivElement, DateTimeInputProps>(
  function DateTimeInput(
    {
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      hourCycle,
      showSeconds = false,
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
    const hour12 = resolveHour12(locale, hourCycle);
    const isControlled = value !== undefined;

    const [internalDate, setInternalDate] = React.useState<DateParts>(() =>
      partsFromDate(value ?? defaultValue),
    );
    const [internalTime, setInternalTime] = React.useState<TimeParts>(() =>
      timeValueToParts(
        (value ?? defaultValue)
          ? {
              hour: (value ?? defaultValue)!.getHours(),
              minute: (value ?? defaultValue)!.getMinutes(),
              second: (value ?? defaultValue)!.getSeconds(),
            }
          : null,
        hour12,
      ),
    );

    React.useEffect(() => {
      if (!isControlled) return;
      setInternalDate(partsFromDate(value));
      setInternalTime(
        timeValueToParts(
          value
            ? { hour: value.getHours(), minute: value.getMinutes(), second: value.getSeconds() }
            : null,
          hour12,
        ),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, isControlled, hour12]);

    const dateParts = internalDate;
    const timeParts = internalTime;

    const dateTokens = React.useMemo(() => getDateTokens(locale), [locale]);
    const dateSegOrder = React.useMemo(() => dateOrder(dateTokens), [dateTokens]);
    const timeSegOrder: TimeSegKey[] = React.useMemo(() => {
      const base: TimeSegKey[] = showSeconds ? ["hour", "minute", "second"] : ["hour", "minute"];
      return hour12 ? [...base, "dayPeriod"] : base;
    }, [hour12, showSeconds]);
    const fullOrder: AnySegKey[] = React.useMemo(
      () => [...dateSegOrder, ...timeSegOrder],
      [dateSegOrder, timeSegOrder],
    );

    const segmentRefs = React.useRef<Partial<Record<AnySegKey, HTMLDivElement | null>>>({});

    function commit(nextDate: DateParts, nextTime: TimeParts) {
      if (!isControlled) {
        setInternalDate(nextDate);
        setInternalTime(nextTime);
      }
      let composed = composeDate(nextDate, nextTime, hour12);
      if (composed) {
        if (min && composed < min) composed = min;
        if (max && composed > max) composed = max;
      }
      onValueChange?.(composed);
    }

    function setDateSegment(key: DateSegmentKey, v: number | null) {
      const next: DateParts = { ...dateParts, [key]: v };
      if (next.day != null) {
        const dim = daysInMonth(next.year, next.month);
        if (next.day > dim) next.day = dim;
      }
      commit(next, timeParts);
    }

    function setTimeSegment(key: TimeSegKey, v: number | null) {
      commit(dateParts, { ...timeParts, [key]: v });
    }

    function focusSegment(key: AnySegKey) {
      segmentRefs.current[key]?.focus();
    }

    function navigate(fromKey: AnySegKey, dir: -1 | 1) {
      const idx = fullOrder.indexOf(fromKey);
      const next = fullOrder[idx + dir];
      if (next) focusSegment(next);
    }

    function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
      const text = e.clipboardData.getData("text").trim();
      // Pull out a time substring ("14:30", "2:30 PM", …) if present; whatever's
      // left is the date portion — handles "2026-07-08 14:30", "…T14:30", etc.
      const timeMatch = text.match(/\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/);
      const timeStr = timeMatch?.[0] ?? "";
      const dateStr = timeStr ? text.replace(timeStr, "") : text;
      const parsedDate = parseDateString(dateStr, dateSegOrder);
      const parsedTime = timeStr ? parseTimeString(timeStr) : null;
      if (parsedDate || parsedTime) {
        e.preventDefault();
        commit(
          parsedDate ?? dateParts,
          parsedTime ? timeValueToParts(parsedTime, hour12) : timeParts,
        );
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
        {dateTokens.map((t, i) =>
          "literal" in t ? (
            <span key={`d${i}`} className={cx(sc("segment-field-literal"))} aria-hidden="true">
              {t.literal}
            </span>
          ) : (
            <DateTimeSegment
              key={t.key}
              segmentRef={(el) => {
                segmentRefs.current[t.key] = el;
              }}
              value={dateParts[t.key]}
              min={1}
              max={
                t.key === "year" ? 9999 : t.key === "month" ? 12 : daysInMonth(dateParts.year, dateParts.month)
              }
              digits={t.key === "year" ? 4 : 2}
              placeholder={t.key === "month" ? "mm" : t.key === "day" ? "dd" : "yyyy"}
              formatValue={(n) => String(n).padStart(t.key === "year" ? 4 : 2, "0")}
              disabled={disabled}
              onChange={(v) => setDateSegment(t.key, v)}
              onNavigate={(dir) => navigate(t.key, dir)}
              onComplete={() => navigate(t.key, 1)}
              aria-label={DATE_LABEL[t.key]}
            />
          ),
        )}

        <span className={cx(sc("segment-field-literal"))} aria-hidden="true">
          {" "}
        </span>

        {timeSegOrder.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && (
              <span className={cx(sc("segment-field-literal"))} aria-hidden="true">
                {key === "dayPeriod" ? " " : ":"}
              </span>
            )}
            <DateTimeSegment
              segmentRef={(el) => {
                segmentRefs.current[key] = el;
              }}
              value={timeParts[key]}
              min={key === "hour" ? (hour12 ? 1 : 0) : 0}
              max={key === "hour" ? (hour12 ? 12 : 23) : key === "dayPeriod" ? 1 : 59}
              digits={2}
              placeholder={
                key === "hour" ? "hh" : key === "minute" ? "mm" : key === "second" ? "ss" : "am"
              }
              cycleValues={key === "dayPeriod" ? (["AM", "PM"] as const) : undefined}
              formatValue={(n) => String(n).padStart(2, "0")}
              disabled={disabled}
              onChange={(v) => setTimeSegment(key, v)}
              onNavigate={(dir) => navigate(key, dir)}
              onComplete={() => navigate(key, 1)}
              aria-label={key === "dayPeriod" ? "AM/PM" : key}
            />
          </React.Fragment>
        ))}
      </div>
    );
  },
);
