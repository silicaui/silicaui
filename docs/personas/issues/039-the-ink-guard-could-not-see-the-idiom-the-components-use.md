# 039 — The guard against painting a role colour as text could not see the idiom the components actually use

**Status:** fixed
**Severity:** major
**Found by:** P06 · Nia Adeyemi · act 9, chasing why a chip measured 2.78:1
**Surface:** `@wizeworks/silicaui` › `scripts/verify-ink-derivation.mjs`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

A terracotta `TagInput` chip measured **2.78:1** in light. The cause was
[038](038-five-controls-are-smaller-than-the-minimum-target.md): the chip paints the
raw role colour as text instead of the derived ink.

There is a probe whose entire job is to stop that, and it was green.

`verify-ink-derivation.mjs` exists because of issues 019 and 024, and its own header
says what it is for:

> *"No `color:` declaration in a component may name a bare role token."*

Its test was:

```js
const RAW_ROLE_AS_TEXT = /^\s*color:\s*"var\(--color-(?!base-)([a-z0-9-]+?)(?<!-content)\)"/;
```

It matches a **literal** `color: "var(--color-primary)"`. Components do not write
that. They write the accent idiom:

```js
const accent = "var(--tag-accent, var(--color-primary))";
…
color: accent,
```

Same raw fill, painted as text, one name away from the pattern — and invisible to it.

## Why it matters more than one chip

The probe is the thing that is supposed to make this class of defect impossible, and
`pnpm verify` prints its green line on every run. A guard that cannot see the
dominant idiom does not merely miss cases; it **certifies** them. Everyone who read
`✅ every role colour painted as text goes through ink()` was reading a true
statement about a pattern nobody uses.

Widening it found **five more**, all of them shipped, all under that green line:

| | what it paints |
| --- | --- |
| `command-palette.js:159` | `color-mix(… var(--color-primary) 70% …)` — a faded raw role, on an active row's second line |
| `data-table.js:89` | the sort icon, ascending |
| `data-table.js:94` | the sort icon, descending |
| `segment-field.js:63` | a focused segment |
| `stat.js:68` | `var(--stat-figure, var(--color-primary))` — the big number |

`primary` happens to pass raw (7.97), so most were not *failing*. They were still
wrong in the way issue 024 already described: one system, one colour, two answers,
depending on which component you happened to be in — and any consumer who invents a
colour that does not pass raw gets the failure in all five at once.

## The fix

Resolve one level of `const NAME = "…"` indirection before testing, and look for a
role token **anywhere** in the resolved value rather than only at its start. The two
existing exemptions stand — `--color-base-*` and `-content` are already inks — and a
value that goes through `ink()` / `inkOfRole()` / `--*-ink` is the fix itself, so it
is skipped.

## Two wrong versions of the widened guard, and how each was caught

**Neither was caught by the probe passing or failing. Both were caught by reading
what it accused.**

1. **Ten hits, four of them false.** A plain `split/join` substitution rewrote the
   inside of CSS custom property names: `accent` matched within
   `var(--filter-accent-content, …)` and turned a correct `-content` ink into an
   accusation. Fixed by refusing to substitute into a string literal at all.
2. **Nine hits, four still false.** A hand-built boundary regex still let `accent`
   match inside `accentContent`, producing
   `var(--wz-accent, var(--color-primary))Content` — which of course contains a raw
   role. Fixed by tokenising: whole identifiers only, which cannot partially match.

Final: **five hits, all five true.** The check that mattered at each step was
whether `calendar`, `tabs`, `wizard` and `filter` — all of which paint a `-content`
ink on their own accent fill, correctly — were quiet. A probe that fails on correct
code teaches people to ignore probes, which is worse than the hole it was closing.

## The fixes to the five

All five now read their family's emitted `--<root>-ink`, with `inkOfRole("primary")`
as the fallback, which is the idiom `button.js` has always used:

```js
color: `var(--dt-ink, ${inkOfRole("primary")})`,
```

`command-palette` keeps its de-emphasis — it is the second line of an active row —
but fades the **ink** rather than the fill.

## Confirmed by

```
  109 component module(s) checked
✅ every role colour painted as text goes through ink()
```

**Proved by breaking it:** `tag-input.js` reverted to `color: accent,` — confirmed
present on disk first, because a "proof" that passes because the edit never applied
has happened on this run before — and the probe goes red naming
`tag-input.js:77`, which is the exact line the old regex could not see. Restored →
green.

`pnpm verify` is green across the workspace. `verify-token-contrast.mjs` and
`verify-readable-ink.mjs` are unchanged and unaffected.

**On the screen it was found on:** the terracotta chip measures **6.23** in light and
**7.97** in dark, up from 2.78 and 6.06.

## Rating effect

None — this is a probe.
