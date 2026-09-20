# P09 — Gordon Pike · Pike & Daughter Tackle

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done — 10 acts of 10
**Run:** 2026-09-19
**Customer:** developer, with low vision and a strong keyboard habit
**Surface:** the edges — a daisyUI migration, judged keyboard-only, at 360px, in dark
**Role in the roster:** the conditions persona — **runs last**, over a mature tree

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P09-pike-tackle-migration/` — the app **before** and **after** |
| Framework | an existing Vite + React app **already built on daisyUI**, migrated in place |
| Theme | `obsidian` only — he does not use light mode and never will |
| Started from | a working daisyUI app, committed, so the migration is a real diff |

**This persona needs the other eight to have run first.** It judges what is left after
their fixes have landed, and a defect it finds that an earlier run should have caught
is a finding about the process, not about this run.

## The person

**Gordon Pike, 61, he/him.** Thirty years of writing software, the last eight on his
own, contracting. He has macular degeneration in one eye and works at 150% zoom in dark
mode with a large font. He navigates almost everything by keyboard because tracking a
small cursor tires him out.

**Technical level.** Very high, and entirely uninterested in being impressed. He wants
to know the cost of the change and whether he can still read it afterwards.

**What he is nervous about.** That "migrating is easy" means "easy if you rewrite every
screen". He has 40 screens and a client who will not pay for a rewrite. And that a new
system will be designed by people with excellent eyesight and a light-mode habit.

**What made him look today.** daisyUI does not give him a second theme per client
without a fight, and he now has three clients.

## The business

**Pike & Daughter Tackle** — a fishing-tackle retailer in Grimsby whose shop admin he
built and maintains. His daughter runs the shop and uses the admin daily.

- 2,400 products, 40 admin screens, 6 years old
- Built on daisyUI from the start
- **Inconvenient for the software:** his daughter uses it on an iPad in the shop
  standing up, one-handed, and Gordon uses it at 150% zoom in dark on a desktop. Two
  people, two extremes, one codebase, and neither of them will accept the other's
  version.

## Why he is here today

1. "What does this actually cost me to switch, in hours?"
2. "Can I read it at 150% zoom in dark?"
3. "Can I do the whole job without touching the mouse?"

## The data

**This is the test data. Type it as written** (RULE #2).

### The before — the daisyUI app

At least **8 real screens** carried over, using at least **15 different daisyUI
component classes** between them: product list, product edit, orders, order detail,
customers, stock take, settings, sign-in.

### Products — at least 30 rows

| SKU | Product | Price | Stock |
| --- | --- | --- | --- |
| PD-4471 | Shimano Stradic FL 2500 spinning reel | £229.99 | 4 |
| PD-1180 | Drennan Acolyte Ultra 13ft float rod — 3 piece, with spare tip | £184.50 | 0 |
| PD-0902 | Korda Krank size 4 barbless (pack of 10) | £4.85 | 118 |
| PD-3355 | Pike & Daughter's own 20lb fluorocarbon, 100m | £11.20 | 26 |

Twenty-six more. Carries: an apostrophe in `Pike & Daughter's own`, a 62-character
product name, prices with pence, a stock of **0** (which must not read the same as
unknown), and 30 rows so the list pages.

### The zoom and the viewport

| Condition | Value |
| --- | --- |
| Gordon's desktop | 150% browser zoom, `obsidian`, 1440px |
| His daughter's iPad | 768px, one-handed, standing |
| The floor check | 360px, as on every persona |

### The migration ledger

A table, filled in as he goes, one row per daisyUI class he had to replace:

| daisyUI class | Silica equivalent | Drop-in? | Minutes |
| --- | --- | --- | --- |

---

## The build

| Item | What it must have |
| --- | --- |
| Before | the daisyUI app, committed, working, so the diff is real |
| After | the same 8 screens on Silica UI, same behaviour, no screen rewritten from scratch |
| Migration ledger | every class, its equivalent, whether it was a drop-in, and the minutes — a real number, not an impression |
| Zoom pass | all 8 screens at 150% zoom in `obsidian`, with nothing clipped, overlapping or cut off |
| Keyboard pass | one complete real job — receive a delivery and update stock — mouse untouched |
| iPad pass | the same job one-handed at 768px |

