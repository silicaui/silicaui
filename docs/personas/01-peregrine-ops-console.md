# P01 — Dilnoza Karimova · Peregrine Freight

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done
**Run:** started 2026-09-18

> ## ▶ Resume here
>
> ## ✅ ALL TEN ACTS ARE DONE. This persona is complete.
>
> **Issues 001–026 are filed. ALL TWENTY-SIX are fixed and confirmed. None open.**
> `pnpm verify` was exit 0 at the end of act 10, and act 10 found no twenty-seventh.
>
> **The one thing still outstanding is a re-pin, not a defect.** The artifact runs a COPY of
> the workspace build via `node sync-silica.mjs`. Once the changeset ships, re-pin it to the
> published `@wizeworks/silicaui` and delete that script.
>
> **Two corrections made during the run, both mine, both left in place struck through rather
> than deleted:** the `.select-menu-*` "class that ships and renders nothing" never existed
> (I glued a probe's SUFFIX output to a module FILENAME — issue 021, act 7 log), and issue
> 019's "re-proved on the console" claim was made against a stale copy of the package.
>
> **Act 10's keyboard claim is narrower than the script asked**, and says so: the harness's
> Enter stopped driving implicit form submission mid-act, which a bare-HTML-form control
> proved was the tool rather than the product. **Act 8 holds the real keyboard proof.**
>
> **THE CONSOLE APP RUNS A COPY, AND THE COPY GOES STALE.** It installs
> `"@wizeworks/silicaui": "^0.55.0"` with a plain `npm install`, so `node_modules` holds a
> real installed copy rather than a workspace symlink — which is correct for the persona,
> who installs the published package like any customer. A change in `packages/silicaui`
> therefore does NOT reach it, and `rm -rf .next` does not help because the stale code is
> upstream of the build.
>
> Run **`node sync-silica.mjs`** in the artifact, THEN clear `.next`, THEN restart. The
> script prints whether the ink split actually landed so the step cannot be silent.
>
> This was half-known — the block used to say the copy existed. It did not say the copy
> goes stale, and that cost one wrong claim in issue 019, struck in act 8. **The tell: a
> computed style still reading the OLD value after a cold build looks exactly like a fix
> that does not work.** Re-pin to the published version once the changeset ships.
>
> **Stopping a dev server needs care.** `TaskStop` kills the pnpm/npx wrapper and leaves the
> `next dev` child holding the port: the next start fails with `EADDRINUSE` while the OLD
> build keeps answering 200, so a measurement can silently come from the previous code. Kill
> the listener by PID and assert the port is free before restarting.
>
> **Two things are deliberately NOT checked**, and neither is a defect: input resting
> borders in dark measure 1.15–2.34 against WCAG 1.4.11's 3:1, from a deliberate
> probe-guarded `fieldBorder()` — numbers recorded, left alone by acts 7 and 8 on purpose.
> The `-html`/`-behaviors` plugin guards from issue 012 have never been driven to a real
> build overlay — **P08**.
>
> **Settled in act 8:** Escape closes the dialog under a REAL key press, and focus returns
> to the trigger. The act-6 Drawer failure was a synthetic-`KeyboardEvent` artifact, as
> recorded. A 2.3ms focus gap remains at popup unmount — measured, under a sixth of a frame,
> unavoidable, not a defect.
>
> **Servers that may still be running** (this run owns them — start, restart and stop
> freely, and leave nothing running at the end):
>
> | What | Port | Start |
> | --- | --- | --- |
> | silicaui.com (the product under test) | 4011 | `pnpm site:dev` |
> | Dilnoza's own app (the artifact) | 4099 | `cd docs/personas/artifacts/p01-peregrine-ops-console && npx next dev --port 4099` |
>
> **Before trusting either**, re-read "Environment traps" in [CLAUDE.md](CLAUDE.md) —
> a stale `.next` served old CSS twice in act 2 and cost about twenty minutes.
>
> **A second agent is editing `packages/silicaui-react/src/**` in this same tree**
> (date-input, time-input, timestamp). Not this run's work. Stage by file; never
> `git add -A`.
>
> **Nothing is committed.** One changeset is pending:
> `.changeset/wild-cameras-repeat.md`.
**Customer:** developer
**Path:** `@wizeworks/silicaui-react` · Next.js 15 App Router
**Role in the roster:** the deep spine baseline

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/p01-peregrine-ops-console/` (lowercase — npm rejects capitals) |
| Framework | **Next.js 16.3.5**, App Router, TypeScript, React 19.2.8 |
| Shell | `AppShell` + `Sidebar` + `Navbar` + `ThemeController`; phone nav is a `Drawer`, because `AppShell` ships no media queries and `Sidebar` collapses in place rather than overlaying |
| Routes | console pages live in a `(console)` route group with the shell; `/sign-in` sits outside it so a signed-out screen shows no app nav |
| Data | `app/data/shipments.ts` (14 rows, money in cents) served over `GET /api/shipments` with a 550ms delay, so the loading state is a state the app enters |
| Theme wiring | `prefersdark: true`, and **no `data-theme` anywhere** — setting it would make the night shift's automatic dark unreachable |
| Theme | `quartz` (the shipped default), light + dark |
| Started from | `npx create-next-app@latest --typescript --app --tailwind` on 2026-09-18 |
| silicaui version | `@wizeworks/silicaui@0.55.0` + `@wizeworks/silicaui-react@0.55.0`, **installed from npm**, not linked |
| Dev server | port **4099** (`npx next dev --port 4099`) |

Fill in the real versions and the real install command as soon as you have them. A run
nobody can revisit is a run nobody can confirm.

## The person

**Dilnoza Karimova, 31, she/her.** Senior front-end developer, seven years in, the only
front-end person at a six-person freight-forwarding startup in Tashkent. She has
shipped three production apps on Tailwind and has strong opinions about class soup.
She has used daisyUI and liked it until she needed a second brand.

**Technical level.** High. She reads a changelog before she upgrades. A jargon word is
not a blocker for her — but a jargon word that turns out to mean something *different*
from what it means everywhere else is, and she will say so.

**What she is nervous about.** She is committing her company to a design system that
is on version 0.x, by one maintainer, and she will be the person who has to explain it
if it stalls. She is reading the docs for signs that somebody thought this through.

**What made her look today.** A colleague sent her the silicaui.com link with "this is
daisyUI but the theming actually works". She has one afternoon to find out whether
that is true.

## The business

**Peregrine Freight** — a freight forwarder moving 40–60 containers a month between
Tashkent, Riga and Rotterdam. The build is their **internal ops console**: the screen
the two operations staff live in all day.

- 6 staff, 2 of whom use the console for six hours a day on a 13" laptop
- 40–60 shipments live at any time, each with 4–11 status events
- **Inconvenient for the software:** the two operators work a night shift and run the
  console in dark mode from 22:00. Dark is not a preference here, it is the primary
  theme — and half of what they read is small text on a coloured status chip.

## Why she is here today

1. "Can I theme this properly, or is it three themes and a wall?"
2. "How much do I have to install to get one button on the screen?"
3. "If I put this in front of Sardor at midnight, can he read it?"

## Setup answers

| Question | Answer |
| --- | --- |
| Which path | React (`@wizeworks/silicaui-react`) |
| Which framework | Next.js 15 App Router — **record the exact version the docs say to use, and whether they say** |
| Which theme | start on the shipped default; **record what it is called on screen**, not what the code calls it |
| Install command | **record the exact command the getting-started page gives**, and run that one, unchanged |

## The data

**This is the test data. Type it as written** (RULE #2).

### Shipments — at least 14 rows, so the table pages and sorts

| Ref | Consignee | Route | Status | Value |
| --- | --- | --- | --- | --- |
| PFR-2026-0417 | Oltin Vodiy Tekstil MChJ | Tashkent → Rotterdam | In transit | $48,210.00 |
| PFR-2026-0418 | Baltijas Koks SIA | Riga → Tashkent | Customs hold | $7,940.50 |
| PFR-2026-0419 | Müller & Söhne Spedition GmbH | Rotterdam → Riga | Delivered | $112,600.00 |
| PFR-2026-0420 | Samarqand Qurilish Materiallari Ishlab Chiqarish Korxonasi | Tashkent → Riga | Awaiting pickup | $2,015.75 |
| PFR-2026-0421 | Northbound Cold Chain Ltd | Riga → Rotterdam | In transit | $63,300.00 |

Nine more like them, with the same shape. Note what the data deliberately carries:

- **`Müller & Söhne`** — an umlaut and an ampersand, in a cell and in a heading
- **`Samarqand Qurilish Materiallari Ishlab Chiqarish Korxonasi`** — 58 characters, so
  it must wrap or truncate somewhere, and both are answers she has to live with
- **`$7,940.50`** and **`$2,015.75`** — cents, and a column that has to align
- **14 rows** against whatever the table's page size is, so paging is real

### The one long heading

The console's overview section is headed:

> **Live shipments awaiting customs clearance or consignee confirmation**

68 characters. It has to hold at 360px without a horizontal scrollbar and without
becoming three words on five lines.

### Status chips — this is the contrast test

| Status | Intended tone |
| --- | --- |
| In transit | `info` |
| Customs hold | `warning` |
| Delivered | `success` |
| Awaiting pickup | `neutral` |
| Cancelled | `error` |

Every one of these gets read at 22:00 in dark mode, at the smallest size a chip uses.

---

## The build

**This list is the definition of done** (RULE #8). Every item, built and working,
before the run is `done`.

| Item | What it must have |
| --- | --- |
| Sign-in screen | a real form — email, password, a remember toggle, an error state that has actually been triggered, and a submit that is reachable by keyboard |
| Shipments list | the 14 rows, sortable, with the status chips, aligned money, and a working empty state and loading state |
| Shipment detail | the long consignee name, a status timeline, and at least one thing that is genuinely absent and says so rather than showing a dash |
| "New shipment" dialog | opens, traps focus, closes on Escape, returns focus to the button that opened it |
| App shell | nav, a theme toggle that actually flips every screen, and a visible focus ring throughout |

**Working end to end:** a stranger can open the built app, sign in with the seeded
credentials, find `PFR-2026-0420`, open it, and read its status — at 360px, in dark,
without a mouse.

**The look.** A night-shift operations console: dense, calm, high-contrast, the colour
doing real work on status and nowhere else. It should look nothing like a marketing
page.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system
(silicaui + Tailwind utilities only, no hex on a control, no eyebrow, no `soft` ink on
readable text).

---

## The run

### Act 1 — The promise on the front page

Land on silicaui.com `/` cold, at 360px first and then on the laptop. Read it the way
somebody deciding whether to spend an afternoon reads it. Write down **every number
and every claim it makes** — component counts, "no tailwind.config", anything with a
figure in it. Check the counts against what is actually there. There is a known
candidate: `/about`, the README and the code disagree.

**Done when:** every claim on `/` and `/about` is written down with a ✓ or an ✗ beside
it, and any ✗ is an issue with `Severity: major` (a false sentence is not a copy nit).

### Act 2 — The docs index, as a stranger

Open `/docs`. Without using search, find: a button, a data table, a dialog, and
something to show a status. Time it. Then try the search or command palette and see
whether it would have been faster.

**Done when:** all four are found or recorded as **not found by me** (RULE #4), with
the words she typed that did not work.

### Act 3 — Getting started, followed literally

Open `/docs/getting-started` and follow it **exactly as written, adding nothing**. If a
step assumes a file exists, and it does not, that is the finding — do not create it and
carry on. Run it against a `create-next-app` made five minutes ago.

**Done when:** a Silica UI button renders in her own Next.js app, in both themes, and
the exact number of minutes from landing on `/` is written down.

### Act 4 — The wrong import, on purpose

Now break it the way a tired person breaks it: put `@plugin "@wizeworks/silicaui"` in
the wrong file, or import the CSS in the wrong place. Reload.

**Done when:** it is written down what she sees — and whether *anything at all* tells
her what is wrong. A CSS-first plugin that is wired wrongly renders an unstyled page
with no error, and how that failure presents is one of the most valuable findings in
the whole roster.

### Act 5 — The console shell

Build the app shell: nav, theme toggle, the long heading. Flip to dark and back on
every screen as you go, not at the end.

**Done when:** the 68-character heading holds at 360px and in both themes, and the
theme toggle flips every surface — including anything she rendered inside a portal.

### Act 6 — The shipments table

Build the list from the 14 rows: sorting, alignment, the status chips, the empty state
and the loading state. She will look for the empty state by clearing the filter to
something that matches nothing.

**Done when:** all three states have been seen on screen, `Müller & Söhne` renders
correctly in the cell and in a heading, and the 58-character consignee either wraps or
truncates in a way she would accept.

### Act 7 — Midnight contrast

The real test. In dark, at the smallest size each chip is used, measure the contrast of
every status chip's ink against its own surface — read it off the **computed style**,
not the swatch. Then do it again inside a `data-theme` island.

**Done when:** every chip has a measured number written down, and any that a
night-shift operator would squint at is an issue.

### Act 8 — The dialog, without a mouse

Build the "New shipment" dialog. Then close the trackpad and do the whole job — open
it, fill three fields, submit, and get an error back — on the keyboard alone.

**Done when:** focus never disappears, Escape closes it, focus returns to the button
that opened it, and every step of the path had a visible ring.

### Act 9 — The thing that goes wrong for her

She discovers the component she wants for the status timeline is not in the docs — or
is there under a name she would never have guessed. She has to decide: compose it out
of what exists, or give up on it.

**Done when:** the decision is recorded along with how long she spent looking, and the
gap between what ships and what is findable is an issue if there is one.

### Act 10 — The other side

Build the app for production and open it cold, as a stranger, with no dev server
running. Sign in, find `PFR-2026-0420`, read its status — at 360px, in dark, keyboard
only.

**Done when:** a stranger can do that, or the specific step that stops them is an
issue.

---

## What only this persona proves

**The spine, deeply** — home → docs → getting-started → install → first themed
component in a real Next.js build, verified step by step, including what a wrong
`@plugin` import actually looks like to the person who made the mistake.

---

## Standing checks

**Wrong moves.** Paste all 5,000 characters of a customs declaration into the shipment
notes field. Double-click Submit on the new-shipment dialog and see whether two
shipments appear. Press Back straight after submitting, then submit again.

**Reload and deep link.** F5 on the shipment detail for `PFR-2026-0420` with the
dialog open. Then copy the address bar, open it in a new window, and check it lands on
the same shipment and not the list.

**Dates.** The status timeline gets an event at `23:59` on the last day of a month and
the next at `00:14` the following day. **Record the machine's timezone** when you write
down what the Timestamp component printed.

**Contrast and token math at the edges.** The five status chips, in dark, at chip size,
measured off the computed style. Then the same five inside a `data-theme="obsidian"`
island nested in the quartz page.

**The other side.** A stranger opening the production build cold — act 10.

**Without a mouse.** Act 8 — the new-shipment dialog, open to submitted, keyboard only.

**A boundary that should hold.** Not a builder run, so: nest `data-theme="obsidian"`
inside the quartz page and confirm the inner theme wins for **everything** inside it
and **nothing** outside it — including anything portalled to `document.body`, which is
the case that breaks.

---

## Verification

Filled in at the end, honestly, **including what was skipped** (RULE #4).

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
| Minutes from silicaui.com `/` to first component on screen | |
| What the unstyled-page failure looks like, and what warns her | |
| Claims on `/` and `/about` checked, and how many were false | |
| Components she went looking for and could not find in the docs | |
| Design-rule breaches found (hex on a control · eyebrow · `soft` ink) | |
| Console errors and warnings during the run | |
| Worst contrast ratio measured on a status chip, dark, at chip size | |

---

## Run log

Written act by act **as you go**, not reconstructed at the end. Each entry: what you
did, what you saw, what you decided. **Quote the exact words on screen** — the sentence
is often the defect.

### 2026-09-18 · Act 1 — The promise on the front page · **done**

Machine timezone for every timestamp in this run: **America/Denver (MDT, UTC−6)**.
Chrome's appearance is set to **dark**, which turned out to matter (#002).

Started the site with `pnpm site:dev` (port 4011, Next 15.5.20). Landed on `/` cold.

**Every claim on `/` with a number in it, checked:**

| Claim as printed | Verdict |
| --- | --- |
| "**113** Documented components" | ✗ FALSE — 116. Issue **#001**, fixed |
| "**34** Vanilla behaviors" | ✗ FALSE — 35 registered handlers. #001, fixed |
| "**13** Published packages" | ✗ FALSE — 12; `silicaui-demos` is private. #001, fixed |
| "116 components across **13** packages" | ✗ the package half. #001, fixed |
| "**Thirteen** packages, but you install four" | ✗ #001, fixed — reworded so the number appears once |
| "Here are all 116" + a list of 116 links | ✓ |
| "MIT · Licensed, open source" | ✓ |
| "CSP-clean — verified by a probe on every build" | **not checked** — P08's surface |
| "a probe fails the build if one of them goes missing" (the five size steps) | **not checked** |

The band said **113** and the very next section said **116**, twelve lines apart in the
same file, with a comment above the first one reading *"Counts. Real, and checked
against the repo rather than remembered."* Nothing checked them. Dilnoza is here
looking for signs the project was thought through; three wrong numbers in one band is
a loud answer in the wrong direction.

Fixed by deriving all three (`apps/site/scripts/gen-counts.mjs` → `src/lib/counts.ts`),
wired before `next build` and into `pnpm verify` as `verify:counts`. Re-read both
screens: `/` and `/about` now both say 116 / 35 / 12 / MIT.

**Then she went looking for dark mode, which is the whole reason she is here.**
There is none. `prefers-color-scheme: dark` is being sent by her OS, `<html>` resolves
`data-theme="light"` on every page, and **zero** stylesheet rules on the page mention
`prefers-color-scheme`. The only "Dark" control on the site re-tints six demo tiles.
Issue **#002** — `Blocked on: decision`, four options written up, recommendation B.
This blocks a complete score on all 121 site screens, so they are being scored
light-only and flagged.

**At 360px:** both hero CTAs were clipped — `Get started` and the install command were
366px wide in a 312px column, with `overflow-hidden` hiding the damage behind only 3px
of page scroll. Issue **#004**, fixed, and the sibling check was wrong on the first
pass — it took three rounds to get every box in the `items-center` chain constrained.
Page overflow at 360px is now **0px**.

**The docs at 360px are worse.** The sidebar holds its full 256px — **71% of the
screen** — leaving ~90px, in which the body renders one word per line. Issue **#003**.
Tried the obvious fix on the screen before writing it: collapsing gives readable docs
and a **dead 72px rail of 116 blank rows**, because the items are text-only and have no
icons. So auto-collapse is not a fix on its own. Options rewritten, recommendation
changed to C′ (swap to `Drawer` at narrow widths). **Awaiting Brandon's pick** — A′ and
B′ change a published component and therefore sparx and piggles.

**Screens scored so far:** Home 7/7, Docs 4/3, Button doc 7/4. `/about` deliberately
**not scored** — the counts were verified on it but it was never reviewed at 360px, and
an unreviewed screen stays `—` (RULE #4).

**Not yet done in act 1:** nothing further — act 1 is complete apart from the two
claims marked "not checked" above, which belong to later personas.

### 2026-09-18 · Act 1, continued — Brandon said "fix it all"

Both blocked issues were unblocked and fixed. Dev server restarted **four** times
during this (twice because a plugin/CSS change needs a cold build, once because
`TaskStop` killed the pnpm wrapper and left `next dev` holding port 4011, once to clear
a stale `.next` that was serving old CSS). Recorded per the rulebook — none of the
fixes depended on a restart to appear correct, but the CSS ones genuinely did not
rebuild without one, which is worth knowing for every later run.

**#002 turned out to be three defects, and two were in the library, not the site.**

1. The plugin had no way to follow the OS at all. Added an opt-in
   `prefersdark` — pure CSS, no theme script, so no flash and nothing for a CSP to
   refuse. Default off, so sparx and piggles are untouched.
2. `<html data-theme="light">` made the rule permanently unmatchable.
3. **`ThemeController` stamped `data-theme` on mount even when nobody had chosen** —
   so adding the toggle would have silently re-broken the OS preference. That is the
   nastiest thing found today: no symptom except a light page on a dark machine.

The landing page needed **no dark redesign** — every section re-tinted through its
tokens. Contrast measured in dark: **8.10** on the primary panel, **15.75–16.31**
elsewhere, all passing AA.

**A wrong measurement was caught and discarded.** The first contrast pass said 1.02 and
"fails" for everything. That was the instrument — this site's computed colors come back
as `oklch()` and the function parsed them as RGB. Redone through a canvas conversion,
sanity-checked against white-on-black = 21.0 first. *The page was never broken; the
first numbers were.* Worth remembering for every later persona: check the instrument
before believing a bad number.

**#003 was fixed as C′** — the docs shell uses `Sidebar` on desktop and silicaui's own
`Drawer` on a phone, each component used as designed, nothing published changed. Tapped
through it end to end: menu → drawer → "Button" → landed on the Button page with the
drawer closed. **48px of horizontal overflow became 0.**

That fix broke a neighbouring sentence — the body still said "pick one from the
sidebar" when a phone has no sidebar. Reworded. A fix that makes an adjacent sentence
false is not finished.

**#005 filed and fixed along the way:** sidebar rows are 37px, under every published
tap-target minimum, with 116 of them stacked. Fixed with `@media (pointer: coarse)` so
desktop density does not move. **Not confirmed on a real touch device** — this machine
has no coarse pointer, so the one rule written is the one that could not be driven.
Handed to P09 explicitly rather than called done.

`pnpm verify` passes end to end (exit 0), including the HTML projection golden being
byte-identical — so the plugin change did not disturb the static output.

**Screens re-scored:** Home 5→8 / 7→8, Docs 4→7 / 3→7, Button doc 7→8 / 4→7.
`/about` still deliberately `—`.

### 2026-09-18 · Act 2 — Find four components without search · **done**

The hunt: a button, a data table, a dialog, something to show a status.

| Needed | Candidates in the list | Outcome |
| --- | --- | --- |
| a button | Button | found immediately |
| a data table | **Table**, **Data Table**, Metadata List, Sortable List | had to open both to choose |
| a dialog | **Dialog**, Alert Dialog | guessable |
| a status chip | **Badge**, **Status**, Label, Tag Input | could not choose from the list |

She found all four, so this was friction rather than a blocked job — but two of the
four came down to a coin-flip between two names, and **the docs could not settle
either**. Opening them showed why:

> **Data Table** — "A sortable, filterable data table powered by TanStack Table…" ✓
> **Table** — "Table — a CSS-first, fully-tokened Table component from SilicaUI…" ✗
> **Badge** — "A status badge … for marking state on a row, card, or record" ✓
> **Status** — "Status — a CSS-first, fully-tokened Status compo…" ✗

**In each pair, exactly one side was a template sentence with the name slotted in.** Not
bad luck: **101 of the 116 component pages** fell back to that template — only 15 were
hand-written. The same string was also the page's `<meta description>`, its OG
description and its `llms.txt` abstract, on a file whose own comment says per-page
metadata exists so none "reads as a thin duplicate to search or answer engines."

That is the **third** comment found today asserting a property nothing enforced, after
#001's "Counts. Real, and checked against the repo" and `home-sections.ts`'s "read off
this repo, not invented". Worth naming as a pattern in this codebase.

Issues **#006** (descriptions) and **#007** (116 items under one "Components" heading).

**Both had the same answer and the repo already had it.**
`packages/silicaui-mcp/src/data/components.json` — the catalog the MCP serves — carries a
real `description` **and** a `category` per component. 115 of 116 demos resolve to an
entry; 114 have prose. The site was hand-maintaining a 15-entry map beside it.

Built `gen-catalog.mjs` → `catalog.ts`, wired into the site build and into `pnpm verify`
as `verify:catalog`. Descriptions now fall back CURATED → catalog → template, and the
template serves **2** pages instead of 101. The nav renders **8 real groups** in reading
order; the command palette got the real category too, where it had been passing the
constant `"Components"` for every item — a grouped list with one group.

**Twelve components needed judgement no data had.** The catalog's `css` and `wrapper`
are package-origin markers, not places a person looks, so those are re-homed by hand in
the generator, and the generator **throws** if anything ends up ungrouped.

**Two extractor bugs, both caught by reading the output rather than trusting it, and
both would have shipped as plausible sentences:**

- Timestamp came out truncated mid-abbreviation — *"…formatting (Intl."* — because
  `Intl.RelativeTimeFormat` looks like a sentence end.
- Data Table came out as the two words *"table CSS."* — and that one was **my own first
  fix making it worse**: `String.match()` silently skips a prefix it cannot match, so it
  returned the second sentence and dropped the first.

Neither would have failed a build. This is the second time today that checking my own
instrument mattered more than checking the product — the first was the `oklch()`
contrast reading in act 1.

**Confirmed on screen:** Status now reads *"A small status dot, optionally pinging."*,
Badge reads its curated sentence, and the rail opens **ACTIONS → Button, Swap** then
**DATA INPUT → …**. The phone drawer carries all 8 groups and all 116 items at 360px in
dark with 0px overflow. `pnpm verify` exit 0.

**So Dilnoza's answer is `Badge`** for her five shipment states — `Status` is a presence
dot, which she could not have known before today.

**Not scored, and deliberately left `—`:** Table and Data Table. She opened them to read
their descriptions, but they were never reviewed at 360px or in both themes, and an
unreviewed screen is unrated (RULE #4).

### 2026-09-18 · Act 2, continued — Brandon: "the docs don't show how to implement anything"

Raised mid-run and it is the biggest finding of the day. Confirmed on
`/docs/components/button/` — the most important page in the docs — by reading the
rendered page:

| | Before |
| --- | --- |
| Code blocks | **0** |
| Prop tables | **0** |
| The word `import` | **absent** |
| Any prop written out (`color=`, `variant=`) | **absent** |
| Total page text | 1,851 characters |

A heading and eleven rows of rendered buttons. Not one character a person could type.
And it **teased** — a heading reading *"Polymorphism · render → a real `<a href>`"*
naming a prop, showing the result, never showing the prop. Same for `loading`, `block`,
`wide`, `shape`, `iconStart`.

This lands at the worst moment for this persona: act 2 just ended with her choosing
`Badge` over `Status`, and act 3 is building the thing. Knowing *which* component is
worth nothing if the page cannot tell her how to write it.

Issue **#008**, fixed. **For the third time today the repo already shipped the missing
material** — the MCP catalog carries `package` (115), `props[].members` with doc
comments (99) and `usageExample` (108). Each page now has **Install and import**,
**Props**, and **Source of the demo above**, server-rendered so the ~240KB of sources
never becomes a client bundle.

**Four rounds on the prop-doc extractor, and the last round is the real lesson.** Raw
docs are TSDoc: round 1 left backticks and a 600-character cell; round 2 cut at the
first code example and silently dropped `render`'s **CLIENT COMPONENTS ONLY** warning;
round 3 stripped tags and ate the `<color>` out of `btn-<color>`; round 4 filters whole
sentences by whether they are code, which is right.

Then round 4 *still* emitted Dialog's `nativeButton` ending at *"e.g."* — while the
abbreviation guard I had just written passed its own isolated test. Cause: **three
near-copies of the sentence-splitting loop in one file, and I fixed one of them.** That
is exactly the defect class this repo has a memory note about, written into the tool
that was finding it. Now one `splitSentences` + one `capToSentence`.

**Confirmed on screen:** Button went 0 → **3 code blocks**, 0 → **11 prop rows**, with
`npm i @wizeworks/silicaui-react` and `import { Button } from "@wizeworks/silicaui-react";`
on the page. Badge's `render` row carries the CLIENT COMPONENTS ONLY caveat in full.
Zero backticks anywhere. `pnpm verify` exit 0.

**Not checked:** the other 114 pages individually, and the new section at 360px. It is
one template over generated data, so the shape should hold — but that is an inference,
and two of the four extractor rounds above looked fine on whichever page I happened to
be testing. Handed to P09.

**Re-scored:** Button doc 7→8 / 4→**9**, Badge doc 8 / 8→**9**, Status doc 8 / 8→**9**.

### 2026-09-18 · Act 2, continued — Brandon: "we have three paths, right?"

Yes: CSS classes (`@wizeworks/silicaui`, ships no JS), React
(`@wizeworks/silicaui-react`, Base UI behavior), and the node tree
(`@wizeworks/silicaui-html` + `-behaviors`, the zero-dep runtime).

**And the section I had just shipped for #008 documented one of them.** Every page told
every reader `npm i @wizeworks/silicaui-react`. For Tomás — no `package.json`, Django
templates — that is not incomplete, it is wrong, and it was the only instruction on the
page.

Worth stating plainly: **I made that worse, not better.** Before #008 the pages were
silent on all three paths equally. Adding React-only instructions turned silence into a
wrong answer for two thirds of the audience. A fix that serves the majority path and
misleads the rest is not a neutral improvement.

It also contradicts the front page, which has a section headed **"The same components,
with no framework at all"**. Landing page sells three, docs documented one.

Issue **#009**, fixed. The generator was keeping the *first* catalog entry per name, so
whichever package came first won. It now indexes by name **and** package and emits three
independent paths — css **108**, react **108**, html **101**, with only `hooks` having
none (correct, it is not a component).

**A second bug fell out of checking the first.** Matching React on `silicaui-react`
alone silently dropped the React section from **Data Table, Chart, Rich Text Editor,
Sortable List and Resizable Panels** — the five opt-in composites, which are React in
their own packages, and are exactly the components whose package name a reader cannot
guess. Caught only by listing what had lost a path and reading the list; the Data Table
page looked entirely fine while being wrong.

**Confirmed on screen.** Accordion shows all three: the `@plugin` line with `.accordion`
+ 5 modifiers and the caveat *"This path ships no JavaScript…"*; the React install,
import and props; and `atom("Accordion", …)` + `toHtml()` with **Hydrated by
`disclosure`** and the warning to load the runtime or the markup is inert. Data Table
shows two — the right composite package, and **no** vanilla section, because it has no
node-tree form. Absence shown as absence.

`pnpm verify` exit 0, golden byte-identical.

**This is now the third time today the answer was already in the repo** — counts,
descriptions and groups, and now all three paths, every one of them sitting in data the
MCP already serves while the site hand-maintained or ignored it.

### 2026-09-18 · Act 3 — Getting started, followed literally · **done**

Real `create-next-app@latest` (Next 16.3.5, React 19.2.8, Tailwind v4), real
`npm install` of `@wizeworks/silicaui@0.55.0` **from npm**, not workspace-linked. Then
the page's three steps, adding nothing.

**Steps 1 and 2 worked first time.** 11 packages, no peer warnings, no vulnerabilities.
The `@plugin` block produced a real themed button with a resolved OKLCH background — the
CSS-first, no-config claim held exactly as advertised.

**And the plugin's own warning is the best thing found in three acts:**

> `[silicaui] Theme colors background, foreground are declared in @theme but not
> registered with the plugin. Utilities like bg-background work, but component variants
> (btn-background, badge-background, …) will NOT be generated and those elements will
> silently render in the default color.`
> `Fix: @plugin "@wizeworks/silicaui" { colors: …, background, foreground; }`

Problem, consequence, and the exact line that fixes it. It fires once. That is the
*opposite* of the silent-failure class this run keeps finding, and somebody built it on
purpose.

**Step 3 returned HTTP 500.** Issue **#010**. The page's only code sample is
`export function Example()` — a **named** export, pasted into `app/page.tsx`, where the
App Router wants a default. *"The default export is not a React Component in /page"*.
The page also never says which file the code goes in, and never states that Tailwind v4
is required.

Fixed: numbered steps, the v4 requirement up front, the CSS entry point named per
framework, a runnable default export, a `<main>` wrapper, and a "Without React" section
covering the other two paths (the page's own metadata already promised them).

**Four more wrong snippets were caught before publishing — three by RUNNING them.**

1. `atom("Button", { color, text })` — the signature is
   `atom(component, cls?, props?, children?)`, so props were landing in the **class**
   slot; and the prop is `label`, not `text`.
2. Corrected to pass props third, ran it: `<button type="button">Get started</button>` —
   **no `btn` class at all**. There is no `color` prop on that path; styling *is* the
   class string. A reader would have got an unstyled button and no error.
3. The `// →` output comment had the attributes in the wrong order.
4. `## Without React {#without-react}` — MDX parses `{}` as JSX. `Could not parse
   expression with acorn`, HTTP 500. Caught because the page refused to compile.

The same `atom()` bug was live on ~101 generated component pages from #009 and is fixed
there too, now printing the real root class.

**Every snippet on the page has now been executed**, and the `atom()` output is checked
against the printed `// →` with an equality assert rather than by eye.

**Confirmed:** the fixed sample pasted verbatim → **HTTP 200**, button at natural size,
primary colour, padded. `pnpm verify` exit 0.

**Housekeeping:** Next 16 writes `AGENTS.md` and `CLAUDE.md` into the project root on
every dev start — a stray binding instruction file inside this repo. Set
`agentRules: false` and confirmed they stay deleted. Artifact folders are **lowercase**
because npm rejects capitals in a package name.

**Not checked:** the getting-started page at 360px. The Vite and plain-HTML paths end to
end belong to P02 and P08.

**Act 4 next:** break the `@plugin` import on purpose. A CSS-first plugin wired wrongly
renders an unstyled page with no error — and act 3 just showed the plugin *can* warn
well, so the question is whether it warns here too.

### 2026-09-18 · Act 4 — The wrong import, on purpose · **done**

Four ways to get the wiring wrong, each driven on Dilnoza's own app at `localhost:4099`
and measured off the live DOM rather than read off the source. The working baseline, for
every comparison below: `btn btn-primary` → `lab(32.5387 -3.30366 -19.0915)`, 40px tall,
`0px 16px` padding, `4px` radius.

| The mistake | What she sees | Verdict |
| --- | --- | --- |
| No `@plugin` line at all | Bare text on a black page. Transparent background, 24px tall, no padding. **No build error, no console warning, clean `GET / 200`** | **Silent — issue 011** |
| `@plugin "@wizeworks/silicaui-react";` | Build stops: **`b is not a function`** | **Unactionable — issue 012** |
| `@plugin "@wizeworks/silicaui-react" { colors: … }` | Build stops: *"The plugin … does not accept options"* | Fine. Tailwind's own message, names the file |
| `@plugin` in a second CSS file that `globals.css` imports | Works. Button identical to baseline | Fine — and worth documenting as supported |

**The finding act 4 exists for is the first row.** The class names are right, the import
is right, the console is clean, Tailwind's own utilities still work — so the page reads
as *deliberate*, not broken. There is no thread to pull. For somebody spending one
afternoon deciding whether a 0.x design system by one maintainer is safe to adopt, that
is not a bug report, it is a closed tab.

**The plugin cannot fix this.** A plugin that was never loaded cannot warn. So the fix
went to the only part of the system that is running with both halves in view: the CSS
plugin now emits one sentinel, `--sui-plugin: 1` on `:root`, and
`@wizeworks/silicaui-react` reads it once per page and says the sentence out loud. A
custom property rather than a class, because `prefix:` renames classes and leaves custom
properties alone — so every install, prefixed or not, tests the same thing.

**The quiet case was confirmed before the loud one.** A check that cries wolf on a
correctly-wired app would be worse than the silence it replaces, so the first measurement
was the working install: sentinel `"1"`, baseline button, nine console messages and every
one of them Next's own. Then the break: exactly one `[silicaui]` error, once, not once per
component.

**Then RULE #7 paid for itself on its first use.** The fix touched the plugin, so it had
to be re-proved on an earlier surface — silicaui.com, cold, acts 2–3's real job. Reading
`/docs/getting-started/` in OS dark with the stored theme cleared, the check stayed quiet
as it should. But the page was wrong in a way nothing had noticed:

```
--color-base-100   oklch(16% 0.01 255)      the dark token, correctly re-pointed
paragraph ink      oklch(0.93 0.006 250)    the dark token, correctly applied
<html> background  rgba(0, 0, 0, 0)         never painted at all
```

`prefersdark` — the option added in act 2 for issue 002 — re-points every colour token and
never paints the page. What a visitor saw behind the text was Chrome's default dark grey,
produced by `color-scheme: dark`, and never `--color-base-100`. **The product's own site
was showing its own dark theme in the browser's grey**, and the light ink was readable
only because the UA happened to darken its own canvas. Issue 013.

That is the "a fix leaves its neighbour behind" shape, and act 2 wrote it. The paint rule
sat forty lines below the block that was added and was never brought along. So the repair
is structural rather than another copy: one `surface()` helper is now the single
definition of what a Silica surface is, and both selectors that establish one call it.

**Three things were guarded rather than just fixed:**

1. `verify-surface-paint.mjs` asserts every selector that re-points
   `--color-base-content` also paints, with `:root` named as the deliberate embeddable
   exception. **Proved to fail before it was trusted** — the fix was removed, the probe
   went red naming the exact selector, the fix was restored. Wired into `pnpm verify`.
2. The two comments that have to agree — the `surface()` doc and the embeddability note —
   were both updated to say there are exactly two opt-ins and both paint through the same
   helper. A comment asserting a property nothing enforces is how this repo gets into
   trouble; this one now has a probe behind it.
3. The `b is not a function` guard went on **all three** non-plugin packages, not just the
   one found. The reason a person types the wrong name is that they are thinking of the
   package they use most, and that differs by path — P08 would have hit the `-html` one.

**Restored and re-measured after every break.** `globals.css` byte-identical to the
backup; button back to `lab(32.5387 -3.30366 -19.0915)`, 40px, `0px 16px`, `4px`.
`pnpm verify` exit 0.

**Not checked:** the `-html` and `-behaviors` guards were never driven to a real build
overlay — same four lines, present in their built output, but only `-react` was seen on
screen. Handed to **P08**. The 360px reading of the newly-painted dark surface is handed
to **P09**.

**Housekeeping:** the artifact's `node_modules` now carries a **local build** of
`@wizeworks/silicaui` and `@wizeworks/silicaui-react`, not npm `0.55.0` — acts 5–10 must
test the fixed product, not re-find issues 011 and 013. Re-pin to the published version
once the pending changeset ships. `npm install` in that folder would silently undo it.

**Act 5 next:** build the console shell — nav, theme toggle, the long heading — and flip
to dark and back on every screen as it is built. The theme machinery has now been changed
twice in two acts, so act 5 is the first act that exercises it as a user rather than as a
measurement.

### 2026-09-18 · Act 5 — The console shell · **done**

Built the chrome on `AppShell` — sidebar, navbar, theme toggle, four routes — plus the
overview with the 68-character heading and the 14 shipments as data. Flipped themes at
every step rather than at the end, which is how the first of these was found.

**Both done-conditions met.**

| | |
| --- | --- |
| the 68-char heading at 360px, both themes | **28px, three lines, 92px — 12% of the screen**, no horizontal scrollbar |
| the toggle flips every surface, incl. a portal | Drawer panel `lab(97.68)` → `lab(3.68)`, identical to `<html>`, **while open** |

The portal test is the one worth keeping: the phone nav Drawer was confirmed to sit
*outside* the `AppShell` subtree first (`panel.closest('.app-shell')` → null), so flipping
with it open proves the theme reaches a portal and not merely a descendant.

**Four issues, and the first three are one root cause.**

**#015 — every heading in the app was body text.** `<Heading level={1}>` measured
**16px/400**, identical to the paragraph beneath it, and emitted no class. Not a
`Heading` bug: its doc is explicit that with no `size` a heading inherits its tag's global
default, and it correctly emits nothing. The global default was unreachable. One attribute
told the whole story:

```
no data-theme        h1 16px/400    h2 16px/400
data-theme="dark"    h1 36px/700    h2 30px/700
```

The entire type ramp lived behind `[data-theme]`, and `prefersdark` — the thing act 2
added so the night shift opens a dark console at 22:00 — *requires that the attribute not
be set*. **Doing the documented thing removed her typography.** Six rule groups: the
heading treatment, all six step sizes, `p`, `small`, and two for `blockquote`.

**This is issue 013 again, in a second place.** So the fix was not the selector but the
rule: one exported `surfaceScopes()` in `theme.js` is now the single answer to *where does
Silica own the page*, and both the paint and the type ramp read it. The inventory is worth
writing down, because the third row is the tell —

| scoped to `[data-theme]` | reached by `prefersdark`? |
| --- | --- |
| the surface paint | no → 013 |
| the type ramp, six groups | no → 015 |
| reduced motion | **yes** — already written `:root, [data-theme]` |

Somebody writing that one line already knew both selectors were needed. Nothing carried
it. Now the list does.

**013's known asymmetry closed in passing.** Moving the paint out of the
`prefers-color-scheme: dark` block fixed the light side too — `surface()` names
`var(--color-base-100)` rather than a value, so one declaration follows whichever palette
is live.

**#016 — the page title ate a quarter of the phone.** 36px flat at every width: five
lines, 198px, **26% of a 360×760 screen** before a single shipment. Stepped the size in
the live page to find where it stops mattering rather than picking a number —

| 36px | 32 | 30 | **28** | 26 | 24 |
| --- | --- | --- | --- | --- | --- |
| 5 lines | 5 | 4 | **3** | 3 | 3 |

28px is the knee. `h1`/`h2` are now `clamp(…cqi…)` on the same shape `display-1`–`3` in
the same object already used — same technique, same units, ceilings unchanged. **Desktop
is byte-identical**, verified at 1438px on *two* apps: 36px/30px before and after.

Checked against the repo's SETTLED position first — *no responsive size variants,
CQ-first*. This adds no variant and uses `cqi`, so it expresses that decision rather than
reversing it; the flat heading ramp was the exception to it.

**#017 — two names for one job.** `render={<Link/>}` on a `SidebarItem` is TS2322;
`SidebarItem` wants `as`. Four components take `render`, four take `as`, and `Button`'s
own doc calls `render` *"Base UI's composition model"* — so `as` is the outlier, not a
second mechanism. All four now take `render` through the existing `composeRender`, with
`as` kept as a deprecated alias. Verified by the DOM, not the compile: four real `<a>`
tags, right `href`s, `aria-current` on one, and **no stray `type="button"`** on a composed
anchor.

**#014 — the catalog could not be searched in words.** `search_docs("app shell")` → `[]`;
`search_docs("appshell")` → 7. Every matcher was one literal `includes(q)`. The damage
lands on an agent, which does not retry with the space removed — it concludes there is no
app shell and hand-rolls a grid, manufacturing the RULE #1 violation the server exists to
prevent. Ten of thirteen result groups shared the defect, and **two comments in the file
already described it** and patched a call site with a keyword list instead of the matcher.
Now one `matches()` helper, term-split and CamelCase-aware.

**Three probes, each proved to fail before being trusted.** `verify-surface-paint.mjs`
grew a second part for the type ramp; `verify-prop-vocabulary.mjs` — whose premise is
already *"one prop name means one concept everywhere"* — grew the mirror rule;
`silicaui-mcp/verify.mjs` grew six two-word lookups plus an all-terms-must-hit check so
the fix cannot degrade into "match any word". Each was broken deliberately, seen red with
the right message, and restored.

**RULE #7.** The plugin changed, so silicaui.com was reopened cold: painted dark surface,
sentinel `1`, h1 36px/700 unchanged at desktop, 28px and no horizontal scroll at 360px
with body still at the 16px floor.

**Not checked, and handed on.** Escape-closes-the-drawer was attempted with a synthetic
`KeyboardEvent` and did not close it — that is a **measurement artifact, not a finding**;
untrusted events miss handlers. Real keys belong to **act 8**, which owns the keyboard.
The 360px reading of the new fluid ramp across the docs goes to **P09**. The `-html` and
`-behaviors` halves of issue 012 still have no build overlay driven for them — **P08**.

**Act 6 next:** the shipments table — sorting, aligned money, the status chips, and the
empty and loading states. `Müller & Söhne` has to survive a cell and a heading, and the
58-character consignee has to wrap or truncate in a way she would accept.

### 2026-09-18 · Act 6 — The shipments table · **done**

Built the list: 14 rows over a real `fetch`, sortable columns, status chips, aligned
money, and the empty and loading states. Plus the detail screen and the sign-in screen,
both of which the build inventory needs and both of which earned their place here for
reasons below.

**All three states seen on screen, not inferred.**

| state | how it was reached | what was there |
| --- | --- | --- |
| loading | polled a hidden iframe every 60ms from the parent, because the window is ~550ms | **48 skeletons across 8 rows** (6 columns × 8), then 14 real rows |
| empty | typed `Vladivostok` into the filter, which is what she would do | *"Nothing matches Vladivostok"*, the count reading `0 of 14`, and a **Clear the filter** button |
| loaded | — | 14 rows, sorted by ETA ascending |

The loading state is behind a real route handler rather than a `setTimeout` in the
component. A skeleton that only appears because a demo delayed itself is a picture of a
loading state, not one.

**The data survived.** `Müller & Söhne Spedition GmbH` renders correctly in a cell **and**
as an `<h1>` on the detail screen — umlauts and ampersand intact at 36px/700. The
58-character consignee **wraps** rather than truncating, two lines in the table cell and
two in the heading. That is a decision, not a default: an operator reading a customs hold
at 22:00 needs the whole legal name, and an ellipsis lands on exactly the row they cannot
act on. Sorting the consignee column puts `Liepājas`, `Müller` and `Rīgas` in their proper
alphabetical places — though honestly, none of these names carries its accent in the FIRST
character, so the data does not actually discriminate between `localeCompare` and a naive
sort. The collation is right; this particular set does not prove it.

**At 360px the page does not scroll sideways** — the 858px table scrolls inside its own
wrapper, which is exactly what `Table`'s auto-wrap promises. Both themes: header contrast
15.75 in dark, 16.71 in light, identical to the data cells in each.

**Three issues, and the first one nearly did not get found.**

**#018 — at midnight the column headers were not readable at all.** The sortable headers
are `<Button variant="ghost" color="neutral">`, and they measured **1.52:1** against the
page while the data beside them measured 15.75. Visible in a zoomed screenshot as grey
smudges under bright rows.

`neutral` is the one role the dark palette deliberately keeps dark — 26%→32% while every
chromatic role lightens to 64–80%. As a **fill** that is right and measures 10.4. As
**ink** it is invisible, and `soft`/`outline`/`ghost` all paint it as ink. Thirty-one of
thirty-two role × variant pairs pass AA; the three failures are all neutral, all
non-solid.

**Moving the token cannot fix it**, which is worth the space because it was checked rather
than assumed — stepping lightness across the range, the two requirements cross at ~53%
where each is only ~3.5:

```
L        32%   38%   44%   50%   56%   62%   68%   74%
as ink    1.5   1.9   2.5   3.2   4.2   5.3   6.7   8.4
content  10.4   8.1   6.3   4.9   3.8   3.0   2.3   1.9
```

So the ink form takes its own source — `--color-base-content`, which is **what an
uncoloured button already used**: every rule reads
`var(--btn-accent, var(--color-base-content))`. `btn-neutral` was overriding the right
answer with a worse one. Applied once in the generator rather than to 28 table entries, so
the builder's runtime cascade fixes a live-invented colour identically.

**The measurement was validated before it was believed.** These colours compute as
`lab()`/`oklab()` and act 1 has already been burned by a parser that silently reads those
as black — so the converter was checked with a magenta pre-fill and `#fff` on `#000` = 21.

**#019 — and turning that check on found something bigger, which was NOT fixed.** Adding
"is this role legible as ink on the page?" to `verify-token-contrast.mjs` went red in
**light** mode for five more roles. Measured in the browser too: `warning` ghost is
**1.78:1**, `success` 2.41, `info` 2.67, `accent` 2.96. Fifteen of twenty-one non-solid
variants are below AA in the default theme.

The fix is designed and measured — a theme-aware lightness clamp in relative-colour
syntax, `min(l, .50)` light and `max(l, .66)` dark, which clears AA everywhere and leaves
dark byte-identical. It is **filed rather than done** because the clamped value is right
for a label and wrong for the hover fill that reuses the same variable, so it needs a real
fill/ink split across ~28 families. That is a deliberate, wide, visible change to the
default theme and it deserves its own pass, not a side effect of a shipments table.

The five are listed in the probe as **tracked, printed with their real ratios and issue
number on every run** — and a tracked entry that later passes now FAILS the build until it
is deleted, so the list cannot rot into an exemption nobody rechecks. **That self-check
caught one of my own errors on its first run**: `secondary` was wrongly listed, because it
passes at 4.57 on the raw token and only fails in `soft`, where the tint lifts the
background.

**#020 — giving the search box a width sent its clear button 718px away.** `className`
landed on the inner `<input>` while the `input-group` that positions the affixes kept its
own width, so the × rendered alone against the far edge of the page. `className` now goes
to the group, with `inputClassName` for the field.

**The sibling claim cost two attempts and that is the point.** `PasswordInput` has the
identical source shape, but reading is not measuring — so the sign-in screen got built to
get a real password field. The first test showed **no defect**, because `w-full` cannot
narrow anything and the `max-w-sm` column was already the group's width; reporting that as
a pass would have been wrong in the other direction. The real condition is a *narrowing*
class in a *wider* container, and with the old routing reproduced exactly the show/hide
toggle sat **480px adrift**. Then fixed, then re-measured at 8px inside the field.

**Also fixed while there:** sign-in was rendering inside the console chrome, nav and all.
The console pages moved into a `(console)` route group with their own layout so the
signed-out screen stands alone — act 10's stranger would have spotted that immediately.

**Measured and deliberately NOT filed.** An input's resting border in dark is below
WCAG 1.4.11's 3:1 for a component boundary — `input-neutral` **1.15**, `input-primary`
**2.21**, `input-info` **2.34**. That comes from `fieldBorder()`, which tints the role
colour into the surface on purpose *"so an unfocused input reads as its colour without
shouting"*, and it is already guarded by `verify-field-border.mjs`. It is a deliberate
design with a real number against it, contrast is **act 7's** subject, and filing a
half-considered blocker against a probe-guarded decision at the end of someone else's act
is how a run loses trust. Handed over with the numbers.

**RULE #7.** The plugin changed, so silicaui.com was reopened cold. `btn-neutral` solid
still measures **10.37** — unchanged, the fill case was not disturbed — while
`btn-neutral btn-ghost` went **1.52 → 15.75**. Seen on the Button page, where the ghost
and outline rows now read `neutral` as clearly as the colours beside it, including the two
custom roles that page registers.

**Act 7 next:** midnight contrast. Every status chip's ink against its own surface, at the
smallest size each is used, read off the computed style — then again inside a `data-theme`
island. `Awaiting pickup` is the `neutral` chip, so issue 018 has already moved it; act 7
measures it rather than assuming.

### 2026-09-18 · Act 7 — Midnight contrast · **done**

Measured every status chip's ink against its own surface at the smallest size each is
used, off the computed style, in **four** configurations — then swept every other piece
of text on every screen, then went looking for the fading a ratio cannot show.

**The chips pass. All of them, everywhere.** Written down rather than summarised,
because the act's done-condition is a number per chip, not a verdict:

| chip | role | dark, `data-theme` | dark, **no attribute** (OS) | light | in a nested island |
| --- | --- | --- | --- | --- | --- |
| Delivered | success | 9.36 | 9.36 | 7.35 | 9.36 / 7.35 |
| Cancelled | error | **5.89** | 5.89 | **4.67** | 5.89 / 4.67 |
| Customs hold | warning | 11.50 | 11.50 | 8.72 | 11.50 / 8.72 |
| In transit | info | 8.77 | 8.77 | 6.87 | 8.77 / 6.87 |
| Awaiting pickup | neutral | 10.37 | 10.37 | 13.48 | 10.37 / 13.48 |

All at **11px / 600** (`badge-sm`). AA needs 4.5; the tightest is `Cancelled` in light
at 4.67. `Awaiting pickup` at 10.37 is issue 018's fix measured rather than assumed.

**The island half works, and the numbers prove it rather than the screenshot.** A
`data-theme="light"` island nested inside the dark page paints its own surface
(`lab(97.68 …)`) and every chip inside it resolves to the light palette — and the
reverse. Five chips × two directions, all matching the root-level readings for the
theme they were given. No per-theme CSS anywhere in the app.

**The whole app was swept, not just the chips.** Every element owning a visible text
node, plus placeholders read off `::placeholder`, on four screens in both themes:

| screen | texts | worst, dark | worst, light |
| --- | --- | --- | --- |
| `/shipments` | 81 | 5.89 Cancelled | 4.67 Cancelled |
| `/` | 38 | 6.38 active nav item | 6.40 |
| `/shipments/PFR-2026-0420` | 17 | 6.38 | 6.40 |
| `/sign-in` | 7 | 8.10 Sign in | 7.92 |

Nothing below AA. The filter's placeholder reads **15.75 / 16.71** — full-strength ink,
not a faded hint, which is RULE #3 being honoured by the component rather than by luck.

**Two numbers that look damning and are not, which is why both were looked at.**

The `neutral` chip's **fill** measures **1.52:1** against the page in dark, and the
`warning` chip's fill measures **1.78** in light. Both are real. Neither means what it
looks like it means: zoomed to 4×, both pills are plainly there — a grey pill in dark, a
tan pill in light. WCAG 2.x measures luminance only, so it under-reports a dark-on-dark
step and ignores hue separation entirely, and a status chip is not an interactive
control whose boundary 1.4.11 governs — its **text** carries the meaning, and that text
passes. Recorded with the numbers and **not filed**. A ratio is evidence; it is not a
verdict.

**A number I reported to myself and then had to withdraw.** The first full-page sweep
returned `Shipments` at **1.39:1** — the active sidebar item. It was wrong. The active
row is tinted with `oklab(… / 0.14)`, and my `behind()` tested alpha with a regex that
only recognised the `rgba(…, 0)` spelling, so it read a 14% tint as an opaque fill and
scored white text against an unblended colour. Rebuilt to composite every translucent
layer down to the page, proved with 50% black over white = **127** and `#fff` on `#000`
= **21.00**, and the true figure is **6.38**. The probe was wrong, not the product; this
is written down because "measured it" and "measured it correctly" are different claims.

**At 360px the status column was not on the screen at all.** Asserted 360 through an
oversized iframe rather than trusted — window resizing cannot go below ~500px on this
machine, so the recorded iframe method was used and `documentElement.clientWidth` was
checked to be exactly 360 before any reading was taken.

At rest she saw **Reference, and part of Consignee**. Route, **Status**, Declared value
and ETA were *not visible at all* — 545 of 858px hidden, four of six columns, on a
screen whose entire purpose is the status column. The table scrolls correctly inside its
own wrapper and the page never scrolls sideways; silicaui did nothing wrong. The column
order did.

Fixed in the artifact: **Status moved to position two**, and Route and Declared value
step aside below `sm` through a single `colClass()` helper so the `<th>`, the `<td>` and
the loading skeleton cannot drift apart. The consignee's width floor drops on a phone so
the long name narrows and wraps instead of shouldering its neighbours off the screen.

**858 → 494px.** Reference and Status are now both **fully visible at rest**; the
remainder is one thumb-swipe instead of four columns away. Desktop is unchanged — six
columns, same order of sort keys, sort on the moved column verified live
(`aria-sort="ascending"`, `Awaiting pickup` first). Loaded rows and skeleton rows both
still carry exactly 6 cells against 6 headers, and the skeleton is still 48 across 8
rows.

**Then the act found what a contrast sweep structurally cannot — issue #021.**

Every ratio on every screen passed, so the remaining question was how the library fades
text at all. RULE #3 bans four things and names `/opacity` first.
`verify-readable-ink.mjs`, the probe written for that rule, matches exactly one of the
four:

```js
const MUTED = /color:\s*"color-mix\(in oklab, var\(--color-base-content\) (\d+)%, transparent\)"/;
```

**110 `opacity` declarations in the components, 53 of them partial fades, none ever
checked.** A countdown's "days" label at 60%. Menu, dropdown, select and footer group
headings at 55–60%. Every breadcrumb link at 70%. A phone dock's 11px label at 55%. The
sentence in an alert that says what to do about the alert, at 90% — with the argument
written beside it in the source:

> *Full-contrast `-content` softened just enough for hierarchy against the bold title,
> not enough to hurt legibility.*

**Four of them were below AA, and nothing in the repo could have told you.**
`verify-token-contrast.mjs` reads tokens, so an `opacity` sitting on top of a perfectly
good token is invisible to it. Measured on the rendered page, both themes:

| element | px | was | dark | light |
| --- | --- | --- | --- | --- |
| `.dock-item` | 16/11 | 0.55 | 3.13 → **7.87** | **2.66** → **7.99** |
| `.menu-title` | 12 | 0.55 | 5.28 → 15.75 | **3.87** → 16.71 |
| `.countdown-label` | 11 | 0.6 | 6.11 → 16.31 | **4.39** → 15.28 |
| `.breadcrumb a` | 14 | 0.7 | 8.00 → 15.75 | 6.36 → 16.71 |

**The first draft of my own probe was wrong twice, and running it is what found that.**
It reported 41 and would have had me "fix" 21 things that were already correct: the
selector capture `\[([^\]]+)\]:` stopped at the first `]`, so
``[`${sel("-item")}[data-disabled="true"]`]`` recorded as `-item` and threw away the
attribute that makes a disabled control legitimately faded; and `ALLOW_SELECTOR` knew
`data-disabled` but not the `:disabled` pseudo-class. **41 → 20** was a correction to
the measurement, not to the code. The file's own header had already warned about that
truncation — for a different assignment shape, while the bug was live in the main one.

**16 fixed, 4 allow-listed with a written reason** (two chevrons made of rotated
borders, terminal line numbers, and a `…` gap marker — all `content: ""` or
`userSelect: none`). Every fix is the same move and it is the one the rule prescribes:
the fade comes out and **nothing replaces it**, because the hierarchy was already there
— 11–12px, 700, uppercase, letter-spaced, against 14px regular items. The dock's active
item was **already** marked with a real accent colour, which is the precise case the
probe's own header had worked out for `tabs-tab` and written down. The knowledge
existed; it could not travel, because the check could not see the property.

**Two things I broke myself, repaired before the act closed.** Removing dock's fade took
its only hover feedback with it — it now hovers to the accent colour, feedback in colour
rather than in fade. And `toast -action` was left holding a dead `opacity: "1"` on
hover, returning from a fade that no longer existed. The `-close` glyph beside it still
measures **0.7**, which is the exemption working: a glyph keeps its fade, the words next
to it do not.

**The probe was proved before it was trusted.** Put the countdown fade back:
`countdown.js:44 \`-label\``, **exit 1**. Take it out: **exit 0**.

**RULE #7.** silicaui.com reopened cold — `rm -rf apps/site/.next`, after killing the
old dev server, which had survived its own stop and was still holding port 4011 (a
restart on a stale `.next` would have made a correct fix look broken, which is the whole
reason that rule exists). Twelve of the thirteen were then measured on the real page,
with the dropdown and the toast opened by clicking their actual triggers.

**Two gaps recorded rather than rounded up — and one of them turned out to be mine.**

~~`.select-menu-group-label` was never seen on a screen.~~ **Withdrawn in act 9.** There is
no such class and there never was. `select-menu.js` builds its selectors as `.select` plus
a suffix — the module is *named* select-menu and emits **`.select-*`**. I read the probe's
own output, which prints the SUFFIX `-group-label`, glued it to the FILENAME, searched the
page for a selector I had invented, found nothing, and wrote the absence up as a finding
about the product. The real class is `.select-group-label`, it is in the served stylesheet,
and the fix is live on it. The on-screen reading taken at the time was right — "Classic" at
opacity 1, 12px — only the name I filed it under was wrong. **All thirteen components were
confirmed on a screen, not twelve.**

The second gap was real. `.alert-description` in light went **1.58 → 1.67** and is *still*
broken: that alert is `alert-warning alert-soft`, whose
ink computes to `oklch(0.8 0.11 85)` — the `warning` role painted as text. That is
**issue 019**, now measured a second time on a real component rather than a synthetic
label. Removing the 0.9 was right and moved it 0.09. The remaining 2.8 belongs to 019.

**Act 8 next:** the dialog, without a mouse. Build "New shipment", then do the whole job
on the keyboard alone — open, three fields, submit, get an error back. Act 6 handed
across a real-key Escape test on the Drawer, since a synthetic `KeyboardEvent` did not
close it and that was recorded as a measurement artifact rather than a defect.

### 2026-09-18 · Issue 019 — the fill/ink split · **done**

Held back from act 6 on purpose, as its own pass. Done here.

**The proposed fix was not the one that shipped, and the reason is worth the space.**
This issue specified a lightness clamp — `min(l, 0.50)` light, `max(l, 0.66)` dark. That
needs to know which way to clamp. The plugin ships two themes and could declare it; a
host theme from `themeTokenCss` would have to declare it too; a hand-rolled theme would
omit it and get the clamp **backwards**, darkening ink on an already-dark page. That is a
failure mode that looks like nothing until someone's custom dark theme is unreadable.
`light-dark()` was considered and rejected the same way — it keys off `color-scheme`, and
`themeTokenCss` emits only `--` properties.

**Mixing halfway toward `--color-base-content` needs no flag.** Base-content is dark on a
light surface and light on a dark one, by definition, in any theme — including one
invented at runtime that this package will never see. The direction comes free:

```js
const inkOf = (c) =>
  `oklch(from color-mix(in oklab, ${c} 50%, var(--color-base-content)) l calc(c * 2) h)`;
```

The mix costs about half the chroma — amber goes olive — so the second step multiplies it
back. Lightness and hue are the mix's; only chroma is restored. **89–134% of the original
chroma survives.** Nothing washes out.

**The constants came from a search, not from taste.** At 55% / ×1.8 the worst case is 4.92
and `warning soft` is 4.55 — passing, with no margin for a palette tweak. At **50% / ×2**
the worst is **5.58** and soft is **5.16**.

**It is a new variable, not a changed one**, which is what kept the blast radius honest.
`--<root>-accent` still holds the raw colour and still drives every fill and tint. The new
`--<root>-ink` is emitted beside it, automatically, for any var key ending `-accent` — so
a component added later is covered without anyone remembering, and the builder's runtime
cascade produces the identical pair.

Only declarations that paint TEXT moved: **19 `color:` rules, three button spinners, and
the resting `outline`/`dash` borders on Button, Badge and Alert.** A border drawn round a
label in the label's own colour has to move with it or the control shows two ambers.
Deliberately left alone: the `soft` background tint, every hover tint,
`btn-outline:hover`'s solid fill and edge, the focus ring, and `fieldBorder()` — the last
because act 6 measured it, found it deliberate and probe-guarded, and handed it forward
rather than half-fixing it here.

**40 role × variant pairs, read off the computed style on a cold silicaui.com:**

| pair | light before | light after | dark after |
| --- | --- | --- | --- |
| `warning soft` | **1.64** | **5.15** | 13.15 |
| `warning` outline / ghost / dash / link | **1.78** | **5.60** | 13.49 |
| `success soft` | **2.13** | 5.71 | 11.6 |
| `accent soft` | **2.55** | 5.94 | 11.4 |
| `error soft` | **3.66** | 7.02 | **7.30** ← worst in dark |

**Every one of the 40 passes in both themes.** The JS search predicted 5.58 and 5.16; the
browser returned **5.60** and **5.15** — two decimals apart, which is the check that the
CSS does what the model said.

**The hover case — the one this issue predicted a clamp would break — was tested with a
real mouse.** A first attempt injected a `.__force` rule, lost the specificity fight and
reported a ratio against a transparent background. Meaningless; discarded rather than
written down. Hovering `btn-warning btn-outline` for real (`matches(":hover") === true`)
fills with `oklch(0.8 0.11 85)` — the **raw** amber — under `oklch(0.24 0.04 85)` at
**8.72:1**. It did not break, because the fill never moved.

**Seen as well as measured.** Light and dark, the solid row is visibly identical and every
non-solid label reads as its own role — amber still amber, success still green, error
still red. `brand`, `brand-duck` and `silica`, the custom roles that page registers, get
the same treatment: the N-colour promise holding through a derived value.

**`neutral` no longer needs its exception, and keeps it anyway.** Through the formula it
clears AA on its own (dark **1.53 → 5.45**). `FILL_ONLY_ROLES` stays because "neutral ink
on a neutral surface" IS the surface's own ink, which measures **15.75** — a better answer
than the general one, for the one role that has one. Issue 018's fix is preserved exactly
and quietly improved: `--<root>-accent` goes back to real `neutral`, so
`btn-neutral btn-outline` now hovers to a neutral fill rather than to the page's ink.

**RULE #7 — re-proved on Dilnoza's own console, rebuilt cold**, in the hardest
configuration: **no `data-theme`, dark from the OS**. The sortable headers are still
`btn btn-neutral btn-ghost btn-sm` and still measure **15.75**, and every text on the page
still passes AA with act 7's numbers unchanged.

**The probe was re-pointed, and then tied down.** `verify-token-contrast.mjs` measured the
raw token — correct while the raw token WAS the ink. Left alone it would have gone on
reporting `warning` at 1.77 while the screen showed 5.60, and stayed green through a
regression in the derivation itself. It now simulates `inkOf`, and reads the mix ratio and
chroma multiplier back out of the **generated CSS**, failing if they disagree. Proved by
changing `calc(c * 2)` to `calc(c * 1.4)` in the source: the probe names the mismatch and
**exits 1**. Restored: exits 0. Two copies of one formula is the exact shape that file's
own header warns about for `contrastRatio`.

`TRACKED_BELOW_AA` is now empty — and it was its own self-cleaning rule (a tracked entry
that starts passing fails the build) that forced it to be emptied rather than left to rot
into an exemption nobody rechecks.

`pnpm verify`: **exit 0**. **Twenty-one issues filed, twenty-one fixed and confirmed,
none open.**

### 2026-09-18 · Act 8 — The dialog, without a mouse · **done**

Built "New shipment" — three fields, a real server that can refuse — then closed the
trackpad and did the whole job on the keyboard. A focus recorder went on FIRST: every
`focusin`, and every `focusout` with no `relatedTarget`. "Focus never disappears" is the
act's own done-condition, and the only honest way to say it is to log it as it happens
rather than sample afterwards.

**The whole path, on keys alone.**

| step | keys | what happened |
| --- | --- | --- |
| reach the trigger | Tab ×8 | sidebar toggle → four nav links → theme switch → filter → **New shipment**. Nothing skipped, nothing trapped |
| open | Enter | focus moved **into** the dialog, onto the first field |
| reference | type | `PFR-2026-0420` — deliberately one that is already booked |
| consignee | Tab, type | `Farg'ona Yog'-Moy Kombinati`, apostrophes intact |
| port | Tab, Enter, ↓, Enter | listbox opened, roving focus, Riga selected, **focus returned to the trigger** |
| submit | Tab ×2, Enter | rejected |
| fix it | Tab, Ctrl+A, type | **one Tab from the error lands on the Reference field** — the field the message names |
| book it | Tab ×4, Enter | `PFR-2026-0431` booked, dialog closed, focus back on the trigger |
| escape | Esc | closed, focus back on the trigger, `:focus-visible` matching, 2px ring at 2px offset |

The dialog is properly modal: the background carries `aria-hidden` with two focus guards.
`aria-modal` is absent, which looked like a finding for about a minute — it is not, the
`aria-hidden` route is the older and arguably sturdier one, and it was checked rather than
assumed.

The server refuses for a real reason and says so in a sentence an operator can act on:
*"PFR-2026-0420 is already booked, to Samarqand Qurilish Materiallari Ishlab Chiqarish
Korxonasi."* Everything she typed survived the rejection — the dialog is controlled
precisely so a 409 cannot throw away her work.

**Three issues, and the first one nearly read as a false alarm.**

**#023 — pressing Enter to submit left her with no focus anywhere for half a second.** The
recorder caught it exactly:

```
button.btn "Book it"
-> nothing (button.btn "Book it" lost it)
div.alert  "The shipment was not booke…"
```

`<Button loading>` computed `isDisabled = disabled || loading` and handed it to the
**native** `disabled` attribute, and when the element a keyboard user is standing on gains
`disabled`, the browser moves focus to `<body>`. `aria-busy` was set correctly and there
was nothing focused for it to be announced against. Tab during that window restarts at the
top of the document — on this dialog, back at the sidebar toggle.

**The component was already inconsistent with itself**, which is the tell: the polymorphic
path has always passed `aria-disabled`, never the attribute, so `<Button loading render=…>`
kept focus and `<Button loading>` did not. Now the native path agrees — `disabled` stays
for a real, lasting disabled; busy goes through `aria-disabled` with the activation
stopped explicitly, since `aria-disabled` is advisory. **Nothing about the look changes**:
button.js already styles `&:disabled, &[aria-disabled='true']` with one rule and the
spinner keys off `aria-busy`.

**Proved by sampling every 50ms through the request**, because the defect lived entirely
inside that window: focus stayed on **Book it** for the whole 450ms with `disabled: false`
and `aria-disabled: true`, then moved to the error. `focusEverLost: false`.

`verify-busy-keeps-focus.mjs` now fails the build on `disabled={…}` derived from a busy
state, following the derivation one hop — because `disabled={isDisabled}` pointing at a
`const` built from `loading` is exactly how this hid. Proved red, then green.

**One focus gap remains and it is not a defect: 2.3ms**, measured, at the moment the popup
unmounts before focus is restored. Under a sixth of a frame, unavoidable when the focused
element leaves the DOM, and recorded as its own thing rather than folded into the same
sentence as a 450ms hole.

**#022 — the dialog title split over two lines with its description beside it.**
`DialogHeader` is `flex` + `space-between`, built for a title on one side and a close
button on the other. Named after the place a title goes, so putting a title AND its
description in it is the obvious move — and it produced "New / shipment" squeezed into half
the popup with the sentence alongside. No error, no warning.

Fixed without redesigning the bar: it wraps, and `.dialog-description` takes
`flex-basis: 100%`. Title + close still sits on one row because nothing is wide enough to
wrap; title + description stacks; all three stack correctly. `flex-basis` is inert outside
a flex parent, so a description in its normal position is untouched.

**The sibling was found by shape, not by memory.** Five components have a `-header` that is
`flex` + `space-between`; only **two also ship a `-description`** — dialog and drawer — and
those two are exactly the ones where the trap is possible. Drawer is fixed identically.
AlertDialog re-exports DialogHeader and takes the fix through the class.

**#024 — the required asterisk was under the floor, and the probe was reporting the
opposite.** Scoring the dialog in both themes turned up one failure: the red `*` at
**4.42:1** in light. `label.js` painted it `color: var(--color-error)` — the raw **fill**
form. Issue 019 had derived an ink form for every role hours earlier, but only components
going through `COLOR_VARIANTS` got it.

**Fifteen rules across twelve modules write a role token straight into a `color:`** — the
asterisk, the validator message, two upload errors, a field error, and nine `primary` uses.
And `verify-token-contrast.mjs` was printing `✓ error — 9.56:1` at the same moment, because
act 7 had just re-pointed it at the derived ink. **One colour, two numbers, and the
reassuring one was the one in the build output.** Third time in this run that a green check
has covered a live failure.

The derivation moved to `lib/ink.js` — two callers now need it and two copies would drift —
and all fifteen call `inkOfRole(…)`. `verify-ink-derivation.mjs` forbids a bare role token
in a `color:`.

**Its first draft was wrong, and running it is what said so.** It flagged
`--color-primary-content` and `--color-neutral-content`, telling two correct rules to derive
an ink from an ink. A `-content` token IS an ink; both are now excluded, with the reason in
the file.

Asterisk: **4.42 → 9.57** in light, 5.72 → 8.45 in dark. Still unmistakably red —
`oklch(0.395 0.163 22)` — just darker than the fill form, which is the point of having two.

**And a claim from earlier today that had to be withdrawn.**

The Dialog fix was made, the console rebuilt cold, and the screen came back **unchanged**.
The cause was not the fix. This app declares `"@wizeworks/silicaui": "^0.55.0"` and is
installed with a plain `npm install`, so its `node_modules` holds a real installed COPY,
not a workspace symlink — correct for the persona, who installs the published package like
any customer, and `rm -rf .next` does not touch it. The app had been running a **snapshot
taken before issue 019 existed**.

So issue 019's "RULE #7 re-proved on P01's console" was wrong and is struck from that file.
Those readings were real, but of the wrong build: they confirmed issue **018**, which was in
the snapshot, and could not have exercised 019's new variable at all. The silicaui.com
confirmation was never affected — that app builds from the workspace source directly.

**Half of this was already written down**, which is the part worth noticing. The resume
block said the artifact runs a local copy and that `npm install` would undo it. It did not
say the copy **goes stale** — so the note was true, was read, and still did not prevent the
mistake, because it described the wrong failure mode. A warning that names one hazard can
make you feel covered against a neighbouring one.

`sync-silica.mjs` now copies the workspace build in and **prints whether the ink split
actually landed**, so the step cannot be silent. The tell to remember: a computed style
still reading the OLD value after a cold build looks exactly like a fix that does not work.

Re-proved properly afterwards, in the hardest configuration — **no `data-theme`, dark from
the OS**: the served stylesheet contains `--btn-ink`, the neutral ghost headers still
measure 15.75, and the asterisk reads 9.57 in light.

**Held at 360px**, asserted rather than assumed (`documentElement.clientWidth === 360`): the
popup is exactly 360 wide at `x: 0`, the page never scrolls sideways, the title is still one
line on its own row, and every control is reachable.

**Act 9 next:** the thing that goes wrong for her. She wants a status timeline and has to
find out whether one exists. Two leads are already waiting: `.select-menu-*`, a class
vocabulary the plugin ships and nothing on earth renders — it is not even in the served
stylesheet — and whatever `search_docs` does with the words a freight operator would
actually type.

### 2026-09-18 · Act 9 — The thing that goes wrong for her · **done**

The act is written expecting a failure: the component she wants is missing, or under a name
she would never guess. **For Timeline the premise did not hold, and that is the first
thing to say.** Typed `timeline` into the docs search: **one word, one result, first
attempt.** Opened it, and the page's own sentence is the brief — *"A sequence of dated
events with a connecting rail."* It is also browsable, item 59 of 117 under **Data
display**, which is where anyone would look.

Total time looking: **one search.** The decision was never in doubt.

**What it cannot do is show a status**, and its source says so plainly: *"Colorless."* Two
props — `orientation` and `box` — and the parts take only native HTML attributes. The dot
is hardcoded to `--color-base-content`. For a changelog that is right, and the comment even
points at `Steps` as the sibling for a numbered process.

**Decision: compose, not give up.** `bg-warning` on the component's own `.timeline-dot`
class — silicaui's class plus a Tailwind utility, which RULE #1 names as the whole
sanctioned toolbox. No bespoke CSS, no hex, follows the theme. Four events on
`PFR-2026-0418` in real operations vocabulary, ending on *"Held by customs — invoice value
queried"*, and an `EmptyState` for a reference nobody has filed against — because an empty
rail would read as "nothing has happened", which is a different fact.

**Recorded, not filed: the vertical rail always centres.** `.timeline > li` is a
`1fr auto 1fr` grid, so the opposite-side label column grows with whatever width it is
given — at full page width the date ended up **~425px from the event it dates**. Capping
with `max-w-2xl` brought that to **72px of date and a 44px gap**, which is one utility class
and the sanctioned way to do it. A centred rail is a legitimate, deliberate look and the
docs demo shows it; nothing is unreadable or unreachable. Measured and left alone rather
than inflated into a defect.

**Then two real findings, and neither was the one the act predicted.**

**#025 — the words she would type find nothing.** Forty-one phrases a person would
actually use were run against a live MCP server. **Thirty-three worked**, which is the
honest headline and the reason this is narrow. Eight returned `[]` while the component sat
right there: `status history`, `activity feed`, `audit trail`, `history` (Timeline);
`snackbar`, `toast message` (Toast); `loader`; `user picture`.

Two causes, and separating them was the work. `snackbar`/`toast` share no substring, so no
normalisation reaches it — a true synonym. But `toast` returns 12 and `message` returns 22,
and **`toast message` returns 0**, because no single entry carries both: adding one
ordinary descriptive word turns a working query empty.

The file already documents this failure **twice**, above two concept lists added one at a
time for exactly it — *"an agent reasonably concluded the 8 semantic roles were the whole
set — then refused to write `badge-brand`"*. Third instance, so it gets a mechanism: a
fifteen-entry alias table, every entry from the measured run, and a **relaxation** when
nothing matches every term.

**OR was tried first and rejected on measurement**, which is the part worth keeping. It
"fixed" all eight and made the answers worse — `toast message` returned 34 entries with
Toast **nowhere in the first eight**, because every `Chat*` matches "message" and nothing
ranked them. Dropping a word keeps the AND and therefore the precision.

**Which word to drop had to be measured too.** Dropping the first is right for
`status history` (→ Timeline) and wrong for `toast message` (→ 22 Chat entries). Dropping
the last is exactly the reverse. Taking the relaxation with the **fewest** results gets both
right, because the word that narrows most is the one carrying the meaning.

**And the relaxation announces itself.** A silent one is its own small lie: the caller asked
for two words, got results, and could not tell one was dropped — `phone zzzznotathing` would
read as "zzzznotathing is a real thing here". The first result is now a `search-note` naming
the ignored word.

**An existing check went red, and that was the point of having it.** `verify.mjs` asserted
`search_docs("phone zzzznotathing").length === 0`. Rather than delete it, it was **replaced
with a stronger test of the same intent** — empty was only ever a proxy for "the tool did
not quietly pretend the nonsense word matched", and the note tests that directly. Eight new
checks assert each measured phrase finds its component **in the results**, not merely that
something came back.

**0 of 41 return nothing now**, `status history` puts **Timeline at index 0**, and every
count that worked before is unchanged.

**#026 — and scoring my own timeline found the bigger one.** At 360px in light the dots
read **2.67** and **1.78**. That second number is issue 019's, fixed hours earlier.
Checking the utility rather than the dot:

```
light   text-warning 1.78   text-success 2.41   text-info 2.67   text-accent 2.96   text-error 4.42
```

**Five of seven chromatic roles below AA** — while `<Button color="warning" variant="ghost">`
measured **5.60** on the same page. Same colour, same library, two answers.

This is the third and outermost layer of one defect, and each layer looked complete from
inside it: **019** fixed the component variants, **024** fixed components painting a role by
hand, and the **utility layer** was never touched. RULE #1 names Tailwind utilities as the
other half of the sanctioned toolbox, so the sanctioned path produced the worst text on the
page.

**The first attempt only half worked, and measuring is what showed it.** Emitting the ink
through `addBase` moved `text-accent` 2.96 → 6.88 and left warning, info, success and error
at exactly their old values — because Tailwind writes its own utilities-layer rule for any
colour whose literal class gets scanned, and that beats `base` regardless of order. `accent`
moved only because nothing scans it. **A fix that works for whichever colours happen not to
be used is not a fix.** The file's own comment, written for the `soft` family, had already
said this. Second pass through `addUtilities` with the same `[class]` specificity bump.

**All seven roles now pass AA in both themes** — `warning` 1.78 → **5.60**, `success` 2.41 →
6.46, `info` 2.67 → 6.89, `accent` 2.96 → 6.88, `error` 4.42 → 9.57. `-content` tokens
unchanged, `bg-`/`border-` untouched.

On the screen it was found on, the dots now read **5.60** and **6.89** in light. Seen as
well as measured: the amber and the blue are plainly there on a white page, which is the
whole reason the dot exists.

**And a correction I owed from act 7.** The lead handed forward — *"`.select-menu-*` is a
class vocabulary the plugin ships that nothing renders"* — was chased and turned out to be
**my own mistake**. There is no such class. `select-menu.js` builds its selectors as
`.select` plus a suffix; I read the probe's output, which prints the SUFFIX
(`-group-label`), glued it to the FILENAME, searched the page for a selector I had invented,
found nothing, and wrote the absence up as a finding about the product. The real class is
`.select-group-label`, it is in the served stylesheet, and issue 021's fix is live on it —
no `opacity` in the rule. The on-screen reading taken at the time was right; only the name
was wrong. **Issue 021 and the act 7 log are corrected in place, struck through rather than
quietly deleted, and all thirteen of its components are confirmed on a screen, not twelve.**

**Act 10 next:** the other side. Build for production, open it cold as a stranger with no
dev server, sign in, find `PFR-2026-0420`, read its status — at 360px, in dark, keyboard
only. The artifact must also be re-pinned to the published version once the changeset ships.

### 2026-09-18 · Act 10 — The other side · **done**

`next build`, then `next start`. **Every dev server stopped first and asserted down** — the
docs site on 4011 returned nothing at all for the whole act, so nothing here came from a
dev build.

```
✓ Compiled successfully in 21.6s
✓ Generating static pages (9/9)
BUILD EXIT: 0
```

Nine routes, TypeScript clean, `/shipments/[ref]` and `/api/shipments` correctly dynamic
and the rest prerendered.

**A stranger can do the job.** Cleared storage, no `data-theme`, dark decided by the OS:

| | |
| --- | --- |
| asserted width | **360** (`documentElement.clientWidth`, via the oversized-iframe method) |
| `data-theme` on root | **null** |
| OS prefers dark | true |
| page paints | `lab(3.68 …)` — Silica's dark surface, **not** the browser's |
| rows loaded | **14**, over the real route handler |

That first paint is the whole `prefersdark` chain from act 4 working in a production build
with **no theme script**: nothing stored, nothing chosen, nothing to flash.

**She found it and could read it.** Typed `PFR-2026-0420` into the filter:

> **1 of 14 shipments** · `PFR-2026-0420` · **Awaiting pickup** · Samarqand Qurilish
> Materiallari Ishlab Chiqarish Korxonasi · Tashkent → Riga · $2,015.75 · 2026-10-11

**Reference and Status are both fully visible at rest at 360px** — asserted, not eyeballed
— which is act 7's column reorder paying off on exactly the screen it was made for. Before
that fix Status was one of four columns not on screen at all. The page does not scroll
sideways, the table scrolls inside its own wrapper, and the filter's clear **×** sits inside
the field rather than 718px away, which is issue 020 holding in a production build.

**Every text element on that screen passes AA**, worst **8.10** ("New shipment"), with the
`Awaiting pickup` chip at **10.37** — issue 018's fix, measured one last time on the
shipped artifact.

**The keyboard claim for this act is narrower than the script asks, and that is a
limitation of my harness, not a finding.**

Partway through, the tool's `Enter` stopped driving implicit form submission. The sign-in
form would not submit on Enter — from either field, on a clean page, with both values
verified in the DOM. That looked exactly like a real defect and I spent a long time
isolating it: swapped silicaui's `Button` for a plain `<button type="submit">` (still no
submit), put a plain `<input>` in the same form (submitted), put a plain `<input>` inside
the `Field` (submitted), compared the two buttons attribute by attribute (identical), and
patched `Event.prototype.preventDefault` to catch a caller (**zero calls**).

