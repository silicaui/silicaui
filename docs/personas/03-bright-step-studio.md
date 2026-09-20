# P03 — Marlene Okonkwo-Bright · Bright Step Studio

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done — 10 of 10 acts, every standing check worked. The deferred 360px / phone / dark pass ran as act 10 (2026-09-19)
**Run:** 2026-09-19
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
| Acts completed | **10 of 10** — act 10 is the deferred 360px / phone / dark pass |
| Issues filed | **35** — 27 this persona's own (040–062, 101–104). The other eight came from working other runs' recorded-not-fixed lists, and are theirs by rights: 105, 107 and 109 close P01's "not checked" lines; 106, 111 and 112 close P04's; 108 is P07's own lead turned into a number; 110 is what 109 was sitting on |
| Issues fixed and confirmed | **35**, each re-proved on the screen — or, for the build-time ones, in the build — it was found in |
| Issues blocked, and on what | **none.** [055](issues/055-the-inspectors-paging-buttons-are-dead-code-under-a-green-test.md) is `partly fixed` on purpose — the dead `PageButton` machinery in `chrome.tsx` is left for whoever is mid-refactor there, and the issue is the note saying so |
| Screens scored (in both themes at 360px) | **3** — Canvas 8/8, Layers 7/7, Inspector › Design 8/7. Three and not thirteen: three are what a person operated at phone width in both themes. The other ten were opened in acts 1–9 at 1280px in light, which RULE #6 does not accept as a reading. See the builder note in [rating.md](rating.md) |
| **Not checked** | **A real handset, and any browser but Chromium.** Act 10's numbers are Chromium at a phone viewport with `isMobile`, `hasTouch`, a 3× scale factor and real `tap()` gestures — much better than a narrow desktop window, and not a device. Also still not checked: the `-html`/`-behaviors` plugin guards left over from P01's [011](issues/011-forgot-the-plugin-line-and-nothing-said-so.md) / [012](issues/012-b-is-not-a-function.md), which were never driven to a real build overlay and are not this persona's surface |

### The numbers

| Record | Result |
| --- | --- |
| Her ninety-second guesses, and how many were right | **3 guesses, 2 right.** Canvas and right rail correct. The left rail she called "the list of my pages"; it read **"Lay"**, because she had already dragged it narrower than its own tabs ([040](issues/040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md)) |
| Steps to make the home page say something real | **3** — double-click, type, click away. This part was never the problem |
| Words on screen she did not understand, listed | **33**, all in one rail: `AvatarGroup`, `AppShellSidebar`, `ChatLayoutMessages`, `NavigationMenu`, `InputGroup`, `MockupBrowser`, `FieldsetLegend`, `BlockquoteCite` and 25 more ([041](issues/041-thirty-three-components-arrive-in-the-rail-as-machine-keys.md)). Plus one word that meant the opposite of what she wanted — **accent** ([045](issues/045-accent-means-the-opposite-of-what-she-came-to-change.md)) |
| Steps to edit the term dates the **second** time | **4**, same as the first — and that is the right answer. Four is the floor for changing text. It was **6** before [049](issues/049-after-a-reload-she-landed-on-an-empty-page-that-was-not-hers.md), because a reload dropped her on a page that was not hers and she had to find her way back |
| Could she get the deleted section back, and in how many steps | **Yes, in 1.** The document came back **byte-identical** — 1,258 bytes gone, 1,258 back, measured against `window.__lastChange`. What was missing was any way to know that before pressing it, which is [047](issues/047-nothing-told-her-what-undo-was-about-to-take-back.md) |
| Design-rule breaches found (especially eyebrows, which this build must have none of) | **Eyebrows: 0** — measured across all seven published pages and the builder chrome, not asserted. **Inline hex on a control: 0.** **RULE #3: 11**, every one of them in what the builder *handed* her rather than anything she chose — a faded lead paragraph on every page, a faded paragraph from the Insert panel's **Text** item, and her timetable shipped at 14px ([062](issues/062-the-builder-handed-her-faded-body-text-and-a-timetable-below-the-floor.md)). All fixed; the published site now scans **0 faded readable text**, and its worst contrast improved from 6.36:1 to **7.98:1** |
| Console errors and warnings during the run | **0.** Zero across the whole build, zero during act 9, and zero on all seven pages as a visitor with the builder shut down |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen — with this persona
the word on the button is very often the whole defect.

---

### Act 1 — First ninety seconds in the builder

**Driven in Brandon's own Chrome, not only Playwright** — and that mattered. The
harness disables persistence when `navigator.webdriver` is true, so the whole of
[040](issues/040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md) is
invisible to automation and exists only for a human.

The first thing she did was drag the left rail narrower, because it covered the page.

| | at the width it let her reach |
| --- | --- |
| rail | 164px |
| tab strip drawn / needed | **51 / 164** |
| scroll arrows | 2, at 32px — **52% of the row** |
| the word "Layers" read | **"Lay"** |
| tree rows cut off | **8 of 12** |

And it persisted, so every future session opened like that. She did it once.

Her guesses at the three rails, and what she read:

| rail | what she thought it was | what it said |
| --- | --- | --- |
| left | "the list of my pages" | **"Lay"** |
| middle | "my website" | correct |
| right | "settings for the thing I clicked" | correct |

