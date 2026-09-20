# P07 — Hiroshi Tanabe · Kaihō Analytics

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done — 10 acts of 10
**Run:** 2026-09-19
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
| Acts completed | **10 of 10** |
| Issues filed | **13** — [086](issues/086-one-button-cost-three-hundred-kilobytes.md), [087](issues/087-four-shipping-lines-got-four-shades-of-one-blue.md), [088](issues/088-the-table-sorted-the-other-way-and-said-nothing-while-loading.md), [089](issues/089-sortablelist-paints-a-row-and-a-handle-and-never-says-so.md), [090](issues/090-reordering-without-a-mouse-announced-the-database-key.md), [091](issues/091-the-divider-moved-a-tenth-of-the-screen-per-key-press.md), [092](issues/092-twenty-seven-controls-wore-the-browsers-focus-ring-instead-of-the-systems.md), [093](issues/093-a-numeric-column-could-not-put-its-header-over-its-numbers.md), [094](issues/094-a-shipping-line-was-painted-the-colour-of-a-critical-delay.md), [095](issues/095-a-refresh-moved-the-selection-to-a-different-ship-and-told-nobody.md), [096](issues/096-a-content-colour-you-write-yourself-is-never-checked.md), [097](issues/097-the-chart-tooltip-left-the-chart-and-took-the-names-with-it.md), [098](issues/098-the-only-control-that-sorts-the-table-was-twenty-pixels-tall.md) |
| Issues fixed and confirmed | **13 of 13.** One `blocker` (095), one `high` (096), the rest `medium` and `low`. Every fix deliberately broken and watched go red before being restored |
| Issues blocked, and on what | **None** |
| Screens scored (in both themes at 360px) | **0 — not checked, and not an omission.** P07's surface is five npm packages, not Silica screens. The dashboard it produced is a CONSUMER's app and is not a row in [rating.md](rating.md); the 116 component doc pages were opened by a sweep looking for one thing, not by a person doing a job, and scoring a page a probe visited would be the exact lie RULE #6 exists to stop |
| **Not checked** | **Other browsers.** Every measurement here is Chromium. Issue 092 says the browser's default focus ring "is a different shape in Firefox and Safari" — that is documented behaviour, not something measured in this run. **The carousel's inactive dot and the scroll-area thumb** ([090](issues/090-reordering-without-a-mouse-announced-the-database-key.md)) fade the same way the drag handle did; a first measurement on the docs site was inconclusive because that page's theme state could not be pinned down, and it was not reported as a number. **Measured on 2026-09-19** — not in a browser, which is why the first attempt failed, but composited from the declared tokens of all 20 shipped themes in both modes over all three surfaces. The thumb read **1.60:1 at worst and was under 3:1 in all 120 combinations**; the dot in 57 of 120. Both fixed and guarded by a new probe — [108](issues/108-a-scrollbar-you-cannot-see-and-a-carousel-dot-under-three-to-one.md). Declining to publish a figure this run could not stand behind is what left the lead findable. **A real ships' satellite link** — bundle weight is measured in bytes, never in seconds |

### The numbers

| Record | Result |
| --- | --- |
| Bundle with core only | **233.9 kB JS (gzip 73.5 kB)** + 340.1 kB CSS (gzip 41.3 kB). It was **538.2 kB (gzip 171.9 kB)** when act 1 opened, before [086](issues/086-one-button-cost-three-hundred-kilobytes.md) |
| Bundle with all five | **1713.4 kB JS (gzip 556.7 kB)** + 344.2 kB CSS (gzip 41.8 kB). Five engines cost **483 kB over the wire**; their CSS cost **0.5 kB** |
| Anything from a composite package present in the core-only build | **No.** All five fingerprints absent — each one derived from that package's own `package.json` and each one a string literal minification cannot rename |
| Did the chart follow the theme with no hand-written colour? | **Yes.** Axis ink went from 238 to 26 mean luminance across a theme flip, with no colour written by hand anywhere in the app |
| Zero month vs unknown month — visibly different? | **Yes, and in words.** The strike month prints `Nordhaven 0`; the outage month prints `Pacific Bridge not measured`. `null` draws a break in the line, `0` draws a point on the axis |
| Seams where one engine betrayed itself | **Three, all fixed.** The editor's toolbar wore the browser's focus ring and 26 other controls did too ([092](issues/092-twenty-seven-controls-wore-the-browsers-focus-ring-instead-of-the-systems.md)); numeric headers sat 83px from their numbers ([093](issues/093-a-numeric-column-could-not-put-its-header-over-its-numbers.md)); a shipping line was 5 degrees from the "critical delay" red ([094](issues/094-a-shipping-line-was-painted-the-colour-of-a-critical-delay.md)). **One typeface, one radius scale, one border and one scrollbar across all five, in both themes** |
| What survived a refresh mid-edit, and what did not | **Survived:** the half-typed note byte for byte (258 characters, `Ø` and all), the sort, and sorting while a refresh was in flight. **Did not:** the selection — it was keyed by row POSITION, so a vessel berthing out of the middle moved the tick to nobody while the app went on reporting the old ship's fifteen-minute-stale delay. `blocker` [095](issues/095-a-refresh-moved-the-selection-to-a-different-ship-and-told-nobody.md), fixed |
| Console errors and warnings during the run | **None**, in any act, at any viewport, in either theme |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen, and record every
measurement as a number.

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.

### Act 1 — Measure core alone

**Done when:** the number is written down, and it is confirmed that **nothing**
from charts, table, editor, dnd or panels is present. If a barrel import pulled
any of them in, that is a `major` against the central claim of the package split.

**Outcome:** the package split holds. Something worse was underneath it —
[086](issues/086-one-button-cost-three-hundred-kilobytes.md).

The shell is a real dashboard, not an empty frame: 800 vessels in memory, the
18-month series computed, the KPI cards live, and a placeholder in each slot the
five engines will fill. That matters for act 10 — the delta measured then is the
cost of the five engines and nothing else.

```
JS   525.6 kB  (gzip 167.9 kB)  in 1 file
CSS  340.1 kB  (gzip  41.3 kB)  in 1 file

what the five opt-in packages left behind:
  ✓ silicaui-charts  — absent
  ✓ silicaui-table   — absent
  ✓ silicaui-editor  — absent
  ✓ silicaui-dnd     — absent
  ✓ silicaui-panels  — absent
```

**Nothing from the five is in a core-only bundle.** That is the claim act 1 came
to test and it is true. Each fingerprint is an internal symbol from that engine —
`recharts`, `getCoreRowModel`, `prosemirror`, `@dnd-kit`, `PanelResizeHandle` —
never a class name a consumer might legitimately type, because a fingerprint that
could appear in ordinary app code would make the check useless in the other
direction.

