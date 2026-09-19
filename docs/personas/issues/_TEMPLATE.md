# NNN — What the customer could not do, in their words

**Status:** open
**Severity:** blocker · major · minor · design · copy
**Found by:** P0N · Person Name · act N
**Surface:** silicaui.com › Docs › Button — or — Site builder › Inspector › Design
**Filed:** YYYY-MM-DD
**Fixed:** —
**Confirmed by:** —
**Blocked on:** — (decision · scope, only if the fix could not be made now)

Title it the way they would say it — "Marlene could not tell which page she was
editing", not "mode atom and left-tab atom desync". The mechanism goes in **Where it
lives**.

## What happened

What you saw, in the order you saw it. **Quote the exact words on screen** — the
sentence is often the defect. Say which theme and which width you were in; on this
product that is half the reproduction.

## What should have happened

What this person had every reason to expect. If the expectation comes from a rule or a
doc, name it — the root [CLAUDE.md](../../../CLAUDE.md) rules,
[docs/builder-ux-principles.md](../../builder-ux-principles.md), or the sentence on
the marketing page that promised it.

## How to reproduce

1. Numbered, from the first door (silicaui.com `/`, or the harness on 5178).
2. **Include the data** — the actual heading text, the actual color, the actual theme.
3. Say the **theme** (light / dark / which of the 20 named ones) and the **width**.
4. Say how reliably it happens: every time, or once in five.

## Why it matters

Who is hurt and how. "The published page is unreadable in dark", "the email breaks in
Outlook", "they could not finish the job", "it says something false". If it is
cosmetic, say that plainly rather than inflating it.

## Where it lives

Files and lines. **Leave blank rather than guessing** — a wrong pointer costs more
than no pointer.

## Do the siblings have it too?

**Required. Not optional, and not left blank.** On this product a defect found on one
component is usually a defect in a class of them. Say which siblings you checked and
what you found:

> Checked Button, Badge and Alert. Button and Badge both do it; Alert does not,
> because it goes through `rolesOf`. Fixed in the shared table, not in Button.

If you checked none, say "not checked" and why.

## The fix

What changed and in which files. **Fix the affordance, not the call site.** If the
same rule is enforced in more than one renderer — Canvas and Navigator, React and the
HTML projection, site builder and email builder — say whether all of them got it.

If the fix touched a published class name, token name or component prop, say so and
say what the changeset says.

## Confirmed by

**Required before `Status: fixed`.** The step re-run as the persona, on the screen,
with the same data, in **both themes**, and what you saw:

> Re-ran P03 act 3. Set the hero's surface to `brand` in the Inspector, flipped to
> dark with the toolbar toggle — heading read as `--color-brand-content` at 6.1:1,
> measured off the computed style, not the swatch. Same at 360px.

A typecheck, a probe or a golden file is not a confirmation.

If the fix touched the plugin, the token engine or the shared class vocabulary, add a
**second** confirmation line naming the earlier persona you reopened and the real job
you did there (RULE #7).

## Rating effect

If this moved a screen's score, record it here and in [rating.md](../rating.md):
`Site builder › Inspector › Design — Ease 4 → 8`.