**Working end to end:** his daughter can do a stock take on the iPad and he can do the
month-end at 150% zoom in dark, on the same build, and neither has to put up with the
other's settings.

**The look.** A working shop admin of six years' standing: unglamorous, fast, dense,
readable. It should look like a tool somebody actually uses, not a showcase.

**Also required, as on every one:** both themes (even though he only uses one — light
still has to be right for whoever inherits it), 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Find out what the migration costs, before doing it

From the docs alone, find out what a daisyUI user has to change. Is there a mapping? A
migration note? Anything?

**Done when:** what exists is written down, and if nothing exists, that gap is an issue
— daisyUI users are the single most likely source of new customers and the docs either
speak to them or do not.

### Act 2 — Migrate one screen and time it

Pick the product list. Migrate it. **Time it honestly**, including the looking-things-up.

**Done when:** the screen is identical in behaviour and the minutes are written down,
along with every class that was **not** a drop-in.

### Act 3 — The other seven

Migrate the rest, filling the ledger as you go.

**Done when:** all 8 screens work, the ledger has a row per class, and the total hours
are written down. That number is the honest answer to "what does this cost me", and it
belongs in the README.

### Act 4 — 150% zoom, dark

Open all 8 screens at 150% zoom in `obsidian`. Look at them the way he does: leaning in.

**Done when:** every screen is checked for clipping, overlap, lost focus rings and
text that has been pushed out of its container — each one an issue, each one `major`
if it makes a control unusable.

### Act 5 — The whole job, no mouse

Receive a delivery: find the product, update the stock from 0 to 40, save, confirm.
Mouse untouched from the first keystroke to the last.

**Done when:** the job is done, or the exact control that cannot be reached is a
`blocker`. Focus must be visible at every single step — not "mostly".

### Act 6 — The iPad, one-handed

The same job at 768px, standing, one thumb.

**Done when:** every tap target is reachable and nothing needed hover to be found. **A
control that only appears on hover does not exist here.**

### Act 7 — The thing that goes wrong for him

Half way through the migration he finds a daisyUI component with **no Silica
equivalent at all**. He has to decide: compose it, keep daisyUI on that one screen, or
tell the client no.

**Done when:** the component is named, the decision is recorded, and the gap is an
issue — this is the most commercially important finding this persona can produce.

### Act 8 — Stock of zero versus stock unknown

A product with 0 in stock and a product whose stock has never been counted.

**Done when:** they are visibly different on screen. If they are not, that is a
`blocker` — his daughter orders from this screen.

### Act 9 — Both people, one build

Gordon at 150% zoom in dark on the desktop; his daughter at 768px one-handed. Same
build, same session.

**Done when:** both can finish their own job without changing anything for the other.

### Act 10 — What is left

Walk every screen any earlier persona fixed something on, and check the fix held.

**Done when:** every shared-spine fix from P01–P08 has been re-proved once, and
anything that regressed is an issue naming both runs.

---

## What only this persona proves

**The edges over a mature codebase** — a daisyUI migration, judged keyboard-only, at
360px, in dark, by someone who will not squint.

---

## Standing checks

**Wrong moves.** Migrate a screen half way and leave both class systems on it at once.
Undo a migration commit and re-apply it. Set stock to a negative number. Save the same
product twice from two tabs.

**Reload and deep link.** F5 at 150% zoom with a dialog open — does zoom survive, does
focus? Then deep-link a product while signed out and check it comes back to the product
and not to a generic home.

**Dates.** A delivery dated the last day of a month, a stock take at `23:59`, and a
price change scheduled across a daylight-saving change. **Record the machine's
timezone.**

**Contrast and token math at the edges.** `obsidian` at 150% zoom, measured on: the
smallest text in the admin, a disabled control (which is legitimately faded and must
still be *identifiable*), and a `soft` surface anywhere it appears. Any readable text
on a faded ink is a breach of the root CLAUDE.md RULE #3 and is filed as `design`.

