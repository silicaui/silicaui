# 049 — Marlene reloaded and the first thing she saw was a blank page

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 7 + the "reload and deep link" standing check
**Surface:** Site builder › crash recovery
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is written as a question:

> F5 with the timetable selected and the Inspector open — is her selection still
> there? Then copy the address bar and open it in a new window: does it land on the
> same page she was editing, or does the builder have no address for where she was?

She was on **Term dates 2026/27**, with her table on screen and the table selected.
She pressed F5.

```
=== before the reload ===
  page she is on:            "Term dates 2026/27"
  the table reads:           ["Term","Ends","Autumn 2026","Friday 18 December 2026",
                              "Half term","Friday 30 October 2026"]
  selected in the Navigator: "Table"

=== after F5 ===
  recovery banner:           true
  page she lands on:         "Home"
  the canvas shows:          []
  selection after reload:    null
```

**Her work was never in danger.** The draft store did its job perfectly — the recovery
banner appeared, and switching to her page showed the table back word for word.

But the first thing on screen was **an empty canvas on a page that was not hers**, and
nothing connected the two. For the person whose stated fear is *"that I will break the
site and not know I have broken it"*, the moment after a crash is the moment that
decides whether she trusts the tool. She saw a blank page.

## What should have happened

A recovered session opens where the crash happened. The draft already knew the
document; it did not know she was on page two of two.

## How to reproduce

1. Open `http://localhost:5178/?persist=1`.
2. Add a page, put a table on it, type into it, select the table in the Navigator.
3. Wait for the autosave (600ms debounce), then press F5.
4. Before the fix: lands on **Home**, empty canvas, nothing selected.
5. Every time, both themes.

## Why it matters

The recovery is right and reads as a failure, which is the worst combination — it
spends the trust it earned. Three specific harms:

1. **It looks like data loss.** An empty canvas is what data loss looks like.
2. **The banner makes it worse, not better.** "Session restored" over a blank page
   invites the reading "restored, and there is nothing in it".
3. **She has to already know** that pages are a switcher at the top of the left rail,
   at the exact moment she is least able to think clearly about it.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — the boot effect and the autosave effect.

The autosave's own comment says why, and it is a **correct** decision that simply has
a gap beside it:

> Selection and active page-or-tree switches are view concerns that don't alter the
> extracted `Site`, so they're filtered out

So the document persisted and the view did not, because the only thing being persisted
was the document.

## Do the siblings have it too?

| | |
| --- | --- |
| site builder | **the defect** — multiple pages, so landing on the wrong one is possible |
| email builder | **not affected in the same way** — it persists the document with the same store, and its equivalent (which template was open) has the same gap, but an email project opened cold on template 1 shows content rather than a blank canvas. Left alone rather than changed speculatively; if a P0x run on the email builder hits it, it is the same five lines. |
| theme library | already persists correctly (`theme-library-persistence.spec.ts`) |

## The fix

A **second, separate store** beside the draft, keyed `<persistKey>:view`:

```ts
/** Where the author was, as opposed to what the document says … Deliberately NOT
 *  part of `Site`: it is session state, and putting it in the document would push
 *  it out through `onChange` to every host. */
interface BuilderView {
  activePageId: string;
  selectedId?: string;
}
```

That keeps the existing design intact — the draft stays the document, `Site` stays
clean, and hosts see no new fields — while still answering "put her back where she
was".

Two ordering details that are the whole correctness of it:

```ts
// Only when that page still exists — a draft can outlive the page it was taken
// on, and `setActivePage` on a missing id would be a silent no-op that leaves
// her somewhere she did not choose either.
if (wanted && next.pagesView.pages.some((pg) => pg.id === wanted)) next.setActivePage(wanted);
// AFTER the page, never before: `select` refuses an id that is not in the tree it
// is currently pointed at, and returns `false` rather than throwing, so a node
// that has since been deleted simply leaves nothing selected.
if (view?.data?.selectedId) next.select(view.data.selectedId);
```

The page switch carries **no ops** — it changes nothing stored — so it is recorded
before the autosave's `if (!e.ops.length) return;` early exit rather than after it.
The view store flushes alongside the draft on `visibilitychange`, `pagehide` and
unmount.

## The other half of the standing check, answered honestly

> does it land on the same page she was editing, or does the builder have **no
> address** for where she was?

**The builder has no address for where she was, and that is deliberate.**

```
the url she would copy: "http://localhost:5178/?persist=1"
it lands on:            "Home"
```

The builder is a component mounted inside a host application. The address bar belongs
to the host — a builder that wrote its own page into the URL would fight the host's
router in every real deployment. So a deep link is **the host's** feature to build,
and the builder's job is to expose enough for it to.

**And the builder already exposes what a host needs**, which is the part that makes
this a decision rather than a gap: `onActivePageChange?: (page: PageMeta) => void`
fires with the page's `id`, `name` and `slug` on every switch, and `document` +
`onChange` carry the rest. A host that wants `/builder/term-dates-202627` in its own
URL has every value required, today, without touching the builder.

So this is a design decision, not a fix I should make unilaterally, and it is recorded
here rather than implemented. What this issue does deliver is the part that is
unambiguously the builder's own: **a reload lands where she was**, which is what
actually bit her.

## Confirmed by

Re-ran the standing check, same data, same gestures:

```
=== after F5 ===
  recovery banner:           true
  page she lands on:         "Term dates 2026/27"
  the canvas shows:          ["Term","Ends","Autumn 2026","Friday 18 December 2026",
                              "Half term","Friday 30 October 2026"]
  selection after reload:    "Table"
  her pages are still there: ["Home","Term dates 2026/27"]
console errors: none
```

All three restored: the page, the content, and the selection.

`e2e/persistence.spec.ts`, `e2e/email-persistence.spec.ts` and
`e2e/theme-library-persistence.spec.ts` — **4 tests, all passing**. `pnpm verify` green
across the builder. Typecheck clean.

## A wrong reading, withdrawn

The first two runs of this reported **"after reload, her whole site is gone"** — page
"Home", no pages, empty canvas. That was not the product:

1. The first run used `http://localhost:5178/` with no `?persist=1`, and the harness
   deliberately gates persistence off under `navigator.webdriver`. I was testing a
   build with persistence switched off and reading the result as data loss.
2. The second added `?persist=1` but still reloaded on a fixed `setTimeout` rather than
   waiting for `window.__ready`, and before the 600ms autosave debounce had landed.

`e2e/persistence.spec.ts` was already green throughout, which is what said the probe
was wrong rather than the feature. Following its discipline — wait for `__ready`, give
the debounce room — produced the real finding above, which is a different and much
smaller thing than the one I nearly filed.

## Rating effect

`Site builder › crash recovery — Ease 5 → 9` in [rating.md](../rating.md).
