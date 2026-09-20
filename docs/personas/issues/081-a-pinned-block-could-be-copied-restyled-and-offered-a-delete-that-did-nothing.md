# 081 — A pinned block could be copied out of its lock, restyled into invisibility, and offered a Delete button that did nothing

**Status:** fixed
**Severity:** critical
**Found by:** P05 · Arvid Lindqvist · act 2, a node the author cannot touch
**Surface:** `Editor.duplicate`, `ClassValidator`, the site Inspector
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 2 is the strongest boundary check in the roster:

> Add `compliance-cert` as a host node and lock it. Then attack it: move it,
> retype it, restyle it, delete it, drag another node into it, undo into it, and
> do all of that **from the Canvas and from the Navigator**.
>
> **Done when:** every one of those is refused, in both renderers, and any that
> is not is a `blocker` that stops the run.

Quarrystone's compliance certificate is not a preference. From the persona file:

> The compliance block is legally theirs, not the customer's. If a customer can
> move it, retype it, restyle it or delete it, that is not a bug, it is a
> regulatory problem.

Thirteen attacks. **Ten were refused.** Three got through.

## 1. `pinned: true` was defeated by Ctrl+D

`HostComponentDef.pinned` stamps `locked: "host"` when the palette places a node —
the author gets no unlock, only the host can clear it. `duplicate()` cleared it
unconditionally:

```ts
if (copy.kind !== "outlet") delete copy.locked;
```

on the reasoning that "a duplicate is author-owned". The spec's own escape hatch
for that was:

> A host that needs duplicates pinned **re-locks on insert**.

**There is no insert hook to re-lock from.** `pinned` stamps the lock inside the
palette's own insert; nothing runs on a duplicate; and `Editor` is not on
`BuilderHandle`, so the host cannot reach `setLocked` either. One keystroke and
the page carried an unlocked copy of a block the host is legally answerable for.

## 2. The Design tab restyled it, and there was no way to stop that

The spec is explicit, and it is the right line for a page builder:

> `setClass`/`setProp`/`setText`/`setData` → **allowed** — locking is about
> structure, not style/content. (A host that wants a fully read-only region
> withholds inspector controls; that's a separate concern.)

Measured, with an unlocked node beside it as a live control:

```
the CONTROL first — an unlocked node must still be restylable
  · its class — null → "text-center flex w-full text-xl"
  ✓ the hero IS restylable (so the controls really work)

now the compliance block
  · its class — null → "text-center flex w-full text-xl"
  ✗ the certificate is NOT restylable
```

Five presses on the Design tab and an author can centre, stretch and resize a
compliance certificate. `hidden` typed into the class field removes it from the
page entirely while leaving it in the document — the block is "still there", and
no regulator cares.

**And the escape hatch the spec names did not exist.** `validateClass` is the
policy seam — but its signature was `(cls: string) => …`. It sees a class string
and not a tree, so a host protecting ONE block could only ban `hidden`
**everywhere or nowhere**. There is no `hide` on `inspectorPanels`/`inspectorTabs`
either. The spec pointed at a door that was not there.

## 3. A Delete button that was offered, looked live, and did nothing

```
=== the node-chrome footer, on a HOST-LOCKED node ===
  Save as component: offered, disabled=false, title=null
  Duplicate:         offered, disabled=false, title=null
  Delete:            offered, disabled=false, title=null

=== clicking Delete on it ===
  before: {"present":1,"readable":true}
  after:  {"present":1,"readable":true}
  → the block survived
```

The boundary held — the engine refuses `remove` on a locked node — but the
author cannot tell *refused* from *broken*. They press Delete, nothing happens,
and nothing on the screen ever says the word "locked".

The **email** builder already does this properly, on its own un-duplicatable
node: disabled, with a hint reading *"The email itself can't be duplicated."*
The sibling had the answer; it did not travel.

## Where it lives

[packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — `duplicate`, `setClass`
[packages/silicaui-html/src/class-policy.ts](../../../packages/silicaui-html/src/class-policy.ts) — `ClassValidator`
[packages/silicaui-builder/src/site/commands.ts](../../../packages/silicaui-builder/src/site/commands.ts) — `setClassTokenMany`
[packages/silicaui-builder/src/site/react/Inspector.tsx](../../../packages/silicaui-builder/src/site/react/Inspector.tsx) — `NodeFooter`, `DesignTab`

## The fix

**1. A host lock survives duplication; an author lock still clears.**

```ts
if (copy.kind !== "outlet" && copy.locked !== "host") delete copy.locked;
```

The author's own lock is theirs to set and clear, so a copy starts unlocked —
unchanged. The host's is not theirs to drop. `setLocked` stays tier-blind, so the
host is never boxed out of its own lock. §B.2 of the locking spec is corrected to
say so.

**2. `ClassValidator` receives the node**, so the door the spec points at is
really there:

```ts
export type ClassValidator = (cls: string, node?: unknown) => { ok: true } | { ok: false; reason: string };
```

Optional, so every existing validator is unchanged, and `unknown` on purpose:
this type lives below the node schema and must not depend on it. `setClass`
passes the node, `setClassToken` routes through `setClass`, so **every** write
path is covered — the Design tab, the class field, paste, and remote ops.

Quarrystone's whole policy is then nine lines, and the certificate is safe
without banning a single class anywhere else on the page.

**3. Nothing pretends.** The footer's Delete is disabled on any locked node and
its tooltip says which kind of lock and what to do:

> This block belongs to the app that hosts this builder, so it can't be deleted
> here

> This element is locked — unlock it in the Layers list first

And the Design tab surfaces a refused class instead of swallowing it —
`setClassTokenMany` returns the first refusal rather than dropping it, and the
tab renders the **host's own sentence**:

> Quarrystone owns how this block looks — it has to appear the same on every
> plant page.

## Confirmed by

All thirteen attacks, from both renderers:

```
1 — delete it
  ✓ held  Delete key, selected on the canvas
  ✓ held  Backspace, selected on the canvas
  ✓ held  Delete key, selected in the Navigator
  · the Inspector's Delete button — offered, disabled=true
  ✓ held  the Inspector's own Delete control
  ✓ held  ...and it is DISABLED, not a live button that does nothing
  ✓ held  cut (Ctrl+X)

2 — move it
  ✓ held  keyboard reorder shortcuts — 5 nodes, order unchanged
  ✓ held  dragging it on the canvas
  ✓ held  dragging its row in the Navigator

3 — retype it
  · anything became editable — no
  ✓ held  double-click and type on the canvas

4 — restyle it
  ✓ held  the hero IS restylable (so the controls really work)
  ✓ held  the certificate is NOT restylable — class stayed null
  · what the Design tab says back — "Quarrystone owns how this block looks…"
  ✓ held  ...and it SAYS why, instead of a control that does nothing
  ✓ held  typing `hidden` straight into the class field
  ✓ held  the certificate is still on the page and readable

5 — drag another node into it
  ✓ held  inserting into a host node

6 — undo into it
  ✓ held  undoing all the way back
  ✓ held  ...and it is still host-locked
```

The restyle section leads with the **unlocked hero** as a live control, because
"the class did not change" proves nothing if the controls were not working at
all — which is exactly the mistake the first pass of this act made.

Nine probe checks in `probe-lock.ts` covering both lock owners through
duplication, including that the host can still clear its own lock afterwards.
**Deliberately broken to watch them fail**: the probe caught the duplicate change
the moment it landed, which is how a real check behaves.

`pnpm verify` exit 0 workspace-wide, builder e2e green, typecheck clean in both
the workspace and the Quarrystone app.

## Three readings that were vacuous, and were redone

Worth recording, because all three *looked* like passes:

- **The class check read a node list that was `null`.** Our store had never been
  written — nothing had successfully changed yet — so "the class did not change"
  was comparing nothing to nothing. Redone after a harmless edit, so there is a
  document to read.
- **The "Design tab field" I typed into was the enquiry form's email input on the
  canvas.** The restyle attack never happened. The corrected run uses
  `data-testid="class-field"` and the token controls.
- **"The Inspector's own Delete control" found no Delete button at all**, because
  it looked for `[aria-label="Delete"]` and the footer's buttons carry visible
  labels. It attacked nothing and reported "held".

## Also recorded, not fixed

**`setProp` is still open on a host-locked node**, by design and correctly: a host
declares which props the Inspector offers, so a host that does not want
`plantId` editable simply does not declare it. Quarrystone declares it on
purpose — moving a page to another plant is a legitimate thing for an author to
do. Named so nobody reads this issue as "host nodes are now fully read-only".

**A duplicated pinned block is still a second copy on the page.** It stays
host-locked and its content still comes from the host's own render, so it is a
genuine certificate shown twice rather than a forgery — untidy, not a compliance
problem. A host that wants "exactly one of these per page" needs a cardinality
rule, which is a different feature and is not pretended at here.

## Rating effect

`Site builder › Inspector` and `› Canvas` in [rating.md](../rating.md), once P05's
screens are scored.