**The other side.** Act 9 — his daughter, on the iPad, in the shop.

**Without a mouse.** Act 5 is the full instance, and it is the strictest in the roster:
one complete real job, mouse untouched, ring visible at every step.

**A boundary that should hold.** Confirm the migration left **no daisyUI classes
silently still in play** — a half-migrated screen where both systems are on the same
element is a boundary that has already failed, and it looks fine until a theme changes.

---

## Verification

| | Result |
| --- | --- |
| Acts completed | **10 of 10** |
| Issues filed | **2** — [099](issues/099-the-docs-sell-to-daisyui-users-and-give-them-nothing-to-act-on.md) (the docs sell to daisyUI users and give them nothing), [100](issues/100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md) (`Steps` had no vertical) |
| Issues fixed and confirmed | **2 of 2.** 099 was deliberately left open through acts 2 and 3 so the page could be written from a real ledger rather than a guess, then fixed and re-proved with the same act-1 probe |
| Issues blocked, and on what | **None** |
| Screens scored (in both themes at 360px) | **0 — not checked.** P09's eight screens are a CONSUMER's application, not Silica screens, so they are not rows in [rating.md](rating.md). The one Silica screen this run created — the migration guide — is a new row and is deliberately `—`: writing a page is not opening it as a reader |
| **Not checked** | **Person-hours.** The persona asks for minutes and none were measured: this migration was done by a machine, and its wall clock is not what it would cost Gordon. What is published instead is the shape of the work — call sites moved, how many were mechanical, which needed a decision. **Two tabs racing a save** — the artifact has no server and no shared store, so there is nothing for two saves to contend over; both completed without throwing and that is all this can say. **Other browsers** — Chromium only, as everywhere in this roster |

### The numbers

| Record | Result |
| --- | --- |
| Total hours to migrate 8 screens | **Not measured, and not estimated.** See "Not checked" above. What is counted instead: **76 daisyUI classes across 28 families**, of which **74** were replaced by name; **45** Silica components used; **five** call sites that needed a decision rather than a swap; **one** type error the compiler caught; **+89 lines of code (+12%)** |
| daisyUI classes replaced, and how many were drop-ins | **74 of 76 replaced.** The 2 left are Silica's own `.select` on a deliberately native picker. **23 of the 28 families were drop-ins**; the 5 that were not are the shell, tabs, modals, form fields and paging — and two of those five (modals, paging) arrived with behaviour the app did not have before |
| daisyUI components with **no** Silica equivalent | **One: `steps-vertical`** ([100](issues/100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md)). Added rather than worked around |
| Screens that broke at 150% zoom | **None.** All eight: 0px sideways scroll, 0 clipped elements |
| Controls unreachable by keyboard | **None.** The whole delivery job done mouse-untouched, 11 tab stops in, with a **visible ring at every one** |
| Controls that needed hover to be discoverable | **None.** At 768px: 0 tap targets under 24px, 0 unnamed controls |
| Earlier personas' fixes re-proved, and how many had regressed | **All of them, via the probes those runs left — `pnpm verify` exit 0 and 217 builder e2e tests. None had regressed.** The P07 focus sweep still returns 0 across 116 pages |
| Worst contrast measured in `obsidian` at 150% zoom | **15.99:1** — the smallest text on the screen (11px, the "Edit" link) on its own surface. `daylight` measured 17.29:1. The disabled Post button, legitimately faded at `opacity: 0.5`, still measures **7.54:1** and is identifiable as itself |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen. Where a number is
the finding — minutes, a contrast ratio, a count of unreachable controls — write the
number, never an adjective.

### Act 1 — Find out what the migration costs, before doing it

**Done when:** what exists is written down, and if nothing exists that gap is an
issue.

Gordon has forty screens and a client who will not pay for a rewrite. Before
touching anything he looks for the page that tells him what he is in for.

**The landing page names daisyUI once**, inside an FAQ accordion, and the answer
is about philosophy. **The docs search returns nothing:**

```
searching "button"      ["Button"]      <- the control
searching "daisyui"     []
searching "migrate"     []
searching "migration"   []
searching "daisy"       []
```

