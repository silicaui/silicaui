# Silica UI — screen ratings

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-19

Every screen in Silica UI, scored on **Design** and **Ease** as the personas open
them. How and when to score is RULE #6 in [CLAUDE.md](CLAUDE.md); this file is where
the numbers live.

**Scored so far: 9 of 146 screens.** Update that line as rows fill in — it is the
denominator, and a rating file that does not show what it has not looked at is the
same lie as an empty issue list.

## The two axes

| Axis | The question |
| --- | --- |
| **Design** | Is it on-system and well-composed? Real silicaui components and real tokens — never a hex, never a re-skin — real color doing real work (not a grey screen), hierarchy from scale and weight, holds at 360px, and the waiting / empty / error states all present and right |
| **Ease** | Could this person do the job without help? Findable, one home per concern, the data they need already on screen, no dead ends, words they use, an obvious next step — and reachable by keyboard and by thumb |

Both are reported. A beautiful screen nobody can operate is not an 8; a plain screen
that gets the job done in two taps is not a 4. Where one number is wanted, quote the
lower.

**Score it in light and dark and at 360px, or do not score it.** A number taken in one
theme at one width is a guess about the other three. On this product that is not a
formality — the whole system is a token engine, and "readable at rest in light,
unreadable ink in dark" is its signature failure.

| Score | Means |
| --- | --- |
| 9–10 | Nothing to fix. A 10 needs a reason written in the gap column |
| 7–8 | Right, with named nits |
| 5–6 | Works; they needed a second look or a second attempt |
| 3–4 | They got there by persistence, or it looks unfinished |
| 1–2 | They would stop, ask somebody, or leave |