Words on screen she did not understand, in the first ninety seconds:
**AvatarGroup, AppShellSidebar, ChatLayoutMessages, NavigationMenu, InputGroup,
MockupBrowser, FieldsetLegend, BlockquoteCite** — 33 of them, filed as
[041](issues/041-thirty-three-components-arrive-in-the-rail-as-machine-keys.md).

### Act 2 — Making the home page exist

**She typed straight onto the canvas and it worked.** Double-click, type, click away.

One reading was **withdrawn**: "typing on the canvas does nothing" was my probe
pressing `Escape`, which correctly cancels. `Enter` and blur both commit. Nothing
wrong with the product.

### Act 3 — Naming and finding her pages

Seven pages created. **`Marlene's story` keeps its apostrophe** in the page list, the
picker, the Navigator and the title.

Two suspected copy defects were **withdrawn** — "Inserts into the page." and
"No components match “timetable”." both render correctly; my text extraction was
joining only direct text children and dropping the `<span>` in the middle.

### Act 4 — The timetable

Eleven rows built, including
`Adult Beginners' Ballet (absolutely no experience required)` at 58 characters. The
reorder works from the Navigator **and** from the canvas.

The Navigator showed her three nested rows all called **"Table"** —
[042](issues/042-the-timetable-showed-three-rows-all-called-table.md). She clicked the
first one, selected the whole timetable, and undid it.

### Act 5 — Making it look like them

She went looking for the word **colour** and found it: the panel says **Colors**.

**She could barely read it.** Every section heading in that panel measured **2.89:1**
— "Colors", "Radius", "Effects", "Sizes", "Motion", "Type", "This site", "Output" —
and every colour swatch's name measured 3.92:1. 44 text runs under AA on one panel, 70
across the two builders, three of which ship into her published pages.
[043](issues/043-the-builders-own-labels-are-faded-below-the-contrast-floor.md).

Picking **grape** from the Themes library worked correctly, first try, and applied
across every page.

Then the trap. She wanted to change **the accent colour** to her purple, which in
everyday English means *the colour of my business*. There is a tile called `accent`.
She used it, and her purple ended up on **2.1% of the painted surfaces** while the
theme's own violet still held **3.9%**. The tooltip said "Edit accent".
[045](issues/045-accent-means-the-opposite-of-what-she-came-to-change.md).

Two more found on the way: the hex field she typed into had **no accessible name**
([046](issues/046-the-colour-pickers-hex-box-has-no-name.md)), and clicking
**Add page** then pressing **Enter** silently made **two** pages
([044](issues/044-add-page-then-enter-silently-makes-two-pages.md)).

**With all five fixed**, act 5 finishes as it should: she reads the tooltip
("accent — a third colour for small highlights, used sparingly"), puts `#7A3FA8` on
`primary`, and gets `oklch(0.491 0.165 307.2)` with `oklch(98% 0.01 307.2)` derived as
its ink. **201 text runs, 0 under AA, in both themes.** The smallest text her purple
touches is 12px at **6.38:1**. On a `soft` surface — the case the persona file names
as the one that will fail — it measures **8.76 / 9.14 in light, 5.55 / 5.67 in dark**.

**What she had to know to get there** is recorded in
[045](issues/045-accent-means-the-opposite-of-what-she-came-to-change.md).

#### Instruments withdrawn during act 5

Four, all of which had produced a confident wrong answer:

1. A contrast probe that parsed `oklab(0.21 -0.003 -0.011 / 0.45)` with a
   grab-the-numbers regex. It reported **"192 runs, 0 under AA"** about a panel full of
   45%-opacity text.
2. A second version that asked the canvas to resolve the colour — `fillStyle` silently
   refuses `oklab()`, so every real element came back null.
3. A third that kept the probe as a string: a template literal and a heredoc each ate a
   level of backslash and every regex stopped matching.
4. "The last `[data-theme]` element is the canvas." Opening the page picker portals a
   `[data-theme="studio"]` island to the end of the body, so the probe read **"her
   theme never reached any page"**. It had.

The working probe carries two hand-computed controls (`#777` on `#fff` = 4.48, `#000`
on `#fff` = 21.00) and is **proved by breaking it** — putting `/45` back on the live
panel turns it red naming 12 runs.

### Act 6 — The thing that goes wrong for her

She deleted the timetable and did not notice for two minutes.

**Undo is excellent.** One press of Ctrl+Z, and the document came back
**byte-identical** — 1,258 bytes gone, 1,258 bytes back, measured against
`window.__lastChange`, which is what a real host stores.

| | |
| --- | --- |
| steps to get it back | **1** |
| anything that told her the delete happened | **nothing** — no toast, no status line, no `aria-live` |
| what the Undo button said, two minutes later | **"Undo"** |

That last row is the finding
([047](issues/047-nothing-told-her-what-undo-was-about-to-take-back.md)). The data was
always safe; she had no way to know it. A toast would have been gone by the time she
looked, so the label had to go on the control itself, and now reads
**"Undo — remove an element"**.

**Three instruments were withdrawn before that number was trustworthy** — a truncated
`innerText` comparison that could only ever print "GOT IT BACK: YES", a tree click that
landed on a child row so I deleted a Row and nearly filed an undo bug that was not
there, and a document walker that found 0 text nodes and then reported "every text node
back: true" about an empty list. All three are pinned in the probe's header.

