# @wizeworks/silicaui-react

## 0.57.0

### Minor Changes

- 9accc71: A real daisyUI migration, run end to end by a developer with low vision and a keyboard habit: what it costs, what is a drop-in, and the one thing that lets you do it a screen at a time

  Found by the P09 persona run — Gordon Pike, 61, six years into maintaining a
  fishing-tackle shop admin his daughter uses on an iPad while he works at 150%
  zoom in dark. Eight screens, 2,400 products, 76 daisyUI classes across 28
  component families, migrated in place. Ten acts, two defects, both fixed.

  **`Steps` could only go across the page.** daisyUI has `steps-vertical`; Silica
  had nothing — not a prop, not a class, and the CSS module's first line said so:
  _"a horizontal progress tracker"_. Its neighbour `Stats` has had `vertical` since
  it shipped, so the answer was yes for one component and no for the next with
  nothing saying which. `<Steps vertical>` ships now, spelled the way `Stats`
  spells it, and the colour variants needed no change because a connector is still
  a connector after it has been turned ninety degrees.

  **The site sold itself to daisyUI users and had nothing for them.** `"daisyUI
alternative"` is in the site's own keywords, and searching the docs for
  "daisyui", "migrate", "migration" or "daisy" returned **nothing at all** while
  "button" returned Button. No page existed under any name. There is one now, and
  every number in it came from the migration rather than from an estimate:

  |                                      |                            |
  | ------------------------------------ | -------------------------- |
  | daisyUI classes in the app           | **76**, across 28 families |
  | Replaced by a Silica component       | **74**                     |
  | Silica components it took            | **45**                     |
  | Lines of code                        | **730 → 819** (+12%)       |
  | Components with no Silica equivalent | **1**, now fixed           |

  **The section that goes first is the one about doing it gradually.** daisyUI and
  Silica both own `.btn`, `.card`, `.table` and `.badge`, so "keep the old system
  on one screen" is two stylesheets fighting — unless Silica is namespaced, which
  it can be. A third app in the artifact loads **both plugins in one build** with
  `prefix: sx-`, and the built stylesheet has 81 rules on `.btn`, 14 on `.sx-btn`,
  and not one Silica class name without its prefix. A forty-screen app can be
  migrated a screen at a time.

  **What the migration does not change is the code.** Every `useState`, every
  handler, every bit of filtering and paging in those eight screens is byte-for-byte
  what it was on daisyUI. The diff is markup.

  **And what it gives back.** Three of the five swaps that were not one-for-one
  arrived with behaviour the app did not have: `AlertDialog` brought a focus trap,
  a scroll lock, escape handling and focus return where `modal modal-open` had
  none; `Tabs` brought arrow-key movement where a `tab-active` class the app
  maintained itself had none; `Pagination` replaced three hand-rolled buttons with
  numbered pages and the aria to match.

  The guide publishes **no hours**, on purpose, and says so in those words: the
  migration behind it was not done by a person at a keyboard, so a figure in hours
  would be invented. What it publishes instead is the shape of the work — how many
  call sites move, how many are mechanical, and which five need a decision.

### Patch Changes

