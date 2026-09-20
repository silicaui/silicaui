# 047 — Marlene deleted her timetable and the only thing on screen said "Undo"

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · act 6, "the thing that goes wrong for her"
**Surface:** Site builder and email builder › toolbar · `Editor` / `EmailEditor` history
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 6 is written as it will really happen: *she deletes the whole timetable section by
accident and does not notice for two minutes.*

She selected the table in the Navigator and pressed **Delete**. Measured against the
document the harness receives through `onChange` — what a real host stores:

```
document before:  20950 bytes   Name=true Role=true Ada=true Engineer=true Grace=true Admiral=true
document after:   19692 bytes   Name=false … all false          (1258 bytes gone)
anything on screen that told her:  []
```

**Nothing.** No toast, no status line, no `aria-live` region — the sweep for
`[aria-live]`, `[role="status"]` and `[role="alert"]` came back empty.

**The recovery itself is excellent.** One press of Ctrl+Z restored the document
**byte-identically**. That is not the defect.

The defect is what she had to go on two minutes later. The only thing on screen about
it was a button whose accessible name was, in full:

> **Undo**

She has no idea whether that will take back the delete, the paragraph she typed after
it, or the theme she spent act 5 choosing. This persona's whole premise is *"I have
lost work in software before and it took me a week to trust it again"* — and the safe
move for someone who feels that way is to not press it.

## What should have happened

The control should say what it is about to take back. Not "are you sure" — a
confirmation on every node delete would be unusable, you delete things constantly —
but a name on the action, which survives the two minutes a toast does not.

## How to reproduce

1. Open `http://localhost:5178/`.
2. Insert a **Table** and put real rows in it.
3. Select it in the Navigator and press **Delete**.
4. Read the toolbar. Before the fix, the Undo button's only name was "Undo".
5. Every time, both themes, every width.

## Why it matters

It is filed `minor` deliberately: **nothing is lost, and one press gets it back.** The
data is safe and the engine is correct.

What is missing is the thing this persona exists to measure — whether she can tell
that. A recovery she is too uncertain to use is, for her, not a recovery. Her business
runs on term dates that change every term; she will be in this exact position several
times a year, at nine in the evening, tired.

## Where it lives