Then I ran the control that settles it: **a bare HTML form injected into the same page, on
a freshly opened tab.** It did not submit either. So the Enter key from this tool does not
reliably reach the browser's implicit-submission path, and **every reading in that chain was
a measurement artifact.** Nothing was filed. Some of my earlier keystrokes had also gone to
the browser's own chrome rather than the page, which is what made two runs disagree.

The tell, for next time: *when a control that cannot be broken appears to break, the harness
is broken.* The same lesson act 6 recorded for a synthetic `KeyboardEvent` on the Drawer,
arriving from the opposite direction — there the synthetic event was too weak, here the real
one was routed somewhere I could not see.

**The keyboard path is proved, but by act 8, not by this act.** That run drove the same
components with real keys end to end: eight Tabs in a sensible order, focus into the dialog,
a Select opened and chosen with arrows, focus returned to its trigger, a rejected submit
that put focus on the error with one Tab to the field it named, **Escape closing the dialog
with a real key press**, and focus back on the exact button that opened it with a measured
2px ring. Act 10 adds the production build, the cold start and the 360px dark reading; it
does not add an independent keyboard proof, and it is not written up as if it does.

**Nothing new was filed.** Twenty-six issues, all fixed and confirmed, and the last act
found no twenty-seventh — which after nine acts of finding them is a result worth stating
plainly rather than padding.

**Left to do before this ships:** the artifact still runs a copy of the workspace build
(`node sync-silica.mjs`). Re-pin it to the published `@wizeworks/silicaui` once the changeset
goes out, and delete `sync-silica.mjs` with it.