### Act 7 — The term dates, the thing she came for

Two separate jobs here: the dates themselves, and doing the edit twice.

**The dates.** She keeps them in a spreadsheet, and a spreadsheet exports
`2026-12-18`. Pasted into a date field, in a real browser:

| she pasted | the field read |
| --- | --- |
| `2026-12-18` | **10/12/2186** |
| `2026-10-26` | **10/10/2194** |
| `2028-02-29` (the leap day) | **12/02/2197** |
| `99/99/9999` | **06/07/10007** |

Nothing refused any of it and the console was clean. Filed as
[048](issues/048-a-pasted-term-date-became-the-year-2186.md) — a **blocker**, because
term dates are her whole site and the paste is how anybody moves a column of them.
Two causes compounded: digit groups mapped by the locale's display order (ISO is
year-first everywhere), and "did a `Date` construct" used as the validity test, which
it is not. A third, the UTC-midnight day-shift, only appeared when I broke the fix on
purpose: `2026-01-01` came back as **2025-12-31**.

**The machine's timezone, as the standing check requires:** `America/Los_Angeles`,
**UTC-8**, locale `en-US`. Marlene is in Leeds. That gap is why this was visible here
and would not have been on a UK laptop.

**The edit, twice.**

| | steps |
| --- | --- |
| edit 1 | **4** — double-click the cell, select the old date, type the new one, Enter |
| edit 2, after a reload | **4** |

Four is the floor for changing text, so the second edit is not *fewer* — and that is
the right answer rather than a defect, because the question act 7 is really asking is
whether she has to **re-learn or re-find** anything. She does not: she lands back on
her own page with the cell where she left it.

**She did before this run, though.** Reloading dropped her onto an empty **Home** with
nothing selected — her work was one page away and entirely safe, but the first thing on
screen was a blank canvas, which is what data loss looks like. That is
[049](issues/049-after-a-reload-she-landed-on-an-empty-page-that-was-not-hers.md), and
fixing it is what took the second edit from **6 steps to 4**.

**Two wrong readings, withdrawn.** I twice reported "after reload her whole site is
gone" — once because I used the URL that deliberately gates persistence off under
automation, and once because I reloaded before the 600ms autosave debounce had landed.
`e2e/persistence.spec.ts` was green the whole time, which is the thing that said the
probe was wrong rather than the product. A third: I typed nine values into a six-cell
table and then reported that the canvas did not contain a date I had never typed.

### Act 8 — Publishing, and the visitor

**The site exists.** It is at
[artifacts/p03-bright-step-studio/](artifacts/p03-bright-step-studio/), built by
driving the real builder — 28 gestures, all of which landed — then published, written
out, and opened with **the builder shut down entirely**:

```
slug                   status  h1                     table  real links  styled  under AA  errors
/                      200     Bright Step Studio       0        4        true      0        0
/classes-timetable     200     Classes & timetable     12        4        true      0        0
/fees                  200     Fees                     0        4        true      0        0
/our-teachers          200     Our teachers             0        4        true      0        0
/term-dates-2026-27    200     Term dates 2026/27       0        4        true      0        0
/marlenes-story        200     Marlene's story          0        4        true      0        0
/find-us               200     Find us                  0        4        true      0        0
```

The timetable is all eleven rows and four columns, including
`Adult Beginners' Ballet (absolutely no experience required)`. `Marlene's story` keeps
its apostrophe in the title, and its address is `/marlenes-story`. The phone number is
`href="tel:+441132468802"` — it dials. Worst text contrast anywhere on the site:
**6.36:1**.

Deferred by agreement during acts 1–9, and run on 2026-09-19 as act 10: the 360px / phone / dark-mode pass.

**Four defects on the way there.**

[050](issues/050-every-page-she-made-had-the-address-page-5.md) — every page she named
kept the address of the two-second-long label it was born with. Her term dates page was
`/page-5`. Now the address follows the name, unless she has chosen one herself, which
was driven and proved separately.

[051](issues/051-nothing-told-her-what-her-pages-were-called.md) — to point the nav at a
page she had to type its address from memory, and nothing on any screen named her pages
or their addresses. The field now offers them, by address, with her own name beside
each.

[052](issues/052-adding-a-column-to-her-timetable-broke-the-table.md) — her timetable
needs four columns and the table arrives with two. Adding one gave `[3,2,2,2,2]` — one
row wider than the rest, silently. A cell's peer group in a table is its column.

[054](issues/054-she-pressed-publish-and-the-screen-did-not-change.md) — she pressed
Publish and **nothing on the screen changed**, while the status line said "All changes
saved" the way it had said it all afternoon: as a literal string that checks nothing.

**Three of my own mistakes, pinned in the scripts.** Clicking a `<tr>` on the canvas
selects a `<td>`, so twenty presses of Ctrl+D built a 3-row table with 24 columns.
`retype("Heading", …)` matched the canvas's own selection pill — an overlay showing the
selected node's TYPE — instead of the heading. And the Pages switcher is **hidden while
the Insert tab is open**, which two runs died on with a wrong theory about inline
editing before I measured it.

**What is still demo content:** 28 links per page still point at `#` — the seed frame's
footer link farm and the header's Sign in / Get started. Replacing them is authoring,
not a defect. It is worth saying plainly though: a published site carrying 28 dead links
with nothing counting them is the kind of thing a "before you publish" check would
catch, and there is no such check.