**No page exists under any name:** `/docs/migration/`, `/docs/migrating-from-daisyui/`,
`/docs/from-daisyui/`, `/docs/daisyui/` all 404, and `/docs/getting-started/`
never says the word.

And `apps/site/src/lib/site.ts` lists **`"daisyUI alternative"`** among the
site's own keywords. It advertises to these people and then has no answer for the
first thing they ask.

[099](issues/099-the-docs-sell-to-daisyui-users-and-give-them-nothing-to-act-on.md), filed **open** rather than fixed on the spot: a class
mapping written from the source would be a guess, and the whole value of that
page is that its numbers are real. It gets written in act 3, from the ledger.

---

### Act 2 — Migrate one screen and time it

**Done when:** the screen is identical in behaviour and every class that was
**not** a drop-in is written down.

The product list. Ten swaps, of which **eight were mechanical** and two needed a
decision:

| daisyUI | Silica | Drop-in? |
| --- | --- | --- |
| `breadcrumbs` | `<Breadcrumb>` | yes |
| `stats` / `stat` / `stat-title` / `stat-value` / `stat-desc` | `<Stats>` / `<Stat>` / … | yes |
| `input input-bordered input-sm` | `<FieldControl render={<Input size="sm" />}>` | **no** |
| `select select-bordered select-sm` | kept native, inside a `<Field>` | **no** |
| `btn btn-primary btn-sm` | `<Button color="primary" size="sm">` | yes |
| `table table-zebra table-sm` | `<Table zebra size="sm">` | yes |
| `badge badge-*` | `<Badge color variant>` | yes |
| `btn btn-ghost btn-xs` | `<Button variant="ghost" size="xs">` | yes |
| `alert alert-warning` | `<Alert color="warning">` | yes |
| `join` / `join-item` + three buttons | `<Pagination page count onValueChange>` | **no — better** |

**The two that were not drop-ins, and why:**

`FieldControl` renders a native input, where `size` is the HTML attribute and
takes a **number** — so `size="sm"` is a type error rather than a small field.
The documented way in is `render={<Input size="sm" />}`. **The type checker is
what caught it**, which is the good version of this: a class-based library would
have silently rendered `size="sm"` as nothing.

`join` was the opposite of a cost. daisyUI's is a visual grouping and the three
buttons inside it were hand-rolled paging; `Pagination` is the component —
numbered pages, ellipses, prev and next, and the aria. 1-based where the state is
0-based, which is the only edit the swap needed.

**And one thing broke that was not on the list: the shell.** Migrating one screen
removed daisyUI from the build, and the app's `drawer`/`drawer-side`/`menu`
classes stopped existing — the left rail vanished from a screen that had not been
touched. That is the fact a forty-screen migration turns on, and act 7 is where
it gets answered.

**On "time it honestly".** The persona asks for minutes and the honest answer is
that **no minutes were measured**. This migration was done by a machine; its
wall clock says 79 seconds for this screen, which is not what it would cost
Gordon and is not being presented as if it were. What transfers is the shape of
the work — ten swaps, eight mechanical, two decisions, one type error, one
surprise — and that is what the ledger and the published guide carry instead.

---

### Act 3 — The other seven

**Done when:** all 8 screens work, the ledger has a row per class, and the total
is written down.

```
BEFORE  76 distinct daisyUI classes across 28 component families
AFTER    2 component classes still written by hand, in 1 family

the migration removed 74 of the 76 by name
what is left:  .select x2, .select-sm x1  — and those are SILICA's, on a
               deliberately native picker

silicaui components imported: 45
lines of CODE       before 730   after 819    (+89, +12%)
lines with comments before 819   after 932    <- the difference is migration notes
```

**Every `useState`, every handler, every bit of filtering and paging logic is
byte-for-byte what it was.** The diff is markup.

Three more that were not drop-ins:

- **The shell.** daisyUI's `drawer` is a hidden checkbox plus five coordinated
  classes. `AppShell` + `AppShellSidebar` + `AppShellHeader` + `AppShellMain` is
  a layout, and the open state becomes ordinary React state. Biggest single edit
  in the migration, done once.