- [packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — `past` / `future` held bare `Site[]` snapshots with no record of what each action was
- [packages/silicaui-builder/src/site/react/editor-context.tsx](../../../packages/silicaui-builder/src/site/react/editor-context.tsx) — `useHistory()` reported two booleans
- [packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — `label="Undo"`, a constant

The information existed. `transact` already collects every op of an action in
`txOps`, and `node.remove` is one of them. It was thrown away at commit.

## Do the siblings have it too?

**Yes, and both are fixed.**

| | |
| --- | --- |
| site builder | **fixed** |
| email builder | **fixed** — same bare `label="Undo"` / `"Redo"`, same shape |
| a host-delegated history (`HistoryDelegate`) | **correctly left alone** — the host owns the stack, so `undoLabel` returns `undefined` and the button falls back to "Undo". A label invented here would describe a history this editor is not driving. |

The email builder's engine is a separate class with its own op vocabulary
(`template.*` and `columns.rebalance` rather than `page.*`), so this is not a
copy-paste; it is the same idea against a different list of fourteen kinds.

## The fix

Two parallel label stacks beside the snapshot stacks, filled in where the ops already
exist:

```ts
// `pastLabels[i]` describes the action that moved the document OFF `past[i]`,
// which is exactly what undoing to `past[i]` takes back.
private pastLabels: string[] = [];
private futureLabels: string[] = [];
```

`pushHistory` pushes a placeholder, because the action has not run yet and its ops do
not exist. The outermost `transact` fills it in from what was actually recorded — and
only when that action took a snapshot, so an action that skips history cannot relabel
someone else's entry:

```ts
if (this.txHistory && this.pastLabels.length) {
  this.pastLabels[this.pastLabels.length - 1] = describeOps(ops);
}
```

`describeOps` maps op kinds to phrases and picks the most structural one in the batch
— the same rule `primaryKind` already uses for `ChangeEvent.kind`, because that is the
part a person would say they did.

**It is built from op kinds only, never from the builder's display vocabulary.** The
engine has no React and no `node-display.ts`, and must not grow a dependency on
either. That caps how specific the phrase can be — *"Remove an element"*, not *"Remove
the timetable"* — which is still the difference between a button that says nothing and
one that says what it is about to take back. Making it name the node would mean
handing the engine a display layer, and that is a bigger decision than this issue.

The label travels with the snapshot through undo and redo, so redo says what it will
put back. Both stacks clear together in the two places history is discarded
(`applyRemoteOps` and `replaceState`), because a label without its snapshot would
describe an action that no longer exists.

## Confirmed by

Driven as Marlene, with the document read from `window.__lastChange`:

```
with nothing done yet:            {"label":"Undo","disabled":true}
after inserting a table:          {"label":"Undo — add an element","disabled":false}

document 20950 bytes   Name=true Role=true Ada=true Engineer=true Grace=true Admiral=true
selection is: "Table"

--- she deleted it ---
document 19692 bytes (1258 gone)   all six words now false
TWO MINUTES LATER, the Undo button says:
                                  {"label":"Undo — remove an element","disabled":false}

--- after one Ctrl+Z ---
document 20950 bytes   all six words back
byte-identical to before the accident: true
the Redo button now says:         {"label":"Redo — remove an element","disabled":false}

after redo, document matches the deleted state: true
Undo now says:                    {"label":"Undo — remove an element","disabled":false}
console errors: none
```

**Steps to get it back: 1.** **Did anything name what was undone: now yes.**

**Both builders, driven the same way** — RULE #7, since the email half is P02's
surface:

```
=== site builder ===
  nothing done:           {"label":"Undo","disabled":true}
  after insert:           {"label":"Undo — add an element","disabled":false}
  after adding a page:    {"label":"Undo — rename a page","disabled":false}
  after undo, Redo says:  {"label":"Redo — rename a page","disabled":false}
  redo round-trips:       true

=== email builder ===
  nothing done:           {"label":"Undo","disabled":true}
  after insert:           {"label":"Undo — add an element","disabled":false}
  after adding an email:  {"label":"Undo — rename an email","disabled":false}
  after undo, Redo says:  {"label":"Redo — rename an email","disabled":false}
  redo round-trips:       true
```

"Undo — rename a page" after adding one is **correct, not a bug**: the new gesture
from [044](044-add-page-then-enter-silently-makes-two-pages.md) is create-then-name,
so the last action really was the rename, and the label is reporting it accurately.

The email insert line was **`{"label":"Undo","disabled":true}` on the first attempt**
— my click had not landed, because the email palette only renders once its rail tab is
open and `hasText` was matching against untrimmed text. Fixed the gesture rather than
report a pass on a screen where nothing had happened.

`pnpm verify` green across the builder, including the history-bearing probes
(`verify:ops`, `verify:batch`, `verify:peers`, `verify:lock`, `verify:symbols`) — the
label stacks ride alongside the snapshots and change no op, no event and no document
byte. Typecheck clean.

**Three of my own instruments were withdrawn getting to this number**, and all three
are pinned in the probe's header because each said what I wanted to hear:

1. Comparing `canvas.innerText` truncated to 160 characters — a slice that is the hero
   and never contained the timetable. It printed **"GOT IT BACK: YES"** and could not
   have printed anything else.
2. Clicking a tree row by index. A `[role="treeitem"]` **contains its descendants**, so
   a centre-of-box click lands on a child: I meant to delete the Table, deleted one
   Row, and read the difference as an undo bug that was not there. The probe now
   asserts what the builder says is selected before touching Delete.
3. Walking the document for `.text` fields — the wrong node shape, so it found **0**
   text nodes, and "every text node back: true" was a true statement about an empty
   list.

And the step that turned the result into evidence: **proving the delete changed the
document at all**, so that "byte-identical after undo" is a real finding rather than a
test that never moved.

## Rating effect

`Site builder › toolbar — Ease 7 → 8` in [rating.md](../rating.md).
