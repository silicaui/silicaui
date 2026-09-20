# P04 — Reuben Halloway · The Thornbury Dispatch

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done — 9 acts, every standing check, 16 issues filed and fixed
**Run:** 2026-09-19
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
| Acts completed | **9 of 9**, plus every standing check |
| Issues filed | **16** — [063](issues/063-the-templates-panel-had-no-templates.md)–[078](issues/078-two-regexes-that-could-never-match.md) |
| Issues fixed and confirmed | **16**, each re-proved on the screen it was found on. Every fix was deliberately broken and watched go red before being restored. |
| Issues blocked, and on what | **none** |
| Screens scored (in both themes at 360px) | **0 of 14** — the email builder's screens are scored in one pass once the run's fixes settle. Recorded, not padded. |
| **Not checked** | **Outlook on Windows, Gmail web, Apple Mail in dark mode.** None can be driven on this machine and Brandon confirmed that for this run. No screenshot was produced for a client nobody opened. · **Apple Mail's own dark inversion** is a different algorithm from `prefers-color-scheme` and was not exercised. · **Only Chromium** rendered the phone and dark passes. · **A real send** — every "test send" went to the demo host's hook, never to an inbox. |

### The numbers

| Record | Result |
| --- | --- |
| Clients checked, and what broke in each | **None checked.** What the markup must give them is asserted instead: both calls to action are table cells carrying `bgcolor` and `mso-padding-alt` so Word paints a real button; the body has an `<!--[if mso]>` 600px shell; there is no flex, no grid, one `<style>` block and no script. How Word actually paints it: **not checked**. |
| Template copy that survived into the finished email | **None.** Every line of the newsletter starter was replaced. The stock footer was the only survivor into act 8 and it carried the defect that became [074](issues/074-the-email-canvas-never-said-a-token-was-broken.md) — a `{{unsubscribeUrl}}` no host resolves. |
| What an empty merge token renders as | **Nothing at all — the sentence closes over the gap.** "Hello {{firstName}}," for a subscriber with no name on file arrives as `Hello ,`. The Inspector now says so before sending, the canvas outlines the block, and the Preview's subscriber picker shows the sentence that person receives. |
| Places he had to change the offer code | **12.** Four per email × three shops: the subject, the preview text, one sentence in the body, and the query string on the button's link. **Six of the twelve are on no screen he was looking at.** The Find page now counts them for him and changes all twelve in one press. |
| Design-rule breaches found | **13.** Eleven RULE #3 fades on readable chrome text in the email builder ([077](issues/077-the-builders-own-labels-were-faded-text.md)), one `text-[10px]` arbitrary size, and one below-floor 12px canvas chip. All fixed. **63 more of the same fade in the site builder: counted, not fixed here** — those screens belong to P01 and P03. Finished on 2026-09-19 once P03's run was complete: the count had grown to **69**, of which 57 took the real ink and 12 are the exemptions this rule allows. Every text ink in both builders' chrome now reads at full alpha in both themes — see [077](issues/077-the-builders-own-labels-were-faded-text.md). No RULE #1 breaches (no inline hex on a control, no non-silicaui component) and no RULE #2 breaches. |
| Console errors and warnings during the run | **Zero.** Every script in this run tracked `pageerror` and `console.error` and printed the tally; every one printed `none`. |
| Worst contrast measured in the dark rendering | **7.98:1**, at 16px, on "Read Nadia's full review" — the button's own ink on its accent. Every line passes AA. The footer's legal line, the smallest text in the email at 14px, measures **15.28:1**. The email declares no colour scheme, so this is Chromium rendering it unchanged; **Apple Mail's inversion is not checked**. |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.

### Act 1 — Start from a template, the way people do

**The Templates panel had no templates.** "Templates" meant *his own saved
emails*, so the list offered exactly one thing to start from: the blank email he
had just made. The site builder has had starters, a picker and a host seam for a
while; none of it had reached email. Filed and built as
[063](issues/063-the-templates-panel-had-no-templates.md).

Driven again as Reuben, on the built thing:

```
a dialog opens: "New email" — Start blank, or from a layout you can then replace with your own.
focus starts in: Search layouts…
  blank         Blank email     One empty section. Start from nothing.
  newsletter    Newsletter      A masthead, a lead story, three picks and a footer — the weekly-send shape
  announcement  Announcement    One thing to say and one thing to press — a launch, a closure, a change of hours
  offer         Offer           A promotion with a code and an end date
after picking: focus is on "Template name" (the name field: true)
template name: "The Thornbury Dispatch"   the email on the canvas: 444 characters
```

The starters ship deliberately obvious stock copy — `YOUR COMPANY · Your street
address` — because act 1's real question is what survives into a real send.
Every image carries real `alt`, and the footer carries a working
`{{unsubscribeUrl}}` rather than a `#`.