#### And then: 525 kB for five components

React and react-dom are about 217 kB of that. The rest is not.

```
  react only                         217.3 kB   gzip   67.7 kB
  + Button from the PUBLISHED dist   518.9 kB   gzip  165.5 kB   (+301.6 kB)
  + Button from SOURCE               219.3 kB   gzip   68.6 kB   (+2.0 kB)
```

**The component is two kilobytes. Publishing it made it three hundred.** And
importing four more on top of the first added **0.1 kB** — the signature of a
package that is not being tree-shaken at all: the first import pays for
everything and the rest are already there.

A page with one `<Button>` was carrying Select, Slider, NavigationMenu and
ScrollArea, pulled in through the library as its own dependencies. The cause is
the shape of the artifact and not the source: the package shipped as one
pre-bundled `dist/index.js`, and a consumer's bundler seeing one enormous module
keeps whatever it cannot prove dead. `dist` now mirrors `src`, one file per
module, and the published package costs exactly what the source costs.

```
the whole dashboard   before   538.24 kB   gzip  171.94 kB
                      after    233.88 kB   gzip   73.49 kB
```

**98 kB less over the wire**, for a screen that is read on a ship's satellite
link.

#### A check of mine that was worth nothing

The first attempt to answer "is the whole library in here?" grepped the minified
bundle for `PinInput`, `Carousel`, `Calendar` — found none, and concluded the
tree-shaking worked. **Minification renames locals**, so the absence of a name
says nothing at all about the absence of the code. Weighing the modules instead
showed 170.6 kB of `@wizeworks/silicaui-react/dist/index.js` sitting in a bundle
that imports one button. Class-name string *literals* do survive minification and
are honest evidence; identifiers are not.

#### Recorded, not fixed

**Every other package still ships as a single bundle.** The same argument applies
to `silicaui-html`, `silicaui-charts`, `silicaui-table`, `silicaui-editor`,
`silicaui-dnd` and `silicaui-panels`. It matters least for the five opt-in
engines — install the chart package and you want the chart engine — and most for
`silicaui-html`, which the builder and sparx both consume. Named rather than
changed in the same breath: each needs its own before-and-after measurement, and
the next nine acts install five of them and will produce exactly those numbers.

**`react-dom` is 629 kB of the modules in that bundle** and is not ours to
shrink. Written down so the next person reading "234 kB" knows what the floor is.

### Act 2 — The chart, and the theme

**Done when:** it redraws in the new theme without him writing a single colour,
and the zero month and the unknown month are **visibly, deliberately different**
from each other.

**Outcome:** done, after one defect —
[087](issues/087-four-shipping-lines-got-four-shades-of-one-blue.md).

Not one colour is written in `ThroughputChart.tsx`. The theme flip is measured
off the pixels ECharts actually painted, in the strip where the axis labels are:

```
axis ink, mean luminance — midnight 238 (255 px) -> cobalt 26 (164 px)
✓ midnight's ink is LIGHT, for a dark surface
✓ cobalt's ink is DARK, for a light surface
```

**And the two months are two different things**, end to end. The data carries `0`
for the strike and `null` for the outage, and the reader gets told which is
which in words:

```
hovering the OUTAGE month — "2026-07 … Pacific Bridge  not measured  Nordhaven 84,217 …"
hovering the STRIKE month — "2026-03 … Pacific Bridge 95,467  Nordhaven 0 …"
```

On the canvas the strike is a **V down to the axis** and the outage is a **break
in the line** — `connectNulls: false`, so nothing draws across a month nobody
counted. That difference is free, and it survives only because the data never
coerces one into the other on the way in.

#### Four lines nobody could tell apart

The palette the theme handed them:

```
hue angles used — [211, 232, 245, 255]   span 44 degrees of 360
the two hardest to tell apart — Kaihō Line vs Litoral: 13 degrees apart, 2% lightness, 0.04 chroma
```

Four shipping lines, four shades of one blue, two of them effectively identical
on a wall screen at the end of a dark room. The palette was the theme's
**semantic roles in declaration order** — and Kaihō declares one brand colour, so
`secondary`/`accent`/`info` are derived from it and land right next to it.

Worse, it does not stop there: a fifth line would have been `success` green and a
seventh `error` red, on a dashboard whose own rule is that colour means delay
severity and nothing else.

The palette is built now rather than borrowed — anchored on the theme's primary,
walking the hue wheel, alternating lightness so neighbours differ on a second
axis too:

```
hue angles used — [20, 245, 290, 335]   span 315 degrees of 360
the two hardest to tell apart — Kaihō Line vs Pacific Bridge: 45 degrees apart, 6% lightness
```

#### Two of my own checks were measuring nothing

**A literal backspace byte in two regexes.** `\b` written through a shell heredoc
emits the byte it names, so `/Nordhaven:?\s*0<U+0008>/` could never match. One of
the two went red and got investigated; the other was a **negated** test, so it
passed having tested nothing. The repo's own control-character verifier does not
scan scratch probes, which is precisely why the third occurrence of this defect
got through.

**A rebuilt package that never reached the app**, twice and in both directions:
`pnpm install` with a `file:` dependency reused its cached copy, and a `vite`
child that survived a task stop kept the port and went on serving the old module.
Each made a working fix look broken. Both are now handled by copying `dist` over
the installed copy and restarting the server by port rather than by task id.

#### The number, carried to act 10

Installing charts took the dashboard from **233.9 kB to 1,246.0 kB** of
JavaScript — **+336 kB gzipped**, because `import * as echarts from "echarts"`
pulls every chart type and both renderers. A wrapper that accepts an arbitrary
`EChartsOption` cannot know which parts a consumer will use, so this is a
deliberate trade rather than an accident. Recorded here and stated plainly at act
10, which is where the persona asks whether the lean claim held.

### Act 3 — 800 rows

**Done when:** sorting is correct including the negative delay and the CJK name,
the 43-character vessel either wraps or truncates acceptably, and the empty state
and loading state have both been seen.

**Outcome:** done, after one medium defect with two halves —
[088](issues/088-the-table-sorted-the-other-way-and-said-nothing-while-loading.md).

The table did the hard parts first time.

```
· rows handed to the table — 800
· rows drawn at once — 25
✓ the whole fleet reached the table
✓ it pages rather than drawing 800 at once
```

**The negative delay is handled correctly, and the check proves it properly**:
rather than asserting "something sorted", it takes the minimum delay across all
800 rows straight from the data and asserts the table put that exact ship first.

```
· the earliest ship in the data — -6h
✓ ...and it is the one the table put first — -6 vs -6
```

**The names sort with a real collator**, so `MV 東京丸` lands where a Yokohama
desk looks for it. That was checked at row **359** — the first row where a
collator order and a code-point order disagree — because page one is twenty-five
copies of one name and is identical under both. Paging there is a real control,
and it is the only place the check means anything.

