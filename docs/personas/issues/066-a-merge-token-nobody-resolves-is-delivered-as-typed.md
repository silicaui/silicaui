# 066 — A merge token nobody resolves is delivered exactly as typed

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · act 3, the greeting and the empty merge token
**Surface:** Email builder › Inspector, and `src/email/starters.ts`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 3 is *"Put `{{firstName}}` in the greeting. Then set it to empty and look at
what a subscriber with no name on file receives."*

Both of the act's two named failure modes happened, measured through the real
projector on the real screen:

```
what a subscriber receives, with the starter's own token:
  "Hello {{firstName}},"

what a subscriber with NO NAME ON FILE receives:
  "Hello ,"
```

And nothing on any screen said a word about either:

```
every tab on screen: ["Layers","Insert","Design","Settings"]
anything offering a different subscriber to preview as: NOTHING
anything anywhere about an empty merge value:           NOTHING
anything in the Inspector about a fallback:             NOTHING
the token picker, on "{{cust":  ["Customer first name"]  — and nothing about what
                                 happens when it is empty
```

Two separate defects, and the first one was mine.

## Defect 1 — the newsletter starter shipped a token no host resolves

The starter I wrote in act 1 ([063](063-the-templates-panel-had-no-templates.md))
opened with `Hello {{firstName}},`. **`firstName` is a guess.** No host in this
repo declares or resolves it — the demo host's real reference is
`customer.firstName` — and a starter cannot know what a given platform calls its
fields.

The resolver's rule for an unknown ref is to keep the literal, which is right:

> a visible artifact in a test send beats a silently mangled sentence

So the default path — open the builder, pick the newsletter, write your issue,
send — delivered the characters `Hello {{firstName}},` to every subscriber.
Stock copy has to be correct when it is sent untouched.

## Defect 2 — the builder never said what a token would do

This is the real one.

An inline `{{ref}}` is the headline feature of an email builder. It is the
reason a marketing lead is in the product at all. And **the builder said nothing
about one, ever**: not on the canvas (which shows the literal by design, and
correctly), not in the Inspector, not on export.

**The resolver has always known.** `resolveTokens` fires an `unknown-ref`
diagnostic on every token it cannot resolve. Nothing anywhere consumed it. That
is this framework's **"fetched but never rendered"** shape, on the single
highest-cost silent failure an email tool has — 4,100 recipients, no undo.

Two things went out unannounced, and they are different in kind:

| | |
| --- | --- |
| **unknown ref** | the literal `{{firstName}}` is delivered. A defect, and the resolver already reported it |
| **known but empty** | the sentence closes over nothing: `Hello ,`. Legitimate data, so there is correctly no diagnostic — but an author who cannot SEE it cannot write around it |

## What should have happened

He can see what each token in his copy will send, before he sends it.

## How to reproduce

1. `http://localhost:5178/?editor=email&host=demo` → Templates → **Newsletter**.
2. Export. Before the fix: `Hello {{firstName}},`.
3. Type `{{product.price}}` into a greeting (a ref the demo host KNOWS and
   resolves to empty at document scope). Export: `Hello ,`.

## Why it matters

The subject line and the greeting are the two strings in an email that every
recipient sees. A leaked `{{firstName}}` in a subject sits in 4,100 inboxes
whether or not anybody opens the message, and it is the exact thing that makes a
small business look like it bought a list.

Reuben's own words in the persona file are *"Can I put someone's name in the
greeting without breaking it for people who have no name on file?"* The honest
answer before this was: you can, and you will not find out that you broke it.

## Where it lives

[packages/silicaui-builder/src/email/resolve.ts](../../../packages/silicaui-builder/src/email/resolve.ts) — `resolveTokens`
[packages/silicaui-builder/src/email/react/Inspector.tsx](../../../packages/silicaui-builder/src/email/react/Inspector.tsx)
[packages/silicaui-builder/src/email/starters.ts](../../../packages/silicaui-builder/src/email/starters.ts)

## Do the siblings have it too?

**No, and the reason is worth writing down.** Inline `{{token}}` substitution is
**email-only** — `@wizeworks/silicaui-html`'s site resolver has no such thing.
So this is NOT the usual "a fix landed in one twin and not the other". It is the
rarer and worse case: **a headline feature that never had any authoring-time
feedback at all, in the only builder that has the feature.**

Two related facts found while checking:

| | |
| --- | --- |
| the site Canvas | consumes `onDiagnostic` and draws a dashed `outline-warning` on an unresolved node — so the site builder *does* tell an author. The email Canvas consumes nothing |
| the site consumer | drops any diagnostic with no `nodeId` (`if (!d.nodeId) return;`). The inline-token diagnostic carried none, so even a ported consumer would have been blind to it. Fixed below |

## The fix

