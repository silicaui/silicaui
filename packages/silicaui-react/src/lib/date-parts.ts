export type DateSegmentKey = "month" | "day" | "year";
export type DateParts = Record<DateSegmentKey, number | null>;
export type DateToken = { literal: string } | { key: DateSegmentKey };

export const EMPTY_DATE_PARTS: DateParts = { month: null, day: null, year: null };

export function daysInMonth(year: number | null, month: number | null): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

export function partsFromDate(d: Date | null | undefined): DateParts {
  if (!d) return EMPTY_DATE_PARTS;
  return { month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear() };
}

export function dateFromParts(p: DateParts): Date | null {
  if (p.month == null || p.day == null || p.year == null) return null;
  return new Date(p.year, p.month - 1, p.day);
}

/** Whether two sets of segments spell the same thing, empty cells included. */
export function datePartsEqual(a: DateParts, b: DateParts): boolean {
  return a.month === b.month && a.day === b.day && a.year === b.year;
}

/** Segment order + locale-native separators, derived from `Intl` (never hardcoded to MM/DD/YYYY). */
export function getDateTokens(locale?: string): DateToken[] {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2000, 0, 2));
  const tokens: DateToken[] = [];
  for (const part of parts) {
    if (part.type === "month" || part.type === "day" || part.type === "year") {
      tokens.push({ key: part.type });
    } else if (part.type === "literal") {
      tokens.push({ literal: part.value });
    }
  }
  return tokens;
}

export function dateOrder(tokens: DateToken[]): DateSegmentKey[] {
  return tokens
    .filter((t): t is { key: DateSegmentKey } => "key" in t)
    .map((t) => t.key);
}

/** `YYYY-MM-DD`, optionally followed by a time. ISO 8601 is year-first in every
 *  locale, so it must never be read through the display `order`. */
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]|$)/;

/** Whether these parts name a real day. `new Date(2026, 2025, 12)` is not NaN —
 *  JavaScript rolls a month of 2026 forward into the year 2186 — so "did the Date
 *  construct" is not a validity test, and treating it as one is what let
 *  `99/99/9999` through as 06/07/10007. */
function isRealDate(p: DateParts): boolean {
  const { year, month, day } = p;
  if (year == null || month == null || day == null) return false;
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

/**
 * Parse a pasted date string.
 *
 * Three routes, in order, because they disagree and the first correct one wins:
 *
 *  1. **ISO 8601** (`2026-12-18`) is read year-month-day, whatever the locale
 *     displays. This is the format every spreadsheet, CSV and API produces, so it
 *     is the one people actually paste. Read positionally instead, en-US turned
 *     `2026-12-18` into month 2026 / day 12 / year 18, which rolled over to
 *     **10/12/2186** with no error anywhere. Found by P03 (issues/048).
 *     It is also parsed by HAND rather than with `new Date("2026-12-18")`, which
 *     is defined as UTC midnight and comes back a day earlier anywhere west of
 *     Greenwich — the exact shift that makes a term end on the wrong Thursday.
 *  2. **Positional**, by the locale's own segment order, for `12/18/2026`.
 *  3. **Native**, for prose like `18 December 2026` and for real instants that
 *     carry a time and a zone.
 *
 * A result that does not name a real day returns `null`, and the caller leaves
 * the field alone. Refusing a paste is visible; accepting a wrong date is not.
 */
export function parseDateString(text: string, order: DateSegmentKey[]): DateParts | null {
  const trimmed = text.trim();

  const iso = ISO_DATE.exec(trimmed);
  if (iso) {
    const parts: DateParts = {
      year: parseInt(iso[1]!, 10),
      month: parseInt(iso[2]!, 10),
      day: parseInt(iso[3]!, 10),
    };
    return isRealDate(parts) ? parts : null;
  }

  const groups = trimmed.match(/\d+/g);
  if (groups && groups.length >= 3) {
    const nums = groups.slice(0, 3).map((g) => parseInt(g, 10));
    const result: DateParts = { ...EMPTY_DATE_PARTS };
    order.forEach((key, i) => {
      result[key] = nums[i] ?? null;
    });
    if (result.year != null && result.year < 100) result.year += 2000;
    if (isRealDate(result)) return result;
    // Fall through rather than return: prose like `18 December 2026 (week 1)`
    // has three digit groups and is still parseable natively below.
  }

  const native = new Date(trimmed);
  if (!Number.isNaN(native.getTime())) {
    const parts = partsFromDate(native);
    if (isRealDate(parts)) return parts;
  }
  return null;
}
