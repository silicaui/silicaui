---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-react": patch
"@wizeworks/silicaui-html": patch
---

The embed seam, driven by the engineer who has to put this inside their own product: a block their customer must not be able to touch, two people in one page, a van that loses signal, and a published page that needs nothing running

Found by the P05 persona run — Arvid Lindqvist, 27, platform engineer at a
four-person B2B SaaS in Malmö, who builds the whole integration from
`docs/builder-contract.md` and nothing else, then tries everything the contract
says not to. Seven defects, all fixed.

**A pinned block could be copied out of its own lock.** `HostComponentDef.pinned`
stamps a host lock the author cannot clear — and `duplicate()` cleared it, on the
reasoning that a copy is author-owned. One Ctrl+D put an unlocked copy of a
legally-owned compliance certificate on the page. A host lock now survives
duplication; an author's own lock still clears, because that one is theirs.

**The escape hatch the locking spec pointed at did not exist.** The spec says a
host that wants a read-only region "withholds inspector controls", but
`validateClass` had the signature `(cls: string)` — it saw a class string and not
a tree, so a host protecting ONE block could only ban `hidden` everywhere or
nowhere. `ClassValidator` now receives the node (optional, `unknown`, so no
existing validator changes), and every write path routes through it.

**Two windows given the same document did not hold the same document.** A site
with no frame gets a default one, materialized independently in each window with
minted ids — so a frame op relayed between two people was dropped while a page op
from the same batch landed, silently and forever. Defaults the editor conjures
are now deterministic, and `replaceState` establishes the same invariants the
constructor does instead of leaving Layout mode showing the page.

**The Layers tree moved one row and stuck.** A treeitem lives inside a treeitem,
so the row's keydown handler was bound on every ancestor and a bubbling ArrowDown
ran once per level: the child moved focus forward, the parent moved it straight
back. Every row below the first child was unreachable by keyboard — and the
canvas has no tab stops, so the tree is the only keyboard route to a selection. A
flat tree has no ancestor row, which is how this survived every test it had.

**Nothing pretends any more.** Delete on a locked node is disabled with the
reason on it instead of being a live button that does nothing, and the Design tab
says the host's own sentence back rather than swallowing a refusal.

**Every chip row in the Inspector is one tab stop.** Reaching the host's own
toolbar action took 142 tab presses with a node selected, because every chip in
every mutually-exclusive group was its own stop — one padding row cost thirteen.
The builder's tab strips already did this correctly; one shared wrapper brings
the roving tabindex to all six components that render chip and swatch rows.
142 → 34.

**Two builders on one page no longer fight over one rail width**, and
`BuilderHandle` gained `extract()` — the document on demand, which
`builder-contract.md` §10 had listed as part of the minimal buildable surface all
along and was the one item the handle did not have.

`docs/builder-contract.md` gains **§4.1 Mounting it in your app** (React dedupe,
the `@source` lines, the studio theme) and **§5.2 Publish — the page a visitor
gets**, which says the thing nothing said before: `renderHostNode` is a canvas
hook, a host node ships as an empty `data-sui-host` mount point, and filling it
is the host's job. Follow the old contract exactly and you published a page with
holes where the most important blocks were, valid, 200, and silent.
