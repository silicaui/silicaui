# 074 — The email canvas never said a merge token was broken, and shipped its own dead unsubscribe link

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · act 8, composing through the real send path
**Surface:** Email builder › Canvas
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The whole Dispatch was built on the real screen — masthead, greeting, lead
review, three staff picks, three events, an offer, a footer — then composed
through `toEmailHtml`, the same path a host's send uses. Reading the file a mail
client would actually be handed:

```
no merge token reaches a person
  ✗ no {{token}} survives anywhere in the file — {{unsubscribeUrl}}

the unsubscribe
  ✓ there is an Unsubscribe link
  ✗ its address is real, not an unresolved token
  · it points at — {{unsubscribeUrl}}
```

The newsletter starter's own footer ships:

```html
<a href="{{unsubscribeUrl}}">Unsubscribe</a>
```

No host in this repo declares that reference, so the token is not resolved and
goes out as those literal characters. `href="{{unsubscribeUrl}}"` is a **relative
URL**: a client that follows it fetches something off the sender's own domain
that is not an unsubscribe page. 4,100 subscribers, a legal requirement, and a
link that does nothing.

**And nothing said a word.** A whole newsletter was written, reviewed, previewed
and composed with no warning anywhere on the screen.

## The warning that did exist, and why it was not enough

[066](066-a-merge-token-nobody-resolves-is-delivered-as-typed.md) added a "Merge
tokens" row to the Inspector that says exactly the right sentence — *"Nothing
resolves this. It is delivered as the literal text {{…}}."* It would have said it
about this token too.

It says it **only when that block is selected.** An author does not select every
block and read the right-hand panel before every send, and the one block he is
least likely to select is the stock footer he never wrote.

A warning you have to go looking for is not a warning. It is a reference page.

## The sibling it did not travel to

The **site** canvas has marked an unresolvable reference for a long time:

```
site/react/Canvas.tsx:349
  if (id && ctx.unresolvedIds?.has(id))
    s += " outline outline-2 outline-dashed outline-warning -outline-offset-2";
site/react/Canvas.tsx:629
  if (ctx.unresolvedIds?.has(id)) inter["data-sui-unresolved"] = node.data?.ref ?? "";
```

It even has an e2e named for it — *"an unresolvable ref is marked on the canvas,
not silently blanked"*.

The email canvas had neither line. Searching it for "unresolved" returned
nothing at all.

This is the seventeenth instance this run of **the fix already exists in a
sibling and did not travel** — and the most expensive, because the thing it
failed to catch is the one link an email is legally obliged to get right.

## What should have happened

He opens the starter and the footer is already outlined, before he types a word.

## Where it lives

[packages/silicaui-builder/src/email/react/Canvas.tsx](../../../packages/silicaui-builder/src/email/react/Canvas.tsx) — `unresolvedIds`, `decorations`, `interactionProps`

## The fix

The email canvas marks a block holding a merge token that nothing resolves —
**the same dashes, the same warning colour, the same offset, and the same
`data-sui-unresolved` attribute** as the site canvas. Two builders drawing "this
will go out wrong" differently is how one of them ends up not drawing it at all.

One thing genuinely differs, and it is why this could not be a copy-paste. The
site canvas reads its unresolved set off a **resolved** tree, from the
`unknown-ref` diagnostics the resolver emits while rendering. The email canvas
deliberately does **not** resolve — it shows merge tokens literally, so an author
can see his own. So this asks the resolver the same question the Inspector's
token check asks, block by block, using the resolver's **own** exported scanner
(`scanTokens` / `tokenFieldOf` from 066) rather than a second regex that could
drift from it.

No host means no opinion: with no `resolveBinding` hook, nothing is marked rather
than everything.

## Confirmed by

Straight off the starter, before a word is typed:

```
=== straight off the starter, before he types a word ===
  blocks the canvas marks as going out wrong: 1
    "You are receiving this because you signed up. Unsubscribe"
```

Then, as Reuben — he sees the dashes and replaces the placeholder with his own
list's real address:

```
8. the canvas warned about: ["You are receiving this because you signed up. Unsubscribe"]
   after he fixed it, blocks still marked: 0
```

And the composed file, re-read:

```
no merge token reaches a person
  ✓ no {{token}} survives anywhere in the file

the unsubscribe
  ✓ there is an unsubscribe address
  ✓ it is a real address, not an unresolved token
  · it points at — https://thornburybooks.co.uk/dispatch/unsubscribe
```

Two e2e tests, **both leading with the negative control** — a canvas that
outlined everything would tell an author nothing:

```
  ✓ the canvas marks a block whose merge token nothing resolves — including the starter's own unsubscribe
  ✓ the newsletter starter's own unsubscribe is marked the moment it lands
```

The first walks all four states in order: no token → nothing marked; a token the
host **has** → still nothing marked; a token it does not → marked; fix it →
mark clears. A signal that never clears is not a signal.

**A test of my own was too weak and deleting the fix proved it.** Both tests
originally asserted only `[data-sui-unresolved]` — and with the outline class
deleted they **both still passed**, because a data attribute is not something a
person can see. They now assert the dashes and the warning colour as well, and
with the class deleted:

```
  2 failed
  7 passed
        … restored …
  9 passed
```

`pnpm verify` exit 0 workspace-wide, builder e2e green, typecheck clean.

## Also recorded, not fixed

**The starter still ships `{{unsubscribeUrl}}`.** Left deliberately. 066's rule
is that stock copy must be correct when sent untouched, and by that rule this
token should go — but an email with no unsubscribe line at all is worse, and no
starter can write a working unsubscribe without knowing the platform. The honest
resting place is a placeholder that **shouts**, which is now what it is. The
proper home for a legally-required footer is the host's `EmailFrame`, which
already exists for exactly this; recommending that to a host is a documentation
job, not a defect fix.

**The Inspector's token check remains selection-scoped.** That is fine now that
the canvas carries the always-visible signal, but it is worth writing down that
the two say the same thing at different volumes on purpose.

## Rating effect

`Email builder › Canvas` in [rating.md](../rating.md).
