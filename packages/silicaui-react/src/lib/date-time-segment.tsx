import * as React from "react";
import { cx } from "./cx";
import { useSilicaClass } from "./config";

/**
 * The shared editable-segment primitive behind `DateInput`/`TimeInput`/
 * `DateTimeInput` — a `role="spinbutton"` cell that accepts typed digits
 * (auto-advancing once another digit couldn't stay in range), Up/Down to
 * step, and Left/Right to move between segments. Every segmented field in
 * Silica is built from the same cell so their keyboard behavior matches.
 */

/**
 * Feed one digit into a segment's in-progress buffer. Commits (and signals
 * auto-advance) once the buffer hits `digits` length, or once appending any
 * further digit could no longer stay within `max` — e.g. typing "4" for a
 * day (max 31) commits immediately (no two-digit day starts with 4 and stays
 * ≤31), but typing "3" waits for a second digit (30 or 31 are both valid).
 */
export function nextBufferValue(
  buffer: string,
  digit: string,
  max: number,
  digits: number,
): { value: number; buffer: string; commit: boolean } {
  const candidate = buffer + digit;
  const num = parseInt(candidate, 10);
  if (candidate.length >= digits || num * 10 > max) {
    return { value: Math.min(num, max), buffer: "", commit: true };
  }
  return { value: num, buffer: candidate, commit: false };
}

export interface SegmentProps {
  /** `null` = empty (renders `placeholder`). */
  value: number | null;
  min: number;
  max: number;
  /** Max typed-digit length before auto-commit (2 for day/hour/minute/second, 4 for year). */
  digits: number;
  placeholder: string;
  /** Presence marks this a cycling (non-numeric) segment, e.g. AM/PM. */
  cycleValues?: readonly string[];
  formatValue?: (n: number) => string;
  disabled?: boolean;
  onChange: (next: number | null) => void;
  onNavigate: (direction: -1 | 1) => void;
  onComplete: () => void;
  "aria-label": string;
  segmentRef?: React.Ref<HTMLDivElement>;
}

export function DateTimeSegment({
  value,
  min,
  max,
  digits,
  placeholder,
  cycleValues,
  formatValue,
  disabled,
  onChange,
  onNavigate,
  onComplete,
  "aria-label": ariaLabel,
  segmentRef,
}: SegmentProps) {
  const sc = useSilicaClass();
  const bufferRef = React.useRef("");

  const text =
    value == null
      ? placeholder
      : cycleValues
        ? (cycleValues[value] ?? placeholder)
        : (formatValue ?? String)(value);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (cycleValues) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dir = e.key === "ArrowUp" ? 1 : -1;
        const current = value ?? 0;
        onChange((current + dir + cycleValues.length) % cycleValues.length);
        return;
      }
      const matchIndex = cycleValues.findIndex(
        (v) => v[0]?.toLowerCase() === e.key.toLowerCase(),
      );
      if (matchIndex >= 0) {
        e.preventDefault();
        onChange(matchIndex);
        onComplete();
        return;
      }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const { value: next, buffer, commit } = nextBufferValue(
        bufferRef.current,
        e.key,
        max,
        digits,
      );
      bufferRef.current = buffer;
      onChange(Math.max(min, Math.min(max, next)));
      if (commit) onComplete();
      return;
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      bufferRef.current = "";
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const base = value ?? (dir === 1 ? min - 1 : max + 1);
      let next = base + dir;
      if (next > max) next = min;
      if (next < min) next = max;
      onChange(next);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onNavigate(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNavigate(1);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      if (bufferRef.current) {
        bufferRef.current = bufferRef.current.slice(0, -1);
        onChange(bufferRef.current ? parseInt(bufferRef.current, 10) : null);
      } else if (value != null) {
        onChange(null);
      } else {
        onNavigate(-1);
      }
    }
  }

  return (
    <div
      ref={segmentRef}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value == null ? "empty" : text}
      aria-disabled={disabled || undefined}
      data-placeholder={value == null ? "" : undefined}
      className={cx(sc("segment-field-segment"))}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        bufferRef.current = "";
      }}
      onPaste={(e) => {
        // Let the field-level paste handler (which sees the full clipboard
        // string) own multi-segment autofill; a lone segment just no-ops.
        e.preventDefault();
      }}
    >
      {text}
    </div>
  );
}