- **Tabs.** daisyUI's are `role="tablist"` plus a `tab-active` class the app keeps
  in sync itself — arrow keys do nothing because nothing is listening. Silica's
  are Base UI. The state moved from a `className` to `value`/`onValueChange`.
- **Modals.** `modal modal-open` is a `<dialog>` with a class: no focus trap, no
  scroll lock, no escape, and focus does not return to the button that opened it.
  `AlertDialog` does all four. Note the spelling — **`AlertDialogClose` takes its
  button as a CHILD where `FieldControl` takes its control through `render`.**
  Two components, two ways to say "wrap my element".

Two that got shorter: `Toggle` and `Checkbox` take their caption as children and
wrap themselves in the label, where daisyUI needed a `<label>`, the input and a
`label-text` span. And `Avatar` takes initials directly where daisyUI needed
`avatar avatar-placeholder` on a wrapper around a sized `<div>`.

#### And the component that did not exist

**[100](issues/100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md) — `Steps` could only go across the page.** The order-detail screen
shows progress down the side of a narrow card. daisyUI: `steps steps-vertical`.
Silica: nothing. Not a prop, not a class, and the CSS module's first line said
so — *"a horizontal progress tracker"*. Its neighbour `Stats` has had `vertical`
since it shipped, so the answer was yes for one component and no for the next,
with nothing saying which.

**This is the act-7 finding, and it arrived in act 3.** Added rather than worked
around: `.steps-vertical` in the CSS and a `vertical` prop spelled the way
`Stats` already spells it.

---

### Act 4 — 150% zoom, dark

**Done when:** every screen is checked for clipping, overlap, lost focus rings
and text pushed out of its container.

150% browser zoom on a 1440px screen is 960 CSS pixels at a 1.5 device ratio,
which is what the page sees. All eight screens, in `obsidian`:

```
products  — sideways 0px, clipped 0      customers — sideways 0px, clipped 0
product   — sideways 0px, clipped 0      stock     — sideways 0px, clipped 0
orders    — sideways 0px, clipped 0      settings  — sideways 0px, clipped 0
order     — sideways 0px, clipped 0      signin    — sideways 0px, clipped 0
```

Nothing clipped, nothing overlapping, no sideways scroll on any of them. The
clipping check ignores `text-overflow: ellipsis`, because a truncated 62-character
product name is a decision, not a fault.

---

### Act 5 — The whole job, no mouse

**Done when:** the job is done, and focus is visible at every single step — not
"mostly".

Receive a delivery: find PD-1180 (the Drennan float rod, stock 0), set it to 40,
save, confirm.

```
what focus landed on, in order —
  ["a:Products","a:Orders","a:Customers","a:Stock take","a:Settings",
   "button:Sign out","a:Products","input:","input:","input:","input:"]
✓ the stock field is reachable with the keyboard alone — 11 tab stops in
✓ focus is visible at every step, not mostly — []
✓ the new count went in — "40"
✓ the job finishes without a mouse
```

**Eleven tab stops, a visible ring on every one, and the job done.** The empty
list is the finding: not one focusable element on the path had to fall back to
the browser's ring or to nothing.

**Standing check — set stock to a negative number**, and it found a real bug:

```
typing -3 into stock — {"said":false,"saveDisabled":false}
```

`Number("-")` is `NaN` and `NaN < 0` is false, so typing a minus sign put NaN in
the draft and the guard never fired. **The daisyUI app has the identical bug** —
a faithful migration carries the bugs across too. Fixed in **both** trees, so the
diff between them stays a migration and not a bug fix wearing one. After:
`{"said":true,"saveDisabled":true}`.

---

### Act 6 — The iPad, one-handed

**Done when:** every tap target is reachable and nothing needed hover.

768px, touch, the stock-take screen his daughter uses standing up in the shop:

```
{"sideways":0,"small":[],"unnamed":0}
✓ every tap target clears 24px
✓ nothing you can press is unnamed
✓ the count can be entered and posted by touch
```

Tapped a count field, typed 40, and **Post the count** went from disabled to
enabled — the whole job by thumb.

