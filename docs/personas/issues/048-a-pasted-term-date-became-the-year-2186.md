# 048 — Marlene pasted her term dates in and the field said 2186

**Status:** fixed
**Severity:** blocker
**Found by:** P03 · Marlene Okonkwo-Bright · act 7 + the dates standing check
**Surface:** `@wizeworks/silicaui-react` › `DateInput`, `DateRangeInput`, `DateTimeInput`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 7 is the reason she is here at all:

> "I want to change the half-term dates myself without asking anyone."

She keeps them in a spreadsheet. A spreadsheet exports `2026-12-18`. She copied the
column and pasted it into a date field, in a real browser, on the real docs page:

| she pasted | the field read | what it is |
| --- | --- | --- |
| `2026-12-18` | **10/12/2186** | Autumn term ends, Friday 18 December |
| `2026-10-26` | **10/10/2194** | half term starts |
| `2026-10-30` | **10/10/2198** | half term ends |
| `2028-02-29` | **12/02/2197** | the leap day the standing check names |
| `99/99/9999` | **06/07/10007** | typed to see whether anything would refuse it |

**Nothing refused any of it. The console was clean.**

Two of the seven were right — `12/18/2026` and `18 December 2026` — which is the worst
possible outcome, because it means the field looks like it works.

## What should have happened

`2026-12-18` is ISO 8601. It means the eighteenth of December, in every locale on
earth, and it is the format every spreadsheet, CSV, database and API produces. It
should have read **12/18/2026**. `99/99/9999` should have been refused.

## How to reproduce

1. Open `http://localhost:4011/docs/components/date-input/` in an **en-US** browser.
2. Paste `2026-12-18` into the field.
3. Before the fix it read **10/12/2186**.
4. Every time. `en-GB` gives a different wrong answer (`2024-06-17`), not a right one.

## Why it matters — filed `blocker`

Her business is term dates. In her own words, *"if one is wrong the phone rings all
evening."* Seven of nine dates on her site come out of that spreadsheet, and the paste
is how anybody moves a column of dates into a form.

The failure is **silent, plausible and total**:

- No error, no console warning, no visual difference — it is a date-shaped answer.
- It is **not** an off-by-one she might catch. It is 160 years.
- It is worse for the people most likely to use it: anyone importing real data.
- The two formats that *do* work are the two a human types by hand, so the bug hides
  from exactly the testing a developer does.

It is in a shipped library component, so it is wrong in every consumer's app, not only
here.

## Where it lives

[packages/silicaui-react/src/lib/date-parts.ts](../../../packages/silicaui-react/src/lib/date-parts.ts) — `parseDateString`.

```ts
const groups = trimmed.match(/\d+/g);
if (groups && groups.length >= 3) {
  const nums = groups.slice(0, 3).map((g) => parseInt(g, 10));
  order.forEach((key, i) => { result[key] = nums[i] ?? null; });   // ← positional
  if (result.year != null && result.year < 100) result.year += 2000;
  const d = dateFromParts(result);
  if (d && !Number.isNaN(d.getTime())) return result;              // ← not a validity test
}
```

**Two independent causes, and they compound:**

1. **The digit groups were mapped positionally by the locale's display order.** en-US
   order is month/day/year, so `2026-12-18` was read as month **2026**, day 12,
   year 18 → `+2000` → 2018.
2. **"Did a `Date` construct" was used as the validity test.** It is not one.
   `new Date(2018, 2025, 12)` is a perfectly good Date — JavaScript rolls an
   overflowing month forward — and it lands in **2186**. The same hole is why
   `99/99/9999` was accepted.

Either alone would have been caught. Together, cause 1 produced garbage and cause 2
certified it.

## Do the siblings have it too?

**Yes, all three, through the one shared function — which is also why one fix covers
them.**

| | |
| --- | --- |
| `DateInput` | `date-input.tsx:147` → `parseDateString` |
| `DateTimeInput` | `date-time-input.tsx:189` → `parseDateString` |
| `DateRangeInput` | built out of `DateInput`, so both ends of a range were wrong |
| `DatePicker` / `DateRangePicker` | wrap the same inputs |
| `Calendar` | not affected — it is driven by `Date` objects, never by pasted text |

