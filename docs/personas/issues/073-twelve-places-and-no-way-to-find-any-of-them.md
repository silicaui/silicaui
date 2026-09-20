# 073 — Twelve places to change, six of them on no screen, and no way to find any of them

**Status:** fixed
**Severity:** high
**Found by:** P04 · Reuben Halloway · act 7, the offer code that was wrong
**Surface:** Email builder — the whole project
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 7's completion condition is unusual: *"it is fixed everywhere, and **the
number of places he had to remember to change it is written down**."* The act is
asking for a measurement, so here is the measurement.

His offer code went out as `DISPATCH10` and should have been `THORNBURY10`. With
the email duplicated for three shops ([072](072-no-way-to-copy-an-email-or-a-page.md)),
counted straight out of the saved project:

```
=== every place "DISPATCH10" appears ===
  Dispatch — Clifton          (the email) .subject
  Dispatch — Clifton          (the email) .preheader
  Dispatch — Clifton          body › section › text    .html
  Dispatch — Clifton          body › section › button  .href
  Dispatch — Gloucester Road  … the same four …
  Dispatch — Bedminster       … the same four …

  TOTAL PLACES: 12
```

**Twelve.** Four per email, three emails.

And what the builder offered him for finding them:

```
=== what the builder offers for finding a word across the project ===
  (nothing)
```

No find. No search. Nothing. "Fix it everywhere" meant "remember everywhere".

## The half of it that is worse

Of the four places in each email, **two are on no screen he was looking at**:

- The **subject** and **preview text** live behind a tree row called "Email",
  which he only found in act 2 by guessing.
- The **web address behind the button** is visible only once that button is
  selected and its Settings tab is open. On the canvas the button says "Read
  more"; the offer code is in the query string, invisible.

So six of the twelve were not merely unlisted — they were unseeable without
already knowing where to look. A person who works carefully through the canvas,
fixing everything he can see, ships six wrong links and three wrong subject
lines to 4,100 people.

## What should have happened

He types the code, the builder tells him how many places it is in, and changes
them all.

## Why it matters

This is the failure shape the persona framework calls *absence behaving like
fine*. A missed occurrence renders identically to a correct one — the email
looks finished either way. Nothing fails, nothing warns, and the first signal is
a customer at a till being told the code does not work.

The count is the deliverable here. Twelve places, six invisible, is not a number
a person holds in their head at 4pm on a Thursday.

## Where it lives

[packages/silicaui-builder/src/email/find.ts](../../../packages/silicaui-builder/src/email/find.ts) — new
[packages/silicaui-builder/src/email/engine.ts](../../../packages/silicaui-builder/src/email/engine.ts) — `findText` / `replaceText`
[packages/silicaui-builder/src/email/react/FindPanel.tsx](../../../packages/silicaui-builder/src/email/react/FindPanel.tsx) — new
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the third rail page

## The fix

**A Find page on the left rail**, beside Layers and Insert. A page rather than a
dialog, because working a list of twelve means leaving it open while the canvas
is being used.

**The count is the first thing it says.** "12 places in 3 emails" — the question
he could not otherwise answer, answered before he starts, and the same number
the Change-all button acts on.

**It searches every email in the project, not the one that is open.** That is the
part that makes it worth having: two thirds of his twelve were in documents the
builder was not showing him.

**It searches the places that are not on screen** — subject, preview text, a
button's web address, an image's description, and the author's own block names —
because those are precisely the ones a careful person misses.

**One press fixes all of them, and one undo press puts all of them back.** The
replace crosses templates, which no other method in this engine does, so it
writes to each document directly and stamps each op with that template's own
target. A collaborating host therefore sees exactly what happened: N ordinary
edits across N templates, in one batch.

### Scope, stated rather than discovered

- **Exact text, capitals included.** No case folding, no wildcards, no regular
  expressions. An offer code, a date, a price and a URL are what people actually
  hunt, and all four are typed exactly. The panel says so on screen rather than
  leaving him to find out.
- **Only what a reader would see or follow.** Not class names, colors or sizes:
  those are the design, and a replace that rewrote `#18181b` because it contained
  `18` would be a disaster. There is a probe check for exactly that.
- **Never inside markup.** A text block stores HTML, so a naive replace of "a"
  would rewrite `<a href=…>` into nonsense. Matching and replacing happen in the
  text between the tags, never in a tag. Also a probe check.

### One small thing the run itself turned up

Clicking a result switches the whole document under him — and the template
switcher lives on the *Layers* page, so from Find nothing said which email he
had landed in. The list says it instead: the group he is currently in reads
"Dispatch — Clifton — the one you have open".

## Confirmed by