- 9accc71: The site builder, driven by someone who has never seen a developer tool: her work survives, her pages get real addresses, and the text she publishes is readable

  Found by the P03 persona run — Marlene Okonkwo-Bright, 58, who has run a dance studio in
  Leeds for 22 years, builds a seven-page site with an eleven-row class timetable, and
  publishes it. Twenty-three defects, twenty-two fixed. What follows is what changes for
  anyone building on these packages.

  **Her work now survives the tab closing mid-sentence.** Inline editing held new
  characters in a `contentEditable` and wrote them into the document only on blur or
  Enter, and the draft store persists the _document_ — so the sentence being typed right
  now lived nowhere durable. She typed a full sentence, the tab closed, and seven pages
  came back without it. Both canvases now commit on `pagehide`/`visibilitychange` through
  one shared hook, and both builders write through synchronously once the page is hiding,
  so the ordering of those listeners cannot matter. A killed process still loses the
  sentence in progress; the store's own header comment now states that limit instead of
  promising otherwise.

  **A page's address follows its name.** Renaming a page changed only its label, so a
  seven-page site published as `/page-2` through `/page-7`. A derived slug now follows the
  rename, and `slugify` drops apostrophes rather than turning them into separators —
  `Marlene's story` is `/marlenes-story`, not `/marlene-s-story`, which reads as three
  words one of which is the letter s.

  **Deleting a page says what points at it.** `Editor.linksTo(slug, exceptPageId)` counts
  links across every page, the frame and every symbol master, and the delete prompt uses
  it: _"One link elsewhere on your site points at this page. It will be left pointing at
  nothing."_ It counts, it does not block, and it stays silent when there is nothing to
  say.

  **Text meant to be read is no longer faded, and a table on a public page clears the type
  floor.** Eleven places handed authors `text-base-content/70` on body copy — including
  the Insert panel's **Text** item, so every paragraph anyone inserted started faded. All
  eleven are solid ink. The Table item inserts `table table-lg` (16px cells) rather than
  the bare 14px default, which is right for the dense admin grids the component is mostly
  used for and wrong for a class timetable parents read. `.table`'s own default is
  unchanged.

  **A pasted date is parsed or refused, never invented.** `2026-12-18` pasted into a date
  field became **10/12/2186**: digit groups were mapped by the locale's display order
  (ISO is year-first in every locale), and "a `Date` constructed" was used as the validity
  test, which it is not — `new Date(2018, 2025, 12)` is a perfectly good date in 2186. ISO
  input is now hand-parsed with no `Date` involved, every route is range-checked against
  the real length of the month, and anything that fails returns null instead of a
  plausible wrong year.

  **Other builder repairs from the same run:** the left rail can no longer be dragged
  narrower than its own tabs; 33 components that arrived as machine keys (`AvatarGroup`,
  `FieldsetLegend`) read as English; a table's three nested "Table" rows in the Navigator
  are distinguishable; Undo names what it is about to take back (_"Undo — remove an
  element"_); a reload lands on the page she was editing with her selection intact; the
  link field offers her own pages instead of asking her to type an address from memory;
  duplicating a table column keeps every row the same width; a locked node is no longer
  draggable on the canvas, matching the Navigator and the locking spec; and naming a page
  returns focus to the button that opened the field instead of dropping it on
  `document.body`, which left a keyboard user restarting from the top of the document.

  **`@wizeworks/silicaui`:** a tab panel is in the tab order (`tabindex="0"`) and had
  `outline: none`, so Tab moved focus and nothing on screen changed. `.tabs-panel` now
  carries the same ring `.tabs-tab` already had, under `:focus-visible` only — so it
  appears for the keyboard arrival and not for a click, which is what the original rule
  was protecting.

  **`@wizeworks/silicaui-react`:** the colour picker's hex field had no accessible name;
  it now points at the visible "HEX" label.

  The artifact is in `docs/personas/artifacts/p03-bright-step-studio/` — seven pages
  served under a strict CSP with no `'unsafe-inline'`, built by driving the real builder,
  with 0 text runs under WCAG AA and 0 console errors.

- 9accc71: The "you named the wrong package" guards only fired on the one line nobody writes

  Name the wrong package in `@plugin` and Tailwind used to die inside its own
  minified code with `b is not a function` — no package, no cause, no fix. Each
  non-plugin package got a guard: a default export that throws a real sentence with
  the real remedy.

  Driven to an actual Vite + Tailwind build for the first time, **none of the three
  fired.** Tailwind's resolver:

  ```js
  if (!options) return { plugins: [plugin] };
  if ("__isOptionsFunction" in plugin) return { plugins: [plugin(options)] };
  throw new Error(`The plugin "${path}" does not accept options`);
  ```

  A plain exported function has no `__isOptionsFunction`, so it lands on the third
  branch and is **never invoked**. The guard's sentence was unreachable.

  And that branch is the one everybody hits. The options form is what the docs
  write, what every starter writes, and what the guard's own suggested fix tells
  you to write:

  ```css
  @plugin "@wizeworks/silicaui" {
    colors: primary, secondary, accent, neutral, info, success, warning, error;
  }
  ```

  So a guard built to replace an unhelpful message was, on the common path,
  replaced by one: Tailwind's generic `The plugin "@wizeworks/silicaui-html" does
not accept options` — which names the package and still gives no cause and no
  fix.

  The fix is one property, and deliberately not an import:

  ```ts
  notATailwindPlugin.__isOptionsFunction = true as const;
  ```

  **None of these three packages takes a dependency on Tailwind to carry it**,
  which is the whole reason they are separate packages.

  Confirmed both ways round. Through the real build, the wrong package name now
  produces the guard's own sentence with either call shape, while the correct
  package still builds. And against the published `dist` each package actually
  ships, all three are marked as options-taking and refuse with a message that
  names themselves and gives the fix — while `@wizeworks/silicaui` itself, the
  control, is marked and does **not** refuse, because it is the plugin.

  A probe now guards it — `scripts/verify-plugin-guards.mjs`, in the root `verify`
  chain — and it was shown able to fail before it was trusted: strip the marker from
  a built package and it exits 1 naming the package and the fix. Nothing about the
  source looked wrong for as long as this was broken, which is exactly why a comment
  would not have been enough.

  Found only because the run that shipped the guards recorded "not checked"
  instead of "fixed". Both were present in their built output; the gap was between
  _present_ and _reached_.

- 9accc71: Measure a declared colour's ink instead of guessing it, and repair five controls that were smaller than WCAG's minimum target.

  **The colour engine now uses the value it already holds.** `theme("color")` hands the
  Tailwind plugin each registered colour's VALUE, and a `@plugin ".../theme"` block
  hands it over even more directly — yet both fell through to a CSS lightness rule that
  cannot compare contrast. For roughly 2.3% of the colour space that rule picks the
  failing ink while a passing one sits unused (4.28:1 where white gives 4.91:1). A
  theme block now substitutes the measured ink, but **only** where the rule's pick is
  below AA, so every other emitted token is byte-identical to before. A colour declared
  in `@theme` is warned about instead of rewritten, because it is global and an ink
  emitted at `:root` would outlive any theme that later re-declares the colour.

  Two further silences are now named at build time: a role whose TEXT form cannot be
  read on its own surface (`text-<role>`, `link-<role>`, `btn-<role>-ghost`), and a
  value that is not a parseable colour at all — which previously emitted every class
  and painted a fill the browser discards, with no message anywhere. All of this is
  silent on the twenty shipped presets in both modes.

  **Five controls were under WCAG 2.2 SC 2.5.8's 24 x 24 px minimum** — the chip
  removes in `TagInput`, `MultiSelect` and `PowerSearch`, the `Carousel` dot and the
  `TreeView` toggle. Each keeps its drawn size and gains a full-size hit area, so
  nothing redraws. The carousel's indicator gap widened from `0.4rem` to `1rem` because
  neighbouring hit areas were overlapping by 9.6px.

  **Contrast repairs found alongside them:** `TagInput` and `MultiSelect` chips painted
  the raw role colour as text (2.78:1 in light) where the identical rule in
  `PowerSearch` already used the derived ink (6.42:1); an inactive `Carousel` dot used
  `--color-base-300`, the darkest surface in BOTH modes, so it measured 1.96:1 against
  a dark page. Five more rules painting a raw role as text were found in
  `CommandPalette`, `DataTable`, `SegmentField` and `Stat` once the guard meant to
  catch them was widened to see the accent-variable idiom the components actually use.

  `@wizeworks/silicaui-html`'s `contrastRatio` now quantises to 8 bits before
  measuring, matching what a screen receives — it was off by up to 0.09, though this
  changes no verdict across all 320 shipped token pairs.

  `@wizeworks/silicaui-react`: the fifteen portalled components that never mentioned it
  now carry the note that a popup leaves its `[data-theme]` island, and how to bring it
  back. Documentation only, no behaviour change.

- 9accc71: The email builder, driven by someone who sends a newsletter to 4,100 people every Thursday: the same email again for another shop, one word changed everywhere at once, a broken link he can see, and an email that fits a phone

  Found by the P04 persona run — Reuben Halloway, 36, marketing lead at a three-shop
  independent bookshop in Bristol, who builds his weekly newsletter, duplicates it for
  three shops, gets the offer code wrong, and sends it. Sixteen defects, all fixed. What
  follows is what changes for anyone building on these packages.

  **An email can be copied.** The template switcher could add one and delete one, so the
  second version of an email that already existed had to be built again from a starter and
  retyped word for word — and one send per shop, per region, per language, per list is the
  ordinary shape of the job, not an edge case. `EmailEditor.duplicateTemplate(id)` and a
  Duplicate button in the switcher. The copy gets fresh node ids throughout, so editing one
  never reaches into the other, and it _keeps_ its locks: unlike duplicating a single node,
  the copy IS the same email for another audience, and a footer the host pinned into the
  original belongs in it just as much.

  **And so can a page.** The identical gap sat in the site builder's Pages panel.
  `Editor.duplicatePage(id)`, same Duplicate button, with one difference that matters — the
  copy's address is derived from its new name rather than copied, because two pages cannot
  share a route.

  **You can find a word across every email in a project, and change it everywhere in one
  press.** The offer code went out wrong and sat in twelve places — four per email, three
  emails — and _six of the twelve were on no screen the author was looking at_: the subject
  and preview text live behind a tree row, and the code in a button's link is invisible on
  the canvas. There was nothing at all for finding a word. There is now a Find page on the
  left rail. It searches every template, including the fields that are not on screen, it
  says how many places before you start, and Change-all is one undo step however many it
  touched. The search is exact text including capitals, it never matches inside markup
  (a replace of "a" must not rewrite `<a href>`), and it never touches colours, sizes or
  class names.

  **A merge token nothing resolves is marked on the canvas.** The site canvas has outlined
  an unresolvable reference for a long time; the email canvas did not. The cost showed on
  the first real send: the shipped newsletter starter's own footer carries
  `<a href="{{unsubscribeUrl}}">Unsubscribe</a>`, no host declared that reference, and a
  whole newsletter was written, reviewed and composed with no warning anywhere — leaving
  every subscriber an unsubscribe link pointing at the literal characters. Same dashes,
  same warning colour, same `data-sui-unresolved` hook as the site canvas.

  **Emails fit a phone.** Every email this projector produced was 600px wide on a 360px
  screen. The mobile rule fired and stacked the columns; the body stayed 600px, so a phone
  either shrank the whole message to 60% — a 14px footer arriving at about 8px — or scrolled
  sideways. `max-width:100%` on a fixed-pixel element inside an auto-layout table looks like
  responsiveness and does nothing, because the percentage resolves against a containing
  block that is sized by its own content. Images are now fluid up to the size the author
  chose, the body table is fluid with a `max-width`, Outlook gets a real 600px shell through
  a conditional comment, and the media query narrows the body as well as the columns.

  **A stock button is big enough to press.** 16px of label in an 18px line box with 8px of
  padding is 34px tall — under the 44px minimum a thumb reliably hits. The padding default
  was written out in three places; it is one exported constant now, and it is 14.

  **The email projector will not emit a URL it would not follow.** It escaped every URL and
  checked none of them, so the formatting bar's Link button — which builds a real anchor out
  of whatever it is handed — put `javascript:` straight into the document and out into the
  composed email. Harmless in an inbox; live script on the "view in browser" page, which is
  the sender's own domain. `isSafeUrl` is now exported from `@wizeworks/silicaui-html` (it
  already handled `" javascript:"`, a newline inside the scheme, and the relative path that
  merely contains a colon) and runs on all nine URLs the email projector writes. An unsafe
  anchor inside a text block loses its href and keeps its words. The Link button refuses one
  up front, in plain English, rather than letting an author believe they made a link that
  quietly is not one.

  **The builder's own labels are readable ink.** Eleven `text-base-content/70` fades on text
  a person reads to operate the email builder — every Inspector field label, every group
  heading, the empty state, the breadcrumb, the canvas hints. Not a contrast failure, but a
  fade used as a default is exactly what the rule exists to stop. Icons, the breadcrumb
  separator and the attribution mark keep theirs.

  **`pnpm verify` now fails on a raw control character in source.** While fixing the URL
  guard, a regex that read `/<a\b…/` turned out to contain a literal backspace byte where
  the word-boundary escape was meant — and two more of them sat inside a live test
  assertion, where `!regex.test(html)` had been unconditionally true since the day it was
  written. A check that cannot fail is worse than no check. The new scan found two further
  cases the hand sweep missed, one of them in a shipped React component and one in the scan
  itself.

- 9accc71: The embed seam, driven by the engineer who has to put this inside their own product: a block their customer must not be able to touch, two people in one page, a van that loses signal, and a published page that needs nothing running

  Found by the P05 persona run — Arvid Lindqvist, 27, platform engineer at a
  four-person B2B SaaS in Malmö, who builds the whole integration from
  `docs/builder-contract.md` and nothing else, then tries everything the contract
  says not to. Seven defects, all fixed.

  **A pinned block could be copied out of its own lock.** `HostComponentDef.pinned`
  stamps a host lock the author cannot clear — and `duplicate()` cleared it, on the
  reasoning that a copy is author-owned. One Ctrl+D put an unlocked copy of a
  legally-owned compliance certificate on the page. A host lock now survives
  duplication; an author's own lock still clears, because that one is theirs.

  **The escape hatch the locking spec pointed at did not exist.** The spec says a
  host that wants a read-only region "withholds inspector controls", but
  `validateClass` had the signature `(cls: string)` — it saw a class string and not
  a tree, so a host protecting ONE block could only ban `hidden` everywhere or
  nowhere. `ClassValidator` now receives the node (optional, `unknown`, so no
  existing validator changes), and every write path routes through it.

  **Two windows given the same document did not hold the same document.** A site
  with no frame gets a default one, materialized independently in each window with
  minted ids — so a frame op relayed between two people was dropped while a page op
  from the same batch landed, silently and forever. Defaults the editor conjures
  are now deterministic, and `replaceState` establishes the same invariants the
  constructor does instead of leaving Layout mode showing the page.

  **The Layers tree moved one row and stuck.** A treeitem lives inside a treeitem,
  so the row's keydown handler was bound on every ancestor and a bubbling ArrowDown
  ran once per level: the child moved focus forward, the parent moved it straight
  back. Every row below the first child was unreachable by keyboard — and the
  canvas has no tab stops, so the tree is the only keyboard route to a selection. A
  flat tree has no ancestor row, which is how this survived every test it had.

  **Nothing pretends any more.** Delete on a locked node is disabled with the
  reason on it instead of being a live button that does nothing, and the Design tab
  says the host's own sentence back rather than swallowing a refusal.

  **Every chip row in the Inspector is one tab stop.** Reaching the host's own
  toolbar action took 142 tab presses with a node selected, because every chip in
  every mutually-exclusive group was its own stop — one padding row cost thirteen.
  The builder's tab strips already did this correctly; one shared wrapper brings
  the roving tabindex to all six components that render chip and swatch rows.
  142 → 34.

  **Two builders on one page no longer fight over one rail width**, and
  `BuilderHandle` gained `extract()` — the document on demand, which
  `builder-contract.md` §10 had listed as part of the minimal buildable surface all
  along and was the one item the handle did not have.

  `docs/builder-contract.md` gains **§4.1 Mounting it in your app** (React dedupe,
  the `@source` lines, the studio theme) and **§5.2 Publish — the page a visitor
  gets**, which says the thing nothing said before: `renderHostNode` is a canvas
  hook, a host node ships as an empty `data-sui-host` mount point, and filling it
  is the host's job. Follow the old contract exactly and you published a page with
  holes where the most important blocks were, valid, 200, and silent.

## 0.56.0

### Patch Changes

- 7755923: Follow the visitor's operating system for light/dark, and say something when the plugin
  is not wired up.

  **`prefersdark`, a new opt-in plugin option.**

  ```css
  @plugin "@wizeworks/silicaui" {
    prefersdark: true;
  }
  ```

  Emits `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`, so an app
  follows the OS on first paint with **no theme script** — no flash of the wrong theme,
  and nothing for a strict CSP to refuse. An explicit `data-theme` still wins, so a stored
  choice beats the OS and a theme island beats both.

  The unthemed root becomes a full Silica surface, not just a set of tokens: it gets the
  **surface paint** (`--color-base-100` behind the text, the theme's `--font-sans`, the
  16px reading anchor, the grain if `--noise` is on) **and the global type ramp** — bare
  `<h1>`–`<h6>`, `<p>`, `<small>` and `<blockquote>`.

  That second one matters most. Turning `prefersdark` on means _not_ setting `data-theme`,
  and the type ramp was scoped to that attribute — so an app that followed the
  documentation had no typography at all and every `<h1>` rendered at 16px/400,
  indistinguishable from a paragraph. Both the paint and the ramp now read one shared
  `surfaceScopes()` list, so the two opt-ins cannot come apart again.

  The paint is also declared once rather than inside the dark media query. It names
  `var(--color-base-100)`, so it follows whichever palette is live — which fixes the
  light side, previously left on the browser's white instead of the theme's `oklch(98% …)`.

  Default **off**: nothing changes for an existing app until it asks. If you turn it on,
  do not also hardcode `<html data-theme="light">` — that makes the rule unmatchable and
  silently disables it.

  **`ThemeController` no longer writes a theme nobody chose (bug fix).**

  It previously set `data-theme` on mount unconditionally, falling back to the first theme
  in `themes`. Merely rendering the control therefore stamped `data-theme="light"` and
  overrode the visitor's OS — with no symptom beyond a light page on a dark machine, and
  it defeated `prefersdark` entirely.

  It now writes only once something has actually chosen: a controlled `value`, an explicit
  `defaultValue`, a stored choice, an attribute already on the target, or a click. It also
  reads `prefers-color-scheme` once after mount so the icon shows the theme you are
  actually looking at, without writing the attribute.

  Every case that wrote before still writes. Only "nobody has chosen yet" changed.

  **A missing `@plugin` line is no longer silent.**

  Forgetting it produced an unstyled page and nothing else: components went on rendering
  `class="btn btn-primary"`, the classes resolved to no rules, and there was no build
  error, no console warning and a clean `200`. Tailwind's own utilities kept working, so
  the result read as deliberate rather than broken.

  The plugin now emits one sentinel custom property, `--sui-plugin: 1` on `:root`, and
  `@wizeworks/silicaui-react` reads it once per page in development. When it is missing you
  get a `console.error` naming the problem, the consequence and the exact CSS to add. A
  custom property rather than a class, because `prefix:` renames classes and leaves custom
  properties alone — so a prefixed install tests the same thing.

  Development only, stripped from production builds, and deferred to the `load` event so a
  stylesheet still in flight is never reported as a missing plugin. Nothing reads the
  sentinel's value, only whether it exists — it is safe to treat as internal.

  **Naming the wrong package in `@plugin` now says so.**

  `@plugin "@wizeworks/silicaui-react"` — an easy line to type, since that is the package
  you import components from — failed with `b is not a function` from inside Tailwind's
  minified internals, naming no package, no cause and no fix.

  `@wizeworks/silicaui-react`, `@wizeworks/silicaui-html` and `@wizeworks/silicaui-behaviors`
  now each throw one sentence saying they are not the Tailwind plugin, naming
  `@wizeworks/silicaui` and showing the line that fixes it. No existing export changed; a
  default export on these entry points had no prior meaning.

  **`h1` and `h2` are fluid.**

  They were flat `2.25rem` / `1.875rem` — 36px on a 360px phone and 36px on a 27" monitor.
  A 68-character page title set five lines and 198px at 360px, a quarter of the screen
  before any content.

  Both now use `clamp(…cqi…)`, the same shape `display-1`–`display-3` already use:

  ```
  h1   clamp(1.75rem, 1.15rem + 2.6cqi, 2.25rem)    28 → 36
  h2   clamp(1.5rem,  1.05rem + 2cqi,   1.875rem)   24 → 30
  ```

  **Nothing changes above roughly a 680px container** — both sit at their present size and
  are flat there, so desktop output is identical. `cqi` rather than `vw` means a heading
  sizes to the column it is in, which is the right answer inside a sidebar layout.
  `h3`–`h6` are unchanged; 24px and below already set fine on a phone.

  **Polymorphism has one name: `render`.**

  `SidebarItem`, `Text`, `BlockquoteCite` and `Wordmark` took `as={Component}` while
  `Button`, `Badge`, `Card` and `PowerSearch` took `render={<Element />}` — two names for
  one concept, so a line copied from a Button to a SidebarItem was a type error with no
  hint as to the right spelling.

  All four now accept `render`, through the same implementation the others use. `render` is
  preferred: the element carries its own props and they are type-checked against it
  (`render={<Link href="/x" />}`), which `as` plus a widened parent cannot do. **`as` still
  works everywhere it did** and is marked deprecated, so nothing breaks.

  **`search_docs` can be searched in words (`@wizeworks/silicaui-mcp`).**

  `search_docs("app shell")` returned nothing while `search_docs("appshell")` returned
  seven results — every matcher was a single literal substring test of the whole query, so
  any component whose name is two words was unreachable by the words: `AppShell`,
  `DataTable`, `EmptyState`, `CommandPalette`, `NumberField`, `TreeView` and most of the
  React surface.

  The query now splits into terms, every term must match, and each name is indexed both as
  written and word-split — so `AppShell` answers to `appshell`, `app shell` and `shell`.
  Applied to all ten matchers rather than the one that was reported.

  **`neutral` is readable as ink in dark (bug fix).**

  `btn-neutral btn-ghost`, `badge-neutral badge-soft` and every other non-solid `neutral`
  variant painted `--color-neutral` as TEXT on the base surface. The dark palette keeps
  `neutral` dark on purpose — it is a fill, a subtle chip a shade lighter than the page —
  so as ink it measured **1.5:1** against a dark surface. Column headers, nav labels and
  `neutral` status chips were effectively invisible at night.

  The solid form is unchanged and still measures 10.4:1. Only the ink form moves, to
  `--color-base-content`, which is what an uncoloured control already used: every rule reads
  `var(--btn-accent, var(--color-base-content))`, so `btn-neutral` had been overriding the
  right answer. Applied in the shared generator, so it reaches all 28 coloured families and
  the builder's runtime cascade alike.

  `verify-token-contrast.mjs` gained the direction it never tested — a role colour measured
  as ink on `base-100`, for every role and both modes.

  **`SearchInput` and `PasswordInput` take `className` on their outer box (behaviour change).**

  `className` used to land on the inner `<input>` while the `input-group` that positions the
  search icon, the clear button and the show/hide toggle kept its own width. So
  `<SearchInput className="w-96" />` inside a wide container left the clear button stranded
  against the container's edge — measured at **718px** from the field it belongs to, and
  480px for `PasswordInput`'s toggle.

  `className` now goes to the group, which is the visible control, and the new
  `inputClassName` styles the field itself. Most existing uses are typography
  (`font-mono`, `text-center`), which inherit from the group and land the same either way;
  width, max-width and margin classes start working the way they read.

  **`.sidebar-item` gets a 44px minimum tap target on touch devices.**

  Rows computed to 37px, under WCAG 2.5.5, Apple's 44pt and Android's 48dp — which bites
  in a long nav list under a thumb. Scoped to `@media (pointer: coarse)`, so desktop
  sidebar density is unchanged.

  **Text that a person reads no longer fades (RULE #3).**

  Thirteen components faded readable text with `opacity` — a menu, dropdown, select and
  footer group heading at 55–60%, every breadcrumb link at 70%, a chat bubble's byline and
  delivery line, a countdown's unit label at 11px, a phone dock's icon **and its label** at
  55%, and the description line in an alert and a toast.

  Four of them were below WCAG AA on the rendered page, in a theme:

  ```
  .dock-item        2.66:1 light,  3.13:1 dark   ->  7.99 / 7.87
  .menu-title       3.87:1 light                 ->  16.71
  .countdown-label  4.39:1 light                 ->  15.28
  ```

  Nothing in the repo could have reported this. `verify-token-contrast.mjs` measures
  tokens, so an `opacity` sitting on top of a perfectly good token is invisible to it, and
  `verify-readable-ink.mjs` — the probe written for the rule that bans `/opacity` by name —
  only ever matched the `color-mix(…, transparent)` spelling.

  The fade is simply removed in each case; nothing replaces it, because the hierarchy was
  already carried by scale, weight and case (11–12px, 700, uppercase against 14px regular
  items). The dock's active item was already marked with a real accent colour, so the fade
  on the others was buying nothing; it now hovers to that colour instead. Glyphs, dividers,
  handles, drag states, disabled controls and placeholders are untouched — a toast's close
  "×" still sits at 70% beside an action button that no longer fades.

  `verify-readable-ink.mjs` now checks `opacity` as well, with the same written-reason
  allow list; two bugs in its own selector matching (an attribute selector truncated at the
  first `]`, and the `:disabled` pseudo-class missing from the allow list) are fixed too.

  **A role colour now has an ink form as well as a fill form (visual change, light mode).**

  A palette tunes each role as a **fill**: light mode's `warning` is `oklch(80% 0.11 85)`, a
  soft amber that carries near-black `warning-content` at 8.8:1 and is right behind a label.
  The same value used **as** the label, on a 98% surface, is **1.77:1**.

  So `soft`, `outline`, `ghost` and `link` were unreadable in light for most roles —
  **fifteen of twenty-one** role × variant pairs below AA:

  ```
  warning  soft 1.64   outline/ghost 1.78
  success  soft 2.13   outline/ghost 2.41
  info     soft 2.34   outline/ghost 2.67
  accent   soft 2.55   outline/ghost 2.96
  error    soft 3.66   outline/ghost 4.42
  ```

  No single lightness fixes it — the two uses pull opposite ways. So the ink is **derived**
  from the fill and both ship. Every coloured family gains `--<root>-ink` beside its
  existing `--<root>-accent`:

  ```css
  --btn-ink: oklch(
    from color-mix(
        in oklab,
        var(--color-warning) 50%,
        var(--color-base-content)
      ) l calc(c * 2) h
  );
  ```

  Mixing halfway toward `--color-base-content` moves the colour toward whatever the current
  surface uses as ink — darker on a light page, lighter on a dark one — so it is correct in
  **every** theme, including one a host invents at runtime, with no light/dark flag to set
  and no way to set it backwards. The mix costs about half the chroma, so the second step
  multiplies it back; 89–134% of the original chroma survives, and nothing washes out.

  **In the browser, all 40 role × variant pairs now pass AA in both themes.** Worst light
  case `warning soft` **1.64 → 5.15**; worst dark case `error soft` 7.30.

  **Only text moved.** `--<root>-accent` still holds the raw colour and still drives every
  fill and tint, so **solid variants are unchanged** and `btn-outline:hover` still fills with
  the raw colour under its matching `-content` (measured 8.72:1). What moved: `color:` on
  soft/outline/ghost/dash/link, the button spinners, and the resting outline/dash border on
  Button, Badge and Alert — a border drawn round a label in the label's own colour has to
  move with it.

  The ink variable is emitted from the shared generator, so it reaches all 28 coloured
  families and a colour invented live in the theme editor identically.

  `verify-token-contrast.mjs` now measures the derived ink rather than the token, and reads
  the mix ratio and chroma multiplier back out of the generated CSS so the probe and the
  stylesheet cannot drift apart.

  **A busy `Button` no longer drops the keyboard user's focus (bug fix).**

  `<Button loading>` passed `disabled || loading` to the native `disabled` attribute, and
  when the element a keyboard user is standing on gains `disabled`, the browser moves focus
  to `<body>`. So pressing Enter on a submit button left them with no focus anywhere for the
  length of the request — no ring on the page, the next Tab restarting from the top of the
  document, and a screen reader losing its place with `aria-busy` set and nothing focused to
  announce it.

  Busy now goes through `aria-disabled` (with activation stopped explicitly, since
  `aria-disabled` is advisory) and `disabled` is kept for a real, lasting disabled. **Nothing
  about the look changes** — `&:disabled, &[aria-disabled='true']` already shared one rule and
  the spinner already keyed off `aria-busy`. The polymorphic `render` path always worked this
  way; only the native `<button>` differed from it.

  `verify-busy-keeps-focus.mjs` fails the build on a native `disabled` derived from a busy
  state, following the derivation one hop.

  **A role colour painted as text goes through the ink derivation everywhere (bug fix).**

  Fifteen rules across twelve components wrote a role token straight into a `color:` — the
  required-field asterisk, the validator message, upload errors, an active menu item, prose
  links and more. Those bypassed the ink form entirely: the asterisk measured **4.42:1** in
  light, while `verify-token-contrast.mjs` reported `error` at 9.56 because it measures the
  derived value.

  The derivation moved to `lib/ink.js` so both callers share one formula, and all fifteen use
  it. The asterisk is now **9.57:1** in light and 8.45 in dark, and still unmistakably red.
  `verify-ink-derivation.mjs` fails the build on a bare role token in a `color:` declaration;
  `--color-base-content` and `--color-<role>-content` are exempt, because those already are
  inks.

  **A `DialogHeader` puts a description under the title, not beside it.**

  `.dialog-header` is a `space-between` row, right for a title and a close button. Putting a
  `DialogTitle` and a `DialogDescription` in it — the obvious reading of the name — squeezed
  the title into half the popup and wrapped it. The bar now wraps and `.dialog-description`
  takes a full basis, so title + close still sits on one row and a description takes its own.
  `.drawer-header` had the identical shape and gets the identical fix; `AlertDialogHeader`
  re-exports Dialog's.

  **`text-<role>` paints the ink form, not the fill (visual change, light mode).**

  A palette tunes a role as a fill, so in light `text-warning` put `oklch(80% 0.11 85)` on a
  98% surface and measured **1.78:1**. Five of the seven chromatic roles were under AA that
  way — while `<Button color="warning" variant="ghost">` measured 5.60 on the same page,
  because the component layer had already been given an ink form. RULE #1 names Tailwind
  utilities as the other half of the sanctioned toolbox, so the sanctioned path produced the
  worst text on the page.

  ```
                light before → after
  text-warning     1.78 → 5.60
  text-success     2.41 → 6.46
  text-info        2.67 → 6.89
  text-accent      2.96 → 6.88
  text-error       4.42 → 9.57
  ```

  All seven pass AA in both themes now. **`bg-` and `border-` are unchanged** — a background
  IS the fill form, and a border is a boundary under a different threshold. `base-*` and every
  `-content` token are skipped, because those are already inks.

  The rules are emitted in the utilities layer with the `[class]` specificity bump the `soft`
  family already uses: a base-layer rule is outranked by Tailwind's own utility for any colour
  whose literal class appears in scanned source, which would have fixed only the colours
  nobody uses.

  **`search_docs` answers the words people type, and says when it relaxed a query.**

  Forty-one ordinary phrases were run against the server; thirty-three worked and eight
  returned nothing while the component sat right there — `status history`, `activity feed`,
  `audit trail` and `history` for Timeline, `snackbar` and `toast message` for Toast, `loader`
  for Skeleton, `user picture` for Avatar.

  Two causes. Some are true synonyms that no normalisation reaches (`snackbar`/`toast`), now
  covered by a fifteen-entry alias table. The rest were strictness: `toast` returns 12 and
  `message` returns 22, but `toast message` returned **0**, because no single entry carries
  both. A query that matches nothing now drops its least specific word and runs again — the
  AND is kept, so precision is kept, and OR was measured and rejected for burying the answer.

  A relaxed search returns a `search-note` first, naming the word it ignored. Nothing that
  returned results before returns anything different.

  **A controlled segmented date or time field can be typed into (bug fix).**

  `DateInput`, `TimeInput` and `DateTimeInput` exist so a person can put their hands on the
  keyboard and type the date instead of hunting through a calendar. That was false for every
  **controlled, empty** field, for as long as the components have existed.

  `onValueChange` only fires with a whole value, which is the right contract — a parent must
  never be handed the 4th of no month. But it means the keystrokes before the last one are
  not representable in the parent, and the components kept their own cells only for the
  uncontrolled case, deriving them from `value` otherwise. So each digit reported `null`, the
  parent's `value` stayed `null`, and an effect put the placeholders back before the next
  digit arrived. An empty controlled field could never reach a complete date at all; only
  pasting one worked.

  A field that starts full was typeable, which is why this survived: the fields people looked
  at were seeded with today's date.

  The segments are now the component's own state whether controlled or not, and `value` syncs
  down only when it disagrees with what the cells already say. A `null` value beside
  incomplete cells is somebody part-way through typing, never a parent clearing the field.
  Clearing one segment also stops clearing its neighbours — a single Backspace on the month
  used to empty the day and the year with it.

  `verify-segment-typing.mjs` runs the keystrokes against all three components, because every
  part of this typechecked.

  **`Timestamp` puts the exact time on every relative label.**

  The `title` was keyed on the format rather than on what got rendered: `format="auto"`
  carried one whether it landed on "2 minutes ago" or on "Jul 8", and an explicit
  `format="relative"` carried none. So "2 weeks ago" — the one label that is a summary and
  cannot be quoted — was the one case with no way to reach the real date.

  The tooltip now follows the rendered label: present wherever the text is relative, absent
  where the text is already the answer. `verify-timestamp.mjs` covers it.

## 0.55.0

### Minor Changes

- 81408d3: Base UI moves to `@base-ui/react@^1.7.0` — off a deprecated release candidate

  Every published version of `@base-ui-components/react` is deprecated with the same message: _"Package was renamed to `@base-ui/react`."_ We were pinned to `1.0.0-rc.0` from **2025-12-04**, so the warning printed on every consumer's install while the library itself went 1.0 stable and shipped seven more minors. This moves to the live name at `^1.7.0`.

  ### It is transparent to consumers

  Base UI is a regular `dependency` of `@wizeworks/silicaui-react`, not a peer, so nobody declares it and nobody has to change a package.json. Confirmed by measurement rather than assumption: the generated MCP catalog — every documented component, prop, and type — came out **byte-identical in content** after the swap. No prop was renamed, added, or removed.

  **One case does need action.** If you install `@base-ui-components/react` yourself to use Base UI directly alongside Silica, you now have two different copies in the tree, and Base UI's React contexts won't cross between them — a `Field` from one package can't talk to a `Form` from the other. Rename your own dependency to `@base-ui/react` and the duplication goes away.

  ### What actually changed upstream

  Four components became generic function components — `Form`, `Slider.Root`, `Toggle`, and `ToggleGroup`:

  ```ts
  export declare const Form: {
    <FormValues extends Record<string, any> = Record<string, any>>(
      props: Form.Props<FormValues> & { ref?: React.Ref<HTMLFormElement> }
    ): React.JSX.Element;
  };
  ```

  That shape matters because `React.ComponentPropsWithoutRef<typeof X>` cannot extract props from a generic callable — it collapses, taking `children` and every callback parameter's type with it. Our wrappers were checked against this and the derived types still resolve; the `verify-form-focus` probe, which depends on Base UI's internal focus sequencing more than anything else we ship, passes unchanged.

  `Form` also gained `validationMode`, `onFormSubmit`, and an `actionsRef` imperative handle. Silica doesn't surface those yet — the existing `errors` / `onSubmit` / `focusOnError` API is untouched.

  ### How this was verified

  The risk in a nine-release jump isn't the compiler, it's silent breakage: a renamed data-attribute keeps typechecking and quietly stops matching CSS. So the 24 data-attributes and 13 CSS custom properties our stylesheets actually select on were extracted and diffed across versions — **none were dropped**. Twelve interactive components were then driven in a real browser (open, keyboard, hover, select, Escape) with zero console errors, confirming the attributes and variables are emitted in the states we style, including the ones our CSS positions things with: `--active-tab-left/-width` on the tabs indicator, `--anchor-width` on the select popup, `--transform-origin` on the popover.

  Also fixed: the tsup `external` regexes in `silicaui-react` and `silicaui-demos` still matched `/^@base-ui-components\//`, which after the rename would have **bundled Base UI into the published output** instead of externalizing it — a duplicate copy for every consumer. Both now match `/^@base-ui\//`, verified against the built bundle.

