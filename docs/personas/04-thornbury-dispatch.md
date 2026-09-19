# P04 — Reuben Halloway · The Thornbury Dispatch

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
**Customer:** **business user** — marketing, not engineering
**Surface:** the email builder
**Role in the roster:** the only run that judges output in a real mail client

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P04-thornbury-dispatch/` (the composed `.html` + a screenshot per client) |
| Driven at | `http://localhost:5178/?editor=email` |
| Theme | the email theme defaults, then one custom brand colour |
| Started from | a template from the Templates panel, then rebuilt — because that is what people actually do |

## The person

**Reuben Halloway, 36, he/him.** Marketing lead at an independent bookshop group. He
is comfortable with software — he runs the CRM and the socials — but he is not a
developer and has never written HTML. He has sent a newsletter every Thursday for four
years and has been burned by one that looked perfect and arrived broken.

**Technical level.** Medium. He will understand "merge tag" because his old tool used
it. He will not understand "node", "projection", or "link group".

**What he is nervous about.** Outlook. He has 4,100 subscribers and knows from the
click data that a big share of them open it in Outlook on Windows, where his last
newsletter's buttons became underlined blue text.

**What made him look today.** His email tool's editor is being retired and the
replacement costs three times as much.

## The business

**The Thornbury Dispatch** — the weekly newsletter of a three-shop independent
bookshop group in Bristol.

- 4,100 subscribers, ~38% open rate, sent Thursday 07:00
- Every issue: one lead review, three staff picks, two events, one offer
- **Inconvenient for the software:** every subscriber gets their name and their home
  shop merged in, and the events section is different per shop. One newsletter, three
  variants, and a merge that must not print `{{firstName}}` to a real person.

## Why he is here today

1. "Will this actually arrive looking like it does on my screen?"
2. "Can I put someone's name in the greeting without breaking it for people who have
   no name on file?"
3. "Can I make one email and have the Clifton lot get the Clifton events?"

## The data

