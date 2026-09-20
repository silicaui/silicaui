---
"@wizeworks/silicaui-builder": minor
---

The email builder now says an email has a subject, from the first moment

Getting to the subject took knowing that a tree row called "Email" is the
document, and that document fields live behind its Settings tab. Both are true
and neither is guessable — and **until you knew them, nothing on screen mentioned
a subject line at all.** It is the single most consequential string in an email
and the most likely first thing anybody writes.

There is a slim bar above the canvas now, where every mail client puts it,
reading `Subject` and then the subject.

**It is a read-out, not a second field,** and that is a decision rather than a
shortcut. The toolbar already carried a written ruling against a second copy, and
a second copy would have had a real bug in it: the field's editor seeds its local
state at mount and never re-syncs, so two of them on one value would drift apart
inside a session and the last one blurred would win. One value, two views, one
editor.

Clicking it **moves the Inspector's tab as well as the selection.** Selecting the
root without asking for Settings lands you on Design, which is the right rail and
the wrong page of it — most of the original problem over again.

And the empty state says what is missing: *"No subject yet — most people write
this first"*, rather than rendering as a slightly shorter line of nothing. An
email with no subject is the one that goes out wrong.

Alongside it, the builders' left rail is **288px** rather than 240px. Its tab
strip had three pages (Layers, Insert, Find) and 236px of tabs, so at 240px it
paged at every width — which put **Find** behind an arrow, the one tab whose
entire purpose is that you can see it without knowing it is there. The email
builder had been doing this since its own Find shipped; both are fixed.