- c335b4f: Floating components can be anchored to something other than their own trigger

  Every Silica component that renders a Base UI `Positioner` forwarded exactly three of its props — `side`, `align`, `sideOffset` — and dropped the rest. The most consequential omission was `anchor`, which meant a popup could physically only sit against the element that opened it. Anchoring a panel to a table row, a chart mark, a text caret, or the pointer was not merely undocumented; it was unreachable through the wrapper, and passing `anchor` was a type error.

  This forwards the whole shared positioning surface on all twelve of them: `Popover`, `Tooltip`, `DropdownMenu`, `Menubar`, `ContextMenu`, `Select`, `Combobox`, `MultiSelect`, `Autocomplete`, `NavigationMenu`, `PreviewCard`, and `DatePicker`/`DateRangePicker`.

  ```tsx
  // anchor to a different element entirely
  <PopoverContent anchor={rowRef} side="right">…</PopoverContent>

  // a virtual element — anything with getBoundingClientRect() — pins a popup
  // to a point that has no DOM node of its own
  <PopoverContent anchor={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }}>…</PopoverContent>

  // stay inside a scroll container instead of colliding with the viewport
  <DropdownMenuContent collisionBoundary={scrollerRef.current} collisionPadding={8}>…</DropdownMenuContent>
  ```

  New on each: `anchor`, `positionMethod`, `alignOffset`, `collisionBoundary`, `collisionPadding`, `collisionAvoidance`, `sticky`, `arrowPadding`, `disableAnchorTracking`. `ContextMenuContent` additionally gained `side`/`align`/`sideOffset`, which it forwarded none of — those stay undefaulted there so Base UI's pointer anchoring is unchanged.

  ### One definition, not twelve

  The set lives in a single `PositioningProps` interface, with each member's type read off Base UI's own Positioner rather than hand-copied, so it tracks upstream. Twelve private copies of a positioning prop list is how this drifts back apart — the same reasoning behind the shared `COLOR_VARIANTS` table.

  Props are split by key rather than passed through blindly, and keys absent from a call stay absent from the Positioner: for `collisionAvoidance`, an explicit `undefined` is not the same as omitting it and would have overridden Base UI's default.

  ### Additive

  `side`, `align`, and `sideOffset` keep their Silica defaults and behavior. Nothing was renamed or removed, and every existing probe passes unchanged.

  ### Verified in a browser, not a compiler

  Positioning is a layout claim, and jsdom reports every element as a zero rect — "the popup moved to the anchor" and "the popup never moved" are indistinguishable there, which is precisely the failure being defended against. `examples/playground/e2e/popover-anchor.spec.ts` drives real Chromium: it asserts the popup's box sits against the anchor's box and is centred on a line the trigger is demonstrably _not_ on, then clicks an arbitrary point and asserts a virtual element pins the popup there. Both were confirmed to fail when the forwarding is reverted.

  The MCP catalog now inlines shared props interfaces into the components that extend them. Without that it reported `extends PositioningProps` and stopped, so an agent reading the catalog to check what a popup accepts would have concluded — correctly, before this change, and wrongly after it — that there is no way to anchor one.

