---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
---

A real daisyUI migration, run end to end by a developer with low vision and a keyboard habit: what it costs, what is a drop-in, and the one thing that lets you do it a screen at a time

Found by the P09 persona run — Gordon Pike, 61, six years into maintaining a
fishing-tackle shop admin his daughter uses on an iPad while he works at 150%
zoom in dark. Eight screens, 2,400 products, 76 daisyUI classes across 28
component families, migrated in place. Ten acts, two defects, both fixed.

**`Steps` could only go across the page.** daisyUI has `steps-vertical`; Silica
had nothing — not a prop, not a class, and the CSS module's first line said so:
*"a horizontal progress tracker"*. Its neighbour `Stats` has had `vertical` since
it shipped, so the answer was yes for one component and no for the next with
nothing saying which. `<Steps vertical>` ships now, spelled the way `Stats`
spells it, and the colour variants needed no change because a connector is still
a connector after it has been turned ninety degrees.

**The site sold itself to daisyUI users and had nothing for them.** `"daisyUI
alternative"` is in the site's own keywords, and searching the docs for
"daisyui", "migrate", "migration" or "daisy" returned **nothing at all** while
"button" returned Button. No page existed under any name. There is one now, and
every number in it came from the migration rather than from an estimate:

| | |
| --- | --- |
| daisyUI classes in the app | **76**, across 28 families |
| Replaced by a Silica component | **74** |
| Silica components it took | **45** |
| Lines of code | **730 → 819** (+12%) |
| Components with no Silica equivalent | **1**, now fixed |

**The section that goes first is the one about doing it gradually.** daisyUI and
Silica both own `.btn`, `.card`, `.table` and `.badge`, so "keep the old system
on one screen" is two stylesheets fighting — unless Silica is namespaced, which
it can be. A third app in the artifact loads **both plugins in one build** with
`prefix: sx-`, and the built stylesheet has 81 rules on `.btn`, 14 on `.sx-btn`,
and not one Silica class name without its prefix. A forty-screen app can be
migrated a screen at a time.

**What the migration does not change is the code.** Every `useState`, every
handler, every bit of filtering and paging in those eight screens is byte-for-byte
what it was on daisyUI. The diff is markup.

**And what it gives back.** Three of the five swaps that were not one-for-one
arrived with behaviour the app did not have: `AlertDialog` brought a focus trap,
a scroll lock, escape handling and focus return where `modal modal-open` had
none; `Tabs` brought arrow-key movement where a `tab-active` class the app
maintained itself had none; `Pagination` replaced three hand-rolled buttons with
numbered pages and the aria to match.

The guide publishes **no hours**, on purpose, and says so in those words: the
migration behind it was not done by a person at a keyboard, so a figure in hours
would be invented. What it publishes instead is the shape of the work — how many
call sites move, how many are mechanical, and which five need a decision.