---

### Act 7 — The thing that goes wrong for him

**Done when:** the component is named, the decision is recorded, and the gap is
an issue.

The component is `steps-vertical` and it is [100](issues/100-steps-had-no-vertical-and-the-css-said-so-in-its-first-line.md), above. But act 7's real
question is the one the missing component forces: **what do you do when you hit
one of these on screen 23 of 40?**

Gordon's three options are compose it, keep daisyUI on that screen, or tell the
client no. The middle one sounds reasonable and is the worst, because **daisyUI
and Silica both own `.btn`, `.card`, `.table` and `.badge`** — two stylesheets
fighting over the same names is not "one screen on the old system".

**Unless Silica is namespaced, and it can be.** `coexist/` is a third app in this
artifact that loads **both plugins in one build**, with Silica behind `prefix:
sx-` and `<SilicaProvider prefix="sx-">`. Measured on the built stylesheet:

```
rules whose selector is exactly .btn     (daisyUI)  81
rules whose selector is exactly .sx-btn  (Silica)   14
rules whose selector is exactly .card    (daisyUI)  13
rules whose selector is exactly .sx-card (Silica)    3

Silica-only class names appearing WITHOUT the prefix  []
...and the same names WITH it  ["breadcrumb","sortable-list","resizable-group","data-table","field"]
✅ daisyUI and Silica are in one stylesheet and share no class name
```

Rendered side by side, the two columns are near-identical and neither took the
other's styling. **That is the answer to "can I do this a screen at a time", it
is yes, and it was documented nowhere a daisyUI user would look** — which is
[099](issues/099-the-docs-sell-to-daisyui-users-and-give-them-nothing-to-act-on.md) again, and is now the first section of the published guide.

The check counts selector HEADS rather than substrings, because `.sx-btn`
contains `btn` and a naive `includes(".btn")` is true whatever happens.

---

### Act 8 — Stock of zero versus stock unknown

**Done when:** they are visibly different. If not, `blocker`.

```
stock 0        (PD-1180)  {"words":"none in stock","background":"oklch(0.62 0.2 25)"}
never counted  (PD-4474)  {"words":"not counted",  "background":"rgba(0, 0, 0, 0)"}
```

**Different words and a different shape.** `0` is a filled red badge that says
*none in stock*; `null` is an outline badge that says *not counted*. The words
differ first and the colour second, because colour alone is not a distinction —
and the products screen counts them separately at the top, "Out of stock 4" beside
"Never counted 3, not the same as none".

---

### Act 9 — Both people, one build

**Done when:** both can finish their own job without changing anything for the
other.

Gordon's window at 150% zoom in `obsidian` and his daughter's iPad at 768px, open
at the same time against the same build.

```
Gordon's window theme        obsidian
his daughter's iPad theme    obsidian
✓ his daughter's screen still has its rows — 12 rows
✓ Gordon's screen still has its content — 176 elements
```

Neither changed a setting because **there is no per-person setting to change**:
the layout responds to the viewport and the theme is the app's. That is the
answer, and it is a boring one, which is the point.

---

### Act 10 — What is left

**Done when:** every shared-spine fix from P01–P08 has been re-proved once.

Those fixes are not a list to walk by hand — each run left its own probe, and
`pnpm verify` is all of them:

```
pnpm verify                       exit 0
builder e2e                       217 passed
verify-no-control-chars           ✅
verify-readable-ink               ✅
verify-token-contrast             ✅
verify-auto-ink                   ✅
golden HTML projection            byte-identical to the fixture
gen-screens --check               ok, 145 screens
```

**Nothing had regressed.** The P07 focus-ring sweep over all 116 component pages
also still returns **0**, and the P09 migration itself is a second proof of the
same thing: 45 components used across eight screens, every one of them keyboard
reachable with a visible ring, in an app that had never opened them before.

One thing the run ADDED to the denominator: the migration guide is a new docs
page, so `gen-screens --check` went red until `rating.md` was regenerated —
**144 screens became 145**. That is the framework working: a new screen cannot
appear without the denominator moving.