## 0.54.0

### Minor Changes

- d57570c: The mockup browser's traffic lights are themed, and its toolbar actually lines up

  The dot cluster was positioned by two hand-tuned magic numbers that were copied from the window
  titlebar and never re-derived for the browser toolbar, which is a different height. Both were wrong,
  and the arithmetic says so:

  - **Vertically**, the dots sat at a fixed `top: 0.875rem` — correct for the 2.25rem titlebar, but
    the toolbar is 2.75rem, putting the address bar's centerline at 1.375rem and the dots' at 1.175rem.
    Off by 0.2rem, which is exactly the "the URL bar is not aligned" you can see in a screenshot
    without measuring anything.
  - **Horizontally**, the cluster ends at `1rem + 2 × 1rem + 0.6rem = 3.6rem`, but the toolbar reserved
    `padding-inline-start: 3.5rem`. The address bar was overlapping the third dot by 0.1rem.

  The geometry is now single-sourced — dot size, step, and inset are declared once, and both frames
  derive their padding and centering from them, so the two can't drift apart again. The toolbar centers
  its dots against itself (`top: 50%`) rather than against a constant, which also means custom
  `toolbar` content that grows the bar keeps the dots on the address bar's centerline instead of
  stranding them near the top.

  ### The dots carry theme color

  Close / minimize / zoom now read `--color-error`, `--color-warning`, and `--color-success`. They were
  previously three copies of `currentColor` at 30%, which is a muted default doing no work — the exact
  thing soft is not supposed to be. Because they resolve through the token roles rather than literal
  values, **a theme gets correct traffic lights for free**: no per-theme CSS, and they re-resolve on a
  `data-theme` island the same as everything else. The single-element-plus-`box-shadow` trick still
  holds, since each shadow carries its own color.

  `.mockup-plain` restores the neutral, colorless dots for anyone who wants the old look:

  ```tsx
  <MockupBrowser url="https://silica.ui" className="mockup-plain">
    …
  </MockupBrowser>
  ```

  ### The URL is readable

  `.mockup-browser-input` faded its text to 65% ink on the grounds that it's fake chrome. But the
  domain in a mockup is usually the whole reason the mockup is on the page, so it reads as real text
  and gets real ink. The corresponding exemption in `verify-readable-ink` is gone rather than left
  sitting there describing a rule the CSS no longer follows.

## 0.53.0

### Minor Changes

- cba5df1: A horizontal strip now says so when there is more of it off-screen — and `Tabs` does it on its own

  `overflow-x: auto` on its own is a trap on anything that can be dragged narrow. The content stays
  reachable, but the only thing announcing it exists is a scrollbar that overlay-scrollbar platforms
  (macOS, iOS, Android) never draw until you are already scrolling. A tab strip that ends at
  "Activity" with Documents and Details past the edge does not have those tabs, as far as the person
  looking at it is concerned.

  ### `ScrollStrip`

  ```tsx
  <ScrollStrip label="filters" trackClassName="gap-2">
    {filters.map((f) => (
      <Badge key={f}>{f}</Badge>
    ))}
  </ScrollStrip>
  ```

  Prev/next controls mount the moment the content stops fitting, and they are **in flow**, not
  overlaid — an overlaid chevron covers the item at the edge, which is exactly the item you were
  trying to read. At an end a control disables but keeps its footprint, so the strip never jumps
  sideways.

  That pairing is load-bearing rather than cosmetic: mounting a control narrows the scroller, which
  can create the very overflow that justified it — remove it and the overflow goes, so it comes back,
  forever. Overflow therefore decides whether the **pair** is mounted and position decides only
  whether each is disabled.

  Also handled: RTL (`scrollLeft` runs negative, and the glyphs turn around), `prefers-reduced-motion`
  (owned in CSS, so the buttons inherit it with no branch in the JS), an opt-in `fade` that clears
  itself at whichever end is not clipped, and a keyboard tab stop on the scroller **only** when
  nothing inside it already has one.

  New: `.scroll-strip` / `-track` / `-control` (+ the `xs`–`xl` ramp and `-faded`) in the CSS plugin,
  a `ScrollStrip` macro and `scroll-strip` behavior for the framework-neutral layers, and a
  `chevronLeft` glyph the bundled Lucide set was missing.

  ### `Tabs` carries it without a wrapper

  `TabsList` gains `scrollable` (**default `true`**), so overflowing tabs announce themselves with no
  change at any call site. Requiring every consumer to remember a wrapper is the papercut, not the fix.

  The list itself becomes the scroller rather than gaining a div around it, so Base UI's moving
  indicator keeps measuring against the same box. Two consequences worth knowing:

  - **Layout.** An `inline-flex` list shrink-wraps its content and therefore can never detect that it
    overflows — a scrollable list has to be constrained by its parent, so the wrapper is block-level
    and fills the available width. The tabs still shrink-wrap and stay left-aligned, and the baseline
    rule still ends at the last tab. Pass `scrollable={false}` for a strip that must shrink-wrap its
    own box.
  - **The indicator.** `overflow-x: auto` forces the other axis off `visible`, so a horizontal
    scroller necessarily clips vertically; the underline's deliberate 1px overhang is tucked flush in
    the scrollable case so it is not shaved to 1px tall.

  On the vanilla side this is wired into the `tabs` behavior directly rather than by nesting a
  `scroll-strip` root inside the list — part lookup stops at a nested behavior boundary, so every
  `tab` would have resolved to the inner root and selection would have gone dead while the strip
  scrolled beautifully.

