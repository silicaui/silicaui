# 085 — The Layers tree moved one row and stuck, so most of the page could not be selected without a mouse

**Status:** fixed
**Severity:** critical
**Found by:** P05 · Arvid Lindqvist · the "without a mouse" standing check
**Surface:** `@wizeworks/silicaui-react` › `TreeView` — every tree in both builders
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P05's keyboard check is concrete: **mount, select the compliance certificate,
open the Compliance tab, press "Send for review" — no mouse.**

Canvas nodes carry no tab stop, which is the ordinary answer for a document
surface: the **Layers tree is the keyboard route to a selection**. It is a
`role="tree"` with a roving tabindex, reached at tab press 44.

Then the arrows stopped working after one step.

```
rows at rest:
  0  tabindex 0   (the root group)
  1  tabindex -1  Höganäs Kross & Grus AB — Ängelh…
  2  tabindex -1  (the product list)
  3  tabindex -1  Makadam 8–16 mm · 189 kr/ton
  …
  7  tabindex -1  Compliance certificate
  8  tabindex -1  Plant statistics
  9  tabindex -1  Price enquiry form

after ArrowDown #1: focused = Höganäs Kross & Grus AB — Ängelh…
after ArrowDown #2: focused = Höganäs Kross & Grus AB — Ängelh…
after ArrowDown #3: focused = Höganäs Kross & Grus AB — Ängelh…
after ArrowDown #4: focused = Höganäs Kross & Grus AB — Ängelh…
```

ArrowRight, then ArrowDown: still the same row. Home and End: the same row.

## Why it matters

Rows 2 through 9 were **unreachable by keyboard**, and the canvas has no tab
stops, so a keyboard user could select exactly one node in the entire document:
the first child of the root.

Everything the Inspector does is scoped to a selection. So without a mouse there
was no way to reach the Design tab for any other block, no way to open a
node-scoped host tab, and — for Quarrystone specifically — **no way to reach the
compliance certificate at all**, which is the block their whole embed exists to
protect.

This is in `TreeView`, a shipped `@wizeworks/silicaui-react` component, so it is
every tree in both builders and in anything else built on it.

## The cause

A treeitem lives **inside** a treeitem — that is what a tree is:

```html
<li role="treeitem">          <!-- the group -->
  <ul role="group">
    <li role="treeitem">…</li>  <!-- the row you are on -->
  </ul>
</li>
```

`onKeyDown` is bound on every `<li>`, so one ArrowDown ran the handler **once per
level**. The row's own copy moved focus to the next row; the event then bubbled
to the parent row, whose copy computed *its* next row — the child we had just
left — and moved focus straight back.

The handler is correct in isolation. It is wrong in a tree, and only in a tree:

> **A flat tree has no ancestor row**, so it worked, and that is how this
> survived every test it had.

## Where it lives

[packages/silicaui-react/src/tree-view.tsx](../../../packages/silicaui-react/src/tree-view.tsx) — `onKeyDown`

## The fix

The row claims the keys it owns and lets everything else keep bubbling:

```ts
/** The keys a ROW owns. Anything else keeps bubbling untouched. */
const ROW_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", " ", "F2"]);

if (ROW_KEYS.has(e.key)) e.stopPropagation();
```

A set rather than a blanket `stopPropagation()`, because the tree must not
swallow keys it does not handle — Escape, Tab, a typeahead letter and any
application shortcut still reach whatever is listening above it.

## Confirmed by

```
after ArrowDown #1: focused = Höganäs Kross & Grus AB — Ängelh…
after ArrowDown #2: focused = (the product list)
after ArrowDown #3: focused = Makadam 8–16 mm · 189 kr/ton
after ArrowDown #4: focused = Stenmjöl 0–4 mm · 142 kr/ton
```

and the whole standing check, end to end on the real Quarrystone embed:

```
· canvas nodes with their own tab stop — 0
· the Layers tree reached after — 44 tab presses
✓ the Layers tree is reachable by keyboard
· the row the arrows landed on — "Compliance certificate"
✓ the certificate's row can be reached with the arrow keys
✓ the certificate block can be selected without a mouse
· the first tab strip reached after — 33 more tab presses — landed on "Design"
✓ the host's own tab is reachable with the arrows
✓ ...and opens with the keyboard
✓ ...showing our certificate
· the host's toolbar action reached after — 16 more tab presses
✓ the host action is reachable from the open Compliance tab
· pressing it says — ["Sent 1 page(s) for compliance review."]
✓ ...and it fires
```

An e2e in `navigator-naming.spec.ts` asserts four ArrowDowns land on four
**different** rows, that exactly one row is in the tab order and it is the
focused one, and that Home/End reach both ends. It **first asserts the fixture is
a nested tree**, because on a flat one this test cannot fail. And the control:
after arrowing, Enter still SELECTS — a fix that made rows reachable but
unselectable would have passed every other assertion.

**Deliberately broken to watch it fail**: the `stopPropagation` line removed, the
test went red; restored, green. Builder e2e green, `pnpm verify` exit 0.

## Two of my own checks were measuring nothing

Worth recording, because both read as passes:

- **`[data-sui-selected]` does not exist.** The canvas draws selection with an
  overlay, not an attribute, so "what is selected?" queried an attribute no
  element has ever carried — and the two-builders check that asked "did selection
  leak between them?" counted zero of a thing that is always zero. Both now read
  the tree's own `aria-selected`, which is what a screen reader reads too.
- **A `role="tablist"` is a roving tabindex.** Tab lands on the *selected* tab and
  the arrows move between them, so tabbing 120 times looking for a tab named
  "Compliance" could never find it. That is correct behaviour and the check was
  wrong about the mechanism, not the product.

## Also recorded, not fixed

**44 tab presses to reach the Layers tree** from the top of the Quarrystone page.
Most of that is the app's own header and the builder's toolbar, each stop a real
distinct control, so there is no chip-row style win available here (that was
[082](082-the-hosts-own-toolbar-button-was-142-tab-presses-away.md)). A skip link
into the editing surface is the right answer and is a feature, not a fix.
Recorded as the number it is.

**The canvas has no tab stops at all.** Defensible — the tree is the accessible
route, and a page of hundreds of nodes in the tab order would be worse — but it
means the tree is a single point of failure for keyboard access, which is exactly
why this defect was total rather than annoying. Named so the next person weighing
a canvas-focus feature knows what it would buy.

## Rating effect

`Site builder › Navigator` and `Email builder › Navigator` in
[rating.md](../rating.md) — the component is shared.