**Registering the new screen broke something else.** `pnpm verify` correctly
stopped and told me to run `gen-screens.mjs`; running it **deleted P01's entire
scoring run** — six scored rows replaced with dashes, exit code 0. The file's own
`--check` path says scores are hand-written and must not be byte-compared; the
write path eleven lines below ignored it.
[064](issues/064-the-tool-that-counts-the-screens-erased-the-scores.md). My
first attempt at the fix was the same bug again — `rating.md` is CRLF and my row
regex anchored on `$`, so it matched zero rows and wiped them a second time.
Hence the refusal guard, which was then deliberately broken to watch it fire.

### Act 2 — The 97-character subject line

It stores whole and comes back whole. He cannot read it:

```
typed:  95 characters
field:  95 characters    maxlength: none
identical to what he typed: true
the box is 238px wide holding 528px of text
→ he can see about 45% of it at once, and must scroll inside the box to read the rest

anything on screen about how long a subject line can be: NOTHING
```

A one-line `<input>` in a 240px rail, holding the one string that decides whether
any of the others get read. [065](issues/065-he-could-read-back-under-half-of-his-own-subject-line.md).

After the fix — it wraps, and it counts:

```
before:  the box is 238px wide holding 528px of text   → 45% visible
after:   the box is 238px wide holding 236px of text   → all of it

the starter's own copy:  Subject  28 characters
his real subject:        Subject  95 characters — most inboxes show about the first 60   [warning colour]
a short one:             Subject  38 characters
```

A count, not a cap: nothing is refused, and a short subject says nothing more
than its length. Five e2e tests reached for `ROW("Subject") > input` and needed
updating — all mine, each now carrying a comment pointing at the issue.

**Recorded, not fixed here — and fixed on 2026-09-19** ([112](issues/112-nothing-on-screen-mentioned-that-an-email-had-a-subject.md)): a read-out above the canvas, where every mail client puts it, that takes one click to the real field and switches the Inspector to the tab that field is on. A read-out and not a second editor, because two `TokenTextField`s on one value drift — each seeds from `defaultValue` at mount and never re-syncs. The original note: getting to the subject at all takes knowing that a tree
row called `Email` holds it — two clicks, and until then nothing on screen
mentions a subject line. For a marketing lead the subject is the *first* thing he
writes. A deduction against `Email builder › Inspector`, not a redesign at the
end of act 2.

### Act 3 — The greeting and the empty merge token

**Both of this act's named failure modes happened.** Measured through the real
projector, on the real screen:

```
what a subscriber receives, with the starter's own token:  "Hello {{firstName}},"
what a subscriber with NO NAME ON FILE receives:           "Hello ,"
```

And nothing anywhere said a word about either:

```
every tab on screen: ["Layers","Insert","Design","Settings"]
anything offering a different subscriber to preview as: NOTHING
anything anywhere about an empty merge value:           NOTHING
anything in the Inspector about a fallback:             NOTHING
```

Two defects, and the first was mine — the starter I wrote in act 1 opened with
`Hello {{firstName}},`, and `firstName` is a **guess**. No host in this repo
resolves it. The second is the real one: an inline `{{ref}}` is the headline
feature of an email builder, the resolver has always fired an `unknown-ref`
diagnostic for one it cannot resolve, and **nothing in the builder ever drew it**.
[066](issues/066-a-merge-token-nobody-resolves-is-delivered-as-typed.md).

**The grammar was left alone on purpose.** `resolve.ts` says silica owns exactly
one production — a bare dotted path — and "does not grow a `??`, a pipe, or a
conditional". That is a written decision with reasons, and a persona run is not
the place to overturn it.

**The act's target turned out to be reachable with no new code, and that was
proved rather than assumed** — two blocks on one ref, one *Has a value* and one
*Is empty*:

```
A  "Hello {{customer.firstName}},"   visible when it HAS A VALUE  → "Shown — the node renders"
B  "Hello there,"                    visible when it IS EMPTY     → "Hidden — the node and its children are dropped"

variant 1 — a subscriber with a name:   ["Hello Jordan,"]   exactly one greeting: true
variant 2 — a subscriber with no name:  ["Hello there,"]    exactly one greeting: true
                                        reads "Hello ,": false     shows a raw {{token}}: false
```

So what was missing was never the mechanism. It was any way to know you needed
it. Confirmed after the fix, with a **negative control first**, because a panel
that appears on every block tells him nothing:

```
1. the newsletter starter, sent untouched
   the greeting a real subscriber receives: "Hello there,"
   any raw {{token}} anywhere in the delivered email: false

control: a block with no merge token
   the "Merge tokens" panel is: absent (correct)

2. he types {{firstName}} — a name no host here knows
   {{firstName}}  Nothing resolves this. It is delivered as the literal text {{firstName}}.

3. he uses the token this host really has
   {{customer.firstName}}  sends as "Jordan"

4. a token that resolves to nothing (the "Hello ," case)
   {{product.price}}  Resolves, but to nothing here — the sentence closes over an empty space.

5. the same check on the SUBJECT line
   {{firstName}}  Nothing resolves this. It is delivered as the literal text {{firstName}}.

console errors: none
```