### Standing check — a boundary that should hold

Lock the footer, then try to move, retype, restyle and delete it, from the Canvas
**and** from the Navigator.

| | delete | move | duplicate | restyle / retype |
| --- | --- | --- | --- | --- |
| Navigator | **refused** | **refused** | allowed, copy unlocked | allowed |
| Canvas | refused on the footer | refused on the footer | — | allowed |

That is exactly what `host-nodes-and-node-locking.md` §B.2 specifies: a lock gates
**structure on the locked node itself**, and style and content stay editable. **The two
renderers agree**, which is what this check exists to ask.

**One divergence found and fixed**
([053](issues/053-the-canvas-let-her-drag-a-node-it-would-then-refuse-to-move.md)): the
canvas left a locked node **draggable**. The engine refuses the move, so picking it up
produced a drop indicator, a release, and nothing — no explanation. The Navigator
already honoured the lock in its chrome. The comment directly above the offending line
makes the argument for the claimed case and never applies it to the locked one.

**A reading withdrawn.** The first run reported *"the Navigator deleted a locked
footer"*. Clicking `.sui-canvas footer` selects the innermost element under the pointer
— a `<ul>` inside it — so I had locked a list and deleted a footer that was never
locked. The probe now asserts the selected tag before it locks anything.

### Act 9 — Two hours after class, tired

*"Do one more real edit — fix a typo on the fees page — at the end, without re-reading
anything."*

Run the way she would live it, which is the only way this act means anything. The whole
site was built and published in one session, **the browser was closed**, and a second
run opened the same profile with nothing restored by hand. The typo is one she would
actually make at nine at night, and it is the kind that makes the phone ring: the class
price typed as **£7.05** instead of £7.50.

Thirteen actions, start to finish:

```
 1. Opens the builder
     → 7 pages still here; it opened on "Find us"
 2. Reads the status line
     → "Published — 7 pages live"
 3. Looks at the page
     → 489 characters of her own text
 4. Clicks the page name at the top
     → Home · Classes & timetable · Fees · Our teachers · Term dates 2026/27 · Marlene's story · Find us
 5. Clicks Fees
 6. Finds the wrong price
     → "Ballet and tap are £7.05 a class, paid by the term…"
 7. Double-clicks the sentence            → editable in place
 8. Double-clicks the number itself       → selected "7.05 "
 9. Types 7.50 over the highlight         → "…are £7.50a class…"
10. Notices the space vanished and types it back
11. The sentence now reads                → "…are £7.50 a class, paid by the term…"
12. Reads the status line again           → "Edited since you published"
13. Presses Publish                       → "Published — 7 pages live"
```

**Nothing had to be re-learned.** The page list is the same list in the same place, the
double-click-to-edit is the same gesture, Publish is the same button. She did not have
to find anything she had found before.

**Steps 2 and 12 only read like that because of a defect this act found.** On the first
run the status said **"Not published yet"** — about a site that was live on the
internet. The host was counting edits in memory, so closing the laptop wiped the fact
that it had ever published. That is
[056](issues/056-the-builder-forgot-it-had-published-her-site.md): the same slot that
[054](issues/054-she-pressed-publish-and-the-screen-did-not-change.md) had just
repaired, holding one sentence that was true only within a single sitting. It now
compares the document it last received against the one it last published, and both
survive the laptop closing.

**Step 10 is not a defect, and it was checked before that was said.** Double-clicking a
word in Chromium selects the word *and the space after it*, so typing over it eats the
space. The same gesture was run in a plain `contenteditable`, a `textarea` and an
`input` in the same browser:

```
#ce  selected "7.05 "  →  " are 7.50a class tod"
#ta  selected "7.05 "  →  " are 7.50a class tod"
#in  selected "7.05 "  →  " are 7.50a class tod"
```

Identical in all three. It is the browser, everywhere, and not something this product
does. Written down so nobody files it later.

**The live site now says £7.50.** Rebuilt and re-served from the act-9 publish, with the
builder shut down: 7 pages, all 200, 0 text runs under AA, 0 console errors, worst
contrast 6.36:1.

---

### Standing check — wrong moves

*"Delete the timetable section that the home page summary points at. Drag the hero into
itself. Paste the whole 11-row timetable into a single heading field. Close the tab
mid-edit with unsaved work and reopen it."*

All four done to a **copy of her real seven-page site**, so every one of them happens to
real content with real links pointing at it.

| | what happened | verdict |
| --- | --- | --- |
| delete the page her nav links to | page gone, prompt asked first, **nothing counted the link left pointing at nothing** | [057](issues/057-deleting-a-page-left-the-links-to-it-pointing-at-nothing.md) |
| drag the hero into itself | engine refused, document byte-identical, section still at top level | **holds** |
| paste 11 rows into one heading | stayed one `<h1>`, no crash, one undo restored "Fees" | **holds** |
| close the tab mid-sentence | **her sentence was gone** | [058](issues/058-the-sentence-she-was-typing-when-the-tab-closed-was-gone.md) |

**The hero into itself.** `move(section → its own descendant)` returned nothing, threw
nothing, and left the document the same length it started:

```
{"section":"section","into":"div","returned":undefined,"threw":null,
 "sectionStillAtTopLevel":true,"documentSizeChanged":false}
```