**The deductions are the point.** Every scored row carries a **gap to 10** — the
specific thing that would raise it. Anything in that column which is a real defect
becomes an issue and is fixed on the spot (RULE #3), then the row is re-scored keeping
both numbers: `5 → 8`.

A screen no persona reached stays `—`. **Never infer a score** from the code, from a
sibling screen, or from the fact that it typechecks.

**Act 7 opened twelve doc pages and scored none of them, on purpose.** Measuring one
element's contrast is not reading a screen. Act 7 loaded the Menu, Dropdown, Select
(Advanced), Toast, Alert, Dock, Footer, List, Chat, Countdown, Breadcrumb and Power
Search doc pages to confirm issue 021's fix on rendered elements, took a number off each,
and left. None was opened at 360px and none was walked as a person doing a job, which is
what RULE #6 asks for. **They stay `-`.** A row filled in from a fly-past would be worth
less than the dash it replaced, because the dash is honest about what nobody has looked
at and a soft 7 is not.

**Caveat on every dark reading taken before act 4 (issue 013).** Acts 1–3 scored the six
rows below in dark, and that dark was not Silica's. `prefersdark` re-pointed the colour
tokens but never painted the page, so an OS-dark visitor read Silica's ink over Chrome's
default dark canvas rather than `--color-base-100`. Fixed in act 4.

**No score was changed for it**, and that is deliberate rather than an omission: the two
backgrounds are both very dark — the UA's grey against `oklch(16% 0.01 255)` — so the
contrast figures shift in the second decimal and nothing that was legible became
illegible. It is recorded because it is true, not because it moved a number. The dark
readings below are sound; they were simply taken a shade off the intended surface.

**Act 5 changed the type ramp, so every scored row's heading sizes moved at narrow
widths.** `h1`/`h2` are now fluid (issue 016). **No score changed for it either**, and
for the opposite reason to the note above: at the widths these six rows were scored —
desktop — the output is byte-identical, verified at 1438px before and after. The
improvement lands at 360px, which is where the `Left:` notes on three of these rows
already point, and it will be re-scored when P09 reads them at that width rather than
credited in advance.

## How to fill a row

| Column | What goes in it |
| --- | --- |
| Screen | as printed |
| Key | the route, or the rail and tab the address bar cannot show |
| Design | `1`–`10`, or `4 → 8` after a fix |
| Ease | same |
| Gap to 10 | one short phrase. If it is a defect, add `#NNN` |
| Persona | who opened it — `P03`. Several may score the same screen; keep the latest and note the earlier in the gap column if it differed |

## Not a screen, and so not a row

Chrome every screen shares, scored **once** in an issue and linked from here rather
than left nowhere:

| Chrome | Issue |
| --- | --- |
| The site's header, theme toggle and footer | — |
| The docs sidebar and its command palette | — |
| The builder's toolbar (mode switch, breakpoints, undo/redo, Publish, status slot) | [047](issues/047-nothing-told-her-what-undo-was-about-to-take-back.md), [054](issues/054-she-pressed-publish-and-the-screen-did-not-change.md), [056](issues/056-the-builder-forgot-it-had-published-her-site.md), [101](issues/101-the-toolbar-drops-publish-at-1024px-and-never-says-so.md), [102](issues/102-the-site-builder-advertises-a-shortcut-for-a-feature-only-the-other-builder-has.md) |
| The builder's selection, drop and peer overlays | — |

## Screens deliberately excluded

- **`packages/shell-mockup.html`** — a static mockup, not a shipped surface.
- **The 5 composite packages' demos as separate apps.** They are reached through the
  playground and through their own doc pages, both of which ARE rows.
- **The MCP server (`silicaui-mcp`).** It has no screens; it is a tool surface. P05
  may use it, but there is nothing to score.

They are not listed below and are not scored. **If a persona ever reaches one, that is
a `major` issue, not a rating.**

## Why P07 scored nothing, and why 17 component rows changed anyway

**P07 opened no screens, so it scored none, and that is the right answer rather
than a gap.** Its surface is five npm packages. The dashboard it produced is a
CONSUMER's application — it is not a Silica UI screen and it is not a row here.

It did touch this file's subject matter, twice, without earning a number:

- **17 component families gained a focus ring** they did not have
  ([092](issues/092-twenty-seven-controls-wore-the-browsers-focus-ring-instead-of-the-systems.md))
  — carousel, stack, number-field, dock, diff, range, multi-select, outline,
  power-search, sidebar, tag-input, tree-view, dropzone, file-upload, wizard,
  wordmark and rich-text-editor. Their doc pages were opened by a **sweep looking
  for one thing**, not by a person doing a job, so those rows stay `—`. Scoring a
  page a probe visited is the exact lie RULE #6 exists to stop.
- **Every themed surface** is affected by
  [096](issues/096-a-content-colour-you-write-yourself-is-never-checked.md), which
  measures a `-content` colour an author declares by hand.

When a persona does open those pages, the deductions are already written down.

## The newest screen is deliberately unscored

`Site builder › Find` is new — built on 2026-09-19 to close
[073](issues/073-twelve-places-and-no-way-to-find-any-of-them.md) /
[111](issues/111-the-site-builder-had-no-find-and-a-site-hides-text-in-three-places.md).
Its row is `—` on purpose, for the same reason the migration guide's was in
[099](issues/099-the-docs-sell-to-daisyui-users-and-give-them-nothing-to-act-on.md):
**writing a screen is not opening it as a reader.** It has been driven by four
controls and by an e2e spec; neither is a person doing a job on it.

The denominator moved 145 → 146, which is what should happen when a pane is
added, and is why `gen-screens --check` failed the build until it was classified.

## Why three builder rows are scored and nineteen are not

**P03 opened thirteen of the builder's screens in its original run and scored
none of them.** That was deliberate: RULE #6 is *score it in light and dark and at
360px, or do not score it*, and the 360px pass was deferred by agreement during
that run. A number taken at 1280px in light is a guess about the other three, and
on a token engine that is exactly the guess that goes wrong.

**That pass has now run** — [P03 act 10](03-bright-step-studio.md), 390×844 with
touch, in both themes, and a width sweep from 1440px down to 360px. It found
four more defects ([101](issues/101-the-toolbar-drops-publish-at-1024px-and-never-says-so.md)–[104](issues/104-the-panels-wrapper-documented-an-imperative-ref-it-never-forwarded.md)),
all fixed, the worst of which was that **Publish left the screen at 1024px** and
the canvas was 64px wide below 480px.

**Three rows are scored, and only three, because three are what a person
operated.** Canvas, Layers and Inspector › Design were selected, opened, typed
into, undone and published from, at phone width, in light and in dark. The other
nineteen were not opened at 360px by anyone doing a job, and a row filled in from
a fly-past is worth less than the dash it replaces — the dash is honest about
what nobody has looked at and a soft 7 is not.

The deduction list for the unscored rows is still the part worth anything.
**Twenty-three issues from the original run** (040–062), twenty-two fixed and one
partly fixed, each carrying a `Rating effect` line naming the row it moves. Rows
with a deduction already written against them: Pages (044, 050, 057, 059), Insert
(040, 062), Inspector › Settings (051), Theme editor (045, 046), toolbar (047,
054, 056), plus 101–104 across all of them.

> This note lives **above** the generated marker on purpose. `gen-screens.mjs`
> rebuilds everything below it section by section, and prose inside that block
> does not survive. Scores do — they are carried over by key — but notes belong
> here.

---

<!-- BEGIN GENERATED SCREENS -->

**146 screens.** Regenerated by `node docs/personas/gen-screens.mjs`.

### silicaui.com — the site itself — 6 screens

| Screen | Key | Design | Ease | Gap to 10 | Persona |
| --- | --- | --- | --- | --- | --- |
| Not found (404) | `(404)` | — | — | | |
| Home | `/` | 5 → 8 | 7 → 8 | now switches light/dark and follows the OS #002; hero CTAs fit at 360px #004. Left: the long H1 still grazes the right edge at 360px | P01 |
| About | `/about` | — | — | | |
| Docs | `/docs` | 4 → 8 | 3 → 8 | grouped into 8 real categories #007 and every page now says what it is #006; drawer on a phone #003; dark #002. Left: Data input is still 38 items to scan | P01 |
| Docs › Getting started | `/docs/getting-started` | 3 → 8 | 2 → 8 | its only sample used to 500 on paste #010; now numbered steps, the Tailwind v4 requirement, the file to put it in, and all three paths. Left: not re-read at 360px | P01 |
| Docs › Migrating from daisyui | `/docs/migrating-from-daisyui` | — | — | | |

### silicaui.com — component doc pages — 116 screens

| Screen | Key | Design | Ease | Gap to 10 | Persona |
| --- | --- | --- | --- | --- | --- |
| Typography — component doc | `/docs/components/typography` | — | — | | |
| Button — component doc | `/docs/components/button` | 7 → 8 | 4 → 9 | now carries install, import, an 11-row props table and the demo's source #008; readable at 360px #003 | P01 |
| Badge — component doc | `/docs/components/badge` | 8 | 8 → 9 | props table incl. the CLIENT-COMPONENTS-ONLY caveat on render #008; best description on the site | P01 |
| Input — component doc | `/docs/components/input` | — | — | | |
| Input Group — component doc | `/docs/components/input-group` | — | — | | |
| Password Input — component doc | `/docs/components/password-input` | — | — | | |
| Search Input — component doc | `/docs/components/search-input` | — | — | | |
| Pin Input — component doc | `/docs/components/pin-input` | — | — | | |
| Phone Input — component doc | `/docs/components/phone-input` | — | — | | |
| Select (Native) — component doc | `/docs/components/select` | — | — | | |
| Textarea — component doc | `/docs/components/textarea` | — | — | | |
| Card — component doc | `/docs/components/card` | — | — | | |
| Alert — component doc | `/docs/components/alert` | — | — | | |
| Progress — component doc | `/docs/components/progress` | — | — | | |
| Avatar — component doc | `/docs/components/avatar` | — | — | | |
| Skeleton — component doc | `/docs/components/skeleton` | — | — | | |
| Table — component doc | `/docs/components/table` | — | — | | |
| Divider — component doc | `/docs/components/divider` | — | — | | |
| Kbd — component doc | `/docs/components/kbd` | — | — | | |
| Timestamp — component doc | `/docs/components/timestamp` | — | — | | |
| Breadcrumb — component doc | `/docs/components/breadcrumb` | — | — | | |
| Stat — component doc | `/docs/components/stat` | — | — | | |
| Steps — component doc | `/docs/components/steps` | — | — | | |
| Join — component doc | `/docs/components/join` | — | — | | |
| Menu — component doc | `/docs/components/menu` | — | — | | |
| Collapse — component doc | `/docs/components/collapse` | — | — | | |
| Indicator — component doc | `/docs/components/indicator` | — | — | | |
| Loading — component doc | `/docs/components/loading` | — | — | | |
| Prose — component doc | `/docs/components/prose` | — | — | | |
| Navbar — component doc | `/docs/components/navbar` | — | — | | |
| Footer — component doc | `/docs/components/footer` | — | — | | |
| Hero — component doc | `/docs/components/hero` | — | — | | |
| Link — component doc | `/docs/components/link` | — | — | | |
| Mockup — component doc | `/docs/components/mockup` | — | — | | |
| Timeline — component doc | `/docs/components/timeline` | — | — | | |
| Carousel — component doc | `/docs/components/carousel` | — | — | | |
| Marquee — component doc | `/docs/components/marquee` | — | — | | |
| Stack — component doc | `/docs/components/stack` | — | — | | |
| Rating — component doc | `/docs/components/rating` | — | — | | |
| Radial Progress — component doc | `/docs/components/radial-progress` | — | — | | |
| Pagination — component doc | `/docs/components/pagination` | — | — | | |
| Accordion — component doc | `/docs/components/accordion` | — | — | | |
| Chat — component doc | `/docs/components/chat` | — | — | | |
| Range — component doc | `/docs/components/range` | — | — | | |
| Toast — component doc | `/docs/components/toast` | — | — | | |
| Swap — component doc | `/docs/components/swap` | — | — | | |
| Status — component doc | `/docs/components/status` | 8 | 8 → 9 | description distinguishes it from Badge #006; props + import now present #008 | P01 |
| Countdown — component doc | `/docs/components/countdown` | — | — | | |
| Number Field — component doc | `/docs/components/number-field` | — | — | | |
| Drawer — component doc | `/docs/components/drawer` | — | — | | |
| List — component doc | `/docs/components/list` | — | — | | |
| File Input — component doc | `/docs/components/file-input` | — | — | | |
| Dock — component doc | `/docs/components/dock` | — | — | | |
| Fieldset — component doc | `/docs/components/fieldset` | — | — | | |
| Label — component doc | `/docs/components/label` | — | — | | |
| Validator — component doc | `/docs/components/validator` | — | — | | |
| Diff — component doc | `/docs/components/diff` | — | — | | |
| Mask — component doc | `/docs/components/mask` | — | — | | |
| Meter — component doc | `/docs/components/meter` | — | — | | |
| Scroll Area — component doc | `/docs/components/scroll-area` | — | — | | |
| Scroll Strip — component doc | `/docs/components/scroll-strip` | — | — | | |
| Preview Card — component doc | `/docs/components/preview-card` | — | — | | |
| Toolbar — component doc | `/docs/components/toolbar` | — | — | | |
| Navigation Menu — component doc | `/docs/components/navigation-menu` | — | — | | |
| Menubar — component doc | `/docs/components/menubar` | — | — | | |
| Toggle Group — component doc | `/docs/components/toggle-group` | — | — | | |
| Field — component doc | `/docs/components/field` | — | — | | |
| Form — component doc | `/docs/components/form` | — | — | | |
| Radio Group — component doc | `/docs/components/radio-group` | — | — | | |
| Checkbox Group — component doc | `/docs/components/checkbox-group` | — | — | | |
| Slider — component doc | `/docs/components/slider` | — | — | | |
| Switch — component doc | `/docs/components/switch` | — | — | | |
| Collapsible — component doc | `/docs/components/collapsible` | — | — | | |
| Filter — component doc | `/docs/components/filter` | — | — | | |
| Select (Advanced) — component doc | `/docs/components/select-menu` | — | — | | |
| Combobox — component doc | `/docs/components/combobox` | — | — | | |
| Multi Select — component doc | `/docs/components/multi-select` | — | — | | |
| Outline — component doc | `/docs/components/outline` | — | — | | |
| Date Input — component doc | `/docs/components/date-input` | — | — | | |
| Time Input — component doc | `/docs/components/time-input` | — | — | | |
| Date Time Input — component doc | `/docs/components/date-time-input` | — | — | | |
| Lightbox — component doc | `/docs/components/lightbox` | — | — | | |
| Overlay — component doc | `/docs/components/overlay` | — | — | | |
| Overflow List — component doc | `/docs/components/overflow-list` | — | — | | |
| Metadata List — component doc | `/docs/components/metadata-list` | — | — | | |
| Chat Suite — component doc | `/docs/components/chat-suite` | — | — | | |
| Power Search — component doc | `/docs/components/power-search` | — | — | | |
| App Shell — component doc | `/docs/components/app-shell` | — | — | | |
| Hooks — component doc | `/docs/components/hooks` | — | — | | |
| Calendar — component doc | `/docs/components/calendar` | — | — | | |
| Data Table — component doc | `/docs/components/data-table` | — | — | | |
| Empty State — component doc | `/docs/components/empty-state` | — | — | | |
| Tag Input — component doc | `/docs/components/tag-input` | — | — | | |
| Chart — component doc | `/docs/components/chart` | — | — | | |
| Color Picker — component doc | `/docs/components/color-picker` | — | — | | |
| Command Palette — component doc | `/docs/components/command-palette` | — | — | | |
| Tree View — component doc | `/docs/components/tree-view` | — | — | | |
| Dropzone — component doc | `/docs/components/dropzone` | — | — | | |
| File Upload — component doc | `/docs/components/file-upload` | — | — | | |
| Wizard — component doc | `/docs/components/wizard` | — | — | | |
| Rich Text Editor — component doc | `/docs/components/rich-text-editor` | — | — | | |
| Sortable List — component doc | `/docs/components/sortable-list` | — | — | | |
| Resizable Panels — component doc | `/docs/components/resizable-panels` | — | — | | |
| Tooltip — component doc | `/docs/components/tooltip` | — | — | | |
| Dialog — component doc | `/docs/components/dialog` | — | — | | |
| Alert Dialog — component doc | `/docs/components/alert-dialog` | — | — | | |
| Popover — component doc | `/docs/components/popover` | — | — | | |
| Dropdown — component doc | `/docs/components/dropdown` | — | — | | |
| Tabs — component doc | `/docs/components/tabs` | — | — | | |
| Checkbox — component doc | `/docs/components/checkbox` | — | — | | |
| Radio — component doc | `/docs/components/radio` | — | — | | |
| Toggle — component doc | `/docs/components/toggle` | — | — | | |
| Wordmark — component doc | `/docs/components/wordmark` | — | — | | |
| Selection List — component doc | `/docs/components/selection-list` | — | — | | |
| Sidebar — component doc | `/docs/components/sidebar` | — | — | | |
| Animations — component doc | `/docs/components/animations` | — | — | | |

### Playground — 1 screens

| Screen | Key | Design | Ease | Gap to 10 | Persona |
| --- | --- | --- | --- | --- | --- |
| Playground (all demos, one page) | `localhost:5173/` | — | — | | |

### The builder — 23 screens

| Screen | Key | Design | Ease | Gap to 10 | Persona |
| --- | --- | --- | --- | --- | --- |
| Site builder › Canvas | `builder?editor=site` | 8 | 8 | **Design:** with a rail open at 360px the page drops to 130px — the rails push the canvas aside rather than sitting over it, so the thing being edited is still what pays. **Ease:** every toolbar control is 32×32, under the 44px a thumb wants; 56 of them across the builder | P03 |
| Site builder › Component board | `canvas, component mode` | — | — | | |
| Site builder › New component (dialog) | `component mode › New` | — | — | | |
| Site builder › Components | `left rail head, component mode` | — | — | | |
| Site builder › Find | `left rail › Find` | — | — | | |
| Site builder › Inspector › Design | `right rail › Design` | 8 | 7 | **Design:** correct in both themes at 256px — Color, Size, Weight, Align and Surface all legible, swatches distinct on the dark surface. **Ease:** at 256px the Design/Settings strip needs its paging arrows, so reaching Settings costs a press that a wider rail does not | P03 |
| Site builder › Inspector › Settings | `right rail › Settings` | — | — | | |
| Site builder › Layouts | `left rail head, layout mode` | — | — | | |
| Site builder › Layers (Navigator) | `left rail › Layers` | 7 | 7 | **Design:** 12 rows read cleanly at 240px and long names ellipsis properly (measured — the label ends at 227px inside a 240px rail). **Ease:** a truncated row has no `title` and no `aria-label`, so two layers whose names differ past the cut are the same row to read; and on a phone the rail covers 240px of 390px, so finding a layer means losing sight of the page | P03 |
| Site builder › Pages | `left rail head, page mode` | — | — | | |
| Site builder › Insert (Palette) | `left rail › Insert` | — | — | | |
| Site builder › Theme editor | `theme mode, right rail` | — | — | | |
| Site builder › Theme library | `theme mode, left rail` | — | — | | |
| Email builder › Canvas | `builder?editor=email` | — | — | | |
| Email builder › Preview | `toolbar › Preview` | — | — | | |
| Email builder › New email (dialog) | `left rail head › Add` | — | — | | |
| Email builder › Find | `left rail › Find` | — | — | | |
| Email builder › Inspector | `right rail` | — | — | | |
| Email builder › Layers | `left rail › Layers` | — | — | | |
| Email builder › Insert | `left rail › Insert` | — | — | | |
| Email builder › Templates | `left rail head` | — | — | | |
| Email builder › Saved blocks | `left rail › Insert › Saved` | — | — | | |
| Builder › Recovery banner | `shown after a crash with unsaved work` | — | — | | |

### Not reachable from any nav — 0 screens

The docs sidebar is generated from `DEMO_META` in `apps/site/src/lib/nav.ts`, so a
doc page **cannot** be an orphan: adding a demo adds its nav entry in the same commit.
Every builder pane is reached from a rail, a tab or the toolbar.

This section is kept, empty, on purpose. **If it ever has a row, that row is a finding
before a run has started.**

<!-- END GENERATED SCREENS -->

---

## How this list was built

`node docs/personas/gen-screens.mjs` — the only thing allowed to write the block above.

- **The site** comes from walking `apps/site/app/**` for route files, exactly as the
  Next.js App Router does. The single `docs/components/[slug]` route file is expanded
  1:1 from `DEMO_META`, because to a customer those are that many separate addresses,
  not one.
- **The playground** is one screen, not one per demo — the per-component content is
  already counted as its doc page.
- **The builder** has no routes, so its **panes are its screens.** Every source file
  under `src/site/react`, `src/email/react` and `src/shared/react` must be classified
  in the script as either a pane or an explicit non-pane with a reason. **A file in
  neither list throws**, so a new pane cannot slip in uncounted and a deleted one
  cannot linger. The Inspector is split into its Design and Settings tabs, the way the
  tab strip splits it on screen.

Run `node docs/personas/gen-screens.mjs --check` to confirm the screen set still
matches the code. It compares the set of screens, not the file byte-for-byte, so it
keeps working once real scores are written into the rows.
