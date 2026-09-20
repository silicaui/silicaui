# 053 — The canvas let her pick up the locked footer, then quietly refused to move it

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · the "a boundary that should hold" standing check
**Surface:** Site builder › Canvas
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is *"lock the site's footer, then try to move, retype, restyle and
delete it — from the Canvas **and** from the Navigator."* The point of naming both is
that a rule enforced in one renderer and not its sibling has shipped on this product
before.

The boundary holds. The engine refuses `remove` and `move` on a locked node from either
surface, exactly as `host-nodes-and-node-locking.md` §B.2 specifies.

But on the canvas the locked footer was still `draggable="true"`. So she could pick it
up, watch the drop indicator follow the cursor across the page, let go — and have
nothing happen, with no message.

The Navigator, meanwhile, already honoured the lock in its own chrome: a padlock glyph
on the row, and `renamable: false`.

## What should have happened

An affordance that cannot succeed should not be offered. **The file already says so**,
four lines above the defect, about the other case:

> Another editor is holding this subtree. It stays SELECTABLE … but every write
> affordance goes: no drag, no drop target, no in-place text edit. The engine refuses
> those anyway; **dropping them here is how the author learns before the click, rather
> than from a gesture that silently does nothing.**

That paragraph is the whole argument. It was applied to `claimed` and never to
`locked`.

## How to reproduce

1. Open `http://localhost:5178/` → **Layout**.
2. Select **Footer** in the Navigator and lock it.
3. Look at the footer on the canvas: before the fix, `draggable="true"`.
4. Drag it. The drop indicator appears; releasing does nothing.
5. Every time, both themes.

## Why it matters

Filed `minor`, honestly: nothing is lost and the boundary is doing its job. What is
wrong is what she learns from it.

Marlene locks the footer *because she is afraid of breaking it*. The first thing the
lock does is let her drag it. Either the lock is not working or the builder is, and she
has no way to tell which — so the safe conclusion is the one she already believes:
that the software is not to be trusted with the thing she was protecting.

## Where it lives

[packages/silicaui-builder/src/site/react/Canvas.tsx](../../../packages/silicaui-builder/src/site/react/Canvas.tsx)

```tsx
const claimed = ctx.claimedIds?.has(id) ?? false;
const draggable = parentId !== undefined && !claimed; // the root can't be moved
```

## Do the siblings have it too?

**Checked every write affordance the canvas offers against the spec's rule that a lock
gates structure and not content.**

| affordance | locked node, before | should be | after |
| --- | --- | --- | --- |
| drag | **offered** | refused | refused |
| drop target | offered | *(unchanged — a locked container may still receive children; the lock is on the node, not its contents)* | offered |
| in-place text edit | offered | **offered** — §B.2 allows `setText` | offered |
| restyle | offered | **offered** — §B.2 allows `setClass` | offered |

Only the drag was wrong. The other three are deliberately left alone, because locking
is about structure, not style or content, and "make everything read-only" is a
different feature the spec explicitly hands to the host.

The **Navigator** was already correct, and the **email builder** shares this Canvas
code path, so it is fixed in both.

## The fix

```tsx
// A LOCKED node is the same argument as a claimed one, and the paragraph above
// already makes it: the engine refuses `move` on a locked node, so leaving it
// draggable means picking it up, watching a drop indicator follow the cursor,
// letting go, and having nothing happen with no explanation. …
//
// Only the DRAG goes. Text and styling stay editable on a locked node — locking
// is about structure, not content (host-nodes spec §B.2) — so `inlineEditable`
// below is deliberately not gated on this.
const locked = !!node.locked;
const draggable = parentId !== undefined && !claimed && !locked;
```

Plus `data-sui-locked`, matching the `data-sui-claimed` hook that already exists beside
it, so chrome styling, e2e and a host's own tooling do not have to pattern-match
utility classes to find a locked node.

## Confirmed by

Driven as Marlene — select Footer in the Navigator, lock it, read the canvas:

```
before locking:  {"selectedTag":"footer","locked":null,    "footerDraggable":"true", "footerLockedAttr":null}
after locking:   {"selectedTag":"footer","locked":"author","footerDraggable":"false","footerLockedAttr":"author"}
after unlocking: {"selectedTag":"footer","locked":null,    "footerDraggable":"true", "footerLockedAttr":null}
```

It reverses cleanly, which matters: a lock she cannot undo would be a worse trap than
the one this fixes.

And the boundary itself, re-run across all eight combinations — the footer survives
delete, move, duplicate and rename from both renderers, and the two agree. Full table
in [the run log](../03-bright-step-studio.md).

`pnpm verify` green across the builder (including `verify:lock` and
`verify:email-lock`), `e2e/lock.spec.ts`, `e2e/canvas.spec.ts` and
`e2e/host-seam.spec.ts` all passing. Typecheck clean.

**A reading withdrawn on the way.** The first run of the boundary check reported *"the
Navigator deleted a locked footer"* — a blocker, if it had been true. Clicking
`.sui-canvas footer` selects the innermost element under the pointer, which is a `<ul>`
inside it, so I had locked a list and then deleted a footer that was never locked. The
probe now asserts `selectedNode.tag === "footer"` and refuses to report anything if it
is not.

## Rating effect

`Site builder › Canvas — Ease 8 → 9` in [rating.md](../rating.md).
