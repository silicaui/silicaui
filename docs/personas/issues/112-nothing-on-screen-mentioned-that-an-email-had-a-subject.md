# 112 — Nothing on screen mentioned that an email had a subject

**Status:** fixed
**Severity:** minor
**Found by:** P04 · Reuben Halloway · act 2, recorded as a deduction; built on Brandon's instruction, 2026-09-19
**Surface:** `@wizeworks/silicaui-builder` — the email builder, above the canvas
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P04 act 2, written down and deliberately not acted on at the time:

> **Recorded, not fixed:** getting to the subject at all takes knowing that a
> tree row called `Email` holds it — two clicks, and until then **nothing on
> screen mentions a subject line**. For a marketing lead the subject is the
> *first* thing he writes. A deduction against `Email builder › Inspector`, not
> a redesign at the end of act 2.

The reasoning for deferring was about scope and timing, not about it being
acceptable.

## Why it matters

The subject is the single most consequential string in an email — it is most of
what decides whether the thing is opened at all — and the builder opened on a
screen that did not say emails have one. Finding it meant knowing that a row
labelled "Email" is the document, and that document fields live behind its
Settings tab. Both are true and neither is guessable.

It is the "fetched but never rendered" shape turned inside out: the value is in
the document, the editor for it exists and works, and the screen the author
starts on gives no sign that either is there.

## Where it lives

[packages/silicaui-builder/src/email/react/SubjectBar.tsx](../../../packages/silicaui-builder/src/email/react/SubjectBar.tsx)
[packages/silicaui-builder/src/email/react/inspector-focus.tsx](../../../packages/silicaui-builder/src/email/react/inspector-focus.tsx)

## The fix, and why it is not a second field

A slim bar above the canvas — where every mail client puts it — reading
`Subject` and then the subject.

**A read-out, not an editor**, and that was a decision rather than a shortcut.
`EmailBuilder`'s toolbar already carries a written ruling against the obvious
answer:

> Subject and preview text are document fields, not toolbar controls… A second,
> token-less copy up here duplicated the field in its WORSE form and ate ~300px
> of a bar that also has to fit the host's own `toolbarSlot`.

That is right, and a second field would also have had a real bug in it:
`TokenTextField` seeds its local state from `defaultValue` at mount and **never
re-syncs**, so two of them on one value would drift apart within a session and
the last one blurred would win.

So the bar shows the value and takes you to the one editor there is — in **one**
click instead of two, and from a screen that now mentions the field exists.

**It moves the Inspector's tab, not just the selection.** Selecting the root
without asking for Settings lands an author on Design, which is the right rail
and the wrong page of it — most of the original complaint over again. That took
a small piece of machinery: `InspectorFocusProvider`, a React context, because
which tab is open is a fact about this rail in this browser and nothing in a
saved email should know a rail exists. The request is **consumed** — read once
and cleared — or it would pin the tab and the author could never move off it.

**And the empty state says what is missing.** An email with no subject is the one
that goes out wrong, so it reads *"No subject yet — most people write this
first"* rather than rendering as a slightly shorter line of nothing.

## Confirmed by

```
the subject is on screen from the first moment: yes
   it reads: "New email"

CONTROL  the inspector tab before clicking: "Design"
after clicking the bar, selected tabs: ["Layers","Settings"]
   the rail reads: "Design Settings Email CONTENT Subject 9 characters Preview text 0 …"
   landed on the subject field: yes  ok

page errors: 0
```

The control is the one that matters: if the Inspector had already been on
Settings, "it went to Settings" would have proved nothing.

Guarded by
[e2e/email-subject-bar.spec.ts](../../../packages/silicaui-builder/e2e/email-subject-bar.spec.ts),
which also locks the two-way read — type a subject into the Inspector and the bar
follows it, empty it and the bar says so — because one value with two views is
exactly the thing that quietly becomes two values.

```
2 passed
```

## One test it broke, and why the test was the thing that changed

`email-navigator-and-tabs.spec.ts` asserted that with nothing selected the word
"Subject" appears **nowhere on the page**. It appears now, on purpose, which was
the entire point. The assertion's real subject was the **rail** — that it shows
no document settings until you ask for them — and that is still true, so it is
scoped to the Inspector rather than the page, with an added line asserting the
bar is there. Narrowing an assertion to what it was actually about is different
from relaxing it to fit.

## Rating effect

`Email builder › Canvas` in [rating.md](../rating.md) — the bar is chrome
attached to it, scored with it, the same way the selection overlay is.