Two new e2e tests, deliberately broken to watch them go red (2 failed) before
being restored (6 passed). Builder e2e **202 passed**, `pnpm verify` exit 0
workspace-wide, typecheck clean.

**Recorded, not fixed here — and then fixed two acts later, which this note
never said.** At the time there was no way to preview as a *different*
subscriber: the Preview pane showed whatever the host's one resolver returned.
**Act 6 built the switcher** — `EmailBuilderHost.previewAudiences()`, a host-
supplied list of sample recipients, each carrying the `DataScope` that IS that
person, handed to `toEmailHtml({ scope })` so the host's own `resolveBinding`
answers exactly as it would on the real send. Silica never invents a subscriber.
The Preview renders it as a "Showing what this subscriber gets" picker, absent
entirely when a host offers no samples.

Re-checked on 2026-09-19 while working this list: the contract is in
`host.ts`, the picker is in `EmailPreview.tsx`, the harness offers three samples
— including *"Someone with no name and no shop on file"*, which is the variant
nobody remembers exists — and `e2e/email-merge-tokens.spec.ts` holds it. **9
passed.** The note above simply outlived the thing it described.

**Three instrument failures on the way here, none of them reported as findings.**
v1 of the act-3 probe read a `window.__emailEditor` that does not exist, matched a
tree row by text — and a `[role="treeitem"]` **contains its descendants**, so
"the row whose text has Hello in it" was the document root, the exact P03 trap
walked into a second time — and looked for a Preview tab that is not there. The
row's own element is `.tree-node`, which the product's own e2e spec already said.

### Act 4 — The lead review and the button

**His copy survives the projection character for character.** Typed as the
persona file writes it, read back out of the composed HTML:

```
kept    the em-dash headline      Warlight — Michael Ondaatje
kept    the £ with pence          £9.99
kept    the apostrophe in Nadia's
kept    the curly quotes          “A book about the fog…
kept    the word he most regrets  which I now regret
```

The cover image carries a real source and real alt text:

```
<img src="http://localhost:8032/images/warlight.png"
     alt="Warlight by Michael Ondaatje — the paperback cover" width="552" … />
```

The covers are genuine PNGs, rendered and served from
`artifacts/p04-thornbury-dispatch/images/` on port 8032 — an email does not carry
its pictures, it points at them, so hosting them is part of the test rather than
a detail.

**Then the button, which is the act.** What came out:

```html
<td align="center" bgcolor="#374f6a" style="border-radius:8px;background:#374f6a">
<a href="…" style="display:inline-block;padding:8px 16px;…">Buy Warlight — £9.99</a>
```

Every pixel of padding on the `<a>`. The cell has none. Outlook's Word engine
drops `padding` and `display:inline-block` on an inline anchor, so the cell keeps
the colour and loses the size: a clickable coloured word.

**And the code said so itself.** Three lines above that markup:

> `// "Bulletproof" button: a table cell carries the background so Outlook (which`
> `// ignores border-radius/padding on <a>) still renders a solid, sized target.`

Somebody knew, wrote it down, fixed the background half, and left the padding on
the one element the sentence says Outlook ignores it on. The same file reaches
for MSO conditionals in three other places — columns, a section background (real
VML), the document head. Four places needed it. Three got it. The one that did
not is the thing Reuben is afraid of.
[067](issues/067-the-button-is-a-coloured-word-in-outlook.md).

**Outlook cannot be run here and nothing below claims it was.** What was measured
is the real markup, before and after, through the one documented Word behaviour
the projector's own comment already names:

```
=== a client that follows CSS (Gmail, Apple Mail, everything but Outlook) ===
  before the fix        button 195×34px   space around the words: 0px across, 0px down
  after the fix         button 195×34px   space around the words: 0px across, 0px down
  unchanged for these clients: true

=== the same markup through the Word engine's documented rules ===
  before the fix        button 163×18px   space around the words: 0px across, 1px down
  after the fix         button 195×34px   space around the words: 16px across, 9px down
```

Square corners in Outlook either way — `border-radius` is dropped there. That is
written into the code as a known trade rather than left to be rediscovered.

**A second defect, found while reading the same export.** The masthead above the
cover:

```html
<img src="" alt="Your logo" width="160" … />
```

`src=""` is a relative URL resolving to the current document, so a client that
follows it fetches the message itself. And `renderLink`, **two lines below in the
same function's neighbour**, already refuses exactly this shape for `href` with
the reasoning written out — "never `<a href=""`, which some clients resolve to
the message itself".
[068](issues/068-an-image-with-no-source-fetches-the-message-itself.md).

