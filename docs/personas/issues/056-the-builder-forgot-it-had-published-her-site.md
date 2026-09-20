# 056 — She published her site, came back the next evening, and it said "Not published yet"

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 9, "two hours after class, tired"
**Surface:** Site builder harness — the reference host's `toolbarStatusSlot`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 9 is the only act that asks her to **come back**. So it was run the way she
would live it: the site was built and published, the browser was closed, and a
second run opened the same profile with nothing restored by hand.

```
 1. Opens the builder
     → 7 pages still here; it opened on "Find us"
 2. Reads the status line
     → "Not published yet"
```

Her site was live. Seven pages, served to visitors, verified in act 8. The builder
told her she had never published it.

## What should have happened

`"Published — 7 pages live"`, which is what it had said one minute before she closed
the laptop.

## How to reproduce

1. Open `http://localhost:5178/?persist=1`, make an edit, press **Publish**.
   The status reads `Published — N pages live`.
2. Close the browser. Open it again on the same profile.
3. Before the fix: `Not published yet`.
4. Every time, both themes.

## Why it matters

This is the **same slot and the same file** that
[054](054-she-pressed-publish-and-the-screen-did-not-change.md) just repaired, and it
is worth being plain about that: 054 replaced a sentence that was always the same
with four sentences derived from state. This is the discovery that **one of those four
was still a claim the code could not keep** — it just took closing the laptop to see
it.

For Marlene specifically it is the worst of the four to get wrong. Her stated fear is
*"that I will break the site and not know."* She has a site on the internet. The tool
that put it there greets her the next evening by saying it never did. There are only
two things she can conclude, and both are bad: either the publish did not work, or the
tool does not know what it did.

The generic shape is one the framework names outright — **absence presented as
measurement**. The host had no record, so it reported "never", when the honest answer
was "I do not know".

## Where it lives

[packages/silicaui-builder/harness/main.tsx](../../../packages/silicaui-builder/harness/main.tsx)

```tsx
const [edits, setEdits] = React.useState(0);
const [publishedCount, setPublishedCount] = React.useState<number | null>(null);
const [publishedAtEdits, setPublishedAtEdits] = React.useState<number | null>(null);
```

Three `useState`s. **All three die with the tab.** `publishedCount === null` is the
branch that prints "Not published yet", and after any reload it is always null.

It is worth naming the second bug hiding underneath, because it is the reason a
smaller fix would not have worked. The comparison was `edits === publishedAtEdits` —
*a count of change events*. Even if the count had been persisted, it answers the wrong
question. Undo three edits back to exactly what is live and the counter says
"Edited since you published". The number of changes is not the thing she cares about.

## Do the siblings have it too?

| | |
| --- | --- |
| site harness | **the defect** |
| email harness | same literal `"All changes saved"` string it always had — see 054 |
| the `Builder` itself | **correct, and deliberately silent.** It owns the busy state while `onPublish` is awaited and nothing else, because only the host knows what publishing means |

Unchanged in the email harness for the reason 054 already recorded: its path is
`onSend`/preview, the equivalent sentence is a different sentence, and no persona has
driven that surface. Recorded, not implied.

## The fix

**Stop counting edits. Compare the documents.**

```tsx
// It is NOT an edit counter. A counter lives in memory, so it resets on reload
// and the host forgets it ever published … The honest question is not "how many
// edits", it is "is what is on screen what is live", so the host compares the
// DOCUMENT it last received against the one it last published. Both survive the
// laptop closing.
const [doc, setDoc] = React.useState<string | null>(() => readMark<string>(DOC_KEY));
const [mark, setMark] = React.useState<PublishMark | null>(() => readMark<PublishMark>(PUB_KEY));

const status =
  mark === null
    ? doc === null
      ? "Not published yet"
      : "Unpublished changes"
    : doc === mark.sig
      ? `Published — ${mark.pages} ${mark.pages === 1 ? "page" : "pages"} live`
      : "Edited since you published";
```

`signature()` is a cheap content fingerprint of the document — `length.hash`, not a
checksum and not security. The host writes one on every `onChange` and one on every
`onPublish`, and the whole status is the comparison of the two.

Three decisions worth the words:

**`localStorage`, not the builder's `DraftStore`.** The harness imports only from
`@wizeworks/silicaui-builder/react`, on purpose — it is the worked example of a host,
so it may not reach into the package's internals. A real host stores this on its
server. `localStorage` is the smallest honest stand-in.

**Behind the same `persist` gate as the draft.** Under `navigator.webdriver` without
`?persist=1`, nothing is read or written, so every e2e spec still opens a host that
has never published anything.

**Now correct under undo.** Undo back to exactly what is live and it returns to
`Published — 7 pages live` on its own, because it is comparing the document, not
counting keystrokes. The counter could never have done that.

## Confirmed by

Act 9 re-run end to end: build, publish, **close the browser**, reopen the same
profile.

```
 2. Reads the status line          → "Published — 7 pages live"     ← was "Not published yet"
…
12. Reads the status line again    → "Edited since you published"   (after she fixes the typo)
13. Presses Publish                → "Published — 7 pages live"
```

Four states, all four surviving the laptop closing, and the live site now says
`£7.50` where act 9 began with `£7.05`.

`e2e/host-seam.spec.ts` and `e2e/persistence.spec.ts` green, `pnpm verify` green
across the builder, typecheck clean.

## Rating effect

`Site builder › toolbar — Ease 9 → 10` in [rating.md](../rating.md), which 054 had
raised to 9 on the strength of a sentence that turned out to be true only within one
sitting.