**The grammar is untouched, deliberately.** `resolve.ts` states that silica owns
exactly one production — a bare dotted path — and "does not grow a `??`, a pipe,
or a conditional", handing anything else to the host's `resolveExpression`. That
is a written architecture decision with reasons, and a persona run is not the
place to overturn it. A Mailchimp-style `*|FNAME:there|*` default stays out.

**1. `scanTokens` / `tokenFieldOf`, exported from the resolver.**

```ts
export function scanTokens(text: string): ScannedToken[];
export function tokenFieldOf(node: EmailNode): { field: "html" | "label"; text: string } | undefined;
```

The authoring UI uses the resolver's OWN scanner and grammar. A second regex in
the Inspector would have reintroduced precisely the class of bug that splitting
`TOKEN_RE` from `TOKEN_PATH_RE` exists to prevent: finding a different set of
tokens than the thing that sends them, and then reporting confidently on the
wrong set.

**2. The inline diagnostic now carries `nodeId`.** Every other diagnostic in the
file already did. The document's subject and preheader genuinely have no node
and pass none.

**3. A "Merge tokens" row in the Inspector** — on any text or button block that
contains one, and on the document root for the **subject and preview text**,
because a leaked token in a subject is the most expensive place it can happen.
Three states, in his words rather than the resolver's:

```
{{firstName}}            Nothing resolves this. It is delivered as the literal
                         text {{firstName}}.
{{customer.firstName}}   sends as "Jordan"
{{product.price}}        Resolves, but to nothing here — the sentence closes over
                         an empty space. Anyone this is empty for reads the line
                         without it.
```

With no `resolveBinding` at all it says so, rather than showing a clean panel —
an unchecked token is unknown, not fine.

**4. The starter's greeting is `Hello there,`** — correct when sent untouched.

**Also fixed while in the file** (RULE #3 — faded ink is a signal, not a
default): three `text-base-content/70` on the Data-binding preview rows, which
are the *value that will be sent* and so are plainly meant to be read.

## The fallback itself needs no new code, and that was worth proving

Act 3's "done when" demands a greeting that is never `{{firstName}}` and never
`Hello ,`. The builder can already do it — two blocks on one ref, one **Has a
value** and one **Is empty** — and it was driven end to end rather than assumed:

```
A  "Hello {{customer.firstName}},"   visible when it HAS A VALUE  → "Shown — the node renders"
B  "Hello there,"                    visible when it IS EMPTY     → "Hidden — the node and its children are dropped"

variant 1 — a subscriber with a name:     ["Hello Jordan,"]   exactly one greeting: true
variant 2 — a subscriber with no name:    ["Hello there,"]    exactly one greeting: true
                                          reads "Hello ,": false     shows a raw {{token}}: false
```

So the act's target is reachable in the product as it stands. What was missing
was any way to know you needed it.

## Confirmed by

Driven as Reuben on the same screens, with a **negative control first** — a
panel that appears on every block would tell him nothing:

```
1. the newsletter starter, sent untouched
   the greeting a real subscriber receives: "Hello there,"
   any raw {{token}} anywhere in the delivered email: false

control: a block with no merge token
   the "Merge tokens" panel is: absent (correct)

2. he types {{firstName}} — a name no host here knows
   {{firstName}}  Nothing resolves this. It is delivered as the literal text {{firstName}}.

3. he uses the token this host really has
   {{customer.firstName}}  sends as "Jordan"

4. a token that resolves to nothing (the "Hello ," case)
   {{product.price}}  Resolves, but to nothing here — the sentence closes over an empty space.

5. the same check on the SUBJECT line
   {{firstName}}  Nothing resolves this. It is delivered as the literal text {{firstName}}.

console errors: none
```

Two new e2e tests in `email-merge-tokens.spec.ts`, **deliberately broken to
watch them fail** before being restored:

```
  2 failed
    the Inspector says what each merge token will actually send
    the subject line gets the same check — a leaked token there shows in the inbox
  4 passed
                    … restored …
  6 passed
```

Builder e2e **200 passed** before the new tests, **202** after. Typecheck clean.

## Also recorded, not fixed

**There is still no way to preview as a different subscriber.** The Preview pane
renders whatever the host's resolver returns, which in a real deployment is one
fixed identity. Seeing the empty-name variant means changing data outside the
builder. The Inspector row now tells him *per token* what will happen, which is
the part he can act on; a recipient switcher is a larger piece of design and is a
deduction against `Email builder › Preview` when the email screens are scored.

**The Inspector's own chrome labels are `text-base-content/70`** — nine of them,
including every `Row` label and `Group` heading. Those are text a person is meant
to read, so RULE #3 says they should not be faded. It is one convention applied
consistently across a 2,000-line file in both builders, so changing it is a
deliberate pass in both themes, not a side-effect of act 3. Recorded as a
deduction, not silently left.

## Rating effect

`Email builder › Inspector` and `Email builder › Preview` in [rating.md](../rating.md),
once the email screens are scored.