**And a third cause, which only appeared when I broke the fix on purpose.** With the
ISO branch disabled but the range check left in, `2026-12-18` falls through to
`new Date("2026-12-18")` — which the spec defines as **UTC midnight**. On this machine
(UTC-8) that reads back as the 17th:

```
✗ en-US  paste 2026-12-18 → 2026-12-18  — field read 2026-12-17
✗ en-US  paste 2026-01-01 → 2026-01-01  — field read 2025-12-31
```

A term ending "Friday 18 December" would publish as **Thursday the 17th**, and New
Year's Day would publish in the **wrong year**. That is the failure the persona's dates
standing check exists to find, and it would have passed silently in CI, which runs in
UTC.

## The fix

Three routes, in order, because they disagree and the first correct one must win:

```ts
/** `YYYY-MM-DD`, optionally followed by a time. ISO 8601 is year-first in every
 *  locale, so it must never be read through the display `order`. */
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]|$)/;
```

1. **ISO 8601** is read year-month-day whatever the locale displays, and is parsed
   **by hand** — `new Date("2026-12-18")` is never constructed, so the UTC-midnight
   shift cannot happen.
2. **Positional**, by the locale's own segment order, for `12/18/2026`.
3. **Native**, for prose like `18 December 2026` and for real instants carrying a time
   and a zone.

And a real validity test replaces the rollover:

```ts
/** Whether these parts name a real day. `new Date(2026, 2025, 12)` is not NaN —
 *  JavaScript rolls a month of 2026 forward into the year 2186 — so "did the Date
 *  construct" is not a validity test. */
function isRealDate(p: DateParts): boolean { … month 1-12, day 1-daysInMonth, year 1-9999 }
```

A result that does not name a real day returns `null`, and the existing paste handler
already does nothing with a `null` — so the field keeps its value. **Refusing a paste
is visible; accepting a wrong date is not.**

The positional branch now *falls through* rather than returning on failure, so prose
that happens to contain three digit groups (`18 December 2026 (week 1)`) still reaches
the native parser.

## Confirmed by

**On the screen it was found on** — same page, same browser, same seven pastes:

| she pasted | before | after |
| --- | --- | --- |
| `2026-12-18` | 10/12/2186 | **12/18/2026** |
| `2026-10-26` | 10/10/2194 | **10/26/2026** |
| `2026-10-30` | 10/10/2198 | **10/30/2026** |
| `2028-02-29` | 12/02/2197 | **02/29/2028** |
| `12/18/2026` | 12/18/2026 | 12/18/2026 |
| `18 December 2026` | 12/18/2026 | 12/18/2026 |
| `99/99/9999` | 06/07/10007 | **refused — field unchanged** |

No console errors.

**And a probe**, `packages/silicaui-react/verify-date-paste.mjs`, wired into
`pnpm verify`. **51 checks, and it drives the real component** — a real
`ClipboardEvent` into a mounted `DateInput`, with the answer read off the rendered
segments, because what a customer touches is a field and not a function:

- Marlene's nine real term dates, in **en-US, en-GB, de-DE and ja-JP** — 36 checks that
  ISO means the same thing in all four
- each locale's own display order (`12/18/2026`, `18/12/2026`, `18.12.2026`)
- three prose forms
- **eight nonsense strings that must be refused**, including `2027-02-29` (not a leap
  year) and `2026-02-30`
- the timezone invariant, asserted rather than the local answer, since CI is UTC and
  this was written at UTC-8

**Proved by breaking it.** Disabling only the ISO branch — confirmed present on disk
first, then rebuilt — turns it red on 30 checks and surfaces the timezone shift above.
Restored, byte-identical by checksum, green again.

`pnpm verify` green across `@wizeworks/silicaui-react`. Typecheck clean.

## The machine's timezone, as the standing check requires

`America/Los_Angeles`, **UTC-8** at the date under test, locale `en-US`. Marlene is in
Leeds. That gap is the whole reason this defect was visible here and would not have
been on a UK developer's laptop.

## Rating effect

`Components › DateInput — Ease 3 → 9` in [rating.md](../rating.md).
