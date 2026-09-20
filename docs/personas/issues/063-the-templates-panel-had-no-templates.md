# 063 — The Templates panel had no templates

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · act 1, the first thing he did
**Surface:** Email builder › Templates
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 1 is *"Open the Templates panel and pick one. Then start replacing its content with
his."* That is what Reuben does — he has sent a newsletter every Thursday for four
years and does not start from a blank page.

The panel offered one thing, and it was his own empty email:

```
a template switcher exists: true
it says: "Email 1"
the list offers: ["Email 1"]

the email itself, as it arrives:
  "Start writing your email…"

anything on screen offering a template to START from:
  ["Current template", "Rename template", "Add template", "Delete template"]
```

**Templates**, here, meant *the emails I have already made*. In every tool a marketing
person has used, it means *a design to start from*. So the act could not be performed:
there was nothing to pick.

## What should have happened

Pressing the plus offers him a layout.

## How to reproduce

1. Open `http://localhost:5178/?editor=email`.
2. Press **+** next to the template name.
3. Before the fix: a second blank email appears, named "Email 2", reading
   *"Start writing your email…"*.

## Why it matters

A blank page is the single most expensive thing you can hand somebody whose job is to
get a newsletter out on Thursday morning. He is not deciding what a newsletter looks
like — he already knows — he is trying to produce this week's.

And the word makes it worse rather than better. **Templates** sets an expectation the
panel cannot meet, so the first thirty seconds teach him that the words in this tool do
not mean what they say. That is the same shape as
[045](045-accent-means-the-opposite-of-what-she-came-to-change.md) from P03: not a
missing feature so much as a label promising one.

## Where it lives

[packages/silicaui-builder/src/email/engine.ts](../../../packages/silicaui-builder/src/email/engine.ts)

```ts
addTemplate(name?: string): string {
  const label = name?.trim() || `Email ${this.project.templates.length + 1}`;
  const template: EmailTemplate = {
    id: defaultMakeId(),
    name: label,
    document: emptyEmailDocument(defaultMakeId, this.colors),   // ← always empty
  };
```

## Do the siblings have it too?

**No — and that is the finding.** The site builder has had all three pieces of this for
a while, and none of them travelled:

| | site builder | email builder, before |
| --- | --- | --- |
| a shipped set of starters | `component-starters.ts` | **nothing** |
| a picker with search | `ComponentStarterDialog.tsx` | **nothing** |
| a host seam to contribute more | `host.componentStarters()` | **nothing** |

This is the twelfth time on this run-series that a thing exists in one builder and not
its twin. It is worth naming the pattern rather than just the instance: these two
builders are built by the same people from the same parts, and every capability added
to one is a capability the other silently lacks until somebody drives it.

## The fix

**Three files, mirroring the site builder's shapes deliberately so the two cannot drift
into different ideas of the same gesture.**

`email/starters.ts` — four shipped starters, each returning a whole `EmailDocument`
(because the choices that make a newsletter a newsletter — body width, the background
behind the content, the subject line — live on the document, not inside it):

```
blank          Blank email    One empty section. Start from nothing.
newsletter     Newsletter     A masthead, a lead story, three picks and a footer — the weekly-send shape
announcement   Announcement   One thing to say and one thing to press — a launch, a closure, a change of hours
offer          Offer          A promotion with a code and an end date
```

`email/react/EmailStarterDialog.tsx` — the picker, control for control the same as the
site builder's, down to the `starter:<key>` test ids.

`EmailBuilderHost.emailStarters()` — the same `{ extend, hide }` merge shape as
`catalog()` and as the site builder's `componentStarters()`, so a platform's own house
newsletter lands predictably.

`addTemplate(name?, document?)` gains an optional document. Omitted still means empty,
so every existing caller is unchanged.

**Three decisions worth the words:**

**The stock copy is deliberately obvious.** `"YOUR COMPANY · Your street address, town,
postcode"`, `"The lead story headline"`. A starter whose placeholder text reads like
finished copy is exactly how somebody else's address ships in a real send — which is
what act 1's second half exists to catch.

**The footer carries a real `{{unsubscribeUrl}}`, not a `#`.** An unsubscribe that does
not work is the one defect in an email that is also illegal in most of the world. He
gets a working one without having to know it is there.

**Every image ships with real `alt` text.** An empty `alt` reads as "decorative, skip
me", and a subscriber whose client blocks images — most of them — sees nothing at all.
Stock copy is wrong words; a missing `alt` is a missing affordance, and only one of
those is fixed by him typing over it.

## Confirmed by

Driven as Reuben, pressing the plus:

```
a dialog opens: "New email" — Start blank, or from a layout you can then replace with your own.
focus starts in: Search layouts…
  blank         Blank email     One empty section. Start from nothing.
  newsletter    Newsletter      A masthead, a lead story, three picks and a footer — the weekly-send shape
  announcement  Announcement    One thing to say and one thing to press — a launch, a closure, a change of hours
  offer         Offer           A promotion with a code and an end date

after picking: focus is on "Template name" (the name field: true)
template name: "The Thornbury Dispatch"
the email on the canvas: 444 characters
```

The add-then-name flow [044](044-one-click-and-one-enter-made-two-pages.md) established
is intact: pick a layout, land in the name field, type, Enter.

**And act 1's actual question — what stock copy could he miss?** Every marker the
newsletter starter ships is visible on the canvas where he can reach it:

```
visible  YOUR COMPANY              visible  The lead story headline
visible  Your street address       visible  First / Second / Third pick
visible  {{firstName}}             visible  A sentence introducing this issue
  —      {{unsubscribeUrl}}        visible  Read more
```

The one thing not on the canvas is `{{unsubscribeUrl}}`, and that is correct: it is an
`href`, not copy, shown in the Inspector when the line is selected. Nothing is hidden
from him that he is expected to replace.

`pnpm verify` green across the workspace, builder e2e **200 passed**, typecheck clean,
0 console errors.

**Four e2e specs needed updating and they were mine.** `email-templates.spec.ts` adds a
template and immediately asserts on the canvas; Add now opens a picker first. The
helper picks **Blank email** — which is precisely the document `addTemplate` used to
mint on its own — so the tests still exercise what they were written to exercise.

## Rating effect

`Email builder › Templates — Ease` and the new `Email builder › New email (dialog)` row
in [rating.md](../rating.md), once the email screens are scored.
