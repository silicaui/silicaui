# 009 — The docs tell a Django developer to `npm i @wizeworks/silicaui-react`

**Status:** fixed
**Severity:** major
**Found by:** Brandon, during P01 act 2 · confirmed as P01
**Surface:** silicaui.com › Docs › every component page
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** Accordion (all three paths) and Data Table (two, correctly) read on screen
**Blocked on:** —

## What happened

Brandon, immediately after #008 landed: *"so we have multiple paths of implementation
right? one is react, one is vanilla html, and one is css classes right?"*

Yes — and the API section shipped an hour ago in #008 documents **one of the three**.

Silica UI is one design system through three genuinely separate paths:

| Path | Package | What you write | Ships JS? |
| --- | --- | --- | --- |
| CSS classes | `@wizeworks/silicaui` | `<button class="btn btn-primary">` | no |
| React | `@wizeworks/silicaui-react` | `<Button color="primary">` | yes, Base UI |
| Vanilla / node-tree | `@wizeworks/silicaui-html` + `-behaviors` | a node tree projected to HTML | yes, zero-dep runtime |

Every component page now says, for all three audiences:

> **Install and import**
> `npm i @wizeworks/silicaui-react`
> `import { Button } from "@wizeworks/silicaui-react";`

For a Django developer with no `package.json`, and for somebody generating static HTML,
that is not incomplete — it is **wrong**, and it is the only instruction on the page.

The site makes the opposite promise loudly on its own front page, in a section headed:

> **The same components, with no framework at all**
>
> React is one output, not the product. The node tree also projects to plain HTML that a
> zero-dependency runtime hydrates — real keyboard handling and focus management on a
> static page, with no bundler and no framework on the client.

So the landing page sells three paths and the docs document one. By the rulebook that is
a **false sentence on screen**, which is `major`, not a gap.

**I made this worse, not better.** Before #008 the pages showed no code at all, so they
were silent on all three paths equally. Adding React-only instructions turned silence
into a wrong answer. That is worth stating plainly: a fix that helps the majority path
and misleads the others is not a neutral improvement.

## What should have happened

A component page shows how to use that component on each path the component exists on.

## How to reproduce

1. `pnpm site:dev`, open `http://localhost:4011/docs/components/button/`
2. Read "Install and import" as somebody with no React in their project.
3. Every component page.

## Why it matters

It is two thirds of the audience, and it is the audience the product's own positioning
leans on hardest — "framework-agnostic", "CSS-first", "no `tailwind.config`".

It also lands squarely on this roster. **P02 (Tomás Ferreiro, Django, no bundler) is the
negative-space persona, written before any of this to catch exactly "every doc page
assumes React".** He has not run yet, and the defect is already here waiting for him.
**P08 (Fatima, static export, node-tree)** hits the other half.

## Where it lives

- `apps/site/scripts/gen-catalog.mjs` — `byName` keeps the **first** catalog entry per
  normalised name, so whichever package happens to come first wins. For `Button` that is
  `@wizeworks/silicaui-react`, and the other two entries are discarded.
- `apps/site/app/docs/components/[slug]/component-api.tsx` — renders that single entry.

## Do the siblings have it too?

**All 116 pages**, since it is one template.

The catalog carries all three paths and is not the limitation:

| Package in `components.json` | Entries |
| --- | --- |
| `@wizeworks/silicaui-html` | 237 |
| `@wizeworks/silicaui-react` | 133 |
| `@wizeworks/silicaui` | 111 |

Plus `classes.json` — 111 families with their full class lists, e.g. `button` →
`btn`, `btn-primary`, `btn-outline`, `btn-soft`, `btn-lg`, … (24 classes).

## The fix

Show all three, as equal siblings rather than one path and two footnotes:

1. **CSS classes** — the `@plugin` line, the component's real class list from
   `classes.json`, and a plain-HTML snippet. Plus the honest caveat that this path ships
   no JavaScript, so an interactive component styled this way will not behave.