**This is the test data. Type it as written** (RULE #2).

### The subject line — deliberately long

> **This week: Ondaatje's new one, a Tuesday poetry night in Clifton, and 20% off everything Nordic**

97 characters. It has to be typeable, savable, and visible in the builder without
being silently cut.

### The lead review

> **Warlight** — Michael Ondaatje · £9.99 · paperback
>
> Nadia's note: "A book about the fog after a war rather than the war itself. I read
> it in two sittings and then immediately lent it to my brother, which I now regret."

Carries: an apostrophe in `Ondaatje's` and in `Nadia's`, a `£` with pence, and a
quotation that wraps to five lines at 360px.

### Staff picks — three, one per shop

| Title | Author | Price | Shop |
| --- | --- | --- | --- |
| Piranesi | Susanna Clarke | £8.99 | Gloucester Road |
| Die Vermessung der Welt | Daniel Kehlmann | £11.50 | Clifton |
| 中国北方的情人 | Marguerite Duras (trans.) | £14.00 | Bedminster |

Carries: a non-ASCII title in CJK, a German title with an umlaut-free but long form,
and three prices with pence.

### Merge tokens

| Token | Real value | The value that breaks it |
| --- | --- | --- |
| `{{firstName}}` | `Reuben` | **empty** — a subscriber with no first name on file |
| `{{homeShop}}` | `Clifton` | **empty** — someone who has never said |
| `{{unsubscribeUrl}}` | a real URL | must never be empty, ever |

### Events — the dates that matter

| Event | When |
| --- | --- |
| Poetry night | Tuesday 29 September 2026, 19:30 |
| Children's storytime | Saturday 3 October 2026, 10:00 |
| Late-night opening | Thursday 31 December 2026, until 23:59 |

---

## The build

| Item | What it must have |
| --- | --- |
| Header | the shop's wordmark with a real logo image, and a "view in browser" link that works |
| Greeting | `{{firstName}}` with a working fallback for an empty value |
| Lead review | the cover image, the five-line quote, the price, and a button that is a **button in Outlook** |
| Staff picks | three cards including the CJK title, each linking to a real product URL |
| Events | the three events, with the Clifton one shown only to `{{homeShop}} == Clifton` |
| Offer | one promotional block with a code |
| Footer | address, a working unsubscribe, and the legal line — complete, not stock |

**Working end to end:** the composed HTML, opened as a file in **Outlook on Windows**,
Gmail web and Apple Mail, renders with its buttons as buttons, its images with alt
text, and no `{{token}}` visible anywhere.

**The look.** A bookshop's letter: typographic, restrained, one accent, images that
carry it. It must not look like the site builder's output.

**Also required, as on every one:** both themes (an email's light and dark rendering
is a real thing and Apple Mail will invert it), 360px, keyboard-reachable in the
builder, on-system.

---

## The run

### Act 1 — Start from a template, the way people do

Open the Templates panel and pick one. Then start replacing its content with his.

**Done when:** the template's own copy is completely gone, and it is recorded whether
anything of it survived that he did not notice — stock copy left in a footer is the
classic.

### Act 2 — The 97-character subject line

Type it in. Read it back.

**Done when:** it is stored whole and shown whole, or the point at which it is cut is
an issue.

### Act 3 — The greeting and the empty merge token

Put `{{firstName}}` in the greeting. Then set it to empty and look at what a
subscriber with no name on file receives.

**Done when:** an empty token renders as something a human would accept — never as
`{{firstName}}`, and never as a greeting that reads "Hello ,".

### Act 4 — The lead review and the button

Build it with the real cover image, the five-line quote, the price. Then the button.

**Done when:** the button is a button — and act 8 proves it in Outlook, not the
Preview pane.

### Act 5 — The staff picks, including the CJK title

Three cards, three real links.

**Done when:** `中国北方的情人` renders correctly in the builder, in the composed HTML,
and in all three clients — and the link on each card is a real anchor, not a wrapper
around block content.

### Act 6 — One email, three shops

Make the Clifton events show only for `{{homeShop}} == Clifton`.

**Done when:** all three variants have been produced and looked at, including the
variant for somebody whose `homeShop` is empty.

### Act 7 — The thing that goes wrong for him

He notices at the last minute that the offer code is wrong, **after** he has already
duplicated the email for the three shops. He has to fix it in all of them.

**Done when:** it is fixed everywhere, and the number of places he had to remember to
change it is written down.

### Act 8 — Outlook, which is the whole point

Compose the final HTML through the real send path (`composeEmailDocument` — the same
one sparx uses). Open the file in **Outlook on Windows**, then Gmail web, then Apple
Mail with dark mode on.

**Done when:** there is a screenshot from each, buttons are buttons in all three,
images have alt text when blocked, and nothing inverted into unreadable ink in Apple
Mail's dark rendering.

### Act 9 — The other side, on a phone

Open the same file on a phone at 360px.

**Done when:** it is readable one-handed, every tap target is reachable, and the
unsubscribe link is findable and works.

---

## What only this persona proves

**The email builder's output in a real client** — merge tokens, link groups, the
frame, and Outlook.

---

## Standing checks

**Wrong moves.** Duplicate the email, edit the copy, then realise the change belonged
in the original. Paste 5,000 characters into the subject line. Delete a saved block
that two sections are both using. Double-click Send / Export.

**Reload and deep link.** F5 with the lead review selected and the Inspector open.
Then copy the address bar into a new window and see whether it lands on the same email
or a blank one.

**Dates.** `Thursday 31 December 2026, until 23:59` — a late-night opening that ends
at the boundary of a year. And a scheduled Thursday 07:00 send across a
daylight-saving change. **Record the machine's timezone.**

**Contrast and token math at the edges.** The offer block's accent on its own surface
in Apple Mail's dark inversion, measured — not guessed. Then the footer's legal line,
which is the smallest text in the whole email, on whatever surface it sits on.

**The other side.** Acts 8 and 9 — three real clients and a phone.

**Without a mouse.** Building the staff-picks section start to finish in the builder,
keyboard only.

**A boundary that should hold.** Put `<script>`, `onerror=` and an `<iframe>` into a
merge token's value and into a rich-text field. Confirm the host sanitizer eats them
and `toHtml`'s allowlist holds. Then confirm `{{unsubscribeUrl}}` cannot be made empty.

---

## Verification

| | Result |
| --- | --- |
| Acts completed | |
| Issues filed | |
| Issues fixed and confirmed | |
| Issues blocked, and on what | |
| Screens scored (in both themes at 360px) | |
| **Not checked** | |

### The numbers

| Record | Result |
| --- | --- |
| Clients checked, and what broke in each | |
| Template copy that survived into the finished email | |
| What an empty merge token renders as | |
| Places he had to change the offer code | |
| Design-rule breaches found | |
| Console errors and warnings during the run | |
| Worst contrast measured in the dark rendering | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.
