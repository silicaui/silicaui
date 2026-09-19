# P09 — Gordon Pike · Pike & Daughter Tackle

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
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
| Acts completed | |
| Issues filed | |
| Issues fixed and confirmed | |
| Issues blocked, and on what | |
| Screens scored (in both themes at 360px) | |
| **Not checked** | |

### The numbers

| Record | Result |
| --- | --- |
| Total hours to migrate 8 screens | |
| daisyUI classes replaced, and how many were drop-ins | |
| daisyUI components with **no** Silica equivalent | |
| Screens that broke at 150% zoom | |
| Controls unreachable by keyboard | |
| Controls that needed hover to be discoverable | |
| Earlier personas' fixes re-proved, and how many had regressed | |
| Worst contrast measured in `obsidian` at 150% zoom | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen. Where a number is
the finding — minutes, a contrast ratio, a count of unreachable controls — write the
number, never an adjective.