## 0.52.0

### Minor Changes

- f99ccb6: Every button in both builders says what it does on hover; the email builder's Export HTML button is gone

  ### Export HTML is removed (BREAKING — a minor, since SilicaUI is pre-1.0)

  The email builder shipped an **Export HTML** toolbar button that did two things: triggered a
  client-side `Blob` download of the projected markup, and called an optional `onExport` prop with the
  same string. Both are gone, along with the `onExport` prop.

  Projecting a document is the HOST's job, not a button in the chrome. A host already owns the send
  path, the storage, and the filename; the builder handing the browser a `subject-slug.html` download
  was a fourth, uncoordinated answer to a question the host had already answered. The projector itself
  is untouched and still public:

  ```ts
  import { toEmailHtml } from "@wizeworks/silicaui-builder/email";
  const html = toEmailHtml(doc, { resolver: host, frame });
  ```

  That is the same one projector Preview and Send test use, so nothing about the output changes.

  **Migrating from `onExport`:** render your own action in `toolbarSlot` and call `toEmailHtml`
  yourself. The prop only ever fired on that button's click, so there is no other behaviour to
  replace. The site builder had no export or import button and is unaffected — `Publish` is its
  terminal action and stays.

  There was never an Import HTML anywhere in either builder. (The site Theme editor's paste-CSS →
  **Apply** flow imports _theme CSS_, not document HTML, and is deliberately untouched.)

  ### Tooltips on every chrome button

  Roughly thirty icon-only buttons across both builders had no hover help at all, and every other
  button relied on the native `title` attribute — which has an unconfigurable ~1s delay, no styling,
  no theme, no touch support, and is announced inconsistently by screen readers (often twice, once as
  the name and once as the description). Icon-only controls in a dense tool UI are exactly the case a
  real tooltip exists for.

  New shared primitives in the builder — `Hint`, `IconButton`, `BuilderTooltipProvider` — replace
  every `title` on a control. Three rules they enforce that a per-call-site `<Tooltip>` would not:

  - **One string, both consumers.** `IconButton` takes one `label` and emits both the tooltip and the
    `aria-label`, so they can't drift. Several swatch grids were empty `<button>`s carrying only a
    `title` — no accessible name at all — and now have real ones.
  - **Themed.** Base UI portals the popup to `document.body`, outside the chrome's `[data-theme]`
    island, where `--color-*` resolves against nothing. `Hint` re-stamps the studio theme, the same
    fix `DialogContent` and `Select`'s `popupProps` already use. `StudioThemeProvider` moved to
    `shared/react/` and is now mounted in the email shell too (it was site-only, and the email builder
    hand-threaded `studioTheme` as a prop through each panel).
  - **Disabled controls still explain themselves.** "Why can't I click this" is the hover people
    actually make, and it's the one Base UI drops by default since a disabled `<button>` emits no
    pointer events. Disabled buttons now carry their reason: _A row holds at most 6 columns_, _This
    block is locked by the host_, _Publishing isn't available here — this editor's host hasn't wired
    it up_.

  Tooltips add the CONSEQUENCE rather than repeating a visible label — "Delete component" gets _every
  instance is unlinked into a real copy_; a value chip that already reads "Bold" gets nothing, because
  a popup echoing the word on the button is noise.

  Two accessible names changed, both improvements: the rich-text toolbar's buttons are named `Bold` /
  `Italic` (the shortcut moved to its own tooltip line, out of the accessible name), and swatches are
  named for what they set (`Medium corners`, `Base 200`) instead of carrying a bare `title`.

  ### silicaui-react

  - `Tooltip` gains **`popupProps`** — the escape hatch `Select` and `Combobox` already had, for
    re-stamping a theme on the portalled popup.
  - `DialogTrigger` **forwards its props** to Base UI's trigger instead of dropping everything but
    `children`, and accepts `nativeButton`. A trigger wrapper that silently swallows props is
    indistinguishable from a broken dialog at the call site: nothing errors, the button just stops
    opening anything.

  ### Verified

  A new `tooltips` e2e spec asserts the parts that regress silently: that the popup is themed
  (`data-theme="studio"`), that no `title` survives beside it (both would show, staggered), that a
  disabled button still opens one, that an unlabelled swatch has an accessible name — and that neither
  builder has an Export or Import button. Full builder suite: 199 passing.

  One trap worth recording, since it cost a full red suite: **two Base UI triggers cannot render the
  same element.** A tooltip trigger nested with a dialog trigger clones the child twice and the second
  clobbers the first's ref, so the dialog stops opening with no error anywhere. Where both are needed,
  the tooltip owns a wrapper `<span>` and the dialog owns the real button.

## 0.51.0

## 0.50.0

## 0.49.0

## 0.48.0

### Minor Changes

- 2b079ee: `marquee` — an infinitely-looping ticker, in all four layers

  The `marquee` **behavior** already shipped: registered in `silicaui-behaviors`, named in the
  `BehaviorType` union, documented in the architecture spec and the MCP catalog. There was no marquee
  **component** anywhere — no CSS, no React, no `ComponentDef` — so the handler paused an animation
  that nothing in the library defined. It could only ever do something for a consumer who hand-wrote
  their own keyframes and then dropped our marker on top. Our own landing page did exactly that,
  under a comment reading "Tailwind has no infinite-marquee utility". Neither did we.

  ### The loop distance is not `-50%`

  Every marquee recipe on the web renders the content twice and animates to `-50%`. That is correct
  only with no gap between items. With gap `G` and `R` copies the track measures `R·group + (R−1)·G`,
  so `-100%/R` lands `G/R` short of a whole cycle — the strip snaps back a fraction early, once per
  loop, forever. Small enough to look like a rendering glitch, big enough to see.

  The exact cycle is `group + G`:

  ```css
  @keyframes silica-marquee {
    to {
      transform: translateX(
        calc((-100% - var(--marquee-gap)) / var(--marquee-copies))
      );
    }
  }
  ```

  Carrying `R` as a variable instead of baking in `-50%` also turns the copy count into a knob. The
  other failure mode of a marquee is content too narrow to overflow its container: one pass runs out
  before the loop returns and the tail of each cycle is blank. That is not fixable in CSS by
  measurement, but it is fixable by repetition — hence `repeat` (2–6, and the CSS is a var-setter
  class per count so `toHtml`, which refuses inline `style` on principle, can emit it too). The
  landing-page wall needed `repeat={3}`; it had been running two copies with a blank tail.

  ### New

  - **`.marquee`** (clipping viewport) › **`.marquee-track`** (what travels) › **`.marquee-group`**
    (one copy). Colorless — it moves things, it doesn't paint them.
  - Variants: **`-vertical`**, **`-reverse`**, **`-slow`/`-normal`/`-fast`** (80s/40s/20s),
    **`-fade`**, **`-pause-on-hover`**, **`-copies-2`…`-6`**. Speed and gap are custom properties
    (`--marquee-duration`, `--marquee-gap`, `--marquee-fade`) so any value is reachable inline
    without fighting specificity.
  - **`<Marquee direction speed pauseOnHover fade repeat>`** in React.
  - A **`Marquee`** `ComponentDef`, and a palette entry in the site builder.

  ### Duplicated content is hidden twice over

  Every copy past the first is `aria-hidden` **and** `inert`. `aria-hidden` alone leaves the
  duplicate tabbable while announcing as nothing — tab into copy #2 of a logo wall and focus lands
  somewhere a screen reader insists is not there. In the node tree the extra copies are also
  id-stripped: ids are globally unique by contract, so a duplicate carrying the original's id makes a
  builder click land on whichever copy the DOM query hit first. `inert` joins `GLOBAL_ATTRS` in
  `silicaui-html` for this — it sits next to `hidden` for the same reason both are safe, in that it
  only ever removes capability and carries no URL or script surface.

  In React neither spelling of the prop survives both supported majors — React 18's types don't know
  `inert` and drop `inert={true}` as a non-boolean attribute, React 19 knows it as a boolean and
  drops `inert=""` — so it is set on the node through a ref callback instead. Server-rendered markup
  therefore carries `aria-hidden` but not `inert` until hydration.

  ### The behavior handler was pointing at the wrong element

  It set `style.animationPlayState` on the behavior root. The animation lives on the `track` part, so
  the moment a real component existed the root would never have seen it. It now toggles
  `data-sui-paused` and lets the stylesheet decide, which keeps play-state with exactly one owner and
  means the handler never has to know which descendant is animated. Pause-on-hover is CSS in both
  paths; what is left for JS is the editor-canvas freeze, plus honouring `params.pauseOnHover` for
  hand-authored markup that carries the marker without the class.

  `prefers-reduced-motion` is deliberately **not** handled in JS. The CSS stops the animation and
  hands the strip back as a plain scroller — freezing a clipped strip strands everything past the
  first viewport behind `overflow: hidden`, which for a ticker of announcements or links is worse
  than the motion was. Decorative walls opt back out with `overflow-hidden`, as the landing page
  does. That rule needs two selectors, not one: every rule that _assigns_ an animation is two classes
  deep (`.marquee-vertical .marquee-track`) and a media query adds no specificity, so a bare
  `.marquee-track` loses and the vertical variant keeps moving.

  ### Dogfooding

  `apps/site/app/globals.css` loses its entire hand-rolled marquee block — keyframes, three speed
  classes, the reduced-motion override and the edge mask — and the hero wall is three
  `<Marquee direction="up">`. The file's only remaining custom rule is `.mono`.

  Covered by 17 structural `toHtml` checks, 10 jsdom hydration checks driving the real pause flag, and
  a browser pass asserting the strip actually travels, that hover actually stops it, and that reduced
  motion actually stills it in both orientations — the vertical-specificity bug passed every
  structural assertion right up until something measured a moving pixel.

## 0.47.0

## 0.46.0

### Minor Changes

- 11cccee: Deleting a page asks first.

  It didn't. The trash icon in the Pages panel called `removePage` straight off the
  click, and it sits one button away from Add — the same 24px square, the same ghost
  treatment, in the same run of three. A mis-click took the page and its entire node
  tree off the canvas with nothing on screen to stop it or explain what just
  happened. The op has always been invertible, but undo being available is not the
  same as an author knowing to reach for it: nothing in the editor says a deleted
  page is recoverable, so the honest read of that click is "gone".

  The button now awaits the shared `AlertDialog`, which names the page, labels its
  confirming action `Delete page` rather than a bare `Confirm`, and says undo covers
  it. `AlertDialog`'s backdrop is inert by design, so the decision can't be lost by
  clicking away; Escape still cancels, per the ARIA alert-dialog pattern.

  **`ImperativeAlertDialogProvider` gained `popupProps`**, which is what made this
  reusable rather than a one-off. The popup portals to `document.body` — outside any
  `[data-theme]` island the provider sits in — so a confirm raised from inside a
  themed region (an editor shell, a pane, a dark section) resolved its tokens
  against the host page instead of that region, and came back wearing the wrong
  palette. `popupProps` re-stamps the theme on the portalled surface, the same
  escape hatch `Select` already exposes for the identical reason. It also accepts
  `data-*` keys explicitly, because TypeScript waives excess-property checks for
  hyphenated names in JSX position only, never in an object literal.

  The builder mounts that provider once at the root inside its studio island, so
  this is now infrastructure: any panel can raise a themed confirm by calling
  `useImperativeAlertDialog()`, with no per-call-site dialog state and no bespoke
  markup.

  Covered by a new `e2e/pages.spec.ts`: cancel keeps the page, Escape keeps the
  page, confirm removes it and undo restores it to the switcher, the last remaining
  page stays undeletable, and the popup actually resolves the studio theme — the
  test asserts a non-transparent computed background, not just the attribute, since
  the attribute being present is exactly what a broken portal would also show.

## 0.45.0

### Minor Changes