**The 43-character vessel**:

```
{"text":"MV Santa Catarina do Sul Navegação Costeira","title":"MV Santa Catarina do Sul Navegação Costeira",
 "overflow":"ellipsis","whiteSpace":"nowrap","rowHeight":41,"tableWidth":1616,"viewport":1700}
```

Truncated with an ellipsis, one line tall, the whole name on `title`, and the
table still inside the window.

The empty state is reached by a **real control** — a search that matches nothing
— and says what to do next rather than showing a blank box.

#### What was wrong

**The prop said the sort cycle was asc → desc → none. It is not.** The first
click is **descending on a numeric column and ascending on a text column** —
which is what a person means by the click, since pressing "Delay" on a fleet list
means *show me the worst*. The behaviour is right and the doc was wrong, so the
doc changed.

**And the loading state was a sighted-only signal.** Eight skeleton rows appear,
the real data goes, and `aria-busy` was never set — so on a dashboard that
refreshes itself every fifteen minutes, a screen-reader user gets the swap with
no announcement at all. One attribute.

#### Four of my own checks were measuring nothing

The sort control is a `<button>` **inside** the `<th>`, so clicking the header
cell hit its padding and the first run read the unsorted seed order as a sorting
bug. Page one is twenty-five identical names, so "not a code-point sort" could
not fail there. `"Santa Catarina"` stopped matching the 43-character ship once
the generated fleet grew a `MV Santa Catarina Carrier`, so the length check was
measuring a 25-character name. And the first click was assumed ascending when the
component is right and the doc was not.

### Act 4 — The notes

**Done when:** it round-trips exactly, including the diacritics and the bold —
and it is recorded what happens when someone pastes formatted text from Word
into it.

**Outcome:** done, first time, no defects.

The note goes in as the duty officer typed it and comes back the same:

```
✓ the vessel with a macron survived        Hakuhō Maru
✓ the vessel with an umlaut survived       Königsberg Express
✓ the phone number is intact, plus sign and all   +81 45 212 7730
✓ the time reads as a time                 23:40
· what is bold — ["23:40 — Königsberg Express", "not"]
✓ the bold is real markup, not asterisks
✓ ...and the word that matters most is one of them
```

Then a real edit, a reload, and a **byte-for-byte** comparison of the stored
HTML — 297 characters both sides, the bold list identical, the diacritics intact.

#### Pasting out of Word

The clipboard payload is the real thing: `MsoNormal` classes, the Office
namespace, an `<o:p>` tag, an inline `#C00000`, a pasted font-family, a smart
quote and a non-breaking space.

What came out:

```html
<p><strong>Berth 8</strong> is held until 06:00&nbsp;— see Hiroshi’s email.</p>
```

```
· what Word brought along, and whether it stuck —
  {"msoClass":false,"msoNamespace":false,"officeTag":false,
   "inlineColour":false,"fontFamily":false,"styleAttr":false}
✓ no mso class names in the saved note
✓ no Office namespace
✓ no <o:p> tags
✓ no hardcoded colour that would fight the theme
✓ no pasted font-family
```

**Not a single `style` attribute survived**, which is the outcome that matters:
the note renders inside whichever theme the dashboard is on, and a pasted
`color:#C00000` would have been a dark-red sentence on a dark surface every
night. The bold survived because bold is meaning; the colour did not because it
is Word's.

The smart quote is kept as a typographic apostrophe and the non-breaking space is
kept as an entity — both right, both the author's own characters rather than
Word's styling.

**Recorded, not a defect:** the paste landed at the START of the note rather than
at the caret. That is the probe, not the product — tiptap owns its own selection
and a `Range` set from outside it does not move the caret. Noted so the next
person reading this log does not take it for a product behaviour.

### Act 5 — The watchlist

**Done when:** the order survives a reload, and the reorder can also be done from
the keyboard.

`pnpm add @wizeworks/silicaui-dnd` — installed with `--ignore-workspace`, because
running `pnpm install` inside the artifact walks up to the repo's own
`pnpm-workspace.yaml` and installs *that* instead, reporting "Scope: all 16
workspace projects" and adding nothing to the app. It looks like a successful
install and it is a no-op.

The nine, as the duty officer keeps them:

```
1 - the nine the duty officer is watching
  · rows drawn - 9
  ✓ nine vessels, not eight and not four
  · the order on screen - ["MV Königsberg Express","MV Santa Catarina do Sul Navegação Costeira",
      "MV 東京丸","MV Hakuhō Maru","MV Emerald Strait","MV Nordlys Carrier",
      "MV Björnøya Passage","MV Salvador Voyager","MV 神戸 Carrier"]
  ✓ every row has a handle
```

**Reachable, and it reorders.** Two Tab presses from the header to the first
handle. Space picks up, arrows move, space drops:

```
3 - reorder it from the keyboard
  · before - ["MV Königsberg Express","MV Santa Catarina do Sul Navegação Costeira","MV 東京丸", …]
  · after  - ["MV Santa Catarina do Sul Navegação Costeira","MV 東京丸","MV Königsberg Express", …]
  · the row that was picked up - "MV Königsberg Express" moved 0 -> 2
  ✓ ...and it is the one that moved, by exactly two places
  ✓ nothing was lost or duplicated
```

Two arrows, two places. Not "something changed" — the row that was picked up is
the row that moved, and it moved by the number of keys pressed.

**The mouse agrees**, and **the reload is the real question:**

```
5 - reload, which is the actual question
  · what is stored - ["v-santa-catarina","v-5","v-tokyo-maru","v-konigsberg-express", …]
  ✓ the order came back exactly
  ✓ ...and that order is NOT just the default, so surviving means something
```

That second line is the control. "The order survived" is worth nothing if the
order it survived into is the order it would have had anyway.

**Standing check — drag a watchlist item onto itself.** Picked up, moved 9px,
moved back, dropped. The order is unchanged and nothing threw. `SortableList`
returns early when `active.id === over.id`, which is the right shape: the drop is
a no-op rather than a reorder-to-the-same-place that fires `onReorder` and writes
storage for nothing.

#### Two defects, and they are the same defect

**[089](issues/089-sortablelist-paints-a-row-and-a-handle-and-never-says-so.md) — the component paints a row and a handle and never says so.** I read
the README, wrote the documented example, and got a bordered box inside a
bordered box with two different radii, whose contents fell **258px short of a
467px row**. The package ships a complete `.sortable-item` and a complete
`.sortable-handle` — grab cursor, hover ink, focus ring — and mentions neither in
its README, its props table or its types. The handle's class is prefix-dependent,
so a consumer who somehow found it could not hardcode it. So I hand-rolled a
handle in Tailwind, forgot the focus ring, and painted a second row on top of the
first. Fixed: `ctx.handleProps` now carries the handle's class, a single wrapper
fills its row, `itemClassName` reaches the `<li>`, and the README says what the
component does.