No cycle, no corruption, no error to confuse her. Refusing silently is the right answer
for a gesture that produces no drop indicator in the first place.

**The 11-row paste.** She ends up with a 505-character heading reading
`Pre-Primary Ballet⇥Monday⇥16:00–16:45⇥4–6Grade 1 Ballet…`. That is a silly thing to
have done and the builder lets her do it, which is correct — it stays **one heading
element**, the schema is not corrupted, no console errors, and one undo puts "Fees"
back. The newlines are dropped without a separator, which is why rows run together; a
space would be kinder, and it is not worth a change that would guess at what someone
meant by pasting a table into a title.

**The tab closing is the one that matters**, because it is the thing she is nervous
about. Everything came back except the sentence her hands were on — see 058 for the
full measurement, including the reading it took three attempts to get honest.

#### Two readings withdrawn here

**"The pasted heading is 497 characters on screen and 0 in the document."** That would
have been a blocker — a canvas showing text the document does not have. It was my
reader: node children are plain **strings**, not `{kind:"text"}` nodes, so the walk
returned 0 for the untouched "Fees" heading too. The control caught it. The document
holds the text and a visitor gets it, verified by publishing and reading the `<h1>` out
of the payload.

**The first pass measured nothing at all.** `window.__lastChange` is null until the
first edit; `activeRoot` is a **method**, not a field; and a synthetic `ClipboardEvent`
does not paste, so "the heading survived" was my probe doing nothing rather than the
product holding. The second pass reads `editor.site`, uses the real API, and pastes
through the real clipboard with a control that proves the clipboard holds 11 lines
before anything is claimed about them.

---

### Standing check — without a mouse

*"Creating a page, naming it, adding a heading and publishing — keyboard only, with the
ring visible the whole way."*

No `click()` anywhere in this pass — Tab, Shift+Tab, Enter, arrows and typing only.

| step | keys | result |
| --- | --- | --- |
| reach **Add page** | 14 × Tab | a ring on every real control on the way |
| make the page | Enter | focus lands **in the name field**, ringed |
| name it | type + Enter | `Term dates 2026/27` → `/term-dates-2026-27` |
| open **Insert** | ArrowRight on the tab strip, then Enter | correct manual-activation tabs |
| add a heading | 12 × Tab, Enter | headings 1 → 2 |
| publish | Shift+Tab to Publish, Enter | `Published — 2 pages live` |

The whole job is doable without a mouse, and that "focus lands in the name field" is
[044](issues/044-add-page-then-enter-silently-makes-two-pages.md) paying off twice as much for
someone who cannot point at it.

**Two things were wrong.**

**Focus fell on the floor after she named the page** —
[059](issues/059-naming-a-page-dropped-her-focus-on-the-floor.md). The name field
replaces the switcher, so committing unmounted the focused element and the browser
dropped focus on `document.body`. Tab then restarts from the top of the document and a
screen reader loses its place. Same on Escape, same from Rename, and the same in the
email builder's twin panel.

**Two tab stops showed nothing at all** —
[060](issues/060-a-tab-panel-you-can-focus-and-cannot-see.md). The tab panels carry
`tabindex="0"`, match `:focus-visible`, and had `outline: none`. She presses Tab and the
screen does not answer. That one is in **@wizeworks/silicaui**, not the builder —
reproduced on the docs site with no builder anywhere.

#### A reading withdrawn

**"One Tab press that lands on nothing"**, between the wordmark and the mode buttons. A
`focusin`/`focusout` trace found no such stop, and enumerating the focusable elements
showed the wordmark is the **last** one in the document — so that press leaves the page
for the browser's own chrome, which is what Tab is for at the end of a document. Not a
defect. The two real findings above survived the same scrutiny, which is why they are
filed.

---

### Standing check — isolation (RULE #7)

*Try once to see another customer's data.*

A builder has no accounts, so the question is what the local draft store is keyed on.
Read out of the live browser, not the source:

```
draft keys in IndexedDB:    ["silicaui-designer", "silicaui-designer:view"]
recovery banner:            "Restored your last session (26 min ago). Start fresh"
```

The key is a string and nothing else — **no site identity** — and a seven-page dance
studio was restored over the host's one-page seed with nothing checking they are the
same site. For Marlene that is exactly right and it is what she needs. For a host
serving two sites from one browser profile it means the second author opens holding the
first author's work, under a banner calling it "your last session".

**The builder cannot detect this**, and that is not a dodge: a `Site` carries no id to
compare against, and hashing the seed would break the feature, because a draft is
*supposed* to differ from the document it grew from. The knowledge only exists in the
host, so the contract now says so where a host reads it —
[061](issues/061-the-draft-store-is-keyed-on-nothing-but-a-constant.md).

What kept this at `minor` rather than worse is measured, not assumed: **the restore is
announced, dated and undoable.** Nothing is silent.

### Act 10 — The deferred pass: Marlene on her phone, and the widths in between

*The 360px / phone / dark pass, deferred by agreement during the original run and
run here. It is act 10 because it is a job, not a sweep: she is on the bus, she
wants to look at the term dates she typed, and she has her phone.*

**She could not.** Not "it was cramped" — the page was not on the screen. At 360px
the canvas was **64 pixels wide**, between two rails that each held their full
width, and nine toolbar controls including **Publish** were off the end of the
window with nothing scrolling and nothing saying so.

