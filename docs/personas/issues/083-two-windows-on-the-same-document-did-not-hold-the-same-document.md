# 083 — Two windows on the same document did not hold the same document

**Status:** fixed
**Severity:** high
**Found by:** P05 · Arvid Lindqvist · act 5, two people in one page
**Surface:** `Editor` constructor and `replaceState` — the default frame and the default page
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 5 puts two people in one plant page, which is the thing Quarrystone's
customers do all day:

> Two people from the same account can be in the same page at once

Two windows, two browser contexts, the same `<Builder document={site}>`. They
did not hold the same document.

```
A's frame node ids — ["8b606e68-f36b-4096-8dc9-fc55f9090e55", "94ccc060-…"]
B's frame node ids — ["718a8d23-0cf7-46f7-95b5-1cf7558198ba", "9d466de8-…"]
```

Quarrystone's `Site` has pages and no frame, so the editor materializes a
default one — with **minted ids**, independently, in each window. The two
frames are the same tree with different node names.

## Why it matters

Ops address nodes **by id**. That is the whole design, and it is right. But it
means an op from one window cannot name a node in the other:

```
A edits the frame,  relays the op to B  →  {"applied":0,"dropped":1}
A edits the page,   relays the op to B  →  {"applied":1,"dropped":[]}
```

The page op and the frame op were minted in the same window, in the same run,
and relayed through the same call. Only the ids differ.

And the drop is **silent by contract** — `applyRemoteOps` documents a drop as
"the op's subject was already gone, which is benign under concurrency". Here it
is not benign and it is not transient: every frame edit either of them ever
makes is dropped, forever, and the two shells diverge permanently while both
screens look fine.

## A second way in, on the other path

`replaceState` is the forced resync — the server saying "this is the page now".
It sets `this.site` and did **not** establish the two invariants the constructor
does. A resync carrying no pages conjured a "Home" page with a fresh random id
in each window, the same defect again. A resync carrying no frame left the
editor with **no frame at all**, which the constructor's own comment says cannot
happen:

> A site always has a layout — a page renders *within* the shared shell, it is
> never layout-less.

And `activeRoot()` reads:

```ts
if (this.active === "frame" && this.site.frame) return this.site.frame.root;
```

— so with no frame, **Layout mode silently shows the page**. The author opens
the shared shell, edits it, and has edited one page. Nothing says so.

Measured, before the fix:

```
· what Layout mode is showing — ["ce66d511-…","7f9d5fea-…","0dad3197-…"]
✗ Layout mode shows the LAYOUT, not a page wearing its name
```

## Where it lives

[packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — the constructor, `replaceState`

## The fix

A default the **editor** conjures is not a node anybody created, so it does not
need a fresh name. It needs the *same* name in every window:

```ts
function conjuredIds(prefix: string): MakeId {
  let n = 0;
  return () => `${prefix}-${n++}`;
}

function conjuredFrame(): Frame {
  return { root: stampTree(defaultFrameRoot(), conjuredIds("sui-frame")), editable: true };
}

function conjuredHomePage(): Page {
  return makePage("Home", "/", stampTree(newPageRoot(), conjuredIds("sui-home")), () => "sui-home-page");
}
```

Both paths that set `this.site` now call both, so the constructor and
`replaceState` establish the same invariants instead of one of them doing it.

Deterministic ids are safe here for the same reason a default is allowed to be a
constant at all: **ids are tree-scoped**. Two sites never share a tree, so two
default frames carrying `sui-frame-0` can never collide — each editor only ever
resolves an id inside its own document. Nothing else in the engine is
deterministic and nothing else should be; every other id names a node a person
made.

## Confirmed by

```
1 — the same document, opened twice
  · A's frame node ids — ["sui-frame-0","sui-frame-1"]
  · B's frame node ids — ["sui-frame-0","sui-frame-1"]
  ✓ the two windows agree on the frame's node ids

2 — a resync that carries no pages and no frame
  · A's page ids after the resync — ["sui-home-page"]
  · B's page ids after the resync — ["sui-home-page"]
  ✓ the two windows agree on the conjured page id
  ✓ a site always has a layout, even after a resync
  · what Layout mode is showing — ["sui-frame-0","sui-frame-1","sui-frame-2"]
  ✓ Layout mode shows the LAYOUT, not a page wearing its name
```

and the relay, on the real Quarrystone screen, with a page op beside it as the
control:

```
  · B applied A's PAGE ops  — {"applied":1,"dropped":[]}
  · B applied A's FRAME ops — {"applied":1,"dropped":0}
  ✓ the control: a page op relays fine
  ✓ a frame op survives the relay too
```

Two e2e tests in `collab-ops.spec.ts`. The first compares the two windows' frame
ids **and then relays a real op between them**, because comparing two empty lists
would pass on an editor that conjured nothing at all. The second drives
`replaceState` with a site stripped to its theme.

**Deliberately broken to watch them fail**: the minted-id spelling put back, both
tests went red; restored, green.

## What this unblocked

The concurrent-insert half of act 5 could not be measured until this was fixed —
two windows' documents differed by frame ids before either of them typed, so
"both hold the same document" was unanswerable. Afterwards:

```
  · A's insert op — {"parentId":"block-products","ord":"a0V","id":"475dd5b2-…"}
  · B's insert op — {"parentId":"block-products","ord":"a0V","id":"846d5347-…"}
  ✓ both chose the same slot, which is the whole point of the test
  ✓ nobody's insert was lost
  ✓ the two windows agree on the ORDER
  ✓ the untouched siblings kept their ords
  ✓ both windows hold the same document, byte for byte — 14901 vs 14901 chars
```

Both windows minted the **identical ord** `a0V` for the same slot, which is the
collision an array index cannot survive, and `insertByOrd` broke the tie on node
id — deterministically, so both windows landed on the same order without
exchanging anything but the ops.

## Also recorded, not fixed

**A dropped op is still silent.** `applyRemoteOps` returns `dropped` and it is
the host's to notice; nothing in the builder says anything. That is defensible
for the transient case the contract describes, and it is how this defect stayed
invisible: the only symptom was a shell that would not update. A host has the
information and no reason to look at it. Named rather than half-fixed — a
warning on every benign drop would be worse than none.

## Rating effect

`Site builder › Canvas` and `› Layout mode` in [rating.md](../rating.md), once
P05's screens are scored.
