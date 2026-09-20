---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-react": patch
"@wizeworks/silicaui": patch
---

The email builder, driven by someone who sends a newsletter to 4,100 people every Thursday: the same email again for another shop, one word changed everywhere at once, a broken link he can see, and an email that fits a phone

Found by the P04 persona run — Reuben Halloway, 36, marketing lead at a three-shop
independent bookshop in Bristol, who builds his weekly newsletter, duplicates it for
three shops, gets the offer code wrong, and sends it. Sixteen defects, all fixed. What
follows is what changes for anyone building on these packages.

**An email can be copied.** The template switcher could add one and delete one, so the
second version of an email that already existed had to be built again from a starter and
retyped word for word — and one send per shop, per region, per language, per list is the
ordinary shape of the job, not an edge case. `EmailEditor.duplicateTemplate(id)` and a
Duplicate button in the switcher. The copy gets fresh node ids throughout, so editing one
never reaches into the other, and it *keeps* its locks: unlike duplicating a single node,
the copy IS the same email for another audience, and a footer the host pinned into the
original belongs in it just as much.

**And so can a page.** The identical gap sat in the site builder's Pages panel.
`Editor.duplicatePage(id)`, same Duplicate button, with one difference that matters — the
copy's address is derived from its new name rather than copied, because two pages cannot
share a route.

**You can find a word across every email in a project, and change it everywhere in one
press.** The offer code went out wrong and sat in twelve places — four per email, three
emails — and *six of the twelve were on no screen the author was looking at*: the subject
and preview text live behind a tree row, and the code in a button's link is invisible on
the canvas. There was nothing at all for finding a word. There is now a Find page on the
left rail. It searches every template, including the fields that are not on screen, it
says how many places before you start, and Change-all is one undo step however many it
touched. The search is exact text including capitals, it never matches inside markup
(a replace of "a" must not rewrite `<a href>`), and it never touches colours, sizes or
class names.

**A merge token nothing resolves is marked on the canvas.** The site canvas has outlined
an unresolvable reference for a long time; the email canvas did not. The cost showed on
the first real send: the shipped newsletter starter's own footer carries
`<a href="{{unsubscribeUrl}}">Unsubscribe</a>`, no host declared that reference, and a
whole newsletter was written, reviewed and composed with no warning anywhere — leaving
every subscriber an unsubscribe link pointing at the literal characters. Same dashes,
same warning colour, same `data-sui-unresolved` hook as the site canvas.

**Emails fit a phone.** Every email this projector produced was 600px wide on a 360px
screen. The mobile rule fired and stacked the columns; the body stayed 600px, so a phone
either shrank the whole message to 60% — a 14px footer arriving at about 8px — or scrolled
sideways. `max-width:100%` on a fixed-pixel element inside an auto-layout table looks like
responsiveness and does nothing, because the percentage resolves against a containing
block that is sized by its own content. Images are now fluid up to the size the author
chose, the body table is fluid with a `max-width`, Outlook gets a real 600px shell through
a conditional comment, and the media query narrows the body as well as the columns.

**A stock button is big enough to press.** 16px of label in an 18px line box with 8px of
padding is 34px tall — under the 44px minimum a thumb reliably hits. The padding default
was written out in three places; it is one exported constant now, and it is 14.

**The email projector will not emit a URL it would not follow.** It escaped every URL and
checked none of them, so the formatting bar's Link button — which builds a real anchor out
of whatever it is handed — put `javascript:` straight into the document and out into the
composed email. Harmless in an inbox; live script on the "view in browser" page, which is
the sender's own domain. `isSafeUrl` is now exported from `@wizeworks/silicaui-html` (it
already handled `" javascript:"`, a newline inside the scheme, and the relative path that
merely contains a colon) and runs on all nine URLs the email projector writes. An unsafe
anchor inside a text block loses its href and keeps its words. The Link button refuses one
up front, in plain English, rather than letting an author believe they made a link that
quietly is not one.

**The builder's own labels are readable ink.** Eleven `text-base-content/70` fades on text
a person reads to operate the email builder — every Inspector field label, every group
heading, the empty state, the breadcrumb, the canvas hints. Not a contrast failure, but a
fade used as a default is exactly what the rule exists to stop. Icons, the breadcrumb
separator and the attribution mark keep theirs.

**`pnpm verify` now fails on a raw control character in source.** While fixing the URL
guard, a regex that read `/<a\b…/` turned out to contain a literal backspace byte where
the word-boundary escape was meant — and two more of them sat inside a live test
assertion, where `!regex.test(html)` had been unconditionally true since the day it was
written. A check that cannot fail is worse than no check. The new scan found two further
cases the hand sweep missed, one of them in a shipped React component and one in the scan
itself.
