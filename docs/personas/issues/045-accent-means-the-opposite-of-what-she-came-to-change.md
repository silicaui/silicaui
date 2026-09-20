# 045 — Marlene set the "accent colour" to her purple and 2% of her site changed

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 5, "Making it look like them"
**Surface:** Site builder › Theme › Colors
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Reason number two she is here, in her own words:

> "I want it to look like us — the purple, not whatever it comes with."

The persona file predicts she will look for the word **colour**, not "token". She
found it: the panel says **Colors**. So far so good.

Then it offered her eight tiles, captioned with the token names:

> `base-100` `base-200` `base-300` `base-content` · `primary` `primary-content`
> `secondary` `secondary-content` · `accent` `accent-content` · `neutral` …

She wanted to change **the accent colour** — everyday English for *the colour of my
business, the one on the sign*. There is a tile called `accent`. She clicked it and
typed `#7A3FA8`.

**It worked, and it did almost nothing.** Measured on the component board, which shows
the whole library at once:

| | painted properties |
| --- | --- |
| her purple, after the change (`accent`) | **9 of 439 — 2.1%** |
| the theme's own violet, untouched (`primary`) | **17 of 439 — 3.9%** |

The buttons were still the theme's violet. The thing she came to do was still not
done, and the panel had reported no problem, because there was none: she had
successfully changed a colour. Just not hers.

**The tooltip could have told her and did not.** Hovering `accent` said:

> **Edit accent**

## What should have happened

In this system `primary` is the brand colour — it paints the buttons and the links.
`accent` is the third brand role, for small highlights. That is a reasonable design.
It is also **the opposite of what those two words mean to somebody outside software**,
where "accent colour" is the one you notice and "primary" sounds like a school.

The panel has a tooltip on every tile. It was spending it restating the caption.

## How to reproduce

1. Open `http://localhost:5178/` → **Theme**.
2. Pick **grape** from the Themes library.
3. Click the tile captioned **accent**, type `#7A3FA8`, press Enter.
4. Look at the buttons on the component board. They are still `oklch(56% 0.24 300)`.
5. Hover any tile: the tooltip repeats its caption.
6. Every time, both themes.

## Why it matters

This is the persona whose whole point is that **a word only we use is a blocker, not a
nit** — and this is worse than an unfamiliar word. `accent` is a *familiar* word
pointing at the wrong thing, so she has no reason to doubt it. She would have finished
act 5 believing her site was purple.

It is also the one screen where getting it wrong is invisible: nothing errors, nothing
is unreadable, and the result looks like a designed theme. It just is not hers.

## Where it lives

[packages/silicaui-builder/src/site/react/ThemeEditor.tsx](../../../packages/silicaui-builder/src/site/react/ThemeEditor.tsx) — `ColorTile`:

```tsx
<Hint label={`Edit ${name}`} side="bottom">
  <button aria-label={`Edit ${name}`} …>
```

## Do the siblings have it too?

**Checked both places a colour role is offered by name.**

| | |
| --- | --- |
| site builder › Theme › Colors | **the defect** — 20 tiles, all captioned with token names, all tooltips restating the caption |
| email builder › Inspector › colour | uses `ColorPicker` directly against one concrete colour at a time, never a menu of roles — not affected |

**Explicitly NOT fixed by renaming the roles.** `primary` / `accent` are public API:
they are what the CSS custom properties, `themeToCss`, the docs, the MCP server and
every consumer call them. Renaming a shipped role to suit one panel's tooltip would be
a breaking change dressed as a copy fix, and RULE #1 puts that decision with Brandon,
not with me.

## The fix

The caption stays the token name. The tooltip stops repeating it and says what the
role is **for**, in words she already uses:

```ts
const ROLE_HINT: Record<string, string> = {
  primary: "your main colour — buttons, links, the things you want clicked",
  secondary: "a supporting colour, used beside the main one",
  accent: "a third colour for small highlights, used sparingly",
  neutral: "a quiet dark tone for bars and footers",
  info: "for telling someone something",
  success: "for when something worked",
  warning: "for when to be careful",
  error: "for when something failed",
  "base-100": "the page background",
  "base-200": "panels and cards, one step off the page",
  "base-300": "borders, dividers and the deepest surface",
  "base-content": "the colour of your words",
};
```

A `-content` tile paints nothing — it is the ink that sits on its role — so those are
generated: `accent-content` → *"the words that sit on accent"*.

The same string goes to the tooltip **and** the `aria-label`, so a screen-reader user
and a mouse user get the same sentence.

## Confirmed by

Every tile now announces what it is for — read straight off the rendered buttons:

```
Edit base-100. the page background
Edit base-content. the colour of your words
Edit primary. your main colour — buttons, links, the things you want clicked
Edit primary-content. the words that sit on primary
Edit accent. a third colour for small highlights, used sparingly
Edit accent-content. the words that sit on accent
…20 tiles, all covered
```

Hovering `accent` now reads **"accent — a third colour for small highlights, used
sparingly"**, which is the sentence that stops her.

**Then the act, finished as Marlene.** She reads the tooltip, picks `primary`, types
`#7A3FA8`:

| | |
| --- | --- |
| `--color-primary` | `oklch(0.491 0.165 307.2)` — her purple, converted exactly |
| `--color-primary-content` | `oklch(98% 0.01 307.2)` — the ink derived for it |
| smallest text her purple touches | **12px at 6.38:1** |
| whole screen | **201 text runs, 0 under AA**, in light *and* dark |
| console errors | none |

**The standing check the persona file names explicitly** — "the same accent on a
`soft` surface, which is where it will actually fail". No `soft` form of `primary`
renders on that screen, so rather than report a pass on an empty measurement, three
were built with her real copy and measured:

```
Light   8.76:1  "Book a class"                              btn btn-primary btn-soft btn-xs
        8.76:1  "Thursday"                                  badge badge-primary badge-soft
        9.14:1  "Half term starts Monday 26 October 2026"    alert alert-primary alert-soft
Dark    5.55:1 / 5.55:1 / 5.67:1
```

It does not fail. That is issue
[019](019-ghost-and-soft-text-is-below-aa-in-light.md)'s repair holding for a colour
that did not exist when it was written — **RULE #7, on a role Marlene invented today.**

**And act 5's own "done when": her theme applied across every page.** Read off the
canvas element (`.sui-canvas[data-theme]`) on each page in turn:

```
"Home"     theme=grape  primary=oklch(0.491 0.165 307.2)
"Page 2"   theme=grape  primary=oklch(0.491 0.165 307.2)
```

**A withdrawn reading.** The first run of that check reported `theme=studio` on every
page — which reads exactly like "her theme never reached her pages". It was the probe:
opening the page picker portals a `[data-theme="studio"]` island to the end of the
body (issue [036](036-a-dialog-opened-inside-a-theme-island-leaves-the-island.md)'s
mechanism, working as designed), and the probe took the *last* `[data-theme]` element.
Selecting the canvas by class gives the reading above. Nothing was wrong with the
product; the instrument was.

## What she had to know to get there

Recorded because act 5 asks for it:

| | before | after |
| --- | --- | --- |
| that "Colors" is where colours live | on screen | on screen |
| that `primary`, not `accent`, is her colour | **nothing on screen said so** | the tooltip says so |
| that `-content` is an ink, not a colour | **nothing on screen said so** | the tooltip says so |
| that the hex box is a hex box | **unlabelled** (issue 046) | labelled |
| that picking a theme applies it site-wide | the Themes row's own tooltip already said "Apply … to the whole site" | unchanged |

## Rating effect

`Site builder › Theme › Colors — Ease 4 → 8` in [rating.md](../rating.md).
