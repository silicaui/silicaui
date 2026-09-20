# 111 — The site builder had no Find, and a site hides text in three places no screen shows you

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · recorded in [073](073-twelve-places-and-no-way-to-find-any-of-them.md); built on Brandon's instruction, 2026-09-19
**Surface:** `@wizeworks/silicaui-builder` — the site builder's left rail
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

[073](073-twelve-places-and-no-way-to-find-any-of-them.md) built Find for the
**email** builder and closed with a line it could not act on at the time:

> **The site builder has no Find either.** The same argument applies to a site
> with…

It stayed that way. And in the meantime the site builder's toolbar printed a
`⌘ /` keyboard hint for it — a shortcut nothing was listening to, for a feature
that did not exist ([102](102-the-site-builder-advertises-a-shortcut-for-a-feature-only-the-other-builder-has.md)).
So the two builders were exactly the wrong way round: **the one that could search
said nothing, and the one that said so could not.**

## Why it matters

The argument transfers exactly, and a site is worse than an email in one way: it
has **three** hiding places rather than one.

| Where | Why no screen shows it |
| --- | --- |
| The shared header and footer | It is on every page and belongs to none. It is a different TREE, reached by a mode switch. |
| A saved component | Two clicks and a mode switch away, and every instance of it changes together. |
| The address behind a link | Only visible once that exact link is selected. |

A phone number, a price, an opening time or a campaign URL is in all four places
at once — a card, the header, the contact page, and behind a button — and three
of those four are somewhere the author is not looking. So "change it everywhere"
means "remember everywhere", and the one they forget is the one a customer rings.

## Where it lives

[packages/silicaui-builder/src/site/find.ts](../../../packages/silicaui-builder/src/site/find.ts)
[packages/silicaui-builder/src/site/react/FindPanel.tsx](../../../packages/silicaui-builder/src/site/react/FindPanel.tsx)
[packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — `findText` / `replaceText`

## The fix

A **Find** page in the left rail — the same tab, the same icon and the same place
as the email builder's, so the two shells do not have to be learned separately.

**Scope stated rather than discovered**, and it is the email finder's three rules
because the reasons are the same:

- **Exact text, capitals included.** No case folding, no wildcards, no regular
  expressions. A price, a date, a phone number and a URL are what people hunt,
  and all four are typed exactly.
- **Only what a reader would see or follow** — the words, a link's address, an
  image's description, a page's name, the author's own layer names. Never class
  names, colours or sizes: a replace that rewrote `#18181b` because it contained
  `18` would be a disaster.
- **Never inside markup.** A rich-text node stores HTML, so a naive replace of
  "a" would rewrite `<a href=…>` into nonsense.

**Two things are deliberately not searchable, so their absence is a decision:**

- **A page's slug** is *listed and never rewritten*. It is a route: changing it
  breaks every link that points at it and every bookmark a visitor has. It shows
  up as "the page's web address — shown, not changed", and the Change-all button
  counts only what it will actually touch, so its number and its work are the
  same number.
- **A binding reference** (`{{ref}}`) names the host's data, not the author's
  words. Rewriting it would break the bind rather than fix the copy.

**`replaceText` crosses pages, the frame and saved components in ONE undo step.**
It walks each tree directly and stamps each op with that tree's own target,
rather than going through `setText`/`setAttr`, which only ever address the tree
the spine is pointed at. A collaborator therefore sees it as N ordinary edits
across N trees, which is exactly what it is.

**Clicking a hit switches tree first, then selects.** A hit in the frame or in a
saved component is on a surface the author is not looking at, and selecting a
node that is not in the open tree would silently do nothing.

## Confirmed by

Driven as an author, with four controls — each a different way the panel could
have been lying:

```
the rail offers a Find tab: yes

CONTROL A  "afternoon"                 -> 1 hit    "1 place"
CONTROL B  a word that is not there    -> 0 hits   "Nothing on this site says …"

clicking a hit selects something: yes
   the inspector reads: "Design Settings Heading <h1> Editing All sizes …"

CONTROL C  after Change all:
   "afternoon" -> 0 hits  ok
   "evening"   -> 1 hit   ok — same count
   the Undo button now reads: "Undo — change contents"

CONTROL D  undo -> "afternoon" is back in 1 place  ok

page errors: 0
```

And guarded in CI by
[e2e/site-find.spec.ts](../../../packages/silicaui-builder/e2e/site-find.spec.ts),
whose case is deliberately the **cross-tree** one, because that is the half a
person cannot do by hand: "store" is on the home page *and* in the shared footer,
and the frame is not the tree that is open.

```
2 passed
```

## Three of my own mistakes, recorded rather than quietly repaired

- **Selection was read off a guessed CSS marker class** and reported "nothing
  selected" every time. The Inspector is what an author actually sees, and
  "No selection" is its own empty state — so it tells the two directions apart,
  which a guess at a class name never did.
- **Undo was pressed with the cursor still in the search box**, which correctly
  undid the *typing* and had me reporting a document defect that did not exist.
  Verified twice afterwards, through the toolbar button and through the keyboard,
  the keyboard path with its own control (Ctrl+Z after an ordinary canvas delete
  must work first).
- **The count line was wrong twice.** It read `1 place in 1 place on the site`,
  which nobody would say; the next attempt trailed off as `2 places, across 2`
  because no noun followed the number. A group here is a page, or the shared
  frame, or a saved component, and no single word covers all three. It reads
  `2 places in 2 parts of your site` now.

## Rating effect

`Site builder › Layers (Navigator)` and the left rail generally in
[rating.md](../rating.md). The rail has a third page it did not have.
