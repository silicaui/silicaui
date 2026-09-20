# Kaihō Analytics — the P07 artifact

A vessel and container dashboard for four shipping lines, built to answer one
question: **do the five opt-in packages stay out of your bundle when you do not
install them, and do they look like one product when you do?**

It is deliberately a working dashboard rather than a demo of five components.
Every slot has real numbers behind it, because the delta measured at the end has
to be the cost of the five engines and nothing else.

## Run it

```bash
pnpm install --ignore-workspace     # once, from this folder
npm run dev                         # http://localhost:5194
```

`--ignore-workspace` matters. This folder sits inside the silicaui repo, so a
bare `pnpm install` walks up to the repo's own `pnpm-workspace.yaml`, reports
"Scope: all 16 workspace projects", and adds **nothing** to this app. It looks
like a successful install and it is a no-op.

## What is on the screen, and which package draws it

| | Package | Engine behind it |
| --- | --- | --- |
| KPI cards, filters, badges, search | `@wizeworks/silicaui-react` | — |
| Monthly TEU throughput | `@wizeworks/silicaui-charts` | ECharts |
| 800 vessels, sortable, selectable, paged | `@wizeworks/silicaui-table` | TanStack Table |
| The handover note | `@wizeworks/silicaui-editor` | TipTap / ProseMirror |
| The nine-vessel watchlist | `@wizeworks/silicaui-dnd` | dnd-kit |
| The table / notes divider | `@wizeworks/silicaui-panels` | react-resizable-panels |

Two themes: `midnight` (the default — the operations room runs dark all night)
and `cobalt` (the duty officer's phone in daylight). The toggle is in the header.

## The data is the test

`src/data.ts` holds the five vessels the operations team named, typed as they
write them, because they are the ones that break things:

- `MV Hakuhō Maru` — a macron
- `MV Königsberg Express` — an umlaut, and a **negative** delay, which is a ship
  arriving *early* and not an error
- `MV 東京丸` — CJK, which a code-point sort files after every Latin name
- `MV Santa Catarina do Sul Navegação Costeira` — 43 characters
- utilisation to two decimals, as operations reports it

The other 795 are generated from the same alphabet, so the hard characters appear
throughout the table and not only on page one.

The 18-month chart carries two months that must never look alike:

- **2026-03 is `0`** for Nordhaven — a port strike. Nothing moved. A measured
  value, drawn as a point on the axis.
- **2026-07 is `null`** for Pacific Bridge — the feed was down and nobody
  counted. Drawn as a break in the line, and the tooltip says **"not measured"**.

## The refresh is real

`Refresh now` does what the fifteen-minute timer does: new delay figures, minus
the vessel that has berthed, plus one just picked up. **The berthed vessel leaves
from the middle**, because ships do not berth in array order — which is what
turns row identity from a detail into a defect. That is
[issue 095](../../issues/095-a-refresh-moved-the-selection-to-a-different-ship-and-told-nobody.md).

## Measure it yourself

```bash
npm run build
node ../../../../…/weigh.mjs dist/assets    # size, and which engines are in it
node .measure/attribute.mjs                 # where every byte went, by package
```

`.measure/` holds the act-1 rig too: `react-only`, `one-button`,
`from-source` and `five` are four tiny apps built for a single comparison — one
`Button` from the published dist against the same `Button` from source. That
comparison is how [issue 086](../../issues/086-one-button-cost-three-hundred-kilobytes.md)
was found.

The answer, from a real build of this app:

```
the five ENGINES        3819.6 kB   (82.5%)
the five WRAPPERS         29.6 kB   ( 0.6%)  <- what silicaui itself adds
react + react-dom        670.3 kB   (14.5%)
silicaui core             12.0 kB   ( 0.3%)
```

## Seams worth knowing about

**Nothing here writes a colour by hand.** The chart takes its palette from the
theme through `buildSilicaEChartsTheme`, the badges take theirs from
`delayTone()`, and flipping the theme repaints both. Colour on this dashboard
means exactly one thing — how late a ship is — which is why
[issue 094](../../issues/094-a-shipping-line-was-painted-the-colour-of-a-critical-delay.md)
mattered.

**The clock is named.** `Refreshed 28 Feb 23:59 JST` is formatted with an
explicit `timeZone: "Asia/Tokyo"`. The dashboard is read in Yokohama and the feed
comes from Rotterdam; a bare `toLocaleTimeString()` shows the clock of whatever
machine the browser is on.

**The filter is in the address bar.** `?line=Nordhaven&q=Rotterdam` opens the
same twelve rows in a window with no cookies and no storage, so a duty officer
can send a view to the next watch instead of describing it.

**The split turns at 900px.** A side-by-side divider on a 360px screen is two
170px slivers, so below that the group stacks and the divider still does
something useful. The saved layout is keyed by direction, because a percentage
that made sense side by side is not the same split stacked.

## Test seams

The app exposes a few globals so a probe can drive it without reaching into React
internals. They are named `__kaiho*` and are the only thing here that exists for
testing rather than for the duty officer:

| | |
| --- | --- |
| `window.__kaihoRefresh()` | fire the fifteen-minute refresh now |
| `window.__kaihoChart` | the live ECharts instance |
| `window.__kaihoFleet` | the rows the table was handed |
| `window.__kaihoSelected` | the rows the table says are selected |
| `window.__kaihoWatchlist()` | the watchlist order, as ids |
| `window.__kaihoNote()` | the stored handover note |