- b33c93d: `stack` now peeks at any card size, and the fan is tunable

  `.stack` layers its children into a peeking deck. The nudge that produced the peek was a fixed
  `1.5rem` while the shrink that fights it — `scale()` against `place-items: center` — is
  **proportional**, pulling each edge in by `size × (1 − scale) / 2`. So the two crossed over:

  ```
  2nd card:  12px > h × 0.0375  →  h < 320px
  3rd card:  24px > h × 0.075   →  h < 320px
  ```

  Above ~320px in the peeking dimension every edge went negative and the deck rendered as a single
  card — no warning, no documented ceiling. It looked correct everywhere it was exercised because the
  only specimens were 128×192, comfortably under the ceiling; it failed the first time a card was
  given real content. Reported from sparx's pricing hero at 480×448, where the back cards sat 6px and
  12px _inside_ the front one. Below the ceiling it was not much better: at `w-48` the peek was a ~5px
  sliver, not a fanned deck.

  Both terms are now proportional. Each transform pays back its own shrink first — the `3.75%` /
  `7.5%` terms cancel it exactly — and only then translates by `--stack-peek`:

  ```css
  & > * {
    transform: translateY(calc(-7.5% - var(--stack-peek) * 2)) scale(0.85);
  }
  & > *:nth-child(2) {
    transform: translateY(calc(-3.75% - var(--stack-peek) * 1)) scale(0.925);
  }
  ```

  A percentage in a translate resolves against the element's own border box (`translateY` against
  height, `translateX` against width), so one declaration fans identically at every size, and
  `--stack-peek` is the **real, visible** peek rather than a number that has to out-run the scale.
  `-bottom` / `-start` / `-end` use the same figures — the scale is uniform.

  ### New

  - **`--stack-peek`** on `.stack`, the visible peek per step (2nd card one step, 3rd two, so the deck
    fans evenly). Defaults to `5%`. Accepts any length, so `--stack-peek: 12px` works too, and it is
    reachable as a Tailwind arbitrary property: `className="[--stack-peek:4%]"`.
  - **`stack-xs` … `stack-xl`** (2% / 3.5% / 5% / 7% / 9%), and a matching **`size`** prop on the
    React `<Stack>`. Orthogonal to direction, so `stack stack-end stack-lg` is a wide sideways fan.
    A hero deck and a notification pile want visibly different fans; neither could ask for one before.

  ### Behavior change

  A deck's fan is now a share of the card rather than a constant, so existing decks shift: at the
  128×192 the old demo used, the peek moves from 7.2px/14.4px to 6.4px/12.8px — near-identical — while
  anything larger goes from _nothing_ to a real fan. Pin the old look on a small deck with
  `stack-lg`, or set `--stack-peek` to an explicit length.

  ### Watch out when sizing a deck

  Children stretch to the deck's **width** but keep their own height, so a height class belongs on the
  card and a width class on the deck. `place-items: center` is deliberate — a block-axis stretch would
  squash a deck of `<img>`. A height on the `.stack` itself is an empty box around content-height
  cards, and since the peek is a share of the card, it also reads as a much smaller fan than asked
  for. The demo had this backwards and has been corrected.

  Covered by `examples/playground/e2e/stack-peek.spec.ts`, which measures real browser geometry at
  480×448 — the size that used to collapse. jsdom does no layout, so this class of defect is only
  catchable in a browser.

## 0.44.0

## 0.43.1

## 0.43.0

## 0.42.0

### Minor Changes

- 108ae7d: **Form: stop validation from stealing the caret mid-typing, and add `focusOnError`.**

  Base UI's `Form` moves focus to the first invalid control and calls `select()`
  on it, from two places: synchronously on an invalid submit, and from an effect
  whenever `errors` changes after a submit that passed. The second fires on the
  network's schedule — it lands while the user is typing in a different field,
  yanks the caret out, and (thanks to `select()`) makes the next keystroke replace
  what they had typed instead of appending to it. Upstream offers no opt-out.

  Silica now narrows that move. By default it still focuses the first invalid
  control on submit, but:

  - it never selects the control's existing value — the caret goes to the end, so
    the next keystroke appends;
  - a late `errors` update never takes focus from a text control the user is
    currently typing in; it scrolls the invalid field into view instead.

  The new `focusOnError` prop softens it further — `"scroll"` reveals the field
  without focusing, `false` leaves focus alone entirely:

  ```tsx
  <Form focusOnError="scroll" errors={serverErrors}>…</Form>
  <Form focusOnError={false} errors={serverErrors}>…</Form>
  ```

  Covered by `verify-form-focus.mjs` (policy) and a new playground Playwright
  suite (event-loop timing, which jsdom cannot reproduce).

## 0.41.0

## 0.40.0

## 0.39.0

## 0.38.0

## 0.37.0

## 0.36.0

## 0.35.0

## 0.34.2

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.1

## 0.32.0

### Minor Changes

- da5efa7: `Heading` / `Display` / `Text` take `size` (with `visualLevel` deprecated)

  Sizing a heading now uses the prop everyone reaches for first — `size` — instead of `visualLevel`:

  ```tsx
  <Heading level={2} size={4}>…</Heading>        // an <h2> that looks like an h4
  <Heading level={1} size="display-1">…</Heading> // hero
  <Display size={1}>…</Display>
  <Text size="lg">…</Text>                         // new: explicit body size
  ```

  `size` on these typographic components is the **type/display scale** (an h-level `1`–`6`, a `display-1..3` step, or a `text-*` step on `Text`) — a deliberate, probe-sanctioned counterpart to the `xs`–`xl` control scale that `size` names on `Button`/`Input`/etc. The rule `verify-prop-vocabulary` enforces is unchanged in spirit — `size` always means "a step on a silicaui scale," never a raw length or arbitrary string — it just recognizes the typographic scale on typographic components. Heading/Display values keep the ramp's designed per-step weight and tracking, which a bare `text-*` size would drop.

  `visualLevel` is **deprecated but still works** (`size` wins if both are set), so no one has to migrate on the spot; it will be removed in a future major. The common case is unchanged: a bare `<Heading level={2}>` still sizes itself — `size` is only for overriding.

## 0.31.0

### Minor Changes

- bb098bc: Type scale to `text-10xl`, a fluid display ramp, and a consumable canvas vocabulary

  - **Type scale reaches `text-10xl`** and is now declared in one place (`@wizeworks/silicaui/type-scale`), consumed by the plugin and the MCP catalog generator so the documented ladder can't drift. `text-8xl`/`9xl` are now owned explicitly (previously present only via Tailwind's defaults).
  - **`display-1` / `display-2` / `display-3`** — an oversized hero ramp above the headings — and they are **fluid** (`clamp()` + container units), so they scale with their container instead of overflowing narrow screens. React: `<Display visualLevel={1|2|3}>` and `<Heading visualLevel="display-1">`. Bare `.display` equals `.display-3`.
  - **`@wizeworks/silicaui-builder/vocab`** exposes the canvas's utility-class vocabulary as consumable data — `CANVAS_UTILITY_CLASSES` (flat safelist), `CANVAS_VOCAB_GROUPS`, and `CONTAINER_BREAKPOINTS` — so a consumer's Tailwind safelist can be generated from silicaui's source of truth instead of hand-copied. The Inspector imports the same source, so the two can't drift.
  - The Inspector now **surfaces classes with no backing CSS** on the raw class field (and via a deduped console warning) instead of rendering them silently as no-ops.
  - The **MCP catalog now documents the type scale**: `tokens.json` gains `typography.scale` (every step with px), and `classes.json` gains a `type-scale` group (`text-xs` … `text-10xl`).

## 0.30.0

### Minor Changes

- a90b819: First-five-minutes hardening pass — four defects that shipped to npm and one
  latent projection bug, all in the surface a new adopter hits before anything
  else.

  **`<Checkbox>Run tests</Checkbox>` no longer crashes the page.** `Checkbox`,
  `Radio`, and `Toggle` now accept `children` as a caption, wrapping the control
  in a `<label>` so the text is a real click target. Previously the types
  permitted `children` (inherited from `React.InputHTMLAttributes`) while React
  threw _"input is a void element tag and must neither have `children`"_ at
  runtime — a type-checks-clean white screen. Passing no children is unchanged,
  so pairing with your own `<label htmlFor>` still works exactly as before.

  **The four components where a caption is meaningless now reject `children` at
  the type level** — `Input`, `FileInput`, `PasswordInput`, `SearchInput`. The
  last two were the sneakiest: their root JSX is a `<div>`, so the mistake looked
  safe while `{...rest}` landed the `children` on the inner `<input>` anyway.

  **Five packages were missing their `'use client'` directive.**
  `@wizeworks/silicaui-charts`, `-table`, `-editor`, `-dnd`, and `-panels` all use
  hooks but shipped without the directive, so importing any of them from a
  Next.js App Router page threw. The prepend logic is now one shared build helper
  instead of being re-derived per package, and a new `verify:packaging` CI step
  asserts the directive is present in every client bundle — and absent from
  `silicaui-react/server`, whose entire purpose is being server-safe.

  **`peerDependenciesMeta` no longer dangles.** `@wizeworks/silicaui-react`
  declared `@wizeworks/silicaui` as an optional peer with no matching
  `peerDependencies` entry, which npm and pnpm both accept silently — so the
  intended "you're missing the CSS package" warning never fired. The same CI step
  now catches this class of no-op.

  **`CheckboxOption` / `RadioOption` rendered an unstyled native control in
  static output.** The expansion routed the node's class to the wrapping
  `<label>`, leaving the actual `<input>` with no `.checkbox` / `.radio` class at
  all. The control class now stays on the input, and `Checkbox` / `Radio` /
  `Toggle` in `silicaui-html` gained the same optional caption as their React
  counterparts — so both layers now emit byte-identical markup for identical
  authoring. `Toggle` also picked up the `role="switch"` that React already had.

  **New `.label-control` class** for a label that wraps its own control: the whole
  row is the click target, and the caption gets real ink rather than the muted
  field-caption color `.label` uses, since it's text meant to be read.

  ### Documentation

  The `@source` directive is now documented in both READMEs. Tailwind v4 never
  scans `node_modules`, so without it the plain utilities used inside
  `silicaui-react` never compile — producing a _partial_ break (buttons and cards
  look right; dialog footers don't align, `Lightbox` has no size, `soft`/`glass`
  sit inert) that reads like a library bug rather than a one-line config gap.
  This affected every consumer, not just monorepos.

- a90b819: Convergence pass on the sources of API drift, rather than on its symptoms.

  **One name for a component's own value callback: `onValueChange`.** The library
  already used it 22 times against 4 uses of `onChange`, but the authoring guide
  mandated `onChange` — so every new component was being written to the 15%
  pattern and the split was widening on its own. The guide is corrected, and the
  four outliers (`Rating`, `Pagination`, `Carousel`, `ThemeController`) now expose
  `onValueChange`. **`onChange` still works everywhere it did before**, marked
  `@deprecated`, so nothing breaks. The rule it encodes: `onChange` belongs to the
  native DOM handler on components that wrap a real form element — declaring your
  own shadows it, which is why each of those four carried an
  `Omit<…, "onChange">` in its props type paying for the collision.

  **`ThemeController` no longer causes a hydration mismatch.** Its `useState`
  initializer read `localStorage` and the DOM, so the server resolved one theme
  and the client another — and because that value picks the Sun vs Moon icon, the
  mismatch was guaranteed and visible. It now initializes to a value the server
  can also compute and adopts the stored theme in an effect after mount, matching
  `useTheme` and `useMediaQuery`.

  **`Carousel` no longer notifies spuriously.** The change callback fired once on
  mount (reporting a change that never happened) and re-fired on every render
  when given an inline arrow — which turns a `setState` in the handler into a
  render loop. It now fires only on real index changes.

  **`TreeView` re-flattened its entire tree on every render** in controlled mode:
  the expanded `Set` was rebuilt inline each render, so the `useMemo` depending on
  it never hit.

  **`useControllableState` is real now.** It documented itself as "the pattern
  every Silica component uses internally" while having zero component imports.
  `Rating` now uses it as the reference implementation, and the doc says plainly
  that adoption is partial and ongoing instead of claiming otherwise.

  ### Tooling

  The repo had **no ESLint config at all**. There is now a correctness-only flat
  config — no stylistic rules, and none are wanted.

  Notably, `eslint-plugin-ssr-friendly` turned out **not** to catch the SSR bug
  class it was added for: it skips nested function expressions, which is exactly
  the shape of a lazy `useState` initializer, so both hydration bugs this repo
  actually shipped were invisible to it. A local
  `silica/no-dom-in-state-initializer` rule covers the real shapes — lazy
  initializers, and helpers referenced by name — and reports the read even when
  it's `typeof`-guarded, since a guard prevents the crash but not the mismatch.
  Its RuleTester cases are the two shipped bugs verbatim, and run as part of
  `pnpm lint`.