**[090](issues/090-reordering-without-a-mouse-announced-the-database-key.md) — the keyboard path worked and could not be used.** Everything a
person who cannot see the list is told, while reordering it:

```
"Draggable item v-santa-catarina was moved over droppable area v-5."
```

Two database keys and no position. And the grip you reach for measured **2.88:1**
in the light theme — under the 3:1 a control owes, on the only thing that says
the list is reorderable at all. Fixed: the list now announces
*"MV Santa Catarina do Sul Navegação Costeira moved to position 2 of 9"* via a new
`getItemLabel`, and the grip went from 45% to 65% ink — **7.32:1 dark, 5.31:1
light**, still quieter than the 16:1 label beside it.

Both deliberately broken and watched go red before being restored: the wrapper
310px short, the announcements back to `v-5`, the grip back to 2.88:1.

#### Four of my own checks were measuring nothing

The worst run of self-inflicted checks so far, and every one of them read as a
product defect:

- **A CSS scan that walked only the top level of each stylesheet.** Tailwind v4
  puts everything in `@layer`, whose rules have no `selectorText`, so it found
  zero rules for every class on the page and I nearly filed "the only
  drag-and-drop component in the system ships class names with nothing behind
  them." It has a control now — `.badge`, a class that is definitely styled.
- **A grep with the wrong extensions.** `--include=*.ts --include=*.css
  --include=*.mjs` across a plugin whose components are all `.js`. It found
  nothing, and that nothing agreed with the bad scan. **Two wrong checks agreeing
  is not corroboration**, and it very nearly cost a fix aimed at the wrong thing.
- **A width check that measured the one row that cannot fail.** It read the first
  row — the longest vessel name, which stretches to fill whatever the layout
  does. Measuring every row turned `-8px` into `-258px`.
- **A contrast number that was pure fiction.** It pulled the digits out of the
  *text* of `oklab(0.95 -0.00273616 -0.00751754 / 0.45)` with a `[\d.]+` regex and
  read them as 0-255 channels. It reported the grip at 1.77:1 in **dark**; the
  truth is 4.09:1 in dark and 2.88:1 in **light** — the opposite theme. The tell
  was in the same table and I nearly walked past it: full-strength body ink
  scored **1.03:1 against its own surface**, which cannot happen. Rewritten to
  paint each colour into a canvas and read the pixel back, and to prove itself on
  black-on-white (21) and white-on-white (1) before it is trusted.

Two tooling traps recurred and both now have a permanent fix:

- `pnpm install` inside the artifact silently installs the workspace instead.
  `--ignore-workspace`.
- `restart-dev.mjs` died because `Remove-Item -ErrorAction SilentlyContinue`
  **still exits 1** when the path is already gone, so clearing an already-cleared
  vite cache killed the restart. Wrapped in a try/catch. The same shape killed
  the docs site: `TaskStop` stopped the wrapper and `next dev` kept port 4011,
  so the next start died on `EADDRINUSE` — killed by port, as with 5194.

**Act 5 holds.** Nine rows, reorder by keyboard and by mouse, the order surviving
a reload into something that is not the default, a self-drop that changes
nothing, no console errors, and the grip readable in both themes.

### Act 6 — The split

**Done when:** the handle works with a mouse **and** with arrow keys, and the
layout collapses sensibly at 360px rather than becoming two unusable slivers.

`pnpm add @wizeworks/silicaui-panels`. The fleet table went left, the handover
note went right, and the divider between them is a `ResizeHandle`.

**The divider is a real control before it is a visual one:**

```
{"role":"separator","tabindex":"0","label":"Resize the fleet table against the
 handover notes","now":"68","min":"30","max":"80","width":10,"height":510}
```

Mouse first — drag it 260px left and the panels move together, not
independently:

```
panel widths at rest                      [1058, 498]
panel widths after dragging 260px left    [800, 756]
✓ the two panels still add up to the group - 1556 vs 1556
```

That last line is the one worth having. Two panels that both changed is not the
same fact as two panels that still tile the group.

**Where you leave it is where you find it:**

```
before the reload  [644, 912]
after the reload   [644, 912]
✓ ...and that is NOT the default position, so surviving means something
    - it is at 41%, the default is 68%
```

**Standing check — collapse a panel to zero and get it back.** Dragged the
divider all the way right: the notes panel went to **0px**, the divider **stayed
on screen at its full 510px height**, and dragging back brought the notes to
402px. That is the behaviour that matters — a collapse that takes the handle with
it is a one-way door, and this one is not.

The keyboard does the same thing: 40 ArrowRights collapse it, ArrowLeft brings it
back.

**The phone, which is the harder half.** A side-by-side split of a 360px screen
is two 170px slivers, so below 900px the group turns:

```
{"direction":"vertical","panels":[{"w":326,"h":340},{"w":326,"h":160}],
 "handle":{"w":326,"h":10},"docScrollsSideways":false,"scrollWidth":360}
```

Full-width panels stacked, the divider still there and still useful, and no
sideways scroll. The saved layout is keyed by direction on purpose — a percentage
that made sense side by side is not the same split stacked, and one `autoSaveId`
for both is how a phone inherits a wall screen's divider.

#### One defect

**[091](issues/091-the-divider-moved-a-tenth-of-the-screen-per-key-press.md) — one arrow press moved a tenth of the screen.**

```
what each ArrowLeft moved      [10, 10, 10, 10] percent of the group
one press, in pixels           156px of 1556px
positions to choose between    6  (min 30% to max 80%)
```

Not a missing keyboard path — the keyboard path is there, which is why nothing
flags it. It simply is not the same control the mouse gives you: a pointer has
pixel precision and a key press had six stops in the whole range. And the coarse
step bought nothing, because `Home`, `End` and Shift+arrow already cover travel.
Fixed by giving the wrapper a real default — 1% a press, **51 positions** instead
of 6, still overridable with `keyboardResizeBy`.

#### Recorded, not fixed

**The separator announces a maximum it then exceeds.** `aria-valuemax="80"`, and
`End` takes it to `aria-valuenow="100"`. A `valuenow` outside its own declared
range is invalid, and the cause is upstream — `react-resizable-panels` computes
the max from the neighbour's `minSize` and ignores that the neighbour is
`collapsible`. **Deliberately not patched from the wrapper**: the only fix
available from out here widens the range *after* the user has already gone past
it, which makes the attribute consistent rather than true, and buys that with a
DOM-mutation hack inside a wrapper whose whole value is being thin. Written down
with a reproduction so it can go upstream.

