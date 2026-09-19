# P02 — Tomás Ferreiro · Casa Ferreiro

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
**Customer:** developer
**Path:** `@wizeworks/silicaui` CSS plugin **only** · Django templates · no React, no bundler
**Role in the roster:** the negative-space persona — runs second, on purpose

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P02-casa-ferreiro-menu/` |
| Framework | Django 5 templates, served by `runserver`; Tailwind CLI watches the CSS |
| Theme | `marble` light · `carbon` dark — **not** the default, because he picks one |
| Started from | an empty Django app with one CSS file and no `package.json` at all |

## The person

**Tomás Ferreiro, 44, he/him.** A one-man web shop in Porto. Django since 1.4. He
writes Python and templates and CSS; he has never run a React build and does not
intend to start. He has a Tailwind CLI binary and that is the whole of his front-end
toolchain.

**Technical level.** High, but **sideways** from this product's assumptions. He will
not be confused by a build step — he will be confused by a doc that shows him a `.tsx`
file when he asked how to use a card.

**What he is nervous about.** That "framework-agnostic" is marketing and the real
product is React with a CSS layer bolted on underneath. He has been burned by that
exact promise twice.

**What made him look today.** The README's line "Framework-agnostic. CSS-first: no
`tailwind.config`". He is here to see whether a person with no `node_modules` in their
project can actually use this.

## The business

**Casa Ferreiro** — a 28-cover family restaurant in Porto that his sister runs. He
maintains their site for free and resents every minute of it. The build is their
**menu and booking page**.

- 28 covers, two sittings, closed Mondays
- The menu changes weekly; his sister edits a YAML file he set up
- **Inconvenient for the software:** roughly 40% of the traffic is a phone held in one
  hand outside the restaurant at 19:40, deciding whether to go in. The phone view is
  not the secondary view — it is the view.

## Why he is here today

1. "Can I use this with no JavaScript build at all?"
2. "Do the docs talk to me, or only to somebody holding a React component?"
3. "If I want a dropdown, do I get one, or do I get told to install React?"

## The data

**This is the test data. Type it as written** (RULE #2).

### The menu — at least 16 dishes across 4 courses

| Dish | Price |
| --- | --- |
| Caldo verde com chouriço de Trás-os-Montes | €4.80 |
| Bacalhau à Brás | €13.50 |
| Polvo à lagareiro com batata a murro | €18.25 |
| Arroz de pato à moda da avó, com enchidos fumados e laranja do Algarve | €16.00 |
| Francesinha (só ao sábado) | €12.90 |
| Pastel de nata | €1.35 |

Ten more like them. What the data deliberately carries:

- **Accents everywhere** — `ç`, `ã`, `à`, `ó`, `é` — in headings, in body, in a
  `<title>`, and in a button label
- **`Arroz de pato à moda da avó, com enchidos fumados e laranja do Algarve`** — 70
  characters, which at 360px must wrap to five lines and still leave the price
  readable and aligned
- **`€4.80` / `€1.35` / `€18.25`** — cents, a currency symbol before the number, and a
  column that has to align across four courses
- **16 dishes** — long enough that the page scrolls and the course headings need to
  stay findable

### The booking section

| Field | Value |
| --- | --- |
| Phone | `+351 22 605 4417` |
| Address | Rua de São Bento da Vitória 41, 4050-544 Porto |
| Hours | Terça a domingo, 12:00–15:00 e 19:00–22:30 |
| Closed | Segunda-feira |

### The dish description that wraps

> Polvo cozido lentamente em azeite de Trás-os-Montes com alho, batata a murro e
> grelos do dia; servido para dois, e vale a pena esperar os vinte minutos.

At 360px this is five lines. It sits under a 70-character dish name. Both have to hold.

---

## The build

| Item | What it must have |
| --- | --- |
| Menu page | four course sections, 16 dishes, aligned prices, accents correct everywhere including the `<title>` |
| Booking form | a real Django form — date, sitting, covers, name, phone — posting and coming back with a server-rendered error state that has actually been triggered |
| Opening hours | a table or list that is readable on a phone in one hand |
| An interactive thing | one disclosure or dropdown, done **the way the docs tell a non-React reader to do it** — whatever that turns out to be |
| Theme | `marble` / `carbon`, switched by the OS preference, with no JavaScript if that is possible |

**Working end to end:** a stranger on a phone outside the restaurant at 19:40 can read
the menu, see that it is Tuesday and they are open, and submit a booking that comes
back with a confirmation.

**The look.** Warm, printed, quiet — a paper menu, not an app. Nothing in it should be
recognisable as a sibling of P01's console.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Does the front page speak to him?

Land on silicaui.com `/`. He is looking for one thing: evidence that this works
without React. Write down how far he gets before the page shows him JSX, and whether
anything on it tells a Django developer that they are welcome.

**Done when:** the first JSX on the page is located and written down, along with
whether any CSS-only path is offered before it.

### Act 2 — Install with no package.json in the project

Follow getting-started for the CSS path. He has a Tailwind CLI binary and one `.css`
file. If the instructions assume `npm`, a bundler or a framework, that is the finding —
**do not improvise around it**, record where it stopped.

**Done when:** `btn btn-primary` renders in a Django template, or the exact step that
made it impossible is an issue.

### Act 3 — Read a component doc as a non-React reader

Open `/docs/components/card`, `/docs/components/menu` and `/docs/components/collapse`.
For each one, answer: **can he get the class names he needs without translating React
props in his head?**

**Done when:** each of the three is scored and it is written down, per page, whether a
CSS-only reader is served or has to reverse-engineer it.

### Act 4 — The menu page

Build it: four courses, 16 dishes, aligned prices. Accents in every position — heading,
body, button label, and the `<title>`.

**Done when:** the 70-character dish name and the five-line description both hold at
360px with no horizontal scroll, and the prices align across all four courses.

### Act 5 — The interactive thing

He wants the wine list to fold away. Find out what the docs tell someone with no React
to do. Then do it.

**Done when:** it opens and closes on a phone and on a keyboard — or it is recorded
that the only answer offered was React, which would make "framework-agnostic" a false
sentence and therefore `Severity: major`.

### Act 6 — The booking form and its error state

Build the Django form. Submit it empty. Submit it with the phone in the wrong shape.
Submit it for a Monday.

**Done when:** all three error states have been seen, server-rendered, and each one
says something a customer could act on.

### Act 7 — The thing that goes wrong for him

His sister pastes a dish name with a smart apostrophe and an em-dash from Word. Then
she adds a dish with no price at all.

**Done when:** both are on screen and it is recorded whether the missing price shows
as absent or quietly as something else — an absence that renders identically to a
value is the defect, not the blank.

### Act 8 — Dark, and the phone, at 19:40

Set the OS to dark. Open the menu on a 360px screen. Read it the way somebody standing
outside in the evening reads it.

**Done when:** every dish name, price and heading is measured for contrast in `carbon`
at real size, and the theme follows the OS with no JavaScript — or the JavaScript it
needs is written down.

### Act 9 — The other side

Serve the built page with the dev server off, from a plain file or `collectstatic`
output. Open it cold on a phone.

**Done when:** it renders identically with nothing running, no console error, and the
booking form still posts.

---

## What only this persona proves

**The CSS layer standing alone** — no React, no bundler, a server-rendered template —
and whether the docs can teach a non-React reader anything at all.

---

## Standing checks

**Wrong moves.** Paste the whole menu (all 16 dishes) into the single "dish name"
field. Submit the booking form twice by double-clicking. Delete the theme's CSS import
line and reload, to see what a half-loaded system looks like.

**Reload and deep link.** F5 with the wine list folded open. Then send himself the URL
of the menu page with a course anchor and open it from the phone.

**Dates.** A booking for Monday (closed), one for 23:59, and one for the last day of
February. **Record the machine's timezone.**

**Contrast and token math at the edges.** `€1.35` next to `Pastel de nata` in `carbon`
at the smallest size prices are printed, measured off the computed style. Then the same
line inside a `soft` surface, which is where this rule earns its keep.

**The other side.** Act 9 — the page served cold with nothing running.

**Without a mouse.** The booking form, from the first field to the confirmation, on the
keyboard alone.

**A boundary that should hold.** Drop a `<script>alert(1)</script>` and an
`<img onerror=...>` into a dish description coming out of the YAML file, and confirm
the template escaping and the class vocabulary both hold.

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
| Minutes from silicaui.com `/` to first class rendering in a Django template | |
| Where the first JSX appears on the path a CSS-only reader walks | |
| Component doc pages that serve a CSS-only reader, out of the three read | |
| Did an interactive component have a non-React answer? | |
| Design-rule breaches found | |
| Console errors and warnings during the run | |
| Worst contrast ratio measured, `carbon`, at price size | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.