The first reading looked too bad to be only a phone problem, so the same reading
was taken at every width between a desktop and a phone. It was not a phone
problem:

```
 1280px  canvas 765px    chrome controls lost:  0
 1024px  canvas 509px    chrome controls lost:  1  Publish
  900px  canvas 385px    chrome controls lost:  2  Dark, Publish
  768px  canvas 253px    chrome controls lost:  3  Light, Dark, Publish
  600px  canvas  85px    chrome controls lost:  5  Tablet, Mobile, Light, Dark, Publish
  480px  canvas  64px    chrome controls lost:  6  Desktop, Tablet, Mobile, Light, Dark, Publish
  360px  canvas  64px    chrome controls lost:  9  Undo, Redo, …, Publish, Settings
```

**Publish leaves the screen at 1024px** — a browser window at half of a 1920
monitor — and it is the only way to publish. There is no command, no menu item
and no shortcut: one call site in the whole package, and it is that button.

Three issues, and a fourth found underneath them:

| | |
| --- | --- |
| [101](issues/101-the-toolbar-drops-publish-at-1024px-and-never-says-so.md) | the toolbar clips its own controls, Publish first |
| [102](issues/102-the-site-builder-advertises-a-shortcut-for-a-feature-only-the-other-builder-has.md) | the toolbar prints a `⌘ /` hint and nothing listens |
| [103](issues/103-below-600px-the-builder-is-two-rails-and-a-64px-sliver-of-the-page.md) | two rails with pixel floors squeeze a floorless canvas to nothing |
| [104](issues/104-the-panels-wrapper-documented-an-imperative-ref-it-never-forwarded.md) | `ResizablePanel` documented an imperative `ref` it never forwarded |

#### Two instruments that were wrong, and why they looked right

Worth the room, because each would have printed a clean bill of health.

**`document.scrollWidth > 360`** — always false. Nothing overflows, because an
ancestor clips. A control 695px past the right edge and a control that does not
exist are the same number to that check. The page was never wider than the phone;
the toolbar simply ended early.

**`el.scrollIntoView()` then re-measure** — always "reachable". A browser scrolls
an `overflow:hidden` box happily when SCRIPT asks; a person dragging it cannot.
The instrument had powers the user does not.

What replaced them walks each off-screen control's ancestors to the box clipping
it and reads that box's `overflow-x` — `auto`/`scroll` is swipeable, everything
else is lost — and the classifier is made to say both words before it is
believed:

```
CONTROL A  "Theme" must be ON SCREEN  -> ON SCREEN  ok
CONTROL B  injected must be CLIPPED   -> CLIPPED    ok
CONTROL C  injected must be SWIPEABLE -> SWIPEABLE  ok
```

confirmed with a real gesture: a wheel event of deltaX 400 over the toolbar moved
it **0px**.

**A third check of my own was vacuous and is recorded as such.** Asked whether the
toolbar's words were still painted after the fix, I counted `textContent` — which
reads straight through `display:none`. It reported 4 of 4 labels at 360px, where
the truth was 0 of 4, and it would have reported 4 of 4 if the labels had been
deleted outright. Replaced with a `getClientRects().length > 0` test, which then
double-counted, because the wrapper span carries the same text as the span inside
it. The number only became real on the third attempt.

#### Dark, and what it turned out to be

RULE #6 wants both themes. The builder chrome's theme is whatever the host passes
as `studioTheme`, and the harness passes nothing, so it gets `studio` — declared
light-only in the harness stylesheet. That is not the same as "the builder has no
dark mode", and the difference had to be measured rather than assumed:

```
as shipped   theme=studio  header bg=247,249,250  ink=21,25,30
data-theme=dark            header bg=10,14,18     ink=229,232,236
CONTROL back to studio     header bg=247,249,250  restored  ok

header background luminance  studio 0.98  ->  dark 0.05
```

**The chrome is fully theme-driven.** One attribute and every surface, border and
ink repaints correctly, with the canvas staying its own island — which is right,
because the document has its own theme. Nothing is painted outside the token
system. So the finding is not a missing capability; it is that **nothing ships or
demonstrates a dark studio theme**, so the dark path is never exercised by the
builder's own harness. Recorded, not filed as a defect against silicaui: a host
chooses its chrome theme, and that is the architecture working as designed.

#### What she can do now

The same job, the same phone, 390×844, touch, after the fixes:

```
1. opens the builder
   canvas  369px of 390px viewport
   Publish    reachable  66x32 at 101,90
   Layers     reachable  32x32 at 170,7
   Inspector  reachable  32x32 at 210,7
   Undo       reachable  32x32 at 250,7

2. taps Layers
   layers rail  240px   canvas 130px
   tree rows she can see: 12
   CONTROL tap again -> rail 1px  closed  ok

3. taps a heading, then the Inspector
   inspector rail 256px  reads: "Design Settings Heading <h1> Editing All sizes…"
   CONTROL it is showing the selection, not "No selection": ok
   panes wider than 1px: 2  ok (canvas + one rail)

4. publishes
   Publish reachable  66x32 at 101,90

page errors: 0
```

**The rails kept their pixels and stopped taking them from the page.** 240px and
256px are the floors [040](issues/040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md)
put there on purpose, and undoing them would re-break a real screen at a real
width. What changed is whether both rails are *shown* at a width that cannot hold
them.