**The chart's axis labels collide with its legend at 360px** — `100,000` sits on
top of `Nordhaven` / `Litoral`. Carried to act 9 — and **resolved there**. The legend now gets its own band and the plot starts below it (`grid.top: 72`, `legend.top: 0` in `ThroughputChart.tsx`); at the 36px ECharts leaves by default the legend's second line sat on the axis. `type: "scroll"` was tried and rejected — it showed two of the four shipping lines, and a legend you have to page through is worse than one that wraps. An APP-level fix on purpose: the band's height depends on how many series there are and how long their names are, which the library cannot know.

#### Two more of my own checks were measuring nothing

- **A Home-key test that could not fail.** It pressed `Home` while the divider
  was already parked at its 30% minimum and then asserted it was at 30%. It now
  moves off both ends first, parks at 48%, and watches `Home` take it to 30 —
  which is also what exposed `End` going to 100.
- **A contrast reading against `document.body`, which paints nothing here.**
  `getComputedStyle(document.body).backgroundColor` is `rgba(0, 0, 0, 0)`, so
  every ratio was measured against black — fine by luck on the dark theme,
  meaningless on the light one, where it claimed the grip was 3.16:1. Walking up
  to the nearest painted ancestor gives the real numbers: **7.13:1 in midnight,
  6.46:1 in cobalt**. The same run also had the theme flipped and measured in one
  call, so both themes reported identical numbers; it waits for the flip now.

**Act 6 holds.** Mouse, keyboard, collapse and restore both ways, the position
surviving a reload into something that is not the default, a visible grip in both
themes, a 26px grab zone on a 10px bar, and a phone layout that stacks instead of
splintering.

### Act 7 — Do five engines look like one product?

**Done when:** every seam where one engine's styling betrays itself is written
down. A scrollbar, a focus ring, a font, a radius, a hover colour.

All five on one screen, in both themes, measured rather than squinted at:

```
  surface                   radius   font              size    border
  core: card                6px      ui-sans-serif     16px    1px oklch(0.3 0.022 255)
  core: button              4px      ui-sans-serif     12px    1px …
  core: badge               16px     ui-sans-serif     11px    1px …
  charts: chart box         0px      ui-sans-serif     16px    0px …
  table: scroll frame       0px      ui-sans-serif     16px    0px …
  editor: frame             6px      ui-sans-serif     16px    1px …
  editor: toolbar button    4px      ui-sans-serif     13.6px  0px …
  dnd: row                  4px      ui-sans-serif     16px    1px …
  panels: group             6px      ui-sans-serif     16px    1px …
```

**What is already one product, and it is the majority:**

- **One typeface.** `ui-sans-serif` everywhere; not one engine brought its own.
- **Four radii, and they are a scale, not an accident**: `6px` for a box (card,
  editor frame, panel group), `4px` for a field (button, dnd row, toolbar
  button), `16px` for a pill (badge), `0` for things that are not surfaces. Five
  engines independently landing on the same three tokens is the system working.
- **One border colour and width** on every framed surface, both themes.
- **One scrollbar.** Three scrolling regions, identical `scrollbar-width` and
  `scrollbar-color`.

#### Three seams, all three fixed

**[092](issues/092-twenty-seven-controls-wore-the-browsers-focus-ring-instead-of-the-systems.md) — the focus ring changed depending on which engine you were standing on.**

```
core     button   outline 2px solid oklch(0.95 0.008 250)  offset 2px
dnd      span     outline 2px solid oklch(0.7 0.14 245)    offset 2px
table    input    outline 2px solid oklch(0.7 0.14 245)    offset 2px
panels   div      outline 2px solid oklch(0.7 0.14 245)    offset -2px
editor   button   outline 1px auto  rgb(16, 16, 16)        offset 0px
```

`outline-style: auto` is a value nothing in this codebase authors — it comes from
the user-agent stylesheet, which means the editor's toolbar drew no ring and the
browser filled one in. `.rich-text-editor-btn` had no `:focus-visible` rule;
forty-four other component files do.

That tell can be swept for, so it was: **all 116 component pages**, focusing every
focusable element in the demo column and comparing it, its ancestors and its
descendants unfocused against focused. **27 controls across 17 components** drew
the browser's ring instead of the system's — carousel arrows and dots, number-field
steppers, power-search chips, the tree toggle, the dropzone, wizard steps, dock
items, the sidebar trigger, tag and multi-select chip removes, the outline link,
the diff resizer, range, stack, wordmark. All 27 fixed; the sweep now returns
**0**, with `.btn` passing as a control throughout.

**I was wrong about why it mattered, and I only found out by looking.** The fix's
first comment said the browser's ring is "black on black" on a dark theme. It is
not — Chromium adapts it, white on dark and black on light, screenshotted both
ways before the issue was written. So this is not an accessibility failure. It is
a consistency one: 1px where the system's is 2px, no offset, a colour that ignores
the theme, and a different shape in Firefox and Safari. Worth fixing, worth not
overstating.

**[093](issues/093-a-numeric-column-could-not-put-its-header-over-its-numbers.md) — the word "TEU" sat 83px to the left of the numbers it names.**

```
column          align   header right   cell right   gap
  TEU           left    576            660          -83
  Utilisation   left    759            807          -48
```

A consumer supplies a cell renderer and never touches the `<th>`, the `<td>` or
the sort button, so only `DataTable` could fix it. It takes `meta: { align:
"right" }` now, through TanStack's own per-column `meta`. Gap: **0px on both**.
The cells got shorter too — no more `<span className="block text-right">`.

**[094](issues/094-a-shipping-line-was-painted-the-colour-of-a-critical-delay.md) — one shipping line was painted the colour of a critical delay.**

This dashboard's own rule is that colour means how late a ship is and nothing
else. Measured against what was on the screen beside it:

```
  Litoral          oklch(76% 0.14 20)    h 20
  critical (error) oklch(0.66 0.2 25)    h 25   e.g. "112h late"
  5 degrees apart
```

**And it was my own earlier fix that did it.** Issue 087 spread the chart palette
across the whole hue wheel to stop four lines being four shades of one blue. The
whole hue wheel runs through the reds and the ambers, which is where `success`,
`warning` and `error` live. A categorical series is a NAME; a semantic role is a
JUDGEMENT; the generator knew about both and handed a name a judgement's colour.

Fixed by reading the reserved hues out of the theme (so a theme with an orange
`error` avoids orange) and spreading the series over what is left — **and by
shrinking the palette from eight colours to six**, because eight across the
remaining 228 degrees is 28 degrees apart, three degrees above the bar, while six
is 38. The seventh series now repeats the first, which is the better failure: a
repeated colour is obviously wrong, two series 28 degrees apart are quietly
confusable. **5 degrees became 27**, and 087's own check went from 45 to 38
degrees, still well clear.

