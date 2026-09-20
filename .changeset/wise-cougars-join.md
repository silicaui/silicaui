---
"@wizeworks/silicaui-builder": minor
---

Find anywhere on a site — every page, the shared header and footer, and inside your saved components

The email builder has had Find for months. The site builder had none, and its
toolbar printed a `⌘ /` hint for it anyway — a shortcut nothing listened to, for
a feature that did not exist. The two were exactly the wrong way round: the one
that could search said nothing, and the one that said so could not.

A site hides text in **three** places no screen shows you:

| Where | Why you cannot see it |
| --- | --- |
| The shared header and footer | On every page, belonging to none — a different tree, behind a mode switch |
| A saved component | Two clicks away, and every instance changes together |
| The address behind a link | Visible only once that exact link is selected |

A phone number, a price, an opening time or a campaign URL is in all four places
at once — a card, the header, the contact page, and behind a button — and three
of those four are somewhere you are not looking. "Change it everywhere" meant
"remember everywhere", and the one you forget is the one a customer rings.

**The count at the top is the point.** It answers the question you cannot
otherwise answer — *how many places is this?* — before you start, and it is the
same number the Change-all button acts on.

Scope is stated rather than discovered, and it is the email finder's, because the
reasons are the same: **exact text, capitals included** (a price, a date, a phone
number and a URL are all typed exactly); **only what a reader would see or
follow** — never class names, colours or sizes, because a replace that rewrote
`#18181b` for containing `18` would be a disaster; and **never inside markup**, so
a search for "a" cannot rewrite `<a href=…>` into nonsense.

Two things are deliberately not rewritten, so their absence is a decision. **A
page's slug is listed and left alone** — it is a route, and changing it breaks
every link that points at it and every bookmark a visitor has; the Change-all
button counts only what it will really touch, so its number and its work match. A
**binding reference** names the host's data, not your words.

Change-all crosses pages, the frame and saved components in **one undo step**,
stamping each edit with its own tree so a collaborator sees it as what it is.
Clicking a result switches tree first and then selects, because a hit in the
frame is on a surface you are not on and selecting into a closed tree would
silently do nothing.

**No keyboard hint went back.** Neither builder advertises a shortcut for Find,
which is the consistency the missing feature was really about.