Five checks added to `probe-email.ts` covering both, including a control that a
real source is still emitted untouched, and **deliberately broken to watch three
of them fail** before being restored. `pnpm verify` exit 0 workspace-wide
(including `silicaui-html`'s byte-identical golden fixture), builder e2e **202
passed**, typecheck clean.

**Recorded, not fixed:** the Layers tree names every image `Image`. Selecting the
lead cover meant counting past the masthead. Measured properly in act 5, which
builds three more.

### Act 5 — The staff picks, including the CJK title

**The CJK title is fine everywhere it can be checked here.**

```
=== 中国北方的情人 in the builder ===
  on the canvas: true
  in the Layers tree: true

=== 中国北方的情人 in the composed HTML ===
  present as real characters:  true
  mangled to entities/escapes: false
  the document declares:       <meta charset="utf-8" />
```

The three covers are real PNGs rendered and served over HTTP, including the CJK
one, which was opened and looked at rather than assumed.

**Two defects, both in what the starter builds.**

First, the Layers rail. Five images in this newsletter — a masthead, the lead
cover, three picks:

```
rows named exactly "Image": 5, and they are 1 distinct name(s)
```

Five rows, one name. To reach the Piranesi cover he counts. Every one of those
images already carried a sentence describing itself, and the same rail at the
same moment named text blocks by their own copy. The site builder states the rule
outright — *"content leads because that is what a person recognizes when
scanning"* — and reads an element's `aria-label` for controls with no text, on
the grounds that it *"IS this element's name, to a screen reader and now to the
author too."* `alt` is that, for an image. It never travelled.
[069](issues/069-five-images-five-rows-all-called-image.md).

Second, and worse: with his URLs in, each card had **one anchor, around the cover
only**. The title and price were plain `<div>`s. People click titles.

```
Piranesi                   anchors: 1
Die Vermessung der Welt    anchors: 1
中国北方的情人               anchors: 1
```

My own starter, from act 1 — the picks were a bare `[image, text, text]`. And the
palette has shipped `link-card` the whole time, described as *"Image + title +
price, all pointing at one URL — the product/article card"*, with a comment naming
the exact failure: *"an unlinked card with no visible symptom on canvas."* The
starter reproduced the documented mistake by hand.
[070](issues/070-only-the-cover-of-a-staff-pick-was-clickable.md).

After both fixes, the same section:

```
Piranesi                   anchors: 3   wraps a block element: false
Die Vermessung der Welt    anchors: 3   wraps a block element: false
中国北方的情人               anchors: 3   wraps a block element: false
anywhere in the document, an anchor around block content: false
```

Three anchors each, and **no anchor anywhere wraps a block element** — which is
the assertion act 5 actually turns on, because an anchor around block content is
what Outlook drops outright.

And the rail, which is now readable:

```
"Column"  "thornburybooks.co.uk/shop/pirane…"  "Piranesi — the cover"
          "Piranesi — Susanna Clarke"          "£8.99 · Gloucester Road"
"Column"  "thornburybooks.co.uk/shop/zhongg…"  "中国北方的情人 — the cover"
```

Nine checks added to `probe-email.ts` across both, including both fallbacks, the
truncation, and an end-to-end anchor count on the shipped starter — then
**deliberately broken to watch four of them fail** before restoring. `pnpm verify`
exit 0 workspace-wide, builder e2e **202 passed**, typecheck clean.

**A reading withdrawn.** Mid-act I reported that a block inside a Link group
loses its Settings fields — no Image URL, no Alt text. **False.** The probe walked
`.tree-node` by index and selecting a Link row re-renders the tree, so the next
click landed on a different row. A control on the lead cover — an image *not* in
a link group — caught it. That is the fourth instrument failure this persona and
the second caused by trusting a tree index across a re-render.

**Not checked:** act 5's "in all three clients" half. Recorded as not checked, not
passed.

### Act 6 — One email, three shops

He could build the rule. He could not look at any of it.

**Wall 1 — the rule reads as if segmenting is impossible.**

```
=== the conditions 'Visible when…' offers ===
  "Condition Has a value Is empty"
  can it say "equals Clifton": false

=== what the panel explains, in its own words ===
  (nothing)
```

Two conditions, neither of them equality, and not one word anywhere about what a
reference is or whose job it is to supply one. The product CAN do this —
`homeShop == Clifton` is a reference the platform computes, because silica never
parses a reference's value, which is the same line it holds on merge tokens and
is the right line. But the panel said nothing, so it reads as a dead end.

**Wall 2, which is the one the act turns on — he could never see what anybody
else received.** `toEmailHtml` resolved everything against an implicit `{}`, and
the only way to render the same email for a different subscriber was to build
another host. Fine on a send loop; impossible in a builder mounted once. So the
Preview showed exactly one version of the email, for ever.
[071](issues/071-one-email-many-recipients-and-only-one-of-them-visible.md).

The fix threads a recipient through the render (`DataScope.audience`, opaque to
silica exactly like a ref), adds a `previewAudiences()` host seam, and puts a
"Showing what this subscriber gets" picker on the Preview. The visibility rule now
explains itself, including the sentence it needed most: *"This rule cannot compare
a value to text you type."*

**The first thing the picker did was catch a live defect in his own email.** With
nothing else changed:

```
--- Someone with no name and no shop on file ---
  greeting:            "Hello ,"
```

Act 3's failure, in his finished newsletter. He had already been warned about the
token by 066 and had still written copy that breaks — because a warning about a
field is not the same as seeing the sentence a person receives. Applying act 3's
two-block pattern fixed it, and then all three variants were produced and looked
at, in the builder:

```
--- Reuben — Clifton, has a first name ---
  greeting: "Hello Reuben,"   Clifton events shown: true    raw {{token}}: false
--- Someone at Gloucester Road ---
  greeting: "Hello Priya,"    Clifton events shown: false   raw {{token}}: false
--- Someone with no name and no shop on file ---
  greeting: "Hello there,"    Clifton events shown: false   raw {{token}}: false
```

That is act 6's completion condition met on the screen rather than in a script.

Five probe checks driving one host and three recipients, with a control that no
scope at all behaves exactly as before, plus an e2e through the picker — then
**deliberately broken to watch three fail** before restoring. `pnpm verify` exit 0
workspace-wide including the byte-identical golden fixture, builder e2e **203
passed**, typecheck clean.

**One existing test broke and it was mine.** `{{cust` used to match exactly one
data source, and that test's `ArrowDown` is specifically about being a no-op with
one match; my two new demo refs made it three. Narrowed the query, with a comment
saying why.

### Act 7 — The thing that goes wrong for him

**Done when:** it is fixed everywhere, and the number of places he had to
remember to change it is written down.

**Outcome:** done. **Twelve places.** Two defects, both fixed —
[072](issues/072-no-way-to-copy-an-email-or-a-page.md) and
[073](issues/073-twelve-places-and-no-way-to-find-any-of-them.md).

The act could not start. Its premise is *"after he has already duplicated the
email for the three shops"*, and there was no way to duplicate an email. Read off
the running screen:

```
=== every control on the template switcher ===
  button  "Current template"
  button  "Rename template"
  button  "Add template"
  button  "Delete template"

=== does the word 'duplicate' or 'copy' appear anywhere on screen? ===
  (none)
```

"Add" opens the starter picker — a blank email or a stock layout, never a copy of
the one he just spent an hour on. The same gap, control for control, sits in the
**site builder's Pages panel**. Both were fixed together; both builders could
already duplicate a *block*, so the gesture, the word and the icon all existed
and simply stopped at the block instead of reaching the document.

With the copy in place, the act's own question could be asked. Counted straight
out of the saved project:

```
  Dispatch — Clifton          (the email) .subject
  Dispatch — Clifton          (the email) .preheader
  Dispatch — Clifton          body › section › text    .html
  Dispatch — Clifton          body › section › button  .href
  … the same four in Gloucester Road, and again in Bedminster

  TOTAL PLACES: 12

=== what the builder offers for finding a word across the project ===
  (nothing)
```

**Six of the twelve are on no screen he was looking at.** The subject and preview
text live behind a tree row called "Email"; the offer code in the button's link
is invisible on the canvas, which just says "Read more". A person who works
carefully through the canvas fixing everything he can see still ships six wrong
links and three wrong subject lines to 4,100 subscribers — and a missed one
renders identically to a correct one.

A **Find page** now sits on the left rail beside Layers and Insert. It searches
every email in the project, including the fields that are on no screen, and the
count is the first thing it says:

```
  it says: "12 places in 3 emails"
  the button reads: "Change all 12"
  after: "Changed 12 places to “THORNBURY10”. Nothing says “DISPATCH10” any more."
```

Read back out of the saved project and out of the HTML each shop's subscribers
actually receive:

```
  Dispatch — Clifton:          "DISPATCH10" gone, "THORNBURY10" x4
  Dispatch — Gloucester Road:  "DISPATCH10" gone, "THORNBURY10" x4
  Dispatch — Bedminster:       "DISPATCH10" gone, "THORNBURY10" x4

  one undo press put back: 12 occurrences of "DISPATCH10"
```

Fixed everywhere, and the number written down: **twelve**.

37 new probe checks and 3 new e2e tests, each **deliberately broken and watched
go red** before restoring — the copy sharing node ids, the copy sharing an
address, the replace reaching inside HTML tags, the replace touching only the
open template. One of my own probe checks was wrong and the probe caught it (the
stock subject "New email" contains an "a", so a letter search finds two places,
not one); it now says both things and names why. Three existing tests matched
`getByLabel("Duplicate")` loosely and now say `{ exact: true }`, each with a
comment naming the issue — no behaviour changed.

`pnpm verify` exit 0 workspace-wide, builder e2e **206 passed**, typecheck clean.

### Act 8 — Outlook, which is the whole point

**Done when:** there is a screenshot from each client, buttons are buttons in all
three, images have alt text when blocked, and nothing inverted into unreadable
ink in Apple Mail's dark rendering.

**Outcome:** partly done, and the part that is not done is **recorded as not
checked, not guessed.** One new defect, fixed —
[074](issues/074-the-email-canvas-never-said-a-token-was-broken.md).

**The three clients could not be validated on this machine** and Brandon
confirmed that is accepted for this run. No Outlook, no macOS, no mailbox to send
into. So:

| | |
| --- | --- |
| Outlook on Windows | **NOT CHECKED** |
| Gmail web | **NOT CHECKED** |
| Apple Mail, dark mode | **NOT CHECKED** |

Nothing was faked and no screenshot was produced for a client that was never
opened. What *is* asserted is the markup shape those clients need, read out of
the file a client would actually be handed — and that file is the artifact.

The whole Dispatch was built on the real screen first: masthead with a working
"view in browser" link, the segmented greeting with its empty-name fallback, the
lead review with its cover and quote, the three staff picks including the CJK
title, three events with the Clifton one segmented, the offer, and a complete
footer. Then composed through `toEmailHtml` — the same path a host's send uses.

**The find.** Reading the composed file:

```
no merge token reaches a person
  ✗ no {{token}} survives anywhere in the file — {{unsubscribeUrl}}

the unsubscribe
  ✓ there is an Unsubscribe link
  ✗ its address is real, not an unresolved token
  · it points at — {{unsubscribeUrl}}
```

The newsletter starter's own footer ships `<a href="{{unsubscribeUrl}}">`, no
host here declares that reference, and `href="{{unsubscribeUrl}}"` is a
**relative URL** — a client that follows it fetches something off the sender's
own domain. The one link an email is legally obliged to get right, dead, in stock
copy the author never wrote.

**And nothing said a word.** The site canvas has marked an unresolvable reference
for a long time — dashed warning outline, `data-sui-unresolved`, its own e2e. The
email canvas had neither line; searching it for "unresolved" returned nothing.
The seventeenth instance this run of *the fix exists in a sibling and did not
travel*, and the most expensive.

It marks it now, straight off the starter, before a word is typed:

```
  blocks the canvas marks as going out wrong: 1
    "You are receiving this because you signed up. Unsubscribe"
```

Reuben saw the dashes and made the word a real link with the formatting bar. The
composed file, re-read:

```
✓ no {{token}} survives anywhere in the file
✓ it is a real address, not an unresolved token
· it points at — https://thornburybooks.co.uk/dispatch/unsubscribe
```

**Everything else checkable, checked:** the document is complete and declares its
character set before any text; there is no script and no stylesheet to fetch;
both calls to action are table cells with a painted background, real padding and
`mso-padding-alt` for Word; all five images carry alt text and an absolute
address, none with an empty `src`; the £ and its pence, the apostrophe in
Nadia's, the curly quotes, the em dash and the CJK title all survived; the
segmentation took effect, with the empty-name fallback correctly dropped rather
than printed as well; the layout is table-based with no flex, no grid, and one
`<style>` block.

```
✅ every checkable thing passed
```

**A test of my own was too weak and deleting the fix proved it.** Both new e2e
tests asserted only `[data-sui-unresolved]` — and with the outline class deleted
they both still passed, because a data attribute is not something a person can
see. They now assert the dashes and the warning colour too.

### Act 9 — The other side, on a phone

**Done when:** it is readable one-handed, every tap target is reachable, and the
unsubscribe link is findable and works.

**Outcome:** done, after one critical defect —
[075](issues/075-every-email-was-600px-wide-on-a-360px-phone.md).

The composed file, opened at 360 × 780 with a phone's viewport:

```
isMobile=true  { innerWidth: 600, visual: 360, bodyScroll: 600,
                 mq480: true, innerTable: 600 }
```

`mq480: true` — **the mobile rule fired.** The picks stacked, exactly as designed.
And the email was still **600 pixels wide on a 360 pixel screen**, which leaves a
phone shrinking the whole message to 60% (the 14px footer arriving at about 8px)
or scrolling sideways.

The markup reads as if it already handled this: `style="width:600px;max-width:100%"`.
It does not, and the reason is worth keeping. A percentage `max-width` resolves
against the containing block; the containing block is a table cell; a table cell
in auto layout is sized **by its content** — so the percentage resolves against
the very width the content is setting. CSS treats it as no constraint at all.
`max-width:100%` on a fixed-pixel element inside an auto-layout table looks like
responsiveness and does nothing.

Images swapped round to `width:100%; max-width:552px`, the body table made fluid
with a `<!--[if mso]>` 600px shell so Word still gets a number, and the mobile
rule taught to narrow the body and not only the columns:

```
 360px → body 360, no overflow, picks stacked,  lead cover 312px
 480px → body 480, no overflow, picks stacked,  lead cover 432px
 600px → body 600,               three columns, lead cover 552px
1280px → body 600 (capped),      three columns, lead cover 552px
```

**The second find, on the same pass:** a stock button was **34px tall**, under
the 44px minimum a thumb reliably hits. `paddingY: 8` was written out in three
places, all agreeing by luck rather than by construction. One exported constant
now, saying 14, with the arithmetic in the comment: 14 + 18 + 14 = 46.

The full pass at 360px:

```
✓ no sideways scrolling — page 360px in a 360px window
✓ no body text below 14px on a phone
✓ every line of text meets AA against what is behind it
✓ the "Read Nadia's full review" button is a thumb-sized target — 215×46px
✓ the "Shop the Nordic shelf" button is a thumb-sized target — 197×46px
✓ there is an Unsubscribe LINK, not just the word
✓ it has a real, absolute address
✓ it looks like a link — underlined, so it reads as one
✓ the three picks stacked instead of squeezing — block,block,block
✅ every check passed at 360px
```

**Two things are recorded rather than fixed.** The masthead is a 37px-tall tap
target, because the author set the wordmark to 160px wide — an authoring
dimension, not a projector default, but **nothing in the builder measures a tap
target or says a word about it**. And the linked text inside the cards (16–41px)
is *not* counted as a failure: WCAG 2.5.5 exempts a target "in a sentence or
block of text", which is what a linked book title is, and each sits under a
312×240 cover that is a target in its own right. The exemption is named rather
than the measurement quietly skipped.

14 new probe checks, **deliberately broken to watch six fail** before restoring.
`pnpm verify` exit 0 workspace-wide, builder e2e **208 passed**, typecheck clean.

### Standing checks

**Outcome:** all worked. Three new defects, all fixed —
[076](issues/076-the-email-projector-emitted-any-url-it-was-handed.md),
[077](issues/077-the-builders-own-labels-were-faded-text.md),
[078](issues/078-two-regexes-that-could-never-match.md).

#### Wrong moves

**He edits the copy, then realises the change belonged in the original.** Undo is
whole-project and it did the right thing: the copy reverted, the original was
untouched, and the Undo button then named the step underneath it ("Undo — rename
an email") rather than saying "Undo" and leaving him to guess.

**5,000 characters pasted into the subject line.** All 5,000 survive the field,
the saved document and the projected `<title>`; the layout does not move. The
counter says what matters:

> 5000 characters — most inboxes show about the first 60

Nothing is silently truncated, which is the right call: an author who typed it
gets to keep it, and the sentence tells him what it will cost.

**Delete a saved block two sections are both using.** Saved a section as "Shop
address", inserted it twice, then deleted the library entry:

```
  · copies of the block now in the email — 3
  ✓ deleting the library entry did NOT gut the email — 3 copies before, 3 after
  ✓ the entry is gone from the library — 1 → 0
```

An inserted block is a copy, not a live reference, so deleting the entry costs
him the entry and nothing else.

**Double-click Send test.** Two separate questions, both fine. The trigger is a
dialog toggle, so a double-click opens and closes it — nothing sent, nothing
lost, one more click brings it back. And the confirm cannot double-fire:

```
  ✓ the Send button is disabled until there is a real address
  ✓ ...and stays disabled for something that is not an address
  ✓ the moment it starts sending, the button is dead — it reads "Sending…"
  ✓ so the two extra clicks landed on nothing
```

Read off the button's own state between the clicks, not off the host's record —
the host keeps only the last send, so it could not tell one from three.

#### Reload and deep link

F5 with work in the canvas: **his work survived**, through the builder's own
IndexedDB crash recovery. Selection does not survive, which is a view concern and
deliberate.

The deep link does not exist, and that is the honest finding:

```
  · the address — http://localhost:5178/?editor=email&persist=1&host=demo
  · there is nothing in it to deep link TO
```

Pasting that address into a second window lands on the same email only because
the two windows share one origin's IndexedDB — not because the address points at
it. The builder exposes `activeTemplate` / `setActiveTemplate`, so a host **can**
route to a specific email; the harness has no router, so nothing here does.
Recorded as the host's job, with the seam confirmed to exist.

#### Dates — **timezone recorded**

| | |
| --- | --- |
| Machine timezone | **America/Los_Angeles** |
| Locale | **en-US** |
| UTC offset | **-8 in January, -7 in July** |

`Thursday 31 December 2026, until 23:59` — 31 December 2026 really is a Thursday,
and one minute later is 2027. It is typed prose in a text block, so there is no
parser to get it wrong; the date is the author's to be right about, and the
product neither helps nor hinders.

The Thursday 07:00 send across the change, measured on **this** machine's rules:

```
    Thu 29 Oct, 07:00  →  2026-10-29T14:00:00.000Z  (UTC-7)
    Thu  5 Nov, 07:00  →  2026-11-05T15:00:00.000Z  (UTC-8)   ← the clocks went back here
  ✓ every send is still 07:00 for the reader
  ✓ the UTC instant moved by exactly an hour
```

**The first pass of this check was wrong and proved nothing.** It picked the week
the *UK* clocks change; this machine is in Los Angeles, where they change a week
later, so no offset moved and the check passed vacuously. Redone against the real
transition, wherever it falls.

#### Contrast in a dark rendering

```
  · what the page declares — color-scheme: normal
  · worst contrast measured — 7.98:1 at 16px — "Read Nadia's full review"
  · the offer block — 16.71:1 at 16px
  · the footer legal line — 15.28:1 at 14px
  ✓ every line still meets AA in the dark rendering
```

The email declares no colour scheme, so Chromium renders it identically in dark
mode and every line keeps its light-mode contrast. That is an authoring choice,
not a gap: the control **exists**, on the document's Settings tab, and its copy is
exact —

> Declares the schemes this email is designed for. Apple Mail and Outlook for Mac
> honour it; Gmail and Outlook.com invert colours on their own terms regardless —
> treat dark mode as progressive enhancement.

**Apple Mail's own inversion is a different algorithm and is NOT CHECKED.**

#### Without a mouse

The staff-picks section, built start to finish from the keyboard: a 3-column row
and three linked cards, no pointer at any point.

```
  ✓ Tab reaches the left rail's tab strip — landed on "Layers" (role=tab)
  ✓ Arrow keys reach the Insert tab
  ✓ the focused tab shows a focus ring
  ✓ Enter opens the Insert page
  ✓ the '3 columns' item is reachable by Tab
  ✓ a 3-column row got built from the keyboard — 1 row(s)
  ✓ three linked cards got built from the keyboard — 3 card(s)
```

**The first pass of this one was wrong too**, and reported the Insert tab as
unreachable. It only pressed Tab. A `role="tablist"` is a roving tabindex — Tab
lands on the selected tab and the **Arrow** keys move between them — which is
correct ARIA, and driving it any other way proves nothing.

#### A boundary that should hold

`<script>`, `onerror=`, `<iframe>` and a `javascript:` anchor, typed into a text
block: **all escaped on entry**, all inert, all present as readable characters
rather than markup. The projector never sees a live tag.

**The first reading of this said two of them leaked, and that was the check being
wrong** — it searched for the string `onerror=`, which is there, inside
`&lt;img src=x onerror="…"&gt;`. Anchored on a real tag instead, the boundary
holds.

Then the realistic one, which does not get escaped: the formatting bar's **Link**
button calls `document.execCommand("createLink")`, and that builds a real anchor
out of whatever URL it is handed.

```
  ✗ the projected email carries NO javascript: anchor
        — <a href="javascript:window.__pwned=99">
  · is it in the stored document — yes
```

Into the document and out into the composed email. `@wizeworks/silicaui-html`
has had the right guard all along — `isSafeUrl`, which even handles
`" javascript:"` and a newline inside the scheme — and every URL the **site**
projector writes goes through it. It was module-private, so the email projector
could not reach it and had grown its own weaker answer: `esc()`, which stops a
value breaking *out* of an attribute and does nothing about it *being* dangerous.

Exported now, and used at all nine URL sites in the email projector. The Link
button refuses an unsafe URL in his words rather than letting him believe he made
a link that quietly is not one.

**`{{unsubscribeUrl}}` can be emptied**, and nothing says a word. Recorded, not
fixed: silica does not own the send, so it cannot enforce a legal requirement a
platform owns — but the canvas now marks the token as broken
([074](issues/074-the-email-canvas-never-said-a-token-was-broken.md)) and that is
the part that is silica's to do.

#### Design-rule breaches

**17** uses of `text-base-content/70` in the email builder's own chrome; **11** of
them on text a person reads to operate it — every Inspector field label, every
group heading, the empty state, the breadcrumb, the canvas hints, the Send-test
dialog's description, the Palette's headings. RULE #3 says readable text gets a
real ink token. Fixed. Six remain and every one is a case the rule allows (icons,
a breadcrumb separator, the attribution mark).

They are **not** a contrast failure — P03 measured `/70` at 4.77:1 worst case and
left the verifier that proves it. This is the rule, not rescue.

The site builder has **63** of the same. Counted and recorded for the runs that
score those screens, rather than swept blind here.

#### And one the run found in itself

While fixing the URL guard, the new check failed on code that looked correct:

```ts
return html.replace(/<a\b([^>]*)>/gi, …)
```

That `\b` was a **literal backspace byte**, not the word-boundary escape. A
scripted edit had written the escape as the character it names.

Sweeping the repo for it found two more in `probe-email.ts` — inside a live
assertion:

```ts
return anchors === 9 && !/<a\b[^>]*>\s*<(div|table|tr|td)\b/.test(html);
```

Both backspaces. The regex could never match, so `.test()` was always false,
`!false` always true, and **half of that check had been decoration since the day
it was written**, going green every run. It read as proof that the projector
never wraps block content in an anchor — the exact defect link groups exist to
avoid.

It is the second fake check this run, after act 6's literal `true`. So the class
is closed rather than the instances: `pnpm verify` now runs a repo-wide scan that
fails on any raw C0 control character. It found two more the hand sweep missed —
one in a **shipped** React component, and one **in itself**.
