# P06 — Nia Adeyemi · Nia's Atelier

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-19

**Status:** done
**Run:** 2026-09-19 — 9 acts, 4 issues, all fixed
**Customer:** designer-developer — she designs it and she ships it
**Surface:** the token engine — custom N-colors, class prefix, theme islands, type scale
**Role in the roster:** the N-color claim, tested from the outside

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P06-nias-atelier-brand-kit/` |
| Framework | Vite + React, with an **existing stylesheet already on the page** |
| Theme | three custom themes of her own, none of the 20 shipped ones |
| Started from | a page that already has a legacy `.btn` class of its own — the collision is the point |

## The person

**Nia Adeyemi, 34, she/her.** Brand designer who learned to code so she would stop
having her work approximated. She does identity work for small luxury labels and hands
over a real, running design kit rather than a PDF.

**Technical level.** High on CSS, medium on tooling. She thinks in OKLCH and lightness
ramps. **She will not accept "close enough" on a colour**, and she can tell by eye when
a ramp has been generated rather than designed.

**What she is nervous about.** Every system she has tried has a small number of
"blessed" colours and everything else is a second-class citizen — you can have a
`primary` and an `accent` and then you are writing exceptions forever. She is here to
find out whether the N-color claim is real or is three colours with a nice name.

**What made her look today.** The line about an extensible OKLCH engine and colours
registered in the app's own CSS. If a colour she invents behaves exactly like a shipped
one, she will move her whole practice onto this.

## The business

**Nia's Atelier** — a two-person identity studio in Lagos and London. The build is a
**live brand kit** she hands to a client: the palette, the type, the components, all
running.

- 6–9 identity projects a year, each with its own palette
- Every client wants their kit to sit inside their existing website without a rewrite
- **Inconvenient for the software:** one current client's site already defines `.btn`,
  `.card` and `.badge` in a legacy stylesheet she is not allowed to remove. The kit has
  to coexist, which means the class prefix has to genuinely work, not mostly work.

## Why she is here today

1. "If I invent a colour called `terracotta`, does every component get it — or only
   the ones somebody remembered?"
2. "Can I put this on a page that already has a `.btn` and not break either one?"
3. "Does a section in a different palette need its own CSS, or does it just work?"

## The data

**This is the test data. Type it as written** (RULE #2).

### Three custom palettes — none of them a shipped theme

**`atelier-clay`** — the client's identity.

| Role | OKLCH |
| --- | --- |
| `terracotta` | `oklch(0.62 0.14 38)` |
| `bone` | `oklch(0.94 0.012 85)` |
| `ironwood` | `oklch(0.31 0.035 48)` |
| `verdigris` | `oklch(0.66 0.09 172)` |

**`atelier-ink`** — the dark counterpart, same roles, different ramp.

**`atelier-signal`** — a deliberately hostile one: a brand colour at almost exactly
the same lightness as its surface. `oklch(0.58 0.11 262)` on `oklch(0.60 0.02 262)`.
This one is supposed to be hard, and what the system does about it is the finding.

### The legacy stylesheet already on the page

```css
/* the client's existing site — she may not delete this */
.btn   { background: #2b2b2b; color: #fff; padding: 6px 14px; border-radius: 2px; }
.card  { border: 1px solid #ddd; }
.badge { font-size: 10px; text-transform: uppercase; }
```

### The kit's copy

Section headings on the kit page, typed as written:

- `Palette`
- `Typography`
- `Components in atelier-clay`
- `Components in atelier-ink, nested inside atelier-clay`
- `Nia's notes on where this palette should not be used`

The last one is 49 characters **and carries the apostrophe** — in a heading, a nav
link, and a page title.

### The type specimen

The full scale, every step, with real text at each:

> `display-1` down to `text-xs`, each showing the line
> **"Atelier — a house style is a set of promises about attention."**

At 360px the `display-1` has to wrap and stay a heading rather than becoming a wall.

---

## The build

| Item | What it must have |
| --- | --- |
| Palette page | all four roles of all three palettes, as real swatches with their measured contrast printed beside them — not asserted, measured |
| Typography page | every step of the scale with real text, at 360px and at desktop |
| Component sheet | **at least 20 different components**, each rendered in a custom colour — this is the N-color reach test and 20 is a floor |
| Nested island | `atelier-ink` nested inside `atelier-clay`, with both visible at once |
| Prefixed build | the whole kit re-built with a class prefix, on the page with the legacy stylesheet, both surviving |
| The hostile palette | `atelier-signal` rendered, with what the system did about it written down |

**Working end to end:** a client opens the kit, flips light to dark, and every one of
the 20 components is correct in a colour that did not exist until Nia typed it.

**The look.** A design studio's specimen sheet: generous white space, large type, the
colour doing all the work. Nothing like an app.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Find out how to invent a colour

From the docs alone — not the source — find out how to register `terracotta`.

**Done when:** it is registered and rendering, and the exact path through the docs that
got her there is written down, along with anything she had to guess.

### Act 2 — Does it reach everything?

Render at least 20 different components in `terracotta`. Then render the same 20 in a
**shipped** colour and compare.

**Done when:** all 20 are on screen in both, every difference between an invented
colour and a declared one is written down, and any component that does not take the
invented colour is an issue about the **class**, not that component.

### Act 3 — Dark

Build `atelier-ink` and flip. Every one of the 20 again.

**Done when:** every component is correct in dark, and every `-content` ink is
**measured** against its own surface — read off the computed style, not the swatch.

### Act 4 — The nested island

Put an `atelier-ink` section inside an `atelier-clay` page, with a component in each,
side by side.

**Done when:** the inner theme wins for everything inside it and nothing outside it,
including anything portalled to `document.body` — a dialog opened from inside the
island is the case that breaks.

### Act 5 — The collision

Add the legacy stylesheet to the page. Watch what breaks. Then rebuild with a class
prefix.

**Done when:** both the legacy `.btn` and the prefixed Silica button render correctly
on the same page, and any leak in either direction is an issue.

### Act 6 — The hostile palette

Build `atelier-signal`, where the brand colour and the surface are nearly the same
lightness.

**Done when:** it is on screen and it is written down what the system did — generated
a readable `-content` ink, warned, or silently produced something unreadable. The
third is a `major`.

### Act 7 — The thing that goes wrong for her

The client comes back and says the terracotta is wrong — it needs to be two steps
warmer. She has to change one value and have the whole kit follow.

**Done when:** one value changed and the whole kit followed, or the list of places she
had to touch instead is an issue.

### Act 8 — The type scale at both ends

Render the specimen. `display-1` at 360px, `text-xs` on a `soft` surface.

**Done when:** the `display-1` wraps and holds, and the `text-xs` on a faded surface is
either measured as readable or is an issue against RULE #3 of the root CLAUDE.md.

### Act 9 — The other side

Build the kit for production. Hand it over: open it cold, as the client, on a phone,
in dark, with no dev server.

**Done when:** the client can flip themes, read every swatch's contrast number, and
copy a colour value out.

---

## What only this persona proves

**A colour that did not exist until she typed it** reaching every component identically
to a declared one — the N-color claim, tested from the outside.

---

## Standing checks

**Wrong moves.** Register two colours with the same name. Register one with an invalid
OKLCH value. Delete a colour that components are already using. Set a prefix that
collides with Tailwind's own utilities.

**Reload and deep link.** F5 on the component sheet with the nested island in view.
Then deep-link the `atelier-ink` section's anchor from a cold load.

**Dates.** She has no date data, so the boundary this build actually hits is the
**scale's** boundaries rather than the calendar's: the largest and smallest step of the
type scale, and a colour at lightness `0` and `1`. Write down what each does.

**Contrast and token math at the edges.** This persona **is** the check, and it gets
the fullest version: every `-content` ink of all three palettes measured in both modes;
a `soft` surface inside a theme island inside a `glass` panel; and an invented role
compared byte-for-byte against a declared one, which memory note
`n-color-full-reach-mechanism` says must be identical.

**The other side.** Act 9 — the client opening the kit cold.

**Without a mouse.** Navigating the whole kit and flipping the theme, keyboard only.

**A boundary that should hold.** The nested theme island in act 4, plus the prefix
collision in act 5: neither stylesheet may reach into the other's territory.

---

## Verification

| | Result |
| --- | --- |
| Acts completed | **9 of 9** |
| Issues filed | **4** — [036](issues/036-a-dialog-opened-inside-a-theme-island-leaves-the-island.md), [037](issues/037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md), [038](issues/038-five-controls-are-smaller-than-the-minimum-target.md), [039](issues/039-the-ink-guard-could-not-see-the-idiom-the-components-use.md) |
| Issues fixed and confirmed | **4 of 4**, each re-proved from the screen or the probe it was found on |
| Issues blocked, and on what | none |
| Screens scored (in both themes at 360px) | **1 in rating.md** — `/docs/getting-started`, re-scored by act 4. The kit, collision and prefixed pages were each measured in both themes at 360px but are this persona's ARTIFACT, not Silica UI screens, so they do not enter that denominator |
| **Not checked** | the kit in a browser other than Chromium; `atelier-signal` was never scored as a *design*, only measured, because it is a diagnostic palette rather than a screen; `.color-picker-track` (0.9rem tall, from the nine-target sweep) was never rendered, because the kit has no ColorPicker |

### The numbers

| Record | Result |
| --- | --- |
| Components rendered in an invented colour, and how many were correct | **34 in the sheet, 34 correct**, in all three palettes. Underneath, the plugin emits **38 families** for `terracotta` and **38** for `primary` — identical sets, neither has one the other lacks |
| Any difference at all between an invented colour and a declared one | **In the rendered DOM: none.** 316 nodes each, 0 differing, in all three themes. In the emitted CSS: one, and it is Tailwind's rather than Silica's — a colour declared in `@theme` has its value inlined into the non-`color-mix` `@supports` **fallback** (`--input-border: oklch(0.62 0.14 38)`) where a plugin-emitted role keeps a `var()`. The branch above it, which every current browser takes, is byte-identical. Recorded, not filed |
| Worst `-content` contrast measured, across all three palettes, both modes | **4.72** — `ironwood` and `neutral` in `atelier-signal`, the deliberately hostile palette. Across the two real palettes the worst is **5.26** (`ironwood` in `atelier-ink`). All 8 roles × 3 palettes × 2 modes clear AA |
| What the system did with the hostile palette | **Before this run: nothing.** It compiled in silence, produced a legible ink *on* every colour (4.72–5.75, all passing) and let every colour-as-text use fall to 2.52–2.79. After [037](issues/037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md) it names all 8 roles at build time, with the measured number and what cannot fix it |
| Places she had to touch to change one brand colour | **One line per palette — 3 lines for 3 palettes**, which is the floor, because each palette has its own ramp by design. The shipped roles follow by reference (`--color-primary: var(--color-terracotta)`) rather than by copy, so `btn`, `badge`, `alert` and `text-` all moved from 5.44 to **5.95** and the auto-derived ink recomputed itself |
| Did the prefix hold against the legacy stylesheet, both ways? | **Yes, completely.** With no prefix neither stylesheet survives — the client's `.badge` became a Silica pill and the Silica badge was forced to 10px uppercase. With `prefix: na-` both render exactly as authored: the legacy `.btn` at `#2b2b2b`, radius 2px, padding 6px 14px, border 0; `na-btn na-btn-terracotta` at terracotta, 5.44. Zero leak in either direction |
| Console errors and warnings during the run | **Zero** on every page, in every theme, at every width, including the production build. The only messages at any point were the plugin's own new build-time ones, which are the fix working |

---

## Run log

### Act 1 — Find out how to invent a colour

**Done.** She got there. The docs got her about two thirds of the way.

**The exact path.** Front page: nothing. The only two links on it matching
*colour / theme / token / palette* are the **Color Picker** and **Command Palette**
component pages. Then the command palette, typing what she actually wants:

```
"color"            -> 1 hit: Color Picker (the component)
"custom color"     -> 0
"brand color"      -> 0
"register a color" -> 0
"token"            -> 0
"palette"          -> 1 hit: Command Palette (the component)
```

The sidebar holds **118 entries: 1 guide and 117 components.** So the route is
getting-started or nothing, and she found it by reading section 2 top to bottom.

**What section 2 told her, correctly:** *"Add your own names to that list and they
behave identically to the built-in ones."* The name goes in `colors:`. That is the
only sentence on the whole site about inventing a colour, and it is true.

**What she had to guess: where the VALUE goes.** It is written nowhere. `@theme` is
named exactly once, inside a warning about forgetting — *"If you declare a color in
`@theme` and forget to list it here"* — never as an instruction and never with an
example. She deduced `@theme` from the warning, and she was right. The site's own
`globals.css` uses a third place (`:root`) that the docs never mention at all.

**She also believed section 4:** *"any `--color-X` without a matching
`--color-X-content` gets a legible ink derived for it automatically."* Act 6 is about
the roughly 2.3% where that sentence is not true.

**And the warning she guessed from is real.** Registering the value and omitting the
name prints the promised message, naming the variants and the fix line verbatim:

```
[silicaui] Theme color terracotta is declared in @theme but not registered with the plugin.
  Utilities like `bg-terracotta` work, but component variants (`btn-terracotta`, ...)
  will NOT be generated and those elements will silently render in the default color.
  Fix: @plugin "@wizeworks/silicaui" { colors: ..., terracotta; }
```

Registered and rendering: `btn-terracotta` at **5.44**, `text-terracotta` at
**8.68**, no console errors.

### Act 2 — Does it reach everything?

**Done, and this is the act the whole persona exists for. The claim is true.**

Three independent measurements, each able to falsify it on its own.

**1. The emitted CSS.** 38 selector families carry `-terracotta`. 38 carry
`-primary`. **The sets are identical** — neither has a family the other lacks.

**2. The rendered DOM.** The same function renders both sheets with one argument
changed. Walking both trees node by node, normalising the colour name out:

```
atelier-clay   : 316 nodes each, 0 differing
atelier-ink    : 316 nodes each, 0 differing
atelier-signal : 316 nodes each, 0 differing
```

**3. TypeScript.** `SilicaColor` is `"primary" | ... | "error" | (string & {})` —
the `(string & {})` trick, with a comment saying exactly why it is there. An invented
colour type-checks **and** the built-ins still autocomplete. A consumer on TypeScript
is not a second-class citizen here.

**34 of 34 components correct**, in all three palettes.

**The one difference, written down rather than filed.** Tailwind inlines an
`@theme` colour's value into the non-`color-mix` `@supports` fallback, where a
plugin-emitted role keeps a `var()`. It is Tailwind's behaviour, it applies only to
the fallback branch, and the branch above it — the one every current browser takes —
is byte-identical. Measured, understood, not a defect.

### Act 3 — Dark

**Done.** `atelier-ink` was built as a real ramp rather than an inversion, and every
`-content` was read off the computed style rather than a swatch.

| role | clay: ink / fill | ink: ink / fill |
| --- | --- | --- |
| terracotta | 5.44 / 3.58 | 8.07 / 7.13 |
| bone | 17.65 / 1.10 | 14.64 / 12.93 |
| ironwood | 13.30 / 12.35 | **5.26** / 4.64 |
| verdigris | 7.04 / 2.77 | 10.19 / 9.00 |
| primary / secondary / accent / neutral | 5.44 / 7.04 / 8.24 / 13.30 | 8.07 / 10.19 / 10.97 / 5.26 |

All 8 roles in both modes clear AA. 415 text elements measured per theme; everything
under the line was `.calendar-day[data-outside]`, every one `tabindex="-1"` — the
case [032](issues/032-the-n-color-demo-ships-below-aa.md) established as sanctioned,
checked here rather than assumed (84 days, 24 below AA, **all** of them outside days).

### Act 4 — The nested island

**Done. The island is flawless and the dialog is not** — filed as
[036](issues/036-a-dialog-opened-inside-a-theme-island-leaves-the-island.md).

Two cards, identical class strings, one attribute apart: clay at 14.50 with its
terracotta at `oklch(0.62 0.14 38)`, ink at 15.06 with its terracotta at
`oklch(0.72 0.13 38)`. The inner theme wins for everything inside it and nothing
outside it.

The dialog opened **from inside the dark island** portals to `document.body`, lands
outside every `[data-theme]` except the one on `<html>`, and renders in
`atelier-clay` while its own title reads `atelier-ink`. The persona file named this
as "the case that breaks", and it broke.

### Act 5 — The collision

**Done, and the prefix holds completely.**

**Without a prefix neither stylesheet survives.** Every element is a blend:

| element | what it became |
| --- | --- |
| Silica `Card` | identical to the legacy `.card` — the client's `1px solid #ddd` won |
| legacy `.badge` | a Silica pill: radius 16px, padding 0 10px, Silica's border, keeping only its 10px uppercase |
| Silica `Badge` | forced to **10px uppercase** by the client's rule |
| legacy `.btn` | kept `#2b2b2b`, picked up Silica's 1px border and 14px type |

**With `prefix: na-` on the plugin and `<SilicaProvider prefix="na-">` in React, both
render exactly as authored** — and the legacy sheet is loaded *after* Silica on
purpose, so source order cannot be what saves it:

| | result |
| --- | --- |
| legacy `.btn` | `#2b2b2b`, radius 2px, padding 6px 14px, border 0 — untouched |
| `na-btn na-btn-terracotta` | terracotta, 5.44 |
| legacy `.card` | `1px solid #ddd`, radius 0, transparent — untouched |
| `na-card` | Silica surface, radius 2px, Silica border |
| legacy `.badge` | 10px uppercase, no radius, no border — untouched |
| `na-badge na-badge-terracotta` | terracotta, 12px |

Zero leak in either direction. The prefix has to be given twice — to the plugin and
to the provider — and giving only one of the two is silent; that is written into the
artifact's `prefixed-main.jsx` rather than left to be rediscovered.

### Act 6 — The hostile palette

**Done. The system produced a readable ink and said nothing about anything else** —
filed as [037](issues/037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md),
which is the question [032](issues/032-the-n-color-demo-ships-below-aa.md) handed
forward.

`atelier-signal`: brand `l = 0.58`, surface `l = 0.60`.

| | measured | |
| --- | --- | --- |
| the ink **on** the colour | **4.85** | passes — the derivation held even here |
| the colour **as text**, raw | 1.10 | |
| the colour **as text**, after `lib/ink.js` | **2.77** | a real 2.5x defence, still under AA |
| what the build said | **nothing** | no error, no warning, no console message |

The third outcome is the one the persona file calls a `major`, and it was the third
outcome. The repair is in 037: the plugin holds the value in both documented ways of
declaring a colour, so it can measure — and now does.

### Act 7 — The thing that goes wrong for her

**Done. One value per palette, and the whole kit followed.**

`oklch(0.62 0.14 38)` to `oklch(0.64 0.145 50)`, two steps warmer. The shipped roles
reference it rather than copying it (`--color-primary: var(--color-terracotta)`), and
that works:

| | before | after |
| --- | --- | --- |
| `--color-primary` | a duplicate literal | `var(--color-terracotta)` — follows |
| `btn-terracotta`, `btn-primary`, `badge`, `alert` | 5.44 | **5.95** |
| `text-terracotta`, the derived ink | 7.76 | **7.33** |

Three lines for three palettes, because each palette has its own ramp — which is the
design, not a defect. Inside any one palette it is genuinely one value.

### Act 8 — The type scale at both ends

**Done. It holds at both ends.** On the production build at 360px:

| | px | lines | width | overflows | contrast, clay / ink |
| --- | --- | --- | --- | --- | --- |
| `display-1` | 40 | **4** | 320 | no | 14.50 / 15.06 |
| `text-md` | 16 | 2 | 320 | no | 14.50 / 15.06 |
| `text-xs` | 12 | 1 | 320 | no | 14.50 / 15.06 |
| `text-xs` on `bg-base-200` | 12 | 2 | 272 | no | **13.25 / 15.86** |

`display-1` wraps and stays a heading rather than becoming a wall. The fluid display
steps clamp down at 360px, which is why `text-6xl` at 60px is larger there than
`display-1` at 40px. The `text-xs`-on-a-faded-surface case the persona flags against
RULE #3 is **measured readable**, not asserted: 13.25 at worst.

### Act 9 — The other side

**Done.** `npm run build`, served cold from `dist/` with no dev server, at 360px, on
a touch viewport, in both themes.

```
clientWidth 360 - scrollWidth 360 - horizontal overflow: no
419 text elements measured per theme
console errors: none
```

Everything below AA is accounted for: 24 x `.calendar-day[data-outside]`, all
`tabindex="-1"`, and 4 x `.segment-field-literal`, recorded in 038 and left for P09.

Scoring the build at 360px is what turned up
[038](issues/038-five-controls-are-smaller-than-the-minimum-target.md) — five
controls under WCAG's 24px minimum, two chip removes at **2.78:1**, and a carousel
dot at **1.96:1 in dark** — which in turn turned up
[039](issues/039-the-ink-guard-could-not-see-the-idiom-the-components-use.md), the
probe that was supposed to prevent exactly that and was green.

**One defect in this act was mine, not the product's.** The component grid overflowed
by 16px at 360px: a CSS grid track sizes to its widest item's max-content unless the
track is `minmax(0, 1fr)`, so a Calendar and a `w-40` Slider pushed every column to
356px inside a 320px container. `min-w-0` on the cell fixed it. It is recorded
because a persona run that reports only the library's mistakes is not being honest
about what building this actually took.

---

## Standing checks

**Wrong moves.** All four, compiled through the real Tailwind compiler:

| move | what happened |
| --- | --- |
| the same colour named twice in `colors:` | no error, no warning, `.btn-terracotta` emitted once. Idempotent — correct |
| an invalid OKLCH value | **no error, no warning, every class still emitted**, and the browser discards the fill. Now named at build time — 037 |
| the colour deleted from `colors:` while `@theme` still declares it | warns, names the missing variants, prints the fix line. `bg-terracotta` survives, `btn-terracotta` does not — exactly as documented |
| `prefix: p-`, colliding with Tailwind's `p-4` | **no collision.** Both `.p-btn` and `.p-4` are emitted and neither shadows the other |

**Reload and deep link.** F5 on the component sheet holds position (`scrollY 14782`)
and the island survives. A cold deep link to `#nested` did **nothing** on the first
attempt — `scrollY 0` — because at the moment the browser handles the fragment React
has rendered nothing. That is every client-rendered app rather than silicaui, and the
artifact now catches it after mount; written into `App.jsx` rather than left silent.

**Dates, read as the scale's boundaries.** `display-1` and `text-xs` are in act 8. A
colour at lightness `0` and `1`: `oklch(0 0 0)` measures 1.00 against black and
**21.00** against white, `oklch(1 0 0)` the reverse, and the derivation picks
correctly at both ends. The sweep in 037 covers `l = 0` to `l = 1` in 0.02 steps
across 10,098 colours.

**Contrast and token math at the edges.** This persona **is** the check and it got
the fullest version: every `-content` of all three palettes in both modes (act 3),
`text-xs` on `bg-base-200` inside a theme island (act 8), and the byte-for-byte
comparison of an invented role against a declared one (act 2) — which memory note
`n-color-full-reach-mechanism` says must be identical, and which measured identical
in all three themes.

**The other side.** Act 9 — served cold from `dist/`, no dev server.

**Without a mouse.** 26 tab stops reached, **0 without a visible focus ring**, **0**
focused while off-screen, and the palette switched to `atelier-ink` with the keyboard
alone. The first run of this check reported the theme switch as unreachable; `Home`
scrolls the page but does not move focus, so the probe was simply continuing past
element 26. Re-run from a fresh load, it reaches it.

**A boundary that should hold.** Two of them, and both held: the nested island in act
4, for everything rendered in place, and the class prefix in act 5, in both
directions, with the legacy sheet deliberately loaded last.
