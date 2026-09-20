# 071 — One email, many recipients, and the builder could only ever show one of them

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · act 6, one email and three shops
**Surface:** Email builder › Preview, the projector, and the host seam
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 6 is *"Make the Clifton events show only for `{{homeShop}} == Clifton`"*, and
it is done when **all three variants have been produced and looked at, including
the variant for somebody whose `homeShop` is empty.**

He could build the rule. He could not look at any of it.

Two separate walls, and the second is the real one.

### Wall 1 — the rule reads as if segmenting is impossible

Opening the visibility rule on a block:

```
=== the conditions 'Visible when…' offers ===
  "Condition Has a value Is empty"
  can it say "equals Clifton": false

=== what the panel explains, in its own words ===
  (nothing)
```

Two conditions, neither of them equality, and **not one word of explanation
anywhere**. A marketing lead reading that panel would reasonably conclude the
product cannot do "only for Clifton".

It can. The answer is that `homeShop == Clifton` is a **reference the platform
computes and offers**, because silica never parses a reference's value — the same
deliberate line its merge tokens hold, where the grammar is a bare path and
everything else belongs to the host. That design is right. It was also completely
invisible: the panel said nothing, and the picker (correctly) only lists what the
host declares, so a host that had not declared a segment flag left the author
staring at a dead end with no clue whose job it was to fix.

### Wall 2 — he could never see what anybody else received

This is the one act 6 turns on.

`toEmailHtml` resolved everything against an implicit `{}`, and the only way to
render "the same email for a different subscriber" was to **construct another
host**. That is fine on a send path, which is looping over recipients and
building objects anyway. It is impossible in a builder, where the host is mounted
once and lives for the session.

So the Preview showed exactly one version of the email — whatever the host's
resolver happened to return — for ever. An author could write "show this only to
the Clifton lot", and the two thirds of his list who are *not* the Clifton lot
were simply unviewable.

This was already recorded as a deduction in
[066](066-a-merge-token-nobody-resolves-is-delivered-as-typed.md) under "Also
recorded, not fixed". Act 6 is where it stops being a deduction: an act whose
completion condition is *"all three variants have been produced and looked at"*
cannot be completed at all.

## What should have happened

He picks a subscriber and sees the email that subscriber gets.

## Why it matters

A marketing email is not one email. It is 4,100 of them, and the differences
between them are exactly the parts an author is least able to reason about
without looking: an empty name, a section that vanishes, a shop somebody never
told you about.

**The proof is the first thing the fix showed.** With the picker in and no other
change, his own newsletter previewed as the third sample subscriber:

```
--- Someone with no name and no shop on file ---
  greeting:            "Hello ,"
```

That is act 3's defect, sitting in his finished email, and the picker surfaced it
in the first ten seconds of existing. He had already been told about the token
(066) and had still written the copy that breaks — because a warning about a
field is not the same as seeing the sentence a person receives.

## Where it lives

[packages/silicaui-builder/src/email/projector.ts](../../../packages/silicaui-builder/src/email/projector.ts) — `EmailRenderOptions`
[packages/silicaui-builder/src/email/react/host.ts](../../../packages/silicaui-builder/src/email/react/host.ts) — `previewAudiences`
[packages/silicaui-builder/src/email/react/EmailPreview.tsx](../../../packages/silicaui-builder/src/email/react/EmailPreview.tsx)
[packages/silicaui-html/src/resolve.ts](../../../packages/silicaui-html/src/resolve.ts) — `DataScope`

## The fix

**1. A render carries who it is for.** `DataScope` gains `audience`:

```ts
export interface DataScope {
  item?: unknown;
  index?: number;
  /** WHO this render is for … Opaque to silica, exactly like a `ref`. */
  audience?: unknown;
}
```

Separate from `item`/`index` on purpose. Those say *where in a repeat* a node is
and are rewritten every iteration; this says who the whole render is addressed
to and is constant across the walk. Overloading `item` would have collided the
first time an audience-aware binding appeared inside a collection.

Opaque, like a ref: silica never reads it, never compares it, has no idea what is
in it.

