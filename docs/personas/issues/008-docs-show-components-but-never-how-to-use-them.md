# 008 — The component docs show you the component and never tell you how to write one

**Status:** fixed
**Severity:** major
**Found by:** Brandon, during P01 act 2 · confirmed on screen as P01
**Surface:** silicaui.com › Docs › every one of the 116 component pages
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** Button and Badge re-read on screen — 0 code blocks became 3, 0 prop rows became 11 and 4
**Blocked on:** —

## What happened

Raised by Brandon mid-run: *"our components/docs do not show how to implement anything,
it just shows the components."*

Confirmed on `/docs/components/button/` — the single most important page in the docs —
by reading the rendered page, not the source:

| | On the page |
| --- | --- |
| Code blocks (`<pre>`) | **0** |
| Any `<code>` at all | **0** |
| Prop tables | **0** |
| The word `import` | **absent** |
| An install command | **absent** |
| A single prop written out (`color=`, `variant=`, `size=`) | **absent** |
| Total text on the page | 1,851 characters |

The page is a heading and eleven rows of rendered buttons. It proves a button exists in
eleven colours and six variants. It does not contain one character a person could type.

It is worse than silent — it **teases**. The page has a heading reading:

> **Polymorphism · render → a real `<a href>`**

naming a `render` prop, showing the result, and never showing the prop. Same for
`loading`, `block`, `wide`, `shape`, `iconStart` — all demonstrated, none written down.

## What should have happened

A component page tells a developer, at minimum: what to import, from where, what the
props are, and what a real call looks like. That is the job the page exists to do.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/docs/components/button/`
2. Try to write a `<Button>` using only what is on the screen.
3. Every component page, every theme, every width.

```js
const main = document.querySelector('.app-shell-main');
main.querySelectorAll('pre').length          // 0
/import\s/.test(main.textContent)            // false
/\bcolor=|\bvariant=/.test(main.textContent) // false
```

## Why it matters

This is the whole reason a component library has docs, missing from all 116 pages.

For Dilnoza it lands at the worst moment. Act 2 just ended with her choosing `Badge`
over `Status` for her shipment chips. Act 3 is her building the thing. She now knows
which component she wants and **the page cannot tell her how to write it** — so she goes
to the source, or to the MCP, or she guesses. Each of those is the docs failing.

It also quietly undercuts #006 and #007, fixed an hour ago: those made the right
component *findable*. Finding it is only worth something if the page then tells you how
to use it.

And it makes the site's own claim hard to believe. The landing page sells "one color ×
variant × size × shape vocabulary" — the vocabulary is exactly the thing no component
page writes down.

## Where it lives

- `apps/site/app/docs/components/[slug]/page.tsx` + `demo-view.tsx` — the page renders
  the demo component and its title, and nothing else.

Not a bug in a function; a missing half of the page.

## Do the siblings have it too?

**All 116 pages.** The page is one template, so there is no variation to check —
verified on Button, Badge and Status while confirming #006, none of which had a code
block.

`/docs/getting-started` is a separate page and **does** carry install instructions.
Not checked in detail yet — that is P01 act 3, next.

## The fix

For the third time today, **the repo already ships the missing material.**
`packages/silicaui-mcp/src/data/components.json` carries, per component:

| Field | Coverage across the 116 | Gives us |
| --- | --- | --- |
| `package` | 115 | the import line |
| `props[].members` — name, type, `optional`, `doc` | 108 | a real props table |
| `usageExample` | 108 | a real code sample |

So the same generator behind #006 and #007 grows a second output, and the page gains
three things:

1. **An import line**, derived from `package` and the component name. Always correct
   because it is generated, and currently absent entirely.
2. **A props table** — name, type, required, and the doc comment already written in the
   source. This is the biggest single gap and the data is clean.
3. **The demo's source**, shown as what it is.

**Point 3 needs care, and the honest framing is the whole of it.** `usageExample` is the
source of the demo rendered above it — which is ideal, because it cannot drift from what
the reader is looking at. But it imports this site's own helpers (`../lib/Section`,
`../lib/ColorGrid`, `../lib/icons`), so **it is not paste-able**. Presenting it as
"here's how to use it" would be a promise the reader cannot keep, which by the rulebook
is a `major` copy defect rather than a nicety. It is labelled as the demo's source.

Payload: the sources are ~2KB each (240KB across all 116) and the props ~0.9KB each.
They go in a separate generated module imported **only** by the Server Component, so in
a static export they cost build time and per-page HTML, not a client bundle.

The eight components with no React entry — Typography, Mockup, Toast, Select (Advanced),
Chat Suite, Dropdown, Animations — are CSS-only. They get whatever is true for them and
**no fabricated import line**; absence is shown as absence.

## What was built

`gen-catalog.mjs` grew a second output, `src/lib/catalog-api.ts`, and a new Server
Component `app/docs/components/[slug]/component-api.tsx` renders it under the demo.

Three sections per page: **Install and import**, **Props**, **Source of the demo above**.

| | Coverage |
| --- | --- |
| Import line | **115** of 116 |
| Props table | **99** |
| Demo source | **108** |

The API module is kept separate from `catalog.ts` on purpose: the sources total ~240KB,
and `catalog.ts` is imported by the client-side nav. Split, the sources become
prerendered HTML on one page instead of a bundle every page pays for.

The demo source is labelled **"Source of the demo above"**, with a sentence saying it
imports this site's own `../lib/…` helpers and should be read for the component calls
rather than copied whole. Calling it a usage snippet would have been a promise the
reader cannot keep.

### Four rounds on the prop-doc extractor, and the last one is the lesson

The raw docs are TSDoc written for someone reading the source. Getting them into a
table cell took four attempts, each of which produced *plausible-looking* output:

1. **Raw** — backticks rendered literally (`maps to \`btn-<color>\`.`) and `render`'s doc
   was a 600-character essay that turned one row into a wall.
