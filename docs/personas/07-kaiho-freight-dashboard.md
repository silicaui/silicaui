# P07 — Hiroshi Tanabe · Kaihō Analytics

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
**Customer:** developer
**Surface:** the five opt-in composite packages — charts, table, editor, dnd, panels
**Role in the roster:** the only run that installs anything outside core

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P07-kaiho-analytics-dashboard/` |
| Framework | Vite + React + TypeScript |
| Theme | `cobalt` light · `midnight` dark |
| Started from | core only — **and it must be proved that core alone is lean before anything else is installed** |

## The person

**Hiroshi Tanabe, 41, he/him.** Data-platform engineer at a logistics analytics firm in
Yokohama. He builds internal dashboards for operations teams and has strong feelings
about bundle size, because his users are on ships' satellite links.

**Technical level.** High. He reads `package.json` before he reads the README. He will
check what came along with an install and he will be annoyed if it is more than he
asked for.

**What he is nervous about.** "Kept out of core so it stays lean" is a claim he has
heard before from libraries that pull the entire chart engine in through a barrel
import anyway. He is going to measure it.

**What made him look today.** He needs a chart, a table with 800 rows, a rich-text
notes field, a drag-to-reorder list and a resizable split — and he does not want five
different design languages on one screen.

## The business

**Kaihō Analytics** — vessel and container analytics for four shipping lines.

- 4 customers, 60–90 users, all internal operations staff
- One dashboard per line, refreshed every 15 minutes
- **Inconvenient for the software:** the operations room runs the dashboard on a wall
  screen in a dark room all night, and the same dashboard is opened on a phone by the
  duty officer. Same screen, two extremes, no separate mobile build.

## Why he is here today

1. "If I don't install charts, does my bundle know about charts?"
2. "Will five different engines look like one product?"
3. "Does the chart follow the theme, or do I re-theme it by hand?"

## The data

**This is the test data. Type it as written** (RULE #2).

### Vessels — 800 rows, so paging and sorting are real

The first five, and 795 more of the same shape:

| Vessel | Line | TEU | Utilisation | Last port | Delay |
| --- | --- | --- | --- | --- | --- |
| MV Hakuhō Maru | Kaihō Line | 8,540 | 91.4% | Yokohama | +0h |
| MV Emerald Strait | Pacific Bridge | 14,200 | 78.0% | Busan | +14h |
| MV Königsberg Express | Nordhaven | 21,413 | 96.25% | Rotterdam | −2h |
| MV 東京丸 | Kaihō Line | 6,100 | 45.5% | Kobe | +38h |
| MV Santa Catarina do Sul Navegação Costeira | Litoral | 3,980 | 12.75% | Santos | +112h |

Carries: a macron (`Hakuhō`), an umlaut (`Königsberg`), CJK (`東京丸`), a 43-character
vessel name, percentages with two decimals, and a **negative** delay — which is a real
value, not an error.

### The chart series

Monthly TEU throughput, 18 months, four lines. Includes:

- One month at **zero** (a port strike) — which must render as zero, not as a gap
- One month that is **genuinely unknown** (data loss) — which must render as absent,
  **not** as zero. An absence that renders identically to a measured value is the
  defect this whole framework exists to catch.

### The notes field

The duty officer's handover note, typed into the rich-text editor:

> **23:40 — Königsberg Express**: pilot delayed at Rotterdam, berth 8 held. Kobe leg
> unaffected. Do **not** re-route Hakuhō Maru; the Busan slot is confirmed by phone
> (+81 45 212 7730) and is not yet in the system.

Carries bold, a phone number with a `+`, a time, and two vessel names with diacritics.

### The reorderable list

The duty officer's watchlist — 9 vessels, dragged into priority order, and it must
survive a reload.

---

## The build

| Item | What it must have |
| --- | --- |
| Baseline measurement | the bundle with **core only**, measured and written down, before anything else is installed |
| Throughput chart | four series, 18 months, the zero month and the unknown month **visibly different**, redrawing correctly when the theme flips |
| Vessel table | all 800 rows, sortable, selectable, paged, with the 43-character name handled and the negative delay correct |
| Handover notes | the rich-text editor with the note above, saved and reloaded intact |
| Watchlist | 9 vessels, drag-reorderable, order surviving a reload |
| Split layout | a resizable panel group — table left, notes right — with the handle keyboard-operable |
| Final measurement | the bundle with all five installed, measured, and the delta written down |

**Working end to end:** the wall screen in `midnight` at 2560px and the duty officer's
phone at 360px are the **same build**, and both are usable.

**The look.** An operations dashboard: dense, dark-first, the colour reserved for
delay severity and nothing else. Nothing like a brand kit.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Measure core alone

Build with core only. Record the bundle size and what is in it.

**Done when:** the number is written down, and it is confirmed that **nothing** from
charts, table, editor, dnd or panels is present. If a barrel import pulled any of them
in, that is a `major` against the central claim of the package split.

### Act 2 — The chart, and the theme

Install charts. Build the four-series chart. Flip the theme with it on screen.

**Done when:** it redraws in the new theme without him writing a single colour, and the
zero month and the unknown month are **visibly, deliberately different** from each
other.

### Act 3 — 800 rows

Install the table. Load all 800. Sort by delay, by utilisation, by name.

**Done when:** sorting is correct including the negative delay and the CJK name, the
43-character vessel either wraps or truncates acceptably, and the empty state and
loading state have both been seen.

### Act 4 — The notes

Install the editor. Type the handover note with its bold and its phone number. Save,
reload, and read it back.

**Done when:** it round-trips exactly, including the diacritics and the bold — and it
is recorded what happens when someone pastes formatted text from Word into it.

### Act 5 — The watchlist

Install dnd. Reorder the nine. Reload.

**Done when:** the order survives, and the reorder can also be done from the keyboard.

### Act 6 — The split

Install panels. Table left, notes right, draggable handle.

**Done when:** the handle works with a mouse **and** with arrow keys, and the layout
collapses sensibly at 360px rather than becoming two unusable slivers.

### Act 7 — Do five engines look like one product?

Put all five on one screen, in both themes. Look at it as a designer, not as the person
who built it.

**Done when:** every seam where one engine's styling betrays itself is written down —
a scrollbar, a focus ring, a font, a radius, a hover colour. Each one is a `design`
issue.

### Act 8 — The thing that goes wrong for him

The 15-minute refresh arrives while the duty officer has a row selected, a sort
applied, and the notes field half-typed.

**Done when:** it is recorded what survived and what was thrown away — and anything
that silently discarded typed text is a `blocker`.

### Act 9 — The wall and the phone

The finished dashboard at 2560px in `midnight`, and the same build at 360px.

**Done when:** both are usable, the chart is readable at both, and nothing on the phone
needs hover to be discoverable.

### Act 10 — Measure again

Build with all five.

**Done when:** the final number and the delta from act 1 are written down, and it is
stated plainly whether "kept out of core so it stays lean" held.

---

## What only this persona proves

**The five opt-in packages** — and whether core really stayed lean when you do not
install them.

---

## Standing checks

**Wrong moves.** Paste 5,000 characters into the notes field. Sort an 800-row table
while a refresh is in flight. Drag a watchlist item onto itself. Collapse a panel to
zero and try to get it back.

**Reload and deep link.** F5 with a sort applied, a row selected and the panel dragged
— does any of it survive? Then copy the address bar with a filter applied and open it
in a new window.

**Dates.** The 18-month chart crossing two year boundaries, a month with 28 days, and
the refresh timestamp at `23:59` rolling to `00:00`. **Record the machine's timezone**
— this build is read in Yokohama and the data comes from Rotterdam, so a timezone
assumption here is a real defect, not a technicality.

**Contrast and token math at the edges.** Delay severity colours on the chart in
`midnight` on a wall screen, and the same colours at 360px — measured off the computed
style at both. Then the table's zebra striping under a selected row, which is two
surfaces stacking.

**The other side.** Act 9 — the duty officer on a phone, not the person who built it.

**Without a mouse.** Sorting the table, reordering the watchlist and moving the panel
handle — keyboard only.

**A boundary that should hold.** Confirm each composite package's dependencies stay
inside it: nothing from ECharts, TanStack, TipTap, dnd-kit or react-resizable-panels
may appear in a build that did not ask for it. That is act 1, and it is the boundary
this persona exists to police.

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
| Bundle with core only | |
| Bundle with all five | |
| Anything from a composite package present in the core-only build | |
| Did the chart follow the theme with no hand-written colour? | |
| Zero month vs unknown month — visibly different? | |
| Seams where one engine betrayed itself | |
| What survived a refresh mid-edit, and what did not | |
| Console errors and warnings during the run | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen, and record every
measurement as a number.
