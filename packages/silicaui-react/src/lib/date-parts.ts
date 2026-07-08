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

/** Parse a pasted date string — digit groups mapped positionally by `order`, with an ISO/native fallback. */
export function parseDateString(text: string, order: DateSegmentKey[]): DateParts | null {
  const trimmed = text.trim();
  const groups = trimmed.match(/\d+/g);
  if (groups && groups.length >= 3) {
    const nums = groups.slice(0, 3).map((g) => parseInt(g, 10));
    const result: DateParts = { ...EMPTY_DATE_PARTS };
    order.forEach((key, i) => {
      result[key] = nums[i] ?? null;
    });
    if (result.year != null && result.year < 100) result.year += 2000;
    const d = dateFromParts(result);
    if (d && !Number.isNaN(d.getTime())) return result;
  }
  const native = new Date(trimmed);
  if (!Number.isNaN(native.getTime())) return partsFromDate(native);
  return null;
}
