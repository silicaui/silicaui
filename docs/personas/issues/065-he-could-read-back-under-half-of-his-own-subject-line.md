# 065 — He could read back under half of his own subject line

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · act 2, the 97-character subject line
**Surface:** Email builder › Inspector › Settings — Subject and Preview text
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 2 is *"Type it in. **Read it back.**"* The subject line is his real one:

> This week: Ondaatje's new one, a Tuesday poetry night in Clifton, and 20% off everything Nordic

It went in whole and came back whole. What he could not do was read it:

```
typed:  95 characters
field:  95 characters    maxlength: none
identical to what he typed: true
the box is 238px wide holding 528px of text
→ he can see about 45% of it at once, and must scroll inside the box to read the rest
```

A one-line `<input>` in a 240px rail, holding 528px of text. To check his own subject
line he has to put the caret in the box and arrow across it.

And nothing on screen said anything about length:

```
anything on screen about how long a subject line can be: NOTHING
```

## What should have happened

He can see the whole subject line, and has some idea how much of it an inbox will show.

## How to reproduce

1. `http://localhost:5178/?editor=email` → Layers → the row called **Email** →
   Inspector **Settings**.
2. Type a real subject line into **Subject**.
3. Before the fix: a single line, scrolled, with no indication of length.

## Why it matters

The subject line is the only string in an email that decides whether any of the other
strings get read. Reuben has 4,100 subscribers and a 38% open rate, and the subject is
the whole of that number.

Two separate things were wrong, and the second is the one that costs him money:

**He cannot proofread it.** A typo in body copy is embarrassing; a typo in the subject
line is the thing 4,100 people see in their inbox whether they open it or not. The one
field where reading it back matters most was the one field he could not read back.

**Nothing told him it was too long.** Most inboxes show roughly the first 60
characters, fewer on a phone — which is where most people read email. His is 95, so a
third of it never reaches anybody. The builder knew the length and said nothing.

Neither of these is a bug in the sense of something behaving wrongly. Both are the
framework's **"fetched but never rendered"** shape: the information is already in the
component's hand and nothing draws it.

## Where it lives

[packages/silicaui-builder/src/email/react/Inspector.tsx](../../../packages/silicaui-builder/src/email/react/Inspector.tsx) — `TokenTextField`

```tsx
<Input
  ref={ref}
  size="sm"
  className="w-full"
  value={text}
  …
```

`Row` is already a stacked `flex flex-col`, so the field is as wide as the rail
allows. The rail is 238px. There is no width fix here — a 95-character line does not
fit on one line in a 240px rail at any readable size. It has to **wrap**.

## Do the siblings have it too?

`TokenTextField` has three call sites:

| | |
| --- | --- |
| **Subject** | **the defect** — long by nature, and the most important string in the email |
| **Preview text** | **the same** — it sits beside the subject in every inbox and is longer still |
| a Button's **Label** | correct as it is. A button label is two or three words; wrapping it would imply it can be a paragraph, which it must not be |

So `wrap` is opt-in per field rather than a change to the component's one behaviour.

## The fix

```tsx
/** Render as a growing textarea instead of one line. For the subject and the
 *  preview text: the rail is ~240px, a real subject line is ~500px of text, so
 *  on one line an author can read under half of the single most important
 *  string in the whole email … A `Label` on a button is short and stays on its
 *  line. */
wrap?: boolean;
/** Show a running character count, and say when it passes this many — the
 *  point where inboxes start cutting. Not a limit; nothing is refused. */
countFrom?: number;
```

`<TokenTextField label="Subject" wrap countFrom={60} … />` and
`<TokenTextField label="Preview text" wrap countFrom={90} … />`.

Three decisions:

**Enter commits; it never inserts a newline.** A subject line is one line by
definition, and a textarea's default would let him put a line break in a field that
cannot carry one. Enter does what it does on every other field in this rail — unless
the merge-token autocomplete is open, where it still picks the highlighted token.

**A count, not a cap.** There is no `maxlength` and nothing is refused. He may well
have a good reason for 95 characters; what he did not have was the fact. The line only
turns into a warning past the threshold, so a short subject says nothing more than its
length.

**The merge-token autocomplete is untouched.** `matchTokenQuery` reads
`selectionStart`, which a textarea has too, so `{{firstName}}` in a subject still opens
the picker — proved by the e2e test that exports the resolved `<title>`.

## Confirmed by

Driven as Reuben, typing his real subject:

```
before:  the box is 238px wide holding 528px of text   → 45% visible
after:   the box is 238px wide holding 236px of text   → all of it
typed 95 characters, field holds 95, identical to what he typed, maxlength: none
preview text: typed 81, field holds 81
```

And the count, read off the screen at three lengths so the warning is shown to be
conditional rather than decorative:

```
the starter's own copy:      Subject  28 characters
his real subject:            Subject  95 characters — most inboxes show about the first 60   [warning colour]
a short one:                 Subject  38 characters
```

**The fields were already properly labelled**, which was checked rather than assumed
after [046](046-the-colour-pickers-hex-box-has-no-name.md) found the opposite on the
colour picker: both are wrapped in a real `<label>`, so both have accessible names.

`pnpm verify` green across the workspace, builder e2e **200 passed**, typecheck clean.

**Five e2e tests needed updating and they were mine** — `email.spec.ts`,
`email-merge-tokens.spec.ts` and `email-collab-ops.spec.ts` all reach for
`ROW("Subject") > input`, which is a textarea now. Each says so in a comment pointing
here.

## Also recorded, not fixed

**Getting to the subject takes knowing that a tree row called "Email" holds it.**
Measured: Layers is open by default, so it is two clicks — the row called `Email`, then
the Inspector's `Settings` tab — and until then nothing anywhere on screen mentions a
subject line. For a marketing lead the subject is the *first* thing he writes, not a
property of a node he has to select first. That is a layout question rather than a
defect, and it is a deduction against `Email builder › Inspector` for when the email
screens are scored — not something to redesign at the end of act 2.

## Rating effect

`Email builder › Inspector — Ease` in [rating.md](../rating.md), once the email screens
are scored.
