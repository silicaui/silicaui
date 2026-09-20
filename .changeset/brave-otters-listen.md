---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-react": patch
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui": patch
---

The site builder, driven by someone who has never seen a developer tool: her work survives, her pages get real addresses, and the text she publishes is readable

Found by the P03 persona run — Marlene Okonkwo-Bright, 58, who has run a dance studio in
Leeds for 22 years, builds a seven-page site with an eleven-row class timetable, and
publishes it. Twenty-three defects, twenty-two fixed. What follows is what changes for
anyone building on these packages.

**Her work now survives the tab closing mid-sentence.** Inline editing held new
characters in a `contentEditable` and wrote them into the document only on blur or
Enter, and the draft store persists the *document* — so the sentence being typed right
now lived nowhere durable. She typed a full sentence, the tab closed, and seven pages
came back without it. Both canvases now commit on `pagehide`/`visibilitychange` through
one shared hook, and both builders write through synchronously once the page is hiding,
so the ordering of those listeners cannot matter. A killed process still loses the
sentence in progress; the store's own header comment now states that limit instead of
promising otherwise.

**A page's address follows its name.** Renaming a page changed only its label, so a
seven-page site published as `/page-2` through `/page-7`. A derived slug now follows the
rename, and `slugify` drops apostrophes rather than turning them into separators —
`Marlene's story` is `/marlenes-story`, not `/marlene-s-story`, which reads as three
words one of which is the letter s.

**Deleting a page says what points at it.** `Editor.linksTo(slug, exceptPageId)` counts
links across every page, the frame and every symbol master, and the delete prompt uses
it: *"One link elsewhere on your site points at this page. It will be left pointing at
nothing."* It counts, it does not block, and it stays silent when there is nothing to
say.

**Text meant to be read is no longer faded, and a table on a public page clears the type
floor.** Eleven places handed authors `text-base-content/70` on body copy — including
the Insert panel's **Text** item, so every paragraph anyone inserted started faded. All
eleven are solid ink. The Table item inserts `table table-lg` (16px cells) rather than
the bare 14px default, which is right for the dense admin grids the component is mostly
used for and wrong for a class timetable parents read. `.table`'s own default is
unchanged.

**A pasted date is parsed or refused, never invented.** `2026-12-18` pasted into a date
field became **10/12/2186**: digit groups were mapped by the locale's display order
(ISO is year-first in every locale), and "a `Date` constructed" was used as the validity
test, which it is not — `new Date(2018, 2025, 12)` is a perfectly good date in 2186. ISO
input is now hand-parsed with no `Date` involved, every route is range-checked against
the real length of the month, and anything that fails returns null instead of a
plausible wrong year.

**Other builder repairs from the same run:** the left rail can no longer be dragged
narrower than its own tabs; 33 components that arrived as machine keys (`AvatarGroup`,
`FieldsetLegend`) read as English; a table's three nested "Table" rows in the Navigator
are distinguishable; Undo names what it is about to take back (*"Undo — remove an
element"*); a reload lands on the page she was editing with her selection intact; the
link field offers her own pages instead of asking her to type an address from memory;
duplicating a table column keeps every row the same width; a locked node is no longer
draggable on the canvas, matching the Navigator and the locking spec; and naming a page
returns focus to the button that opened the field instead of dropping it on
`document.body`, which left a keyboard user restarting from the top of the document.

**`@wizeworks/silicaui`:** a tab panel is in the tab order (`tabindex="0"`) and had
`outline: none`, so Tab moved focus and nothing on screen changed. `.tabs-panel` now
carries the same ring `.tabs-tab` already had, under `:focus-visible` only — so it
appears for the keyboard arrival and not for a click, which is what the original rule
was protecting.

**`@wizeworks/silicaui-react`:** the colour picker's hex field had no accessible name;
it now points at the visible "HEX" label.

The artifact is in `docs/personas/artifacts/p03-bright-step-studio/` — seven pages
served under a strict CSP with no `'unsafe-inline'`, built by driving the real builder,
with 0 text runs under WCAG AA and 0 console errors.