2. **Cut at the first code example** — clean, but it silently dropped `render`'s
   **"CLIENT COMPONENTS ONLY"** caveat, which is a correctness warning: use `render`
   from a Server Component and the element arrives without its props.
3. **Strip tags instead** — kept the warning, but ate the `<color>` out of
   "maps to `btn-<color>`" and left fragments like `}>Docs` behind.
4. **Filter whole sentences by whether they are code** — right, because the test is for
   JSX *syntax* (`<[A-Z]`, `/>`, `}>`, `={`), none of which occurs in prose, while
   lowercase `<color>` survives.

**And then the actual lesson.** Round 4 still emitted Dialog's `nativeButton` ending at
*"…something else, e.g."* — even though the abbreviation guard I had just written
passed its own isolated test. The cause: there were **three near-copies of the
sentence-splitting loop** in the file, and I had fixed one. The 220-character cap had
its own copy without the guard.

That is precisely the defect class this repo has a memory note about — a rule enforced
in one of several renderers — and I wrote it into the tool that was finding it. All
three are now one `splitSentences` + `capToSentence`.

One deliberate trade-off kept: a doc that is a **single** long sentence containing an
inline example (Combobox's `popupProps`) falls back to the full text rather than being
filtered to nothing. A slightly code-ish cell beats an empty one.

## Confirmed by

Re-ran the act-2 check on the screen, dark theme, desktop.

> **Button** — was 0 `<pre>`, 0 tables, no `import`, no prop written anywhere.
> Now **3 code blocks**, **1 table**, **11 prop rows**, and the two lines she needs:
> `npm i @wizeworks/silicaui-react` and
> `import { Button } from "@wizeworks/silicaui-react";`
>
> **Badge** — 4 prop rows. `render` reads *"Render as a different element while keeping
> Silica's classes. CLIENT COMPONENTS ONLY — from a React Server Component the element
> loses its props crossing the "use client" boundary."* — the warning that round 2
> would have thrown away.
>
> `color` reads *"Semantic or custom color; maps to badge-<color>."* — the placeholder
> intact, which round 3 destroyed.
>
> **Zero backticks anywhere on the page** (`/\`/.test(main.textContent) === false`).

The headings that used to tease props they never showed now have them: `render`,
`loading`, `block`, `wide`, `shape`, `iconStart` are all in Button's table.

`pnpm verify` passes end to end, exit 0, including `verify:catalog` and the HTML
projection golden being byte-identical.

**Not checked:** the other 114 pages individually, and this page at 360px. The section
is one template driven by generated data, so the shape is the same everywhere — but
that is an inference, not an observation, and two of the four extractor rounds above
looked fine on the page I happened to be testing. **P09 re-reads a sample at 360px and
150% zoom.**

Not a regression risk to an earlier persona: P01 is the first run, and nothing outside
`apps/site` changed.

## Rating effect

Every component doc page. `Button — component doc` currently scores Ease 7 largely on
its demo quality; this is the deduction that was missing. See [rating.md](../rating.md).
