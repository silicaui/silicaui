# P06 — Nia Adeyemi · Nia's Atelier

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
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
| Acts completed | |
| Issues filed | |
| Issues fixed and confirmed | |
| Issues blocked, and on what | |
| Screens scored (in both themes at 360px) | |
| **Not checked** | |

### The numbers

| Record | Result |
| --- | --- |
| Components rendered in an invented colour, and how many were correct | |
| Any difference at all between an invented colour and a declared one | |
| Worst `-content` contrast measured, across all three palettes, both modes | |
| What the system did with the hostile palette | |
| Places she had to touch to change one brand colour | |
| Did the prefix hold against the legacy stylesheet, both ways? | |
| Console errors and warnings during the run | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen, and **write down
measured numbers, never impressions**, because this persona's entire subject is a
number somebody might be tempted to eyeball.