- a90b819: **Breaking (pre-1.0): two props renamed so `size` means one thing.**

  A design system's leverage is that one prop name means one concept everywhere.
  `size` had drifted into three, and two of them were renamed:

  | Component        | Before                         | After                            |
  | ---------------- | ------------------------------ | -------------------------------- |
  | `RadialProgress` | `size?: string` (a CSS length) | `diameter?: string`              |
  | `Heading`        | `size?: 1–6 \| "display"`      | `visualLevel?: 1–6 \| "display"` |

  `RadialProgress` was the harmful one. `size` accepted any CSS length and wrote
  it straight to `--size`, so `<RadialProgress size="lg" />` — the spelling that
  works on every other component in the library — type-checked, compiled, and
  emitted the invalid `--size: lg`, silently collapsing the ring. `diameter`
  pairs with the existing `thickness`, which is also a CSS length.

  `Heading` keeps `level` for semantics; the visual scale is now `visualLevel`,
  which says what it is and no longer collides with the token scale.

  `packages/silicaui-react/verify-prop-vocabulary.mjs` now reads the source and
  asserts every `size` prop resolves to the `xs`–`xl` scale (or a subset the CSS
  actually emits). Typecheck cannot catch this class of drift — `size?: string`
  is perfectly valid TypeScript — so it needed a probe rather than a type.

  ### `render` vs `as`: documented, deliberately not unified

  An earlier audit proposed standardizing all polymorphism on `render`. That was
  investigated and **rejected**, because the two props are not two spellings of
  one idea:

  - `render` takes an **element** and clones it (composition). It needs the real
    element, so it does not survive a `"use client"` boundary — already
    documented in this package's Server Components section.
  - `as` takes a **tag name or component type**. A string like `"span"` crosses
    that boundary fine.

  Unifying on `render` would have regressed Server Component usage for exactly
  the presentational components (`Text`, `Wordmark`, `BlockquoteCite`) most
  likely to be used server-side. The existing split was already correct; what was
  missing was any statement of the rule. It's now in the README as a table, and
  in the component-authoring skill so new components don't pick arbitrarily.

- a90b819: **Every sized component now ships the full `xs`–`xl` scale.**

  Ten of twenty-nine sized components shipped a partial scale, so the same prop
  worked on one component and did nothing on the next:

  | Component      | Shipped             | Added               |
  | -------------- | ------------------- | ------------------- |
  | `EmptyState`   | `sm`                | `xs` `md` `lg` `xl` |
  | `FileInput`    | `sm` `lg`           | `xs` `md` `xl`      |
  | `MultiSelect`  | `sm` `lg`           | `xs` `md` `xl`      |
  | `TagInput`     | `sm` `lg`           | `xs` `md` `xl`      |
  | `Slider`       | `sm` `lg`           | `xs` `md` `xl`      |
  | `SegmentField` | `sm` `lg`           | `xs` `md` `xl`      |
  | `Toolbar`      | `sm` `lg`           | `xs` `md` `xl`      |
  | `ToggleGroup`  | `xs` `sm` `lg`      | `md` `xl`           |
  | `Prose`        | `sm` `lg` `xl`      | `xs` `md`           |
  | `Pagination`   | `xs` `sm` `md` `lg` | `xl`                |
  | `Meter`        | `xs` `sm` `lg` `xl` | `md`                |

  Nothing errored when a size was missing — `size="xs"` just rendered at the
  default, which reads as "the prop was ignored". The only way to learn which
  sizes a component actually supported was to read its CSS, per component. For a
  developer that's a papercut; for an agent generating code it's a silent
  correctness failure.

  The TypeScript unions were _honest_ about this (`ToolbarSize = "sm" | "md" |
"lg"`), which is why typecheck never flagged it — the types faithfully
  described an inconsistent system. They're now all `SilicaSize`, because the CSS
  backs it. `EmptyState`'s wrapper also hard-coded `size === "sm"`, so it would
  have ignored the new classes even once they existed.

  Each component was extended along its **own** ladder rather than a generic one:
  field-height components follow the `×6/8/10/12/14` `--size-field` ramp that
  `Input` establishes, while `Meter` (track height), `Slider` (rail/thumb),
  `Prose` (font/line-height), `Pagination` (cell size) and `ToggleGroup` (item
  height, which is offset because the item sits inside track padding) keep their
  existing proportions.

  `-md` is now declared explicitly everywhere rather than left implicit in the
  base rule. React wrappers may still omit it, but the class-first layers —
  vanilla markup and `silicaui-html` — author `class="foo foo-md"` by hand, and
  that has to resolve.

  Guarded by `packages/silicaui/scripts/verify-size-scale.mjs`, which fails the
  build if any component ships a partial scale, and verified against real
  compiled CSS from the playground rather than only the plugin's JS output.

### Patch Changes