#### What is still wrong at this width, and is a deduction rather than a fix

- **The toolbar is three rows on a phone** — 129px of an 844px screen is chrome
  before anything else. Wrapping is the backstop that makes "nothing is ever
  clipped" true at every width rather than true down to a width somebody tested;
  it is not elegant.
- **Every toolbar control is 32×32**, and that sentence originally read "below
  the 44px a thumb wants… 56 controls under 44px", which was wrong twice and is
  corrected here rather than quietly edited.
  **44px is WCAG 2.1 SC 2.5.5, which is AAA.** Every other run in this folder
  measures against **24×24** — WCAG 2.2 SC 2.5.8, AA — and quoting a different
  standard in one run than in the other eight makes the numbers incomparable.
  And **56** counted every control in the DOM, including the 22 sitting inside a
  rail that is closed at that width, which are not targets at all.
  Measured again at 390px, excluding the closed rail and one visually-hidden
  input: **16 controls on screen, 1 under the AA minimum** — the `silicaui`
  attribution mark, a real link at 52×16. Fixed (`py-1 -my-1`, inside the 28px
  status bar, so the bar does not move) and now 52×24. **Nothing in the builder
  chrome is under 24px.** The 16 that are under 44px are a comfort deduction,
  not a failure.
- **The mode switcher is four unlabelled icons below 896px.** A palette meaning
  "Theme" and a box meaning "Component" are not self-evident the way a sun and a
  moon are, which is why those four now carry a `hint` naming the CONSEQUENCE
  rather than repeating the word. On a touch screen there is no hover to show it.
- **A rail open at 360px leaves 130px of page.** Better than 64px, and still not a
  view you would design in. It is a look, not a workspace.

#### What this act does not claim

**A real phone was not used.** Every number here is Chromium at a phone viewport
with touch emulation and a 3× scale factor — `isMobile`, `hasTouch`, and real
`tap()` gestures rather than clicks. That is much better than a narrow desktop
window and it is not a handset. **Not checked: a real device, and any browser but
Chromium.**

**The harness's 24px inset was zeroed** for every reading, by an init script that
runs before React mounts. Without it the builder would have had 312px of a 360px
viewport and every number would have been about the wrong width. The flattening
is generous to the builder, not to the finding.

### After act 10 — three things other runs had counted and left

Act 10 was the last act. These are not acts; they are items sitting in the ledger
with a number against them, cleared once this persona's run was finally complete.
Each is recorded against the issue that owns it, not re-filed here.

**Sixty-nine faded labels in the site builder's own chrome**
([077](issues/077-the-builders-own-labels-were-faded-text.md)). P04 found this
class, fixed eleven in the email builder, and counted 63 in the site builder
which it left because "those screens belong to P01 and P03" — the *a fix leaves
its neighbour behind* shape, written down honestly and then true for two months.
By now it was 69. **57 took the real ink; 12 are the exemptions the rule names**
— eight icons, three icon-only controls, and the `silicaui` mark that restores on
hover. Confirmed by reading what is painted rather than what was typed: every
text ink in both builders' chrome is at full alpha in both themes.

**P01's two unchecked claims on the landing page** — `"CSP-clean — verified by a
probe on every build"` and `"a probe fails the build if one of them goes
missing"`. Both are claims the product makes about its own engineering, which is
the shape most worth doubting, because a probe that prints a failure and exits 0
goes green forever while the copy still says it guards you. Neither was read;
each was **broken on purpose** — `badge.js`'s `-xs` step deleted, and the inline
style put back on `Embed`'s iframe. Both probes exit **1**, `pnpm verify` exits
**1**, and `ci.yml:85` runs `pnpm verify`. **Both claims are true**, and now
measured rather than assumed.

**The plugin guards P01 could not drive to a build**
([105](issues/105-the-wrong-plugin-guards-only-fired-on-the-one-line-nobody-writes.md)).
This is the one that was actually broken, and it is the best argument in this
whole run for writing "not checked" instead of "fixed". The guards from
[011](issues/011-forgot-the-plugin-line-and-nothing-said-so.md) /
[012](issues/012-b-is-not-a-function.md) were present in every built output and
reported as shipped. Driven through a real Vite + Tailwind build they **never
fired**: Tailwind only invokes a plugin given an options block if its export
carries `__isOptionsFunction`, and the options block is what every doc, every
starter and *the guard's own suggested fix* write. A guard built to replace an
unhelpful message had, on the only path anybody walks, been replaced by one.
Fixed, re-proved through the overlay and against each published `dist`, and
guarded from here on by `scripts/verify-plugin-guards.mjs` — which was itself
shown able to fail before it was trusted.

**What "present in the built output" cannot tell you is whether anything reaches
it.** That sentence is the whole of the last item, and it is why the note P01
left was worth more than a green tick would have been.

#### Four more, found by asking what nobody had measured

**Images in the site Navigator** ([106](issues/106-every-image-in-the-site-navigator-was-one-row-saying-image.md)).
Eleven rows naming their content and a twelfth saying `Image` — the only one
whose alt text said what it was. The email Navigator had fixed this and quoted
the site file's own rule while doing it.

