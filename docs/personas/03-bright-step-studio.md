# P03 — Marlene Okonkwo-Bright · Bright Step Studio

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
**Customer:** **business user** — she is not a developer and never will be
**Surface:** the site builder · page mode, layout mode, theme mode, component mode
**Role in the roster:** the builder judged by the person it was reworded for

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P03-bright-step-studio/` (the exported site) |
| Driven at | `http://localhost:5178/` — the builder harness |
| Theme | one of the 20 shipped themes, **picked by her from the Theme library**, not set in code |
| Started from | an empty document — no starter, no template, nothing pre-placed |

## The person

**Marlene Okonkwo-Bright, 58, she/her.** Ran a dance studio for 22 years. She uses a
laptop, email, a spreadsheet for the register, and Instagram. She has never seen a
developer tool and does not know what a "node" is, a "container" is, or what "parent"
means when it is not a person.

**Technical level.** Low, and unembarrassed about it. **This is the persona where a
jargon word is a blocker, not a nit.** If a rail is labelled with a word only we use,
that is a finding, and memory note `navigator-business-user-naming` says that is a
deliberate design commitment — so a regression against it is a `major`, not a `copy`.

**What she is nervous about.** That she will break the site and not know she has
broken it. She has lost work in software before and it took her a week to trust it
again.

**What made her look today.** Her old site host doubled the price. Her niece said
"the new booking thing has a website bit built in — just do it yourself."

## The business

**Bright Step Studio** — a dance studio in Leeds. Ballet, tap, and an adult beginners'
class on Thursdays.

- 140 students across 11 weekly classes
- Two teachers plus Marlene
- **Inconvenient for the software:** term dates matter more than anything. Half her
  site is dates that change every term, and if one is wrong the phone rings all
  evening. She edits in the two hours between the last class and going home.

## Why she is here today

1. "I want the timetable on the front page, not buried."
2. "I want it to look like us — the purple, not whatever it comes with."
3. "I want to change the half-term dates myself without asking anyone."

## The data