#### Two of my own checks were measuring nothing, and one was measuring the wrong thing

- **"One focus ring, not one per engine" was the wrong bar**, and it failed even
  after everything was fixed. Two of the variations are reasoned: `.btn` rings in
  the button's own accent (`var(--btn-accent, …)`) because a primary ring on a
  primary button is invisible, and a thin control insets its ring so it is not
  drawn on its neighbour. The real question is whether each engine draws a ring
  at all, in a theme colour, at the system's width — which is what it asks now.
- **The sweep was wrong four times before it was right**, and each wrong version
  produced a confident number: **0** (it scraped a 404 page for links and opened
  nothing), **108** (it counted the documentation's own disclosure once per page),
  **34** (it called a background-change "no ring"), **29** (it only looked
  upwards, and `li.tree-item:focus-visible > .tree-node` puts the ring on a child
  on purpose). The answer is 27 and it has a control.
- **The severity-collision check compared sRGB hue alone**, then was widened to
  act 2's three-axis test — and **that version would have passed the original
  defect**, because 0.06 of chroma clears the chroma bar exactly. It asks a
  narrower question now, on purpose: *does a line read as a severity* is about the
  colour family, so it is judged on hue. *Can two lines be told apart* is still
  judged on all three. Using one test for the other question is how a check comes
  back green about something you can see.

#### Recorded, not a defect

**"Saved 17:57:35" is a green badge** in the notes, on a dashboard that reserves
colour for delay severity. It is `Badge` used correctly — state on a thing — but
it is a second meaning for green on the same screen. An app-level choice, not a
library one.

**The chart's axis labels collide with its legend at 360px.** Carried to act 9 — and **resolved there**. The legend now gets its own band and the plot starts below it (`grid.top: 72`, `legend.top: 0` in `ThroughputChart.tsx`); at the 36px ECharts leaves by default the legend's second line sat on the axis. `type: "scroll"` was tried and rejected — it showed two of the four shipping lines, and a legend you have to page through is worse than one that wraps. An APP-level fix on purpose: the band's height depends on how many series there are and how long their names are, which the library cannot know.

**Act 7 holds.** One typeface, one radius scale, one border, one scrollbar, and —
after three fixes — one focus ring, columns whose headers sit over their numbers,
and no line that reads as a severity.

### Act 8 — The thing that goes wrong for him

**Done when:** it is recorded what survived the fifteen-minute refresh and what
was thrown away — and anything that silently discarded typed text is a blocker.

The refresh had to become real first. It was a spinner over a module constant;
it now returns what a fleet feed returns: new delay figures, minus the vessel
that has berthed, plus one just picked up. The berthed vessel leaves **from the
middle**, because ships do not berth in array order — and that detail is the
whole act.

The desk, set up the way the duty officer has it: **Delay sorted descending, one
vessel ticked, a sentence half-typed in the note.** Then the refresh, fired
without leaving the note — no blur, no click elsewhere, which is what a timer
does.

#### What survived

**The half-typed note, byte for byte.** 258 characters before, 258 after,
identical, `Ø` and all. `RichTextEditor` takes `defaultValue`, so it is
uncontrolled and a parent re-render cannot reach in and replace what someone is
typing. That is the single most important thing on this screen and it was never
at risk.

**The sort**, column and direction.

**Sorting mid-refresh**: the header clicked while a refresh was in flight, no
console errors, sort landed.

**5,000 characters pasted into the note**: 5,507 held, the earlier sentence still
in there, the editor capped at **429px** rather than growing without bound, page
still 1,700px wide with no sideways scroll.

#### What did not — [095](issues/095-a-refresh-moved-the-selection-to-a-different-ship-and-told-nobody.md), a blocker

```
before                                          after
tick on screen  ["MV Açu Navegação Costeira"]   []
app believes    ["MV Açu Navegação Costeira"]   ["MV Açu Navegação Costeira"]
its delay       139                              139
the row says    139h late                        138h late
```

**Nothing ticked on screen, and the app holding a vessel whose delay the table no
longer shows.** Two defects compounding into the worst kind — the screen and the
app disagree and neither says so:

- **Selection was remembered by POSITION.** `DataTable` never set TanStack's
  `getRowId`, so the selection map is keyed by array index. Drop a vessel out of
  the middle and every row after it shifts by one; the tick then belongs to a row
  number, not a ship.
- **The caller was never told.** The effect surfacing the selection ran on
  `[rowSelection, selectable]`. A data change does not change the selection
  *key*, so it never re-fired, and the consumer kept the row objects it was
  handed before the refresh.

Fixed: a row with an `id` is identified by it — checked across the **whole**
dataset, because half-identified data would key some rows by id and some by
position, which is worse than either — plus a `getRowId` prop for data whose
identity is something else, and `data` in the effect's dependencies. After:
`139 -> 142`, and the row on screen says `142h late`. The screen and the app
agree on the same number.

#### My first version of this act passed, and it was wrong

The first `refreshFleet` dropped the **first** row and added one at the front.
That leaves every other row's index exactly where it was — so a positional
selection survived **by luck**, every check went green, and the act would have
been signed off with the blocker still in it.

It only showed up because the second version made the departing vessel leave from
the middle, which is both what actually happens and the only version that asks
the question.

The same run also nearly missed it a second way: the callback reported the right
vessel NAME after the refresh, which looks like a pass. A stale callback holds an
object with the same name. **The delay is what moves**, so the check reads that
instead — and the on-screen row's delay beside it, so the two have to agree.

And a third: "no row is ticked afterwards" means nothing unless a row was ticked
beforehand. The before-reading is a control now, not an assumption.

**Act 8 holds** — one blocker found and fixed, the typed text never at risk, and
everything else through first time.

### Act 9 — The wall and the phone

**Done when:** both are usable, the chart is readable at both, and nothing on the
phone needs hover to be discoverable.

Same build, two extremes: **2560×1440 in `midnight`**, read from the far end of a
dark operations room, and **360×780 with touch**, held by the duty officer.

#### The wall

```
{"chart":{"w":1625,"h":288},"table":{"w":1657},"bodyFont":"16px",
 "sideways":false,"scrollWidth":2560}
```

No sideways scroll, the chart got 1,625px, body text still 16px. The KPI row
spreads to four across, the chart and watchlist sit side by side, and the table
and notes split below.

**Standing check — the delay colours, measured off the computed style at this
size**, and the zebra striping under a selected row, which is two surfaces
stacking:

```
odd row                rgba(0, 0, 0, 0)
even row               oklch(0.22 0.02 255)
selected on a stripe   oklab(0.7 -0.059 -0.127 / 0.12)
✓ the stripes are actually different
✓ a selected row reads as selected ON a stripe
✓ ...and on a plain row too
```

The selection is a translucent tint, so it composites over the stripe instead of
replacing it — which is why it survives being stacked on one.

#### The phone

```
{"sideways":false,"scrollWidth":360,"bodyFont":"16px","chart":{"w":278,"h":288}}
✓ the page does not scroll sideways — scrollWidth 360 of 360
✓ body text is still at least 16px
✓ everything you can press says what it is — 0 unnamed
```

The split turns vertical (act 6), the watchlist truncates names and keeps its
badges, and the table scrolls horizontally inside its own frame rather than
pushing the page.

#### Four defects

**[096](issues/096-a-content-colour-you-write-yourself-is-never-checked.md) — the badge that says "this ship is in serious trouble" was at 3.22:1.**

```
"on time"    8.33:1
"14h late"   9.88:1
"112h late"  3.22:1     <- under AA
```

Kaihō's theme declares `--color-error` and `--color-error-content` by hand, and a
near-white ink on a 66% red is 3.22:1. The light theme had the same shape on
amber at 3.60:1.

**And nothing in the engine was ever going to catch it.** Three ink checks exist
and all three open with the same sentence — *"a color whose `-content` is declared
alongside it never reaches the rule"* — which is correct about the derivation and
had not been followed through: **the engine measures the ink it picks for you and
accepts without a glance the ink you picked yourself.** That is backwards. A
derived ink comes from a rule validated over a 51,480-sample sweep; a declared
one came from somebody choosing a colour by eye. Both values are literals in the
same block, so checking costs one contrast calculation.

Fixed in the plugin, and the warning tells you the way out rather than just the
number: *"black measures 6.14:1 here"*. The static check and the rendered page
agree to two decimals — **3.22 both ways** — which is what says it is measuring
the thing. Kaihō's themes then fixed: **5.07:1** at both sizes.

**[097](issues/097-the-chart-tooltip-left-the-chart-and-took-the-names-with-it.md) — the tooltip ran off the edge and took the names with it.**

```
9
ō Line        97,369
c Bridge      68,659
haven         70,255
al            87,512
```

Four figures and no way to know whose. ECharts places the tooltip beside the
pointer and lets it leave the chart; at 278px there is nowhere to go. Fixed with
`confine: true` in the Silica theme — a default, because a tooltip that leaves
its container is never what anyone wanted.

**[098](issues/098-the-only-control-that-sorts-the-table-was-twenty-pixels-tall.md) — the sort buttons were 20px tall**, the only way to sort the
table, under the 24px a thumb needs. `minHeight: 1.5rem`, no layout change.

**And the axis lied on the wall screen.** The last x-axis label read **`2026-0`**
— a month that does not exist — because the label is centred on the last data
point and `grid.right` was 16px. Now 40px, and it reads `2026-09`.

#### Recorded: the divider is not as small as it looks

Painted 326×10. Measured with **real touch input through the devtools protocol**:
grabbing at 0px and 8px from the centre works, 14px does not — an effective target
of **about 26px**, which clears the minimum. The panels library widens the
pointer hit area beyond the painted bar.

#### Three of my own checks were measuring nothing

- **The chart tap landed off the screen.** The chart sits below the fold on a
  360×780 phone and the probe tapped at y=895 in a 780px viewport, then reported
  that the chart does not answer a tap at all. It scrolls to the chart first now
  — and only then was the real defect, the clipped names, visible. **A check that
  misses its target does not report "not found", it reports a defect.**
- **The first touch measurement failed at every distance including zero.** That
  is its own control: synthetic `TouchEvent`s do not reach a library listening
  for pointer events, so the method was wrong, not the handle. Redone through the
  devtools protocol with a passing control on target.
- **The tooltip detector matched on computed `position: absolute` plus a text
  pattern** and found nothing even with the tooltip on screen. It reads the
  `style` attribute and filters on visibility now, checked against three ways of
  summoning it — a held `touchstart`, a full tap, and a mouse hover — so a
  failure on one is distinguishable from the tooltip being broken.

**Act 9 holds.** Both extremes usable, the chart readable at 1,625px and at
278px, every delay badge over AA at both, nothing unnamed, and no tap target
under 24px painted or effective.

### Act 10 — Measure again

**Done when:** the final number and the delta from act 1 are written down, and it
is stated plainly whether "kept out of core so it stays lean" held.

```
                        JS                    CSS
core only (act 1)       233.9 kB  gzip  73.5 kB     340.1 kB  gzip 41.3 kB
all five (act 10)      1713.4 kB  gzip 556.7 kB     344.2 kB  gzip 41.8 kB
                      --------------------------
delta                 +1479.5 kB  gzip +483.2 kB    +4.1 kB   gzip +0.5 kB
```

Five engines cost **483 kB over the wire**, and the CSS for all five components
cost **half a kilobyte**.

#### Where the bytes went

Subtracting five builds would hide the shared code, so this builds the real
dashboard once and asks rollup which module contributed how many rendered bytes,
grouped by the package it came from. Rendered bytes, not gzipped — gzip is a
property of the whole file, so a per-module gzip figure would be an invention.

Two conventions, named because both appear above. **`kB` here is 1024 bytes**,
the same convention act 1 used, so the before and after subtract correctly; vite
prints the same file as `1,754.56 kB` using 1000. And these are **rendered**
bytes, before minification, so they sum to more than the built file does.

```
643 modules, 4627.9 kB of rendered code

  echarts (charts)                    2713.1 kB    58.6%
  tiptap + prosemirror (editor)        798.2 kB    17.2%
  react-dom                            638.5 kB    13.8%
  dnd-kit (dnd)                        116.0 kB     2.5%
  tanstack table (table)               112.4 kB     2.4%
  react-resizable-panels (panels)       79.9 kB     1.7%
  other dependencies                    73.6 kB     1.6%
  react                                 31.8 kB     0.7%
  the dashboard's own code              22.7 kB     0.5%
  silicaui-react (core)                 12.0 kB     0.3%
  silicaui-table (wrapper)               9.2 kB     0.2%
  silicaui-charts (wrapper)              8.2 kB     0.2%
  silicaui-editor (wrapper)              7.8 kB     0.2%
  silicaui-dnd (wrapper)                 3.5 kB     0.1%
  silicaui-panels (wrapper)              0.9 kB     0.0%

the five ENGINES        3819.6 kB   (82.5%)
the five WRAPPERS         29.6 kB   ( 0.6%)  <- what silicaui itself adds
react + react-dom        670.3 kB   (14.5%)
silicaui core             12.0 kB   ( 0.3%)
```

#### Did "kept out of core so it stays lean" hold?

**Yes, and the number is 0.6%.**

Everything Silica wrote across all five opt-in packages is **29.6 kB** — a
`SortableList`, a `DataTable` over TanStack, a `RichTextEditor` over TipTap, a
`Chart` over ECharts and a `ResizablePanelGroup` over react-resizable-panels,
together, for less than a third of what `react` alone costs. **Core itself is
12.0 kB** for the Buttons, Badges, Cards, SearchInput and Checkboxes on this
screen. And the CSS for all five is 0.5 kB gzipped, because the classes were
always in the plugin whether or not the packages were installed.

**And it did not hold when this run started.** Act 1 measured one `Button` at
**301 kB** because `silicaui-react` shipped as a single pre-bundled file that no
consumer's bundler could tree-shake ([086](issues/086-one-button-cost-three-hundred-kilobytes.md)). The claim was true about
the *design* and false about the *artifact*, which is exactly the kind of gap a
number finds and a README does not. Fixed in act 1; this measurement is what it
looks like afterwards.

**The honest caveat, in the other direction:** 82.5% of this bundle is five
third-party engines, and Silica chose every one of them. Choosing ECharts is
choosing 2.7 MB. "Out of core" means a consumer who does not want a chart does
not pay for one — it does not mean a consumer who wants a chart pays a little.
On a ship's satellite link, `import * as echarts` is the number that matters, and
it is **336 kB gzipped** on its own (recorded in act 2 and unchanged: a wrapper
that accepts an arbitrary `EChartsOption` cannot know which chart types the
consumer will use, so it cannot import less).

---

## Standing checks

The ones that are not an act of their own.

**The machine this was measured on:** `America/Los_Angeles`, locale `en-US`. The
dashboard is read in Yokohama (`Asia/Tokyo`) and the feed comes from Rotterdam.
Recorded because a timezone assumption here is a real defect, not a technicality.

**Dates.** The 18-month series, across two year boundaries and a 28-day month:

```
months on the axis — 18: 2025-04 .. 2026-09
✓ it crosses two year boundaries
✓ ...both of them present and in order
✓ February is there, the month with 28 days
· the step between consecutive months — [1]
✓ every step is exactly one month, with no repeat or skip at the year end
```

**23:59 rolling to 00:00**, with the browser's clock frozen eight hours from this
machine's:

```
one minute before midnight in Tokyo    "Refreshed 28 Feb 23:59 JST"
one minute after                       "Refreshed 01 Mar 00:00 JST"
a UTC time of 2026-02-28T23:59:30Z     "Refreshed 01 Mar 08:59 JST"
```

23:59 on 28 February becomes 00:00 on **1 March** — the right next day in a year
without a 29th — and a UTC instant nine hours earlier lands on the correct Tokyo
date. The header was a hardcoded string (`Refreshed 23:45 JST`) at the start of
this act; it is a real timestamp now, formatted with an explicit
`timeZone: "Asia/Tokyo"` and labelled `JST`, because a bare `toLocaleTimeString()`
shows the clock of whatever box the browser is on — correct on a laptop in Japan
and silently eight hours out on the wall screen's own machine.

**Reload with everything set at once** — a sort applied, a row ticked, and the
divider dragged 240px:

```
before   {"sort":"Delay descending","ticked":["MV Nordlys Strait"],"panels":[820,736]}
after    {"sort":null,"ticked":[],"panels":[820,736]}
```

The **divider survives** (it is persisted by direction). The sort and the
selection **do not** — and the table comes back visibly unsorted and unselected,
so nothing claims a state it does not have. That is the honest outcome rather
than the desirable one, and it is written down as measured.

**Deep-link a filter.** The filter was not in the address bar at all when this
check started; it is now:

```
the address bar now reads — /?line=Nordhaven&q=Rotterdam
the table says             — "12 of 800 rows"
what the other window shows — {"rows":"12 of 800 rows","activeLine":"Nordhaven","search":"Rotterdam"}
```

Opened in a **separate browser context** — no cookies, no storage — and it shows
the same twelve rows with the same chip lit and the same text in the search box.

#### Two more of my own checks were measuring nothing

- **`keyboard.press("F5")` does not reload a page.** It is a browser-chrome
  shortcut and Playwright does not act on it, so the first run of the reload
  check pressed it, nothing happened, and every value came back identical — which
  read as "the sort, the selection AND the divider all survived". It is
  `page.reload()` now, and the real answer is the opposite for two of the three.
#### Five, then six, then seven literal backspace bytes — all caught by the repo, not by me

The final `pnpm verify` went **red**:

```
Raw control characters in source. Write the escape instead.
  docs/personas/artifacts/p07-kaiho-analytics-dashboard/.measure/attribute.mjs:70  U+0008
```

The same accident as [078](issues/078-two-regexes-that-could-never-match.md) and
[087](issues/087-four-shipping-lines-got-four-shades-of-one-blue.md), for the
fifth time in this run: a heredoc ate the backslash in `backslash-b` and left the byte it
names, in the regex that decides which bundle bucket React goes in. **The repo's
own `verify-no-control-chars.mjs` is what found it**, which is the whole argument
for that probe existing — my scratch probes check themselves now, but this file
lives in the repo and the repo checked it.

Then it happened AGAIN, in the comment being written to explain it, because the
replacement string went through a JavaScript string literal where a backslash
followed by `b` is also a backspace. The line now contains no escape sequence at
all and spells it out in words.

**And a third time, in this paragraph.** Writing the sentence above through a
Python heredoc put two more of the byte into THIS FILE, and the final `pnpm
verify` of the run went red on them:

```
docs/personas/07-kaiho-freight-dashboard.md:1327  U+0008
docs/personas/07-kaiho-freight-dashboard.md:1334  U+0008
```

Seven occurrences in one run, the last two inside the prose explaining the first
five. The lesson is not "be careful with escapes" — it is that **the only thing
that has reliably caught this is a checker that reads the bytes**, and the only
reason these two were caught is that this file lives in the repo the checker
scans.

**What it changed in the numbers above: nothing.** The broken alternative was one
of three in an `||`, and `/[/]react[/]/` already matched every React module, so
the attribution was correct by luck. Re-measured after the fix to confirm that
rather than assume it — every figure identical except the dashboard's own code,
which grew 21.5 → 22.7 kB because the deep-link and the clock were written after
the first measurement.

`pnpm verify` exit 0 and the builder's **217 e2e tests pass** on the corrected
tree.

- **The bundle attribution counted silicaui-react as React.** The rule was
  `/react@/`, and pnpm stores this package as `@wizeworks+silicaui-react@file+…`,
  which contains `react@`. The run reported **"silicaui core 0.0 kB"** — a number
  that would have gone straight into this log as a boast. The design-system
  packages are matched first now, and the catch-all buckets are printed so a
  mis-binned package is visible rather than silent; that printing is what then
  showed `rope-sequence` and `orderedmap`, two of prosemirror's own dependencies,
  being counted as code I wrote.