Driven as Reuben, on the real screen. What the builder told him when he asked:

```
=== what the builder tells him when he asks ===
  it says: "12 places in 3 emails"
  and lists:
    Subject                              … 10% off this week with DISPATCH10
    Preview text                         Use DISPATCH10 at the till until Sunda…
    Show this email at the Clifton t… — the words   … or enter DISPATCH10 online.
    Read more — the button's web address … ybooks.co.uk/offer?code=DISPATCH10
    … × 3 emails

  the Find list now marks: "Dispatch — Clifton — the one you have open"
  the button reads: "Change all 12"
  after: "Changed 12 places to “THORNBURY10”. Nothing says “DISPATCH10” any more."
```

Then read back out of the saved project, and out of the HTML that actually
reaches an inbox, per shop:

```
=== read back out of the saved project ===
  Dispatch — Clifton:          "DISPATCH10" x0, "THORNBURY10" x4
  Dispatch — Gloucester Road:  "DISPATCH10" x0, "THORNBURY10" x4
  Dispatch — Bedminster:       "DISPATCH10" x0, "THORNBURY10" x4

=== and out of the HTML each shop's subscribers receive ===
  Dispatch — Clifton:          "DISPATCH10" gone, "THORNBURY10" x4
  Dispatch — Gloucester Road:  "DISPATCH10" gone, "THORNBURY10" x4
  Dispatch — Bedminster:       "DISPATCH10" gone, "THORNBURY10" x4

  one undo press put back: 12 occurrences of "DISPATCH10"
```

That is act 7's completion condition met on the screen: fixed everywhere, and
the number written down — **twelve**.

E2e drives the panel end to end, **with a negative control** (a code that is in
none of them finds nothing — a panel that reported hits for everything would
tell him nothing), and reads the projected HTML of the email that is *not* open,
which is the only honest proof the fix crossed templates:

```
  ✓ Find counts every place a word appears across all the emails, and changes them in one press
```

Probe checks — 27 in a new `7c` section, including the two guards the scope
depends on:

```
  ✓ findText finds all five places in one email
  ✓ ...and the web address behind the button — the one on no screen
  ✓ three shops → fifteen places, counted for him
  ✓ replaceText reports the number of places it changed
  ✓ nothing says the wrong code any more, in any email
  ✓ undo puts all fifteen back in one press
  ✓ searching for a letter finds the words AND the subject
  ✓ ...and does NOT count the letters inside the tag — four in the markup, two in the words
  ✓ the tag survived a replace that matched inside it
  ✓ the colour was not rewritten
  ✓ the font size was not rewritten
  ✓ an empty search finds nothing, not everything
  ✓ a no-op replace leaves the email byte-identical
```

**Deliberately broken to watch them fail** before restoring — the replace
reaching inside tags, and the replace touching only the open template:

```
  ✗ replaceText reports the number of places it changed
  ✗ nothing says the wrong code any more, in any email
  ✗ “Dispatch — Clifton” subject was fixed too
  ✗ the tag survived a replace that matched inside it
  ✗ Find counts every place… (e2e)
              … restored …
  ✅ email engine: all checks passed
```

**One of my own checks was wrong and the probe caught it.** I asserted that
searching for the letter "a" would find one place; it finds two, because the
stock subject "New email" contains one — which is the subject genuinely being in
scope, not noise. The check now says both things, and names why.

`pnpm verify` exit 0 workspace-wide, builder e2e **206 passed**, typecheck clean.

## Also recorded, not fixed

**The site builder has no Find either.** The same argument applies to a site with
a price, a phone number or a term date repeated across pages, and the mechanism
here is email-shaped only in which fields it searches. Not fixed in this run
because P04 is the email persona and a site version needs a site persona to
drive it honestly; recorded so it is a known gap rather than a forgotten one.

**Find is exact and case-sensitive by design**, which is a real limit: a code
typed as `Dispatch10` in one place will not be found by a search for
`DISPATCH10`. Deliberate, stated on screen, and revisitable — but it is a limit,
and pretending otherwise would be the thing this framework exists to stop.

## Rating effect

New screen `Email builder › Find` in [rating.md](../rating.md), and a deduction
lifted from `Email builder › Inspector`.


---

**The site half is built, 2026-09-19.** The line above — *"The site builder has
no Find either"* — is closed by
[111](111-the-site-builder-had-no-find-and-a-site-hides-text-in-three-places.md).
A site turned out to have THREE hiding places rather than one: the shared frame
(a different tree), a saved component (behind a mode switch), and the address
behind a link. Replace crosses all three in one undo step; a page's slug is
listed and never rewritten, because it is a route.
