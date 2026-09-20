# 054 — Marlene pressed Publish and nothing on the screen changed

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 8, publishing
**Surface:** Site builder harness — the reference host's `toolbarStatusSlot`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The last thing act 8 asks her to do is publish her site. She pressed **Publish**.

```
what Publish told her: []
the button now reads:  {"text":"Publish","disabled":false}
```

Nothing. No toast, no banner, no `aria-live` region, no change to the button. The
sweep for `[aria-live]`, `[role="status"]`, `[role="alert"]` and anything
toast-shaped came back empty.

And the one place on screen that could have said something was already saying
something else — permanently:

```tsx
toolbarStatusSlot={
  <span data-testid="toolbar-status-slot" className="text-xs text-base-content">
    All changes saved
  </span>
}
```

**A literal string.** It said "All changes saved" before she made a change, after she
made a change, and after she published — because it is not derived from anything. It
was the same four words at every moment of the run.

## What should have happened

After publishing, she should be able to tell that she published.

## How to reproduce

1. Open `http://localhost:5178/`, make any edit.
2. Press **Publish**.
3. Before the fix: nothing on screen changes, and the status still reads "All changes
   saved".
4. Every time, both themes.

## Why it matters

Publishing is the moment the work becomes real, and it is the one step she cannot
verify herself — the site is somewhere else. For someone whose stated fear is *"that I
will break the site and not know"*, a button that does nothing visible is a button she
will press again, and again, to be sure.

The hardcoded "All changes saved" makes it worse rather than better. It is the
framework's own named failure mode — **a promise in copy over code that keeps it** —
sitting in the reference implementation:

> "We will email you when it ships" over code that sends nothing

Anyone building a host copies this file. The copy propagates the reassurance and not
the checking.

## Where it lives

[packages/silicaui-builder/harness/main.tsx](../../../packages/silicaui-builder/harness/main.tsx) — the site harness's `toolbarStatusSlot`.

**This is the host's job, and the builder is right not to do it.** `onPublish` hands
the host `{ site, pages }` and awaits whatever it returns; the builder disables the
button while that promise is open and otherwise says nothing, because only the host
knows whether "published" means a draft saved, a deploy queued or a CDN purged. The
builder already provides the place to say so — `toolbarStatusSlot` — and memory note
`toolbar-status-slot-shipped` records that it exists for exactly this.

So the defect is not a missing feature. It is **the reference host not using the seam
it was given**, and filling it with a claim instead.

## Do the siblings have it too?

| | |
| --- | --- |
| site harness | **the defect** — "All changes saved", always |
| email harness | same literal string, same slot (`email-toolbar-status-slot`) |
| `Builder` / `EmailBuilder` themselves | **correct** — they own the busy state and nothing else, which is the right boundary |

The email half is **not** changed here: its publish path is `onSend`/preview rather
than `onPublish`, so the equivalent sentence is a different sentence, and inventing it
without a persona driving that surface would be guessing. Recorded, not implied.

## The fix

The status is derived from what actually happened:

```tsx
const status =
  publishedCount === null
    ? edits === 0 ? "Not published yet" : "Unpublished changes"
    : edits === publishedAtEdits
      ? `Published — ${publishedCount} ${publishedCount === 1 ? "page" : "pages"} live`
      : "Edited since you published";
```

Two decisions worth the words:

**`aria-live="polite"`.** Somebody who pressed Publish and is not looking at that
corner of the screen has no other way to learn that it worked. A sentence that only
appears is not an answer for them.

**Deliberately unnumbered.** The first version said "2 unpublished changes" after she
added one page — true about our op log, wrong about what she did, because
add-then-name is two change events. A count she would tally differently is worse than
no count. The only thing she needs is whether what is on screen is what is live.

## Confirmed by

Driven as Marlene, reading the slot at each step:

```
before she does anything:   "Not published yet"        aria-live: polite
after she adds a page:      "Unpublished changes"
after she presses Publish:  "Published — 2 pages live"
after one more edit:        "Edited since you published"
```

Four different sentences for four different states, where there was one sentence for
all four.

`e2e/host-seam.spec.ts` — **21 passed**, including the test that asserts this slot
leads the right-hand cluster in DOM order (WCAG 2.4.3); it checks position and
visibility, not the words, so the copy was free to become true. `pnpm verify` green
across the builder. Typecheck clean.

**And the end of act 8, which is what this was blocking:** the published site was
written out, rebuilt and opened with the builder shut down entirely — 7 pages, all 200,
nav working, the phone dialling, 0 text runs under AA and 0 console errors. See
[the run log](../03-bright-step-studio.md).

## Rating effect

`Site builder › toolbar — Ease 8 → 9` in [rating.md](../rating.md).
