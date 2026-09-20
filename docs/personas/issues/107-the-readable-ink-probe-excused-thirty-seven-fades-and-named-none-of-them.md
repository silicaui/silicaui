# 107 — The readable-ink probe excused 37 fades by pattern, named none of them, and its own comment promised otherwise

**Status:** fixed
**Severity:** major
**Found by:** P03 · act 10 follow-up, working the carried-forward list
**Surface:** `packages/silicaui/scripts/verify-readable-ink.mjs`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

`verify-readable-ink.mjs` guards RULE #3 — no faded ink on text a person is meant
to read. It ended every run with one line:

```
  46 legitimately-faded instance(s) allowed
✅ readable text uses real ink everywhere
```

Forty-six exemptions under a single number, and no way to see what they were.

The probe's own doc comment states a stricter policy than its code ran:

> `opacity` is the harder half, because it fades a whole subtree rather than an
> ink… There is no way to tell those apart from the property alone, so **every
> partial value is reported and each one is either fixed or written into
> OPACITY_OK with a reason.**

That is not what happened. Before `OPACITY_OK` was consulted, a broad regex was:

```js
const OPACITY_NOT_TEXT =
  /icon|glyph|arrow|chevron|caret|divider|separator|-sep\b|handle|thumb|track|dot|
   bullet|swatch|overlay|backdrop|scrim|grain|shine|glow|ring|indicator|close|
   dismiss|remove|clear|resize|grip|drag/i;
```

Any selector containing any of those 26 words was waved through with no record.
**37 distinct selectors** were being excused that way, and nobody had seen the
list since the regex was written.

## Why it matters

This is the exemption becoming the rule. A probe that guards a design rule is
only worth its narrowest path, and this one had a 26-word escape hatch in front
of the reviewed list — so a new fade on `.card-indicator`, `.toast-close-label`,
`.step-ring-caption` or anything else containing one of those substrings joined
the count silently and the build stayed green.

**Demonstrated rather than argued.** A faded rule was added to `badge.js` on a
selector called `-indicator`, and both versions of the probe run against it:

```
the committed probe   ✅ readable text uses real ink everywhere      exit 0
the fixed probe       ✗ badge|-indicator … excused only because its
                        SELECTOR looks like a glyph                  exit 1
```

Same input, same components, opposite answers. `major` because it is the check
itself, and because it had been reporting a clean result it had not earned.

## Where it lives

[packages/silicaui/scripts/verify-readable-ink.mjs](../../../packages/silicaui/scripts/verify-readable-ink.mjs)

## The fix

**Every exemption is named, and by which rule let it through.** `let allowed = 0`
became a record:

```
  46 faded instance(s) allowed — 8 named individually, 1 by line context,
     37 distinct selector(s) matched by pattern and reviewed
```

**And the pattern-matched ones now have a floor under them.** The regex still
runs, but it only proposes: a selector it matches must also be in
`PATTERN_REVIEWED`, or the build fails with that selector named and an
instruction. The list **started empty on purpose** — the probe printed all 37,
each was read, and they went in grouped by the reason each is allowed:

| Group | Why RULE #3 allows it |
| --- | --- |
| `&:disabled`, `[data-disabled]`, `[aria-disabled]` | disabled controls — one of the three things the rule says faded text is FOR |
| `::placeholder`, `[data-placeholder]`, `-placeholder` | a prompt for what to type, not content to read |
| `[data-outside]` | days outside the month — the same date drawn twice, the rule's own "de-emphasized duplicate" |
| `[data-dragging]`, `[data-drag-over]` | a transient state under the pointer |
| `-close`, `-sort-icon`, `-trigger-icon`, `chat-typing-dot` | glyphs with no words inside |

Not one of the 37 was actually wrong, which is worth saying plainly: the regex
was not making bad calls, it was making **unaccountable** ones. The difference
only shows up on the thirty-eighth.

## Confirmed by

```
before   46 legitimately-faded instance(s) allowed
after    46 faded instance(s) allowed — 8 named individually, 1 by line context,
            37 distinct selector(s) matched by pattern and reviewed
         ✅ readable text uses real ink everywhere
```

Same 46, and now every one of them is on the record.

**Shown able to fail, twice, and the first attempt was aimed at the wrong half.**
A faded *colour* on a `-indicator` selector was caught — but by the muted half,
whose pattern list does not contain "indicator", so it proved nothing about the
hole. Repeated with an *opacity* fade, which is the half the glyph regex governs:

```
✗ badge|-indicator is faded and was excused only because its SELECTOR looks
  like a glyph. Open it: if any words are inside, give them real ink. If there
  are none, add it to PATTERN_REVIEWED in this script.
exit 1
```

`badge.js` restored byte-identical afterwards and the probe is green.

## Rating effect

None directly — it is a build-time check. Its reach is every component that
ships a faded rule.
