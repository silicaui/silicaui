export interface TimeValue {
  /** 0–23, canonical (24h) — independent of the field's display `hourCycle`. */
  hour: number;
  minute: number;
  second?: number;
}

export interface TimeParts {
  /** Display hour — 1–12 in 12h mode, 0–23 in 24h mode. */
  hour: number | null;
  minute: number | null;
  second: number | null;
  /** 0 = AM, 1 = PM. Only meaningful (and only rendered) in 12h mode. */
  dayPeriod: number | null;
}

export const EMPTY_TIME_PARTS: TimeParts = {
  hour: null,
  minute: null,
  second: null,
  dayPeriod: null,
};

export function resolveHour12(locale: string | undefined, hourCycle?: 12 | 24): boolean {
  if (hourCycle !== undefined) return hourCycle === 12;
  const resolved = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions();
  return resolved.hourCycle === "h11" || resolved.hourCycle === "h12";
}

export function timeValueToParts(v: TimeValue | null | undefined, hour12: boolean): TimeParts {
  if (!v) return EMPTY_TIME_PARTS;
  const dayPeriod = hour12 ? (v.hour >= 12 ? 1 : 0) : null;
  const displayHour = hour12 ? (v.hour % 12 === 0 ? 12 : v.hour % 12) : v.hour;
  return { hour: displayHour, minute: v.minute, second: v.second ?? null, dayPeriod };
}

export function partsToTimeValue(p: TimeParts, hour12: boolean): TimeValue | null {
  if (p.hour == null || p.minute == null) return null;
  let hour24 = p.hour;
  if (hour12) {
    if (p.dayPeriod == null) return null;
    hour24 = p.dayPeriod === 1 ? (p.hour % 12) + 12 : p.hour % 12;
  }
  return { hour: hour24, minute: p.minute, second: p.second ?? undefined };
}

/** Parse a pasted time string: "14:30", "2:30 PM", "2:30:15 pm" → canonical 24h. */
export function parseTimeString(text: string): TimeValue | null {
  const m = text
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let hour = parseInt(m[1] ?? "", 10);
  const minute = parseInt(m[2] ?? "", 10);
  const second = m[3] ? parseInt(m[3], 10) : undefined;
  const ampm = m[4]?.toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59 || (second != null && second > 59)) return null;
  return { hour, minute, second };
}