**2. `toEmailHtml` accepts a `scope`** and threads it to `resolveEmailTree` and
to **both** subject and preheader token passes, which were each hardcoding a
second `{}`. Absent → `{}`, so no existing call changes behaviour.

This is useful beyond the builder: a send path can now render per recipient from
one resolver object instead of constructing a host per person.

**3. A host seam, `previewAudiences()`** — `{ key, label, scope }[]`. Silica never
invents a subscriber; who the samples are is entirely the host's business. The
doc comment asks for the awkward ones by name:

> **Include the awkward ones.** The useful samples are the subscriber with no
> first name on file and the one who never said which shop is theirs — the
> variants an author would otherwise never see until somebody replies to say the
> email said "Hello ,".

**4. A picker in the Preview** — "Showing what this subscriber gets". Absent the
hook, no picker and nothing changes.

**5. The visibility rule explains itself**, in a marketing lead's words, the way
`LinkSettingsFields` two rows below already did:

> Shows or hides this block depending on whether the reference has anything in
> it. To show something to one group only — one shop, one city, people who
> bought before — pick a reference your platform provides for that group. This
> rule cannot compare a value to text you type.

**The grammar is still untouched.** No equality operator, for the same reason
there is no `??` in a merge token: the moment silica parses a reference's value
it owns an expression language. The last sentence of that paragraph says so
plainly instead of leaving an author to discover it.

**6. The harness demo host** (a fixture, not the product) gained
`customer.homeShop`, `customer.atClifton` and three sample subscribers — because
a demo host that can only produce one recipient cannot demonstrate the contract
at all.

## Confirmed by

Built as Reuben: a personalised greeting with the act-3 fallback pattern, and a
Clifton events block bound to `Is a Clifton customer`. Then all three variants,
from the picker, in the builder:

```
the subscribers he can preview as:
  Reuben — Clifton, has a first name
  Someone at Gloucester Road
  Someone with no name and no shop on file

--- Reuben — Clifton, has a first name ---
  greeting:            "Hello Reuben,"
  Clifton events shown: true
  any raw {{token}}:    false

--- Someone at Gloucester Road ---
  greeting:            "Hello Priya,"
  Clifton events shown: false
  any raw {{token}}:    false

--- Someone with no name and no shop on file ---
  greeting:            "Hello there,"
  Clifton events shown: false
  any raw {{token}}:    false
```

Three variants, produced and looked at, including the empty one. That is act 6's
completion condition met on the screen rather than in a script.

Five checks in `probe-email.ts` driving one host and three recipients, **with a
control that no scope at all still behaves exactly as before**:

```
  ✓ the greeting differs per recipient from ONE host
  ✓ a visibility rule keeps the Clifton block for the Clifton customer
  ✓ ...and drops it for everybody else
  ✓ with no scope at all, it still renders and resolves to empty
  ✓ the subject is resolved against the render scope too
```

**Deliberately broken to watch them fail** before restoring:

```
  ✗ the greeting differs per recipient from ONE host
  ✗ a visibility rule keeps the Clifton block for the Clifton customer
  ✗ the subject is resolved against the render scope too
  ❌ 3 check(s) failed
              … restored …
  ✅ email engine: all checks passed
```

One e2e test drives the picker through all three subscribers, reading the
preview's `srcdoc` rather than reaching into a `sandbox=""` iframe whose isolation
is deliberate.

`pnpm verify` exit 0 workspace-wide including `silicaui-html`'s byte-identical
golden fixture, builder e2e **203 passed**, typecheck clean.

**One existing test needed updating and it was my change that broke it.**
`{{cust` used to match exactly one data source, and the whole point of that
test's `ArrowDown` is that it is a no-op with one match. Adding
`customer.homeShop` and `customer.atClifton` to the demo host made it three. The
query is now `{{customer.first`, with a comment saying why.

## Also recorded, not fixed

**A "preview as" is not a test send.** It renders through the same resolver the
send path uses, which is the strongest local guarantee available, but it is still
a browser drawing HTML. What a given client does with that HTML is act 8's
question and remains **not checked** on this machine.

## Rating effect

`Email builder › Preview` and `Email builder › Inspector` in [rating.md](../rating.md),
once the email screens are scored.