- 26b341e: **The Chat family and `Filter` are now authorable outside React.**

  Thirteen Chat components landed as one unit — `Chat`, `ChatImage`, `ChatHeader`,
  `ChatFooter`, `ChatBubble`, `ChatLayout`, `ChatLayoutMessages`,
  `ChatMessageMetadata`, `ChatMessage`, `ChatSystemMessage`,
  `ChatTypingIndicator`, `ChatToolCalls`, `ChatComposer`. Shipping half a family
  is worse than shipping none: a consumer who finds `Chat` but no `ChatComposer`
  hand-rolls the missing half in markup that then drifts from the React layer,
  which is the exact failure the component registry exists to prevent.

  Two of those reuse existing behavior rather than inventing new vocabulary:

  - `ChatToolCalls` is structurally a collapsible, so it emits the existing
    `disclosure` behavior and the Collapsible part classes the CSS already
    targets.
  - `ChatComposer` lowers to a real `<form>` with the existing `form` behavior,
    so a static page can actually send. React adds autoresize and Enter-to-send
    on top; without them it degrades to a normal textarea and submit button
    rather than to something broken.

  **`Filter` turned out not to need a new behavior at all.** It was on the "needs
  a behavior handler" list, but checking it against the existing vocabulary first
  showed it _is_ `toggle-group`: same single-select press semantics, same roving
  focus, same `aria-pressed` buttons. The only delta was the reset control, which
  is now an optional `close` part on that handler — the "one type, optional parts"
  pattern, not a fork. Part names are scoped per behavior root, so `close` here
  can't collide with a modal's. A plain toggle group with no reset is unaffected,
  which is checked explicitly.

  Every new interactive path is verified by driving it in jsdom — clicking the
  tool-call disclosure open and shut, pressing chips, clearing them with the
  reset, and confirming the reset hides itself when nothing is selected — not by
  asserting a marker is present. All of it is locked in the byte-identical HTML
  golden.

  Also removes three `opacity-60` instances from the React layer (one live, two
  in doc examples that were teaching the pattern) — the same RULE #3 defect the
  CSS pass fixed, in a place a stylesheet sweep couldn't see.

  Still deliberately absent from `-html`, each because it needs a genuinely new
  `BehaviorType` rather than because it was overlooked: `Countdown` (a live clock;
  the existing `counter` is a one-shot 0→target tween on scroll-in), `TagInput`
  (text entry that emits removable tokens), and `PowerSearch` (faceted multi-term
  query building, which `combobox` doesn't model).

- 6e1edd6: **`Countdown` works outside React**, via a new `countdown` behavior.

  Reuse was checked first and rejected on the merits. The existing `counter`
  behavior tweens text from 0 to a target once, when it scrolls into view. A
  countdown is a recurring clock that stops at a deadline and formats time —
  different trigger, different cadence, different stopping condition. Reusing
  `counter` would have meant a handler that ignores most of its own parameters,
  so `countdown` is a real addition to the vocabulary rather than a stretched
  existing one.

  Two details worth naming:

  - **The macro never reads the clock.** `expand` must be pure, or two builds of
    the same tree differ and the golden fixture can't be pinned. The starting
    values come from an explicit `props.from`; without it the units render as
    placeholders the handler fills on hydrate.
  - **The authored markup carries real values**, so a page that never hydrates
    shows a sensible (if frozen) countdown rather than empty boxes.

  The handler writes only the units the markup actually authored — it never
  invents or removes DOM — and skips its timer in preview, where a ticking clock
  in an editing canvas is a distraction that also keeps a render loop alive per
  countdown on the canvas.

  Also fixes an SSR hydration mismatch in the React `Countdown`: its value is
  computed from `Date.now()`, so the server and client legitimately disagree.
  That's what `suppressHydrationWarning` exists for — the value is time-dependent
  by definition, not a mismatch to reconcile. Without it every server-rendered
  countdown logged a hydration error. Note this is a class the local
  `no-dom-in-state-initializer` ESLint rule cannot catch, since `Date.now` is not
  a DOM global.

- a90b819: Coverage and catalog honesty — what the library says about itself.

  **The MCP catalog described a component that does not exist.** `Typography`
  had a row in silicaui-react's README component table but is not exported from
  anywhere. The generator resolved the name through its kebab-case fallback to a
  real file (`typography.tsx`), parsed it, and published a fully-formed entry —
  with `HeadingProps` attached. An assistant querying the catalog was told to
  write `<Typography level={2}>`, complete with prop documentation, for a
  component that cannot be imported. The row is gone, and the generator now
  treats a README name with no matching export as an **error**: it drops the
  entry from the emitted data and exits non-zero, because a phantom entry is
  worse than a missing one — a consumer acts on it.

  **Six real components were missing from the catalog.** The generator's
  existing check ran one direction only and at file granularity: a file with at
  least one documented export was exempted wholesale, on the assumption that its
  other exports were Base-UI-style sub-parts. That assumption holds for ~150
  genuine sub-parts, but it also silently swallowed `DateRangePicker` (in
  `date-picker.tsx` beside documented `DatePicker`), `ClickableCard`,
  `SelectableCard`, `FloatingLabel`, `CheckboxOption`, and `RadioOption`. The
  check is now per-export, and a sub-part is identified by being name-prefixed
  by a documented sibling in either direction (`DialogTrigger` ⊃ `Dialog`;
  `Steps` ⊃ `Step`) rather than by sharing a file.

  **Five components became authorable outside React.** `Link`, `FileInput`,
  `FloatingLabel`, `SelectableCard`, and `MockupCodeLine` existed only in
  silicaui-react, so a static or Sparx-rendered page could not author them at
  all — `Link` most glaringly, since a projection with no link component made
  every link a hand-written raw element node.

  **`<input accept>` was silently dropped from all static output.** The raw
  element sanitizer's allowlist for `input` included `multiple` but not
  `accept`, so every static file input lost its file-type filter. Nothing
  errored; the picker just opened unfiltered. This predates the `FileInput`
  macro and affected hand-authored element nodes too — adding the macro is only
  what surfaced it. `accept` is an inert hint string with no URL or script
  surface.

  **React↔HTML parity is now enforced rather than assumed.** A component that
  exists only in silicaui-react is invisible to every non-React consumer. That's
  legitimate for some, but it has to be a decision. The generator now warns on
  any React component with no `-html` macro unless it appears in an explicit
  `HTML_EXEMPT` map with a stated reason — imperative APIs (`ToastProvider`),
  pure class-applicators (`Validator`), names already covered under a different
  one (`NativeSelect` → `-html`'s `Select`), and interactive components still
  owed a behavior handler. It also warns when an exemption goes stale, so the
  list can't rot into fiction once a macro lands.

  The five new macros and the `accept` fix are locked in the byte-identical HTML
  golden fixture.

## 0.29.0

## 0.28.0

## 0.27.0

### Minor Changes

- 4d96f1c: Add `PortalContainerProvider` / `usePortalContainer` for multi-window apps.

  Every portalled surface (DropdownMenu, ContextMenu, Menubar, Select, Combobox,
  MultiSelect, Autocomplete, DatePicker, Dialog, AlertDialog, Drawer, Lightbox,
  CommandPalette, NavigationMenu, Popover, PreviewCard, Tooltip, Toast) now
  resolves its portal container from the new context before falling back to Base
  UI's default `document.body`. Apps that render part of their React tree into a
  second browser window (`window.open` + `createPortal` popouts) wrap that
  subtree in `<PortalContainerProvider container={childDocument.body}>` so menus,
  dialogs, and toasts opened there appear in the window that triggered them
  instead of the opener. No provider — or `container={null}` — keeps today's
  behaviour exactly.

  The container is any `HTMLElement`, not only a document body, so the same
  provider scopes portalled surfaces to an in-page region — a pane, workspace, or
  module shell. A dialog portalled into that element resolves its `--color-*`
  against the region's `[data-theme]` island, so a scoped surface inherits the
  region's palette without per-instance styling. Note the container must not
  establish a containing block for fixed positioning (`transform`, `filter`,
  `contain`, `backdrop-filter`) or clip with `overflow: hidden`, or the centered
  popup will position against the region instead of the viewport, or be cut off.

- 4d96f1c: ToggleGroup gains `size` and `color` props

  The CSS already carried a size vocabulary (`toggle-group-xs|sm|lg`, `md` default)
  and a colored active pill, but the React wrapper exposed neither — you had to hand-write
  the class. It now takes `size` (`xs | sm | md | lg`) and `color`, matching Button's prop shape.

  The colored pill is also no longer limited to three hard-coded roles: `toggleGroup()` now
  takes the plugin's `colors` list and emits a class per registered color, so any custom color
  works. Colors apply orthogonally — the color class only sets `--toggle-group-pill-*`, which
  the base `[data-pressed]` rule reads.

## 0.26.0

## 0.25.1

### Patch Changes

- 3bd07b4: Make the `render` prop fail safely, and document that it's client-only.

  Passing `render={<a href="…" />}` from a React Server Component either threw
  React's opaque `Element type is invalid… got: undefined`, or silently produced
  a styled element with none of its own props — a link that looks right and
  navigates nowhere. The cause is structural: this package's main entry is a
  single `"use client"` module, so the element is serialized across the boundary
  and arrives with `type` and/or `props` missing.

  - The three `render` implementations (`Button`, `Badge`, `ClickableCard`) now
    share one audited helper, `composeRender`. It validates the element before
    cloning it and falls back to the component's own native element when the
    element is unusable, so a bad `render` can no longer take a page down.
  - Both failure modes now log an actionable `console.error` naming the
    component and pointing at `@wizeworks/silicaui-react/server`. They fire in
    production too — each mode is silent by nature, so a build that only warned
    in development would still ship dead links. The remediation detail is
    dev-gated and stripped from production bundles.
  - `mergeProps` keeps its public contract: called with a single argument (its
    documented `/server` usage) it stays silent.
  - The `render` JSDoc on all three components states the constraint and the
    fix, which also surfaces it in editor hover-hints and the `silicaui-mcp`
    catalog. The README gains a **Server Components** section covering the
    `"use client"` boundary and the `/server` class builders.
  - New `pnpm --filter @wizeworks/silicaui-react verify` probe covers all of the
    above against the built bundle, in both `NODE_ENV` modes.

## 0.25.0

## 0.24.0

### Minor Changes

- 065d97b: Data-resolution honesty + a logo-capable brand mark + canvas binding resolution — three orthogonal fixes closing the gap between what the data layer promised and what it did. Design authority: `docs/data-resolution-and-brand-mark.md`.

  - **Resolution honesty (`@wizeworks/silicaui-html`)** — `ResolveHost`'s hooks now return `Resolved | undefined` (and `readonly unknown[] | undefined`), where a bare `undefined` means **"I don't know this ref"** and `{ value: undefined }` keeps its old meaning, **"I know it and it's empty"**. Those were previously the same value, so the walk _couldn't_ tell them apart and blanked the node either way. An unknown ref now **keeps the node's authored content** (marker included, so a re-resolve or a downstream runtime still sees the bind), never drops it, and reports a structured `ResolveDiagnostic` via the new optional `ResolveHost.onDiagnostic`. `omitWhenEmpty` deliberately does **not** apply to an unknown ref — "legitimately empty, render nothing" is a claim only a host that knows the ref can make. The core stays pure: no `console`, no `NODE_ENV` sniffing — loudness is the consumer's call. Widening the return type is source-compatible: an existing host's narrower return still typechecks and behaves exactly as before.

  - **Canvas resolution (`@wizeworks/silicaui-builder`)** — the canvas resolves bindings through the same `resolveTree` primitive `toHtml` uses, via a new `ResolveOptions.editing`. `editing` is a **destruction policy, not a second resolver**: same walker, same hooks, same refs, diverging only where production's answer is "show nothing" — which an editor can't render, because a dropped node can't be selected, inspected, or un-bound. So `visible:false` (and `omitWhenEmpty` at zero items) render **ghosted** and report `code: "hidden"`; unknown refs render their authored content wearing a warning outline plus a `data-sui-unresolved` hook. A **Data on/off toggle** (default on, shown only when the host resolves anything) flips back to the authored placeholder — which is what ships when data is absent, so it must stay visible and editable. Text showing **resolved** data is no longer `contentEditable` (committing it would overwrite the authored placeholder with host data); an unknown ref still shows authored text, so it stays editable. v1 resolves `value`/`html` binds only — a collection keeps its authored template unexpanded _and unresolved_, because cloning children clones their ids (which selection and React keys depend on), and resolving a nested field with no item in scope would blank the very placeholder being laid out.

  - **Brand mark (`@wizeworks/silicaui`, `@wizeworks/silicaui-react`, `@wizeworks/silicaui-html`)** — `Wordmark` can hold a logo. It was a text-only atom while its own CSS and React wrapper both already assumed a mark, so "put the logo in the wordmark" was impossible by construction. It's now a container with `src`/`alt`/`href` props (nesting an `Image`/`Icon` child remains the richer path and wins when present; `href` lowers the mark to an `<a>`, same sugar as `Button`). `alt` defaults to `""` — decorative, since the name renders beside it. The CSS mark rule generalizes from `& svg { width: 1.15em }` to `& :is(svg, img)` height-locked with **width auto**, so a non-square logo is no longer squashed to a square (square marks are unaffected). **Text-only Wordmark markup is byte-identical to before.**

  - **`ComponentDef.primary` (`@wizeworks/silicaui-html`)** — a component now declares which prop a bare `value` bind fills. This replaces `resolve.ts`'s hardcoded `Image`/`Avatar` name-list and its `"src" in props` sniff outright: the name-list meant every new bindable component needed a resolver edit, and the sniff was about to write a bound site **name** into a Wordmark's **logo URL**. `Image`/`Avatar` declare `primary: "src"`; `Wordmark` declares `primary: "text"`. Absent a declaration the old `label` → `text` fallback applies. Same coupling `ComponentDef.container` was introduced to kill.

  - **Host adapters extend, never re-declare** — `BuilderHost` and `EmailBuilderHost` both carried duplicate copies of the resolver hooks, so the widened signature didn't propagate and both Inspectors read `.value` off a possibly-`undefined` with the compiler silent. They now `extends ResolveHost` / `EmailResolveHost`. The builder's React entry also exports the `Editor` type (what `useEditor()` returns — a host couldn't name it), and `Canvas.isEmptyContainer` now asks a component's **expansion** rather than its authored children, so a prop-populated container is no longer painted over with an "empty — drop something here" placeholder.

## 0.23.0

## 0.22.0

## 0.21.0

## 0.20.0

### Minor Changes

- d0a6ca6: `Field` and `FieldStatus` now support a `floating` prop that takes the status panel out of flow (`position: absolute`, anchored under the field) so it never pushes sibling fields up or down as it appears, changes, or disappears — it overlays whatever's below instead. Off by default.

## 0.19.0

### Minor Changes

- 3893c74: Toast now supports a clickable action button. `useToast().add()` accepts `actionProps` (forwarded to Base UI's `Toast.Action`, rendered as a `<button>`) — commonly paired with `timeout: 0` so the toast doesn't auto-dismiss before the user can act: `toast.add({ title: "New version available", actionProps: { children: "Refresh", onClick: () => location.reload() }, timeout: 0 })`. Adds a `.toast-action` style (an outlined pill reading `currentColor`/`--toast-fg`, so it stays legible across every `data-type` and in dark mode) positioned between the toast content and the close button.

## 0.18.0

## 0.17.0

## 0.16.0

### Minor Changes

- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

## 0.15.0

## 0.14.0

### Patch Changes

- aa589af: `buttonClasses`, `badgeClasses`, and `clickableCardClasses` (added in 0.13.0) now actually work from a Server Component. They previously lived inside `button.tsx`/`badge.tsx`/`card.tsx`, part of the bundle `@wizeworks/silicaui-react`'s main entry stamps `"use client"` onto — importing them there handed a Server Component an unusable client reference, not a callable function. They now live in framework-agnostic `lib/` modules (no React dependency) exported from both the main entry and `@wizeworks/silicaui-react/server`, so `import { buttonClasses } from "@wizeworks/silicaui-react/server"` gets a real function.

## 0.13.0

### Minor Changes

- 386a0c1: `mergeProps` (the merge behind every component's `render` prop) now tolerates a `theirs` of `undefined`, so passing a Server Component's client-component element through `render` degrades gracefully instead of throwing — crossing that boundary serializes the element as a lazy client reference whose `.props` reads as `undefined`. `Validator`/`FloatingLabel`'s direct `children.props` reads get the same treatment.

  Also export `buttonClasses`, `badgeClasses`, and `clickableCardClasses` — the class-string logic behind `Button`, `Badge`, and `ClickableCard`, as standalone functions with no React context dependency. A Server Component can now style a plain element directly (e.g. `<Link className={buttonClasses({ color: "neutral", variant: "ghost" })}>`) instead of needing the client-side `render` composition.

## 0.12.0

## 0.11.0

## 0.10.1

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

### Patch Changes

- `ChatMessage` (the convenience wrapper, not the raw `Chat`/`ChatHeader`/`ChatFooter` primitives) now renders name/time _after_ the bubble instead of before it, matching a modern messaging-app read where the message is the point and the timestamp is a quiet trailing detail. The avatar's alignment flips from bottom- to top-anchored (`.chat-image` `align-self: start`) so it lines up with whatever's first in the group — the bubble in `ChatMessage`'s new order, or a `ChatHeader` name/time row for anyone composing the primitives directly (e.g. a Slack-style header-above layout) — instead of hanging toward a short trailing metadata line.

## 0.5.0

### Minor Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

## 0.4.0

### Patch Changes

- 18da685: Fix `@wizeworks/silicaui-mcp`'s catalog generator so it can't silently drift out of sync again:

  - `behaviors.json` is now derived from `silicaui-behaviors`' real `HANDLERS` dispatch table instead of a hand-maintained file list — all 30 registered `BehaviorType`s are covered (previously only 11, missing `form` and every behavior added since).
  - `components.json` now also covers `silicaui-html`'s `ComponentDef` macro registry (208 framework-neutral components — Dialog, Popover, Combobox, etc.), not just `silicaui-react`. Each macro's real `BehaviorType`(s) are discovered by actually calling its `expand()`, not guessed. `get_component` now takes an optional `package` argument to disambiguate names that exist in both packages.
  - The generator now warns at `gen` time if a `silicaui-react` component's export has no matching row in the README's component table, instead of silently omitting it from the catalog forever.
  - `silicaui-react/README.md`'s component table gets 28 real components it was missing (`Timestamp`, `InputGroup`, `PasswordInput`, `MultiSelect`, `AppShell`, `PowerSearch`, the `DateInput`/`TimeInput` family, and others).
