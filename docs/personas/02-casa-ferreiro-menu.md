# P02 — Tomás Ferreiro · Casa Ferreiro

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done
**Run:** started and finished 2026-09-18
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
| Acts completed | **9 of 9** |
| Issues filed | **5** — 028, 029, 030, 031, 032 |
| Issues fixed and confirmed | **5 of 5** |
| Issues blocked, and on what | none. The N-color *engine* question inside 032 is handed to **P06**; the instance on the page is fixed |
| Screens scored (in both themes at 360px) | **6** — `/`, `/docs/getting-started`, the three component pages, and the menu itself |
| **Not checked** | a real phone (measured at an asserted 360px in Chrome, not on hardware); any browser but Chromium; Outlook and email (P04's); whether the docs teach a non-React reader anything beyond the three pages act 3 names |

### The numbers

| Record | Result |
| --- | --- |
| Minutes from silicaui.com `/` to first class rendering in a Django template | one `npm install`, one `@plugin` block, one `npx @tailwindcss/cli` run — **1s compile**, no bundler |
| Where the first JSX appears on the path a CSS-only reader walks | **y=583**, the hero, the FIRST code on the page: `npm i @wizeworks/silicaui-react`. First HTML-with-classes sample: **y=6,902 of 10,466 — 66% down**. #029 |
| Component doc pages that serve a CSS-only reader, out of the three read | **3 of 3** — Plain HTML first, before React, with the class list printed and Django named. Spoiled on all three by a blanket "styled but inert" that is false for 57 of 108 components. #028 |
| Did an interactive component have a non-React answer? | **yes.** Collapse is a native `<details>`. Opened and closed with a **real** Enter, focus kept on the summary, zero JavaScript on the page |
| Design-rule breaches found | **1** — #032, `btn-brand` at 4.30 on the home page. RULE #1 and #2 held everywhere; no hex was written, no eyebrow was needed |
| Console errors and warnings during the run | **0**, including the cold production serve |
| Worst contrast ratio measured, `carbon`, at price size | **10.27** (the `badge-success`, 12px). Worst anywhere in carbon: **9.53**, a 12px `.field-error`. **0 of 92 elements below AA**, in either theme, at an asserted 360px |

---

## Run log

### Act 1 — Does the front page speak to him? · **done**

Measured rather than judged. The page's `<title>` is *"SilicaUI — **The CSS-first**
Tailwind Component Library"*. The first code on it, at y=583, is
`npm i @wizeworks/silicaui-react`. Occurrences of `@wizeworks/silicaui-react`: **2**.
Occurrences of `@wizeworks/silicaui`: **0**. Occurrences of "Django", "Rails", "PHP":
**0**. The word **framework-agnostic** — the README line that brought him — is not on the
page either.

He gets one section, *"The same components, with no framework at all"*, at **y=6,638 of a
10,466px page**. It is about the **node tree**: `atom("Switch", …)` and `toHtml()`, a
JavaScript API and two more packages. **The path he wants — write the classes on your own
markup — is not on the front page at all.** Filed as **#029**, minor, because
getting-started one click away is genuinely good.

He also reads, at 25% of the page, a heading that says *"CSS-only libraries stop right where
the hard part starts"*, whose answer is *"Interaction comes from Base UI"*. Fair as a
competitive point; for him it reads as *the answer to your problem is React*.

### Act 2 — Install with no package.json · **done**

**The promise holds.** Getting-started's "Without React" section is exactly right and names
him: *"Works in Rails, **Django**, PHP, Go, or a static file, with no bundler and no
JavaScript at all."*

Proved in a bare directory outside any monorepo, with no `package.json`:

```
npm install @wizeworks/silicaui     → added 2 packages in 534ms
npx @tailwindcss/cli -i in.css -o out.css   → Done in 1s
```

386KB of CSS carrying `.btn`, `.btn-primary` (with issue 019's `--btn-ink`),
`.badge-warning`, the token set and both built-in themes. **No bundler, no React, no
framework.** Nothing had to be improvised around.

**One failure was mine, not the product's.** Run inside the repo, `npm install` died with
`EUNSUPPORTEDPROTOCOL … Unsupported URL Type "workspace:"` — npm had walked up and found
the monorepo root. The control above, in a plain directory, is what settles it, and the
published package's own dependencies are just `{ tailwindcss: ">=4.3.0" }`. **Not filed.**

### Act 3 — Read a component doc as a non-React reader · **done**

All three pages do the important thing right: **"Plain HTML — CSS classes" comes first**,
before React, with the class list printed and the four server frameworks named. That is
issue 009's fix working, and it is worth saying before the complaint.

The complaint is the paragraph under that heading, identical on all three:

> *"This path ships no JavaScript, so a component that needs interaction is styled but
> inert. For behavior with no framework, use the node-tree path below."*

**On Collapse that is false.** Collapse is a native `<details>`; the same page says so
twice, including a **Hydrated by: nothing — this one is static markup** a few inches lower.
Counted from `catalog-api.ts`: **57 of the 108** components with a class list need no
JavaScript and got the warning anyway. **#028**, fixed — the paragraph now reads the
`behaviors` array it was already rendering.

### Act 4 — The menu page · **done**

Four courses, 16 dishes, prices aligned, accents correct in the heading, the body, the
button label and the `<title>`. At an asserted **360px** the 70-character
*"Arroz de pato à moda da avó, com enchidos fumados e laranja do Algarve"* and the five-line
polvo description both hold, and **the page does not scroll sideways** (`scrollWidth` ===
`clientWidth` === 360).

**Then the theme, which is where the act went.** He picks `marble` and `carbon` from the
twenty presets, writes `<html data-theme="marble">`, and gets **the default palette**. No
error, no warning. `data-theme="marble"`, `data-theme="banana"` and no attribute at all
render identically. **#030.**

The mechanism existed — `@plugin "@wizeworks/silicaui/theme"`, which the site's own
`globals.css` uses three times — but `list_themes` and `get_theme` never mention it, and
`get_theme` steers away from it: *"do not paste these values into CSS."* The site had **no
theming page at all**.

**And declaring the theme surfaced a second defect underneath.** The colours landed; the
headings did not. `--font-head: "Cormorant Garamond", serif` was emitted as **two
declarations**, and the last won:

```css
--font-head: Cormorant Garamond;
--font-head: serif;            /* ← wins */
```

Tailwind hands a comma-separated option to a plugin as an **array**; the main plugin's
`parseColors` and `parsePrefix` both handle that and `theme-plugin.js` did not. **#031.**
Multi-layer shadows split the same way.

**One of the two bugs on this screen was mine.** A `{# … #}` Django comment spanning two
lines is not a comment — Django's is single-line — so the text rendered on the page. Fixed
with `{% comment %}`, and the note kept in the template for the next person.

### Act 5 — The interactive thing · **done**

**He gets a real answer, and it is not React.** The wine list is
`<details class="details">` with `<summary class="details-title">`. Driven with a **real**
Enter key, not a synthetic `KeyboardEvent` (act 6 of P01 having learned that difference):

| | |
| --- | --- |
| summary focusable | yes, `tabIndex` 0 |
| first Enter | `open` **false → true**, content 92px tall, focus still on the summary |
| second Enter | `open` **true → false** |
| scripts in the served HTML | **0** |

So "framework-agnostic" is a true sentence for this component — which makes act 3's blanket
warning the more expensive, because it told him the opposite.

### Act 6 — The booking form and its error state · **done**

A real Django form, and **the error styling needs no JavaScript**: silicaui keys it off
`[data-invalid]` on the control, and Django writes that attribute from `field.errors`.

All three states seen on screen, server-rendered:

| submitted | what came back |
| --- | --- |
| empty | 4 errors, 4 controls marked invalid — *"Diga-nos o nome para a reserva."* |
| phone `123` | *"Escreva o telefone com 9 dígitos, por exemplo 226054417 ou +351 22 605 4417."* |
| a Monday | *"À segunda-feira estamos fechados. Escolha de terça a domingo."* |

Measured: the invalid border is `oklch(0.52 0.19 25)` against a valid control's
`oklch(0.92 0.005 260)` — it really does repaint. The valid booking returns a
`role="status"` confirmation with the date in Portuguese.

**Measured and deliberately NOT filed:** `.field-error` and `.field-description` are 12px
and `.field-label` is 14px. RULE #3's floor is about the **base** — `text-md` = 1rem =
16px, with the root at `100%` so a reader's own browser setting is honoured. These are
`0.75rem`/`0.875rem`, so they scale with that setting, and all of them measure **17.36** in
carbon. Recorded rather than filed.

### Act 7 — The thing that goes wrong for him · **done**

Sofia pastes from Word and leaves a price blank. Both survive:

| | |
| --- | --- |
| `Bacalhau "do Zé" — só à sexta` | curly quotes and the em-dash render correctly |
| the dish with no price | **"preço por definir"**, a `badge-warning` |
| any `0.00` anywhere on the page | **none** |

That last row is the one that mattered. A missing price rendered as `0,00 €` would be a
lie, not a blank; the view keeps it `None` and the template says so.

**The boundary held.** A `<script>alert(1)</script>` and an `<img src=x onerror=…>` in a
dish description, coming out of the YAML: served as `&lt;script&gt;` and `&quot;`, zero
`<script>` tags in the HTML, zero `img[onerror]` elements, `document.title` unchanged. The
payload is visible as text, which is correct.

### Act 8 — Dark, and the phone, at 19:40 · **done**

At an **asserted 360px** (oversized iframe, `clientWidth === 360`), in both themes, with
every translucent ancestor composited:

| | marble | carbon |
| --- | --- | --- |
| text elements measured | 92 | 92 |
| **below AA** | **0** | **0** |
| worst | 6.15 — the `badge-success` | 10.27 — the same badge |
| worst on the error screen | — | **9.53**, a 12px `.field-error` |
| horizontal scroll | none | none |

`carbon` follows the OS with **no script**: one `@media (prefers-color-scheme: dark)` rule
from `prefersdark: true`, so there is nothing to flash and nothing for a CSP to refuse.

**The focus ring measured 1.71429px where the source asks for 2px, and that is not a
defect.** `devicePixelRatio` is 1.75 here, so 2 CSS px is 3.5 device px and Chrome rounds
down to 3 — which is 1.71429 CSS px exactly. The outline **colour** was marble's primary, so
the rule was applying all along. Worth remembering before filing a ring that measures 1.714
on a scaled Windows display.

### Act 9 — The other side · **done**

`DEBUG = False`, `collectstatic` (129 files), WhiteNoise, and **waitress** — a real WSGI
server. The dev server was stopped by PID first and the port asserted free, so nothing here
could have come from it.

| | |
| --- | --- |
| page | HTTP 200, 18,826 bytes |
| stylesheet | HTTP 200, 398,822 bytes |
| theme | marble, `Cormorant Garamond` headings |
| dishes rendered | 19 |
| `<script>` tags | **0** |
| console messages | **0** |
| booking posted cold | yes — `role="status"` confirmation returned |

**And it survives losing its stylesheet.** With the `<link>` pulled, all 19 dishes and
their prices are still readable, 27 headings are still headings, 5 labels are still bound to
their inputs, the `<details>` still opens and the form still submits. That is what the
CSS-only path buys when the markup underneath is semantic.

### Standing checks · **done**

| Check | Result |
| --- | --- |
| Wrong moves — whole menu in the name field | rejected: *"O nome não pode ter mais de 80 caracteres."* |
| Wrong moves — 40 covers | rejected, with the phone number and the reason: the room seats 28 |
| Reload with the wine list open | closes. Native `<details>` keeps no state and the server was never told — correct, and the honest cost of the no-JS path |
| Deep link `/#sobremesas` from cold | lands on **Sobremesas**, heading 16px from the top (`scroll-mt-4`) |
| Dates — a Monday | rejected |
| Dates — 29 Feb 2028 (leap day, a Tuesday) | **accepted**, correctly |
| Dates — yesterday | rejected: *"Esse dia já passou."* |
| **Machine timezone** | `Europe/Lisbon` in Django; the host is on Windows local time |
| Half-loaded system — stylesheet removed | degrades gracefully, see act 9 |
| Without a mouse | name → phone → date → serviço → pessoas in Tab order, all typed with real keys, values correct in the DOM |
| A boundary that should hold | escaped, see act 7 |

**One observation, not a defect:** `<input type="date">` shows `mm/dd/yyyy` on a page with
`lang="pt-PT"`. Chrome formats that control from the **browser's** locale, not the page's.
Nothing Django or silicaui controls.

---

## What this run proves

**The CSS layer really does stand alone.** A Django developer with a Tailwind CLI and no
`node_modules` in his project built a themed, accessible, keyboard-operable, zero-JavaScript
page that passes AA at 360px in both themes and keeps working when its stylesheet is
deleted. That is the claim, and it is true.

**What nearly stopped him was never the CSS.** It was three sentences: a front page that
names only the React package, a doc paragraph telling him his disclosure would be dead when
it was not, and a theme tool giving him half an instruction. All three are documentation,
and all three are now fixed.