**The readable-ink probe was excusing 37 fades by pattern and naming none**
([107](issues/107-the-readable-ink-probe-excused-thirty-seven-fades-and-named-none-of-them.md)).
A 26-word regex ran in front of the reviewed list, so anything whose selector
contained "indicator", "close", "ring" or twenty-three other substrings joined a
count nobody could read. Its own doc comment promised the opposite. None of the
37 was a wrong call — the regex was making **unaccountable** ones, and the
difference only shows up on the thirty-eighth. Demonstrated by adding one: the
committed probe says `✅ … exit 0`, the fixed probe names it and exits 1.

**P07's contrast lead, turned into a number**
([108](issues/108-a-scrollbar-you-cannot-see-and-a-carousel-dot-under-three-to-one.md)).
The scroll-area thumb read **1.60:1 and was under 3:1 in all 120** theme/mode/
surface combinations; the carousel dot in 57 of 120. Not measured in a browser —
which is why P07's attempt was inconclusive — but composited from every shipped
theme's declared tokens. P07 declining to publish a figure it could not stand
behind is the only reason the lead survived to be measured.

**The docs' own prop table, on 116 pages, below the floor the docs teach**
([109](issues/109-the-docs-prop-table-sat-below-the-floor-the-docs-teach.md)),
found while closing P01's "the other 114 pages individually, and … 360px". The
sweep's headline is the good half: **0 of 121 pages scroll sideways at 360px.**

#### One measurement that is not a defect, and is not being treated as one

The same sweep found **49 component parts whose job is to hold words carrying a
default size under 16px** — `field-error` and `field-description` at 12px,
`field-label` at 14px, `accordion-content` at 15px, `countdown-label` and
`dock-label` at 11px, across 72 components, excluding size variants because
`-xs` at 11px is what `xs` *means*.

It is written down with its number and **not changed**. Raising it would move the
density of every form in every consumer app, and a fair reading of RULE #3 — *"the
**base** font floor for body text is 16px — the plugin anchors this by declaring
`100%`"* — is about the anchor of the scale and the body copy, not about every
label in component chrome. [062](issues/062-the-builder-handed-her-faded-body-text-and-a-timetable-below-the-floor.md)
ruled on a visitor's timetable and [109](issues/109-the-docs-prop-table-sat-below-the-floor-the-docs-teach.md)
followed that precedent exactly; neither ruled on this. It is a product decision,
so it goes to Brandon with the numbers rather than being decided by whoever
happened to run the probe.

#### Three features, on Brandon's instruction — and one that was already built

Asked whether the ledger's three remaining feature-sized items counted as
"everything", Brandon said build all three. Two needed building. The third did
not, and finding that out was the useful part.

**Site Find** ([111](issues/111-the-site-builder-had-no-find-and-a-site-hides-text-in-three-places.md)).
[073](issues/073-twelve-places-and-no-way-to-find-any-of-them.md) built it for
the email builder and closed with *"The site builder has no Find either"*. A site
turned out to be worse than an email in one way: it has **three** hiding places
rather than one — the shared frame (a different tree), a saved component (behind
a mode switch), and the address behind a link. Replace crosses all three in one
undo step. A page's slug is listed and never rewritten, because it is a route.

**The email subject** ([112](issues/112-nothing-on-screen-mentioned-that-an-email-had-a-subject.md)).
A read-out above the canvas rather than a second field — the toolbar already
carried a written ruling against a second copy, and two editors on one value
would have drifted, because the field seeds its state at mount and never
re-syncs. One click, and it moves the Inspector's TAB as well as the selection,
because landing on Design would have been most of the original problem again.

**Previewing as a different subscriber was already done.** P04 recorded *"there
is still no way to preview as a different subscriber"* in act 4 and **built it in
act 6** — `previewAudiences()`, a host-supplied list of sample recipients each
carrying the scope that IS that person. The note was never struck, so it read as
outstanding for two months. The contract is in `host.ts`, the picker in
`EmailPreview.tsx`, the harness offers three samples including *"Someone with no
name and no shop on file"*, and a spec holds it: **9 passed.** Struck now.

That is the second dangling note this pass has closed — the other was P07's chart
collision, carried to act 9 and resolved there without the carry being crossed
off. Both were *recorded honestly and then fixed*, which is the good failure
mode; but a ledger that says "not fixed" about something that is costs somebody
a day finding out.

#### What the features cost, which is not nothing

Adding a third tab to the left rail pushed its strip past its own width, so it
**paged at every width** — hiding Find, the tab whose whole purpose is being
visible without being looked for. The email builder had been doing exactly this
since its own Find shipped, unnoticed. The rail is 288px now in both, which is
[040](issues/040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md)'s
arithmetic re-run on contents that grew: 236px of tabs, 24px of actions, 12px of
padding.

Three e2e specs had to change, and each is worth separating from "the tests
broke":

- one asserted the word "Subject" appears **nowhere** with nothing selected. It
  appears now, deliberately. Its real subject was the RAIL, so it is scoped to
  the rail — narrowing an assertion to what it was about is not relaxing it.
- one squeezed a palette row to the constants **180** and **110**, which were the
  right numbers for 14px type. After the re-base the row is exactly full at its
  natural width, so those constants asserted a rule the component still keeps.
  Rewritten against the rule itself — the name reaches a floor and stops giving
  while the category goes on collapsing — which no type change can invalidate.
- one asked the whole page for "the paging buttons" and matched two strips once
  the left rail could page. Scoped to the Inspector, which is what it tests.