**This is the test data. Type it as written** (RULE #2).

### Pages — at least 7, so the page list scrolls

`Home` · `Classes & timetable` · `Fees` · `Our teachers` · `Term dates 2026/27` ·
`Marlene's story` · `Find us`

**`Marlene's story`** carries the apostrophe. It has to survive being typed, saved,
shown in the page list, shown in the Navigator, put in a nav link, and exported.

### The timetable — at least 11 rows

| Class | Day | Time | Ages |
| --- | --- | --- | --- |
| Pre-Primary Ballet | Monday | 16:00–16:45 | 4–6 |
| Grade 3 Tap | Monday | 17:00–18:00 | 8–11 |
| Adult Beginners' Ballet (absolutely no experience required) | Thursday | 19:30–20:30 | 18+ |
| Grade 6 Ballet & Repertoire Intensive | Saturday | 09:00–11:00 | 13–16 |

Seven more. What it deliberately carries:

- **`Adult Beginners' Ballet (absolutely no experience required)`** — 58 characters
  with an apostrophe in it, in a table cell and in a heading
- **11 rows** — long enough that the Navigator tree gets deep and has to stay readable

### The paragraph that wraps

> Bright Step has been on Kirkstall Road since 2004, and a good number of the parents
> waiting in the corridor on a Saturday morning were once the children in the Monday
> four o'clock class themselves.

At 360px that is five lines, under a heading, on the home page.

### Contact

| Field | Value |
| --- | --- |
| Phone | `+44 113 246 8802` |
| Email | `hello@brightstepstudio.co.uk` |
| Address | Unit 4, Kirkstall Road, Leeds LS3 1HS |

### Term dates — the boundary data

| Term | Starts | Ends |
| --- | --- | --- |
| Autumn 2026 | Monday 7 September 2026 | Friday 18 December 2026 |
| Half term | Monday 26 October 2026 | Friday 30 October 2026 |
| Spring 2027 | Tuesday 5 January 2027 | Thursday 1 April 2027 |

---

## The build

| Item | What it must have |
| --- | --- |
| Home page | a hero with the wrapping paragraph, the timetable summary, and a way to get in touch — **no eyebrow above any heading** |
| Classes & timetable | all 11 rows, readable on a phone |
| Fees | a price list with real numbers |
| Our teachers | three people with photos and a sentence each |
| Term dates 2026/27 | the table above, the thing she will come back to edit |
| Marlene's story | the apostrophe intact, everywhere it appears |
| Find us | address, phone, hours, and a map or an embed |
| Site nav | every page reachable, and the current page obvious |
| Theme | **a theme she chose herself from the library**, not the default |

**Working end to end:** the exported site opens with no builder running, every page is
reachable from the nav, the phone number dials on a phone, and the whole thing is
readable at 360px in both light and dark.

**The look.** A neighbourhood dance studio: warm, photographic, a strong single accent
colour. It must not look like a component gallery.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — First ninety seconds in the builder

Open the harness cold with an empty document. Do **nothing but look** for ninety
seconds, then write down: what does she think each of the three rails is for, and what
does she think she is supposed to click first?

**Done when:** her guess is written down for every rail and every toolbar control, and
each wrong guess is a finding about the label, not about her.

### Act 2 — Making the home page exist

Put a hero on the page and type the real heading and the five-line paragraph into it.
She will try to type directly on the thing she can see.

**Done when:** there is real copy on the canvas and it is recorded whether she got
there by typing on the canvas, by finding the Inspector, or by asking someone.

### Act 3 — Naming and finding her pages

Create all seven pages, including `Marlene's story`. Then find the fees page again
three minutes later without help.

**Done when:** all seven exist, the apostrophe is intact in the page list, the
Navigator and the nav link, and the time to find the fees page again is written down.

### Act 4 — The timetable

Build the 11-row timetable. Half way through she realises two classes are in the wrong
order and moves them.

**Done when:** all 11 rows are on the page, the 58-character class name holds at
360px, and the reorder worked — from the Navigator **and** from the canvas, because a
rule enforced in one renderer and not its sibling has shipped before.

### Act 5 — Making it look like them

Open the Theme library and pick a theme. Then change the accent colour to the studio's
purple. She will look for the word "colour", not "token".

**Done when:** her theme is applied across every page, and it is recorded what she had
to know to get there.

### Act 6 — The thing that goes wrong for her

She deletes the whole timetable section by accident and does not notice for two
minutes. Then she tries to get it back.

**Done when:** she has it back, or she does not — and either way it is written down
exactly how many steps it took and whether anything told her what she had just undone.

### Act 7 — The term dates, the thing she came for

Edit the half-term dates, the job she will do every term for the next ten years.
Publish. Then come back and do it again a second time, the way it will actually
happen.

**Done when:** the second edit takes fewer steps than the first, or the reason it does
not is an issue.

### Act 8 — Publishing, and the visitor

Export or publish the site. Close the builder completely. Open the result as a
visitor, on a phone, in dark.

**Done when:** every page loads with no builder running, the nav works, the phone
number dials, and nothing is unreadable.

### Act 9 — Two hours after class, tired

Do one more real edit — fix a typo on the fees page — at the end, without re-reading
anything. This is the state she will actually be in every time she uses it.

**Done when:** the edit is made and published, and any step she had to re-learn is an
issue.

---

## What only this persona proves

**The site builder as a non-technical person:** can she find her page, name a section,
and publish, without ever being told what a node is.

---

## Standing checks

**Wrong moves.** Delete the timetable section that the home page summary points at.
Drag the hero into itself. Paste the whole 11-row timetable into a single heading
field. Close the tab mid-edit with unsaved work and reopen it.

**Reload and deep link.** F5 with the timetable selected and the Inspector open — is
her selection still there? Then copy the address bar and open it in a new window:
does it land on the same page she was editing, or does the builder have no address for
where she was?

**Dates.** The term-date table, entered as written: a term ending `Friday 18 December
2026` and a half term of exactly one week. Then a date at `23:59` and one on a leap
day. **Record the machine's timezone.**

**Contrast and token math at the edges.** Her chosen purple as the accent, in dark, on
the smallest text it touches — measured off the computed style, not the swatch. Then
the same accent on a `soft` surface, which is where it will actually fail.

**The other side.** Act 8 — the visitor on a phone with the builder shut.

**Without a mouse.** Creating a page, naming it, adding a heading and publishing —
keyboard only, with the ring visible the whole way.

**A boundary that should hold.** Lock the site's footer, then try to move, retype,
restyle and delete it — from the Canvas **and** from the Navigator. Both tiers of
`locked`, both renderers.

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
| Her ninety-second guesses, and how many were right | |
| Steps to make the home page say something real | |
| Words on screen she did not understand, listed | |
| Steps to edit the term dates the **second** time | |
| Could she get the deleted section back, and in how many steps | |
| Design-rule breaches found (especially eyebrows, which this build must have none of) | |
| Console errors and warnings during the run | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen — with this persona
the word on the button is very often the whole defect.
