---
"@wizeworks/silicaui-builder": minor
---

A `statusBarSlot` on both builders, and the mode toggle now follows a host's `setActiveTree`.

**`statusBarSlot`** renders host state in the FOOTER — the status bar — immediately after the
engine's own mode label and before the spacer, so a host's state and the engine's read left to
right as one sentence about the session.

It's the same content `toolbarStatusSlot` takes, one floor down, and usually the better home for
it. The footer already carries exactly this kind of fact (which surface you're on, which device
width you're looking at) and nothing else — the engine's own two children are the argument:
`mode` and `device` are state, so they live down there rather than beside the toggles that set
them. State read in the footer isn't competing with a bar full of buttons. Use the header slot
for the one or two things that must be at eye level, this for the rest, or this alone.

Non-interactive content only, and more strictly than in the header: the strip is 28px tall.
Unreachable for a host any other way — `<footer>` is engine-owned and takes no children, so the
alternatives were a second status bar stacked below `<Builder>` (two per screen, one per package)
or a portal into our markup at a computed index, which breaks silently the first time the
footer's children change. Same slot, same position, same contract on `EmailBuilder`.

**The mode follows the tree.** `editor.setActiveTree("frame")` retargeted the whole editing spine
— canvas, Navigator, Inspector — while the shell's mode toggle kept saying **Page** and the left
rail kept listing pages, so an author edited the shared header and footer while the editor
insisted they were on a page body. Two knock-ons came from the same root: the rail showed Pages
instead of Layouts, and `<Navigator>` (keyed on the mode) wasn't remounted, so it kept the page
tree's expanded set and a newly-selected frame node could sit inside a collapsed ancestor with no
visible row. All three are gone: the shell now watches the active tree the same way it already
watched `enterSymbol`, and moves the mode to match.

It keys off a CHANGE of tree rather than the (tree, mode) pair, because the pair is legitimately
mismatched when the MODE moved and the tree didn't — Component mode with no symbol yet leaves the
spine on the page body on purpose, and a pair test would bounce the author straight back out of
it. Theme mode is exempt for the same reason `changeMode` leaves the tree alone there: it edits
tokens, so being in it is not a claim about any tree and there is nothing stale on screen to
correct.

**`editor.select(id)` now returns whether it landed** — the sharp edge underneath the above.
Selection is tree-scoped, so an id from another tree means nothing: a frame node while the spine
is on a page body, a node in another email template, a node a concurrent editor already deleted.
Those used to be stored anyway, leaving a selection that resolved to no node — no ring, no
Navigator row, no Inspector, and shortcuts pointed at nothing. They're now refused, and the
boolean is what makes "not in the tree you're pointed at" distinguishable from "gone", so a host
can say *that block isn't there any more* — or switch trees and try again — instead of guessing at
a silent no-op. Clearing (`select(undefined)`) always lands. Same contract on the email engine.

Also: the footer's ink is a real token instead of `text-base-content/55` (and, in email,
`/40` on the mode label). Faded ink on text a person is meant to read was already wrong, and it's
squarely wrong now that the strip is where a host's status lives.