2. **React** — what #008 already built: install, import, props table.
3. **Vanilla / node-tree** — the `atom()` call, whether it takes children, which
   behaviors hydrate it (`Accordion → disclosure`, `Form → form`, …), and that
   `@wizeworks/silicaui-behaviors` must be loaded or the markup is inert.

Stacked, not tabbed: tabs need client JavaScript, and a page documenting a CSP-clean
no-JS path should not require JS to read about it. A component that genuinely does not
exist on a path shows nothing for it rather than an invented snippet.

## What was built

The generator now indexes the catalog **by name AND package** instead of keeping the
first entry per name, and emits three independent path objects. The page renders them
as equal siblings under one "Using &lt;Component&gt;" heading.

| Path | Coverage | What the section gives |
| --- | --- | --- |
| Plain HTML — CSS classes | **108** | the `@plugin` line, the real class family, and the caveat that this path ships no JS |
| React | **108** | install, import, props table, the demo's source |
| Vanilla — node tree | **101** | `atom()` + `toHtml()`, takes-children, which behaviors hydrate it, and that the runtime must be loaded |

Only `hooks` has no path at all, which is correct — it is a hooks reference, not a
component.

**A second bug found while checking this one.** Matching the React path on
`@wizeworks/silicaui-react` alone dropped the React section from **Data Table, Chart,
Rich Text Editor, Sortable List and Resizable Panels** — the five opt-in composites,
which are React components in their own packages. Those are precisely the components a
reader most needs an install line for, because the package name is not guessable. React
coverage went 103 → 108 once composites were included.

That was only caught by listing which components had lost a path and reading the list.
The page for Data Table looked perfectly fine while being wrong.

## Confirmed by

Re-read on screen, dark theme, desktop.

> **Accordion** — all three sections present.
> *Plain HTML*: `@import "tailwindcss"; @plugin "@wizeworks/silicaui";`, root class
> `.accordion` with 5 modifiers shown as chips, and the sentence **"This path ships no
> JavaScript, so a component that needs interaction is styled but inert."**
> *React*: `npm i @wizeworks/silicaui-react`, the import, the props table.
> *Vanilla*: `atom("Accordion", [/* children */], { /* props */ })` + `toHtml(node)`,
> **Takes children: yes**, **Hydrated by: `disclosure`**, and "Load
> `@wizeworks/silicaui-behaviors` on the page or this markup renders correctly and does
> nothing."
>
> **Data Table** — two sections, and the *absence of the third is the point*. React
> reads `npm i @wizeworks/silicaui-table` and
> `import { DataTable } from "@wizeworks/silicaui-table";` — the composite package, not
> `silicaui-react`. There is **no Vanilla section**, because DataTable has no node-tree
> entry. Absence is shown as absence rather than an invented snippet.

`pnpm verify` exit 0, including the HTML projection golden being byte-identical.

### Follow-up, found and fixed the same day: source banners were leaking into the docs

While navigating to something else during act 3 the Label page loaded, and its Vanilla
section opened with:

> ── structural/presentational catch-up (2026-07-08 sync pass) ──────────────

A source-file **section divider** published as documentation. The node-tree entries take
their doc from the source comment above them, so a component that happens to be *first
in its section* inherits the file's banner. **7 of 150** node-tree docs did it, and they
are not obscure ones: **Input, Alert, Dialog, Breadcrumb, Stat, Label, ChatImage**.

Fixed in the generator by stripping a leading `─…─` banner before the rest of the
cleaning runs. Re-checked on the Label page: no box-drawing characters and no date
stamps anywhere on it, and the section now opens on the real sentence.

Recorded here rather than as its own issue because it did not exist before this fix —
it is this fix's own defect, found and repaired inside the same run. Worth noting how it
surfaced: **by reading a page I had landed on by accident**, not by any check I had
planned.

**Not checked:** the other 114 pages individually, and any of this at 360px. Handed to
P09 along with #008.

**Still open for the paths themselves, and not filed as defects:** P02 (Tomás) and P08
(Fatima) exist to walk the CSS and node-tree paths for real. This issue fixes what the
*page* says; whether the path actually works end to end is their run, not this one.

## Rating effect

Every component doc page. See [rating.md](../rating.md).
