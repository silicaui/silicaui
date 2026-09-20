# 058 — The tab closed while she was typing, and the sentence was gone

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · the "wrong moves" standing check
**Surface:** Site builder › Canvas · email builder › Canvas · local draft store
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is *"close the tab mid-edit with unsaved work and reopen it."*
Driven as Marlene, on a copy of her real seven-page site, editing the paragraph on
**Our teachers**:

```
editing node b68f88be-1eeb-459e-8a23-bca3f14feda1  ("Marlene Okonkwo-Bright has run Bright St…")
  that node BEFORE she types:            "Marlene Okonkwo-Bright has run Bright St"
  still editing:                         true
  that node WHILE she types:             "Marlene Okonkwo-Bright has run Bright St"   ← the typing is nowhere
  that node AFTER reopening:             "Marlene Okonkwo-Bright has run Bright St"   ← her sentence is gone
  HER SENTENCE SURVIVED:                 NO
```

Everything else came back perfectly. Seven pages, the right page open, the right
selection — the crash-recovery store did its job on all of it. The **one** thing it
did not save was the sentence her hands were on.

## What should have happened

The sentence comes back with the rest.

## How to reproduce

1. Open `http://localhost:5178/?persist=1`.
2. Double-click any text on the canvas and type a sentence.
3. **Do not** press Enter. Do not click away.
4. Close the tab. Reopen it.
5. Before the fix: the original text, as if she had never typed.

## Why it matters

Filed `major`, and it would be `blocker` if it lost committed work.

Inline editing holds the new characters in a `contentEditable` and writes them into
the document only on blur or Enter. The draft store persists the **document**. So the
text a person is typing right now exists in exactly one place — a DOM node in a tab
that is closing.

The store's own file says what it is for:

> Local draft persistence — a crash-proof safety net so a user never loses work to a
> reload, a closed tab, a lost connection, or a power cut.

"A closed tab" is named in the first sentence, and a closed tab was the one case it
did not cover. That is the framework's **promise in copy over code that keeps it**,
found in the comment above the code that was supposed to keep it.

And for this persona it is the whole persona. What she is nervous about, in her own
words, is *"that I will break the site and not know."* She lost work in software
before and it took her a week to trust it again.

## Where it lives

[packages/silicaui-builder/src/site/react/Canvas.tsx](../../../packages/silicaui-builder/src/site/react/Canvas.tsx) — `EditableText`

```tsx
const commit = () => {
  if (done.current) return;
  done.current = true;
  onCommit(ref.current?.textContent ?? "");
};
// …
onBlur: commit,
```

Two commit routes, Enter and blur. **A closing tab is neither.**

## Do the siblings have it too?

**Yes — and it is the same shape in both, so the fix is one shared hook rather than
two copies that will drift.**

| | |
| --- | --- |
| site canvas `EditableText` | **the defect** — commits `textContent` on blur/Enter |
| email canvas `EditableHtml` | **the same defect** — commits `innerHTML` on blur/Enter |
| the Inspector's Content field | correct — a real `<input>`, committed on change |
| the page/template name fields | correct — same, plus they commit on blur |

## The fix

**One shared hook,
[`useCommitOnHide`](../../../packages/silicaui-builder/src/shared/react/use-commit-on-hide.ts),
used by both canvases**, plus a write-through in both builders.

```tsx
export function useCommitOnHide(commit: () => void): void {
  const latest = React.useRef(commit);
  latest.current = commit;
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") latest.current();
    };
    const onPageHide = () => latest.current();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => { /* … */ };
  }, []);
}
```

Two details that are the whole reason it works:

**`visibilitychange` is listened for on `document`, not `window`.** The event is
dispatched at `document` and bubbles to `window`, so a document listener runs
**before** the Builder's window listener that flushes the draft. The text has to
reach the document before a snapshot of the document is written. A window listener
here would have been registered second and flushed a snapshot that did not contain it
— a fix that looks right and saves nothing.

**And the ordering is then made irrelevant anyway.** Both builders now write through
the moment they know the page is hiding:

```tsx
const hiding = { now: false };
// …in the editor subscription:
store?.save(site);
if (hiding.now) store?.flush();
// …
const flush = () => { hiding.now = true; store?.flush(); viewStore?.flush(); };
```

So whichever listener runs first, the save that the commit produces is durable.
Coming back to a visible tab returns to debounced writes — otherwise one tab switch
would make every later keystroke a synchronous `localStorage` write.

`commit` is already guarded by a `done` ref in both canvases, so a hide followed by a
real blur commits exactly once.

**A shadowing bug the compiler caught on the way.** Both builder shells have a prop
named `document`, so `document.addEventListener` inside them resolves to the
builder's own document, not the DOM's. It reads correctly and would never have run.
It is `window.document` in both, with a comment saying why.

## What this does NOT fix, stated plainly

**A killed process still loses the sentence.** Measured, not assumed:

| how the page went | before | after |
| --- | --- | --- |
| tab closed | lost | **survives** |
| window closed / navigated away / tab switched | lost | **survives** |
| browser process killed mid-keystroke | lost | **still lost** |

Nothing fires when a process dies, so covering that means writing the in-progress text
durably on a timer while she types — which either puts a history entry behind every
pause or needs a history-coalescing primitive the engine does not have. That is a real
piece of work with a real design decision in it, and it is not being made blind at the
end of a persona run.

What was done instead is to stop the file promising otherwise. The store's header
comment now states the limit it actually has rather than the one it wished for.

## Confirmed by

Driven as Marlene again, on a fresh copy of her site for each case, with a sentence
never typed before so a stale draft cannot fake a pass:

```
=== tab close — fresh copy of her saved site ===
  that node WHILE she types (uncommitted): "Marlene Okonkwo-Bright has run Bright St"
  that node AFTER reopening:               "Ama is away for the whole of half term and Rosa "
  HER SENTENCE SURVIVED: YES
```

And a regression test that fails for the right reason
([`e2e/persistence.spec.ts`](../../../packages/silicaui-builder/e2e/persistence.spec.ts) —
*"a sentence still being typed survives the page going away"*). It asserts
`[data-sui-editing="true"]` is still visible before the reload, so a future change
that commits on every keystroke cannot make it pass for a reason it is not testing.

**Deliberately broken to watch it go red**, then restored:

```
with useCommitOnHide gutted:   1 failed, 1 passed
with it restored:              2 passed
```

Whole builder e2e suite: **199 passed**. Typecheck clean.

**Eight other specs failed on the way, and they were mine.** `pages.spec.ts` (4) and
`email-templates.spec.ts` (4) both add a page/template and then immediately read the
switcher — a flow that
[044](044-one-click-and-one-enter-made-two-pages.md) changed, because Add now opens
the name field with focus already in it. They were updated to complete the naming and
to assert that focus, which is the thing 044 fixed. `host-seam.spec.ts` had been
updated for this when 044 landed; these two had not, which is the same
"the fix did not travel" shape this run keeps finding, in the test suite this time.

## Rating effect

`Site builder › Canvas — Ease 9 → 10` in [rating.md](../rating.md).
