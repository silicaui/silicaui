import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { DateTimeSegment } from "./lib/date-time-segment";
import {
  type TimeValue,
  type TimeParts,
  resolveHour12,
  timeValueToParts,
  partsToTimeValue,
  timePartsEqual,
  parseTimeString,
} from "./lib/time-parts";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type { TimeValue };
export type TimeInputColor = SilicaColor;
export type TimeInputSize = SilicaSize;

export interface TimeInputProps {
  /** Controlled value. `null` clears the field. */
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  /** Fires once hour+minute (+AM/PM, in 12h mode) are filled; `null` while incomplete/cleared. */
  onValueChange?: (value: TimeValue | null) => void;
  /** `12` or `24`. Default: derived from `locale`. */
  hourCycle?: 12 | 24;
  /** Add a seconds segment. Default `false`. */
  showSeconds?: boolean;
  /** BCP-47 locale — drives the default `hourCycle` when not set explicitly. */
  locale?: string;
  disabled?: boolean;
  color?: TimeInputColor;
  size?: TimeInputSize;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

type SegKey = "hour" | "minute" | "second" | "dayPeriod";

/**
 * Silica TimeInput — a typeable, segmented time field (hour : minute [:
 * second] [AM/PM]). Digits auto-advance; Up/Down steps the focused segment
 * (and cycles AM/PM); pasting "14:30", "2:30 PM", or "2:30:15 pm" autofills
 * every segment — converting AM/PM to the field's own `hourCycle` as needed.
 *
 *   <TimeInput value={time} onValueChange={setTime} />
 *   <TimeInput hourCycle={24} showSeconds />
 */
export const TimeInput = React.forwardRef<HTMLDivElement, TimeInputProps>(
  function TimeInput(
    {
      value,
      defaultValue,
      onValueChange,
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
    const [internal, setInternal] = React.useState<TimeParts>(() =>
      timeValueToParts(value ?? defaultValue, hour12),
    );

    // The segments are this component's own state even when controlled, for
    // the reason spelled out in `date-input.tsx`: a half-typed time is not
    // representable in the parent, so deriving the cells straight from `value`
    // threw every keystroke away and left an empty controlled field
    // permanently unfillable. Sync down only when `value` disagrees with what
    // the cells already say.
    React.useEffect(() => {
      if (!isControlled) return;
      setInternal((prev) => {
        const incoming = timeValueToParts(value, hour12);
        if (timePartsEqual(prev, incoming)) return prev;
        if (value == null && partsToTimeValue(prev, hour12) === null) return prev;
        return incoming;
      });
    }, [value, isControlled, hour12]);

    const parts = internal;

    const order: SegKey[] = React.useMemo(() => {
      const base: SegKey[] = showSeconds ? ["hour", "minute", "second"] : ["hour", "minute"];
      return hour12 ? [...base, "dayPeriod"] : base;
    }, [hour12, showSeconds]);

    const segmentRefs = React.useRef<Partial<Record<SegKey, HTMLDivElement | null>>>({});

    function commit(next: TimeParts) {
      setInternal(next);
      onValueChange?.(partsToTimeValue(next, hour12));
    }

    function setSegment(key: SegKey, v: number | null) {
      commit({ ...parts, [key]: v });
    }

    function focusSegment(key: SegKey) {
      segmentRefs.current[key]?.focus();
    }

    function navigate(fromKey: SegKey, dir: -1 | 1) {
      const idx = order.indexOf(fromKey);
      const next = order[idx + dir];
      if (next) focusSegment(next);
    }

    function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
      const text = e.clipboardData.getData("text");
      const parsed = parseTimeString(text);
      if (parsed) {
        e.preventDefault();
        commit(timeValueToParts(parsed, hour12));
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
        {order.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && (
              <span className={cx(sc("segment-field-literal"))} aria-hidden="true">
                {key === "dayPeriod" ? " " : ":"}
              </span>
            )}
            <DateTimeSegment
              segmentRef={(el) => {
                segmentRefs.current[key] = el;
              }}
              value={parts[key]}
              min={key === "hour" ? (hour12 ? 1 : 0) : 0}
              max={key === "hour" ? (hour12 ? 12 : 23) : key === "dayPeriod" ? 1 : 59}
              digits={2}
              placeholder={
                key === "hour" ? "hh" : key === "minute" ? "mm" : key === "second" ? "ss" : "am"
              }
              cycleValues={key === "dayPeriod" ? (["AM", "PM"] as const) : undefined}
              formatValue={(n) => String(n).padStart(2, "0")}
              disabled={disabled}
              onChange={(v) => setSegment(key, v)}
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
