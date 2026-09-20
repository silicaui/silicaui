# 043 — Marlene could not read the headings that tell her where she is

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 5, looking for the word "colour"
**Surface:** Site builder and email builder › all four modes · `@wizeworks/silicaui-builder`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 5 is where Marlene goes looking for her studio's purple. The persona file says
she will look for the word **"colour"**, not "token". She found it — the Theme panel
does say **Colors**.

She could barely see it. Measured on the rendered screen:

| what she is reading | measured | needs |
| --- | --- | --- |
| **Colors**, **Radius**, **Effects**, **Sizes**, **Motion**, **Type** | **2.89:1** | 4.5 |
| **This site**, **silicaui presets**, **Output** | **2.89:1** | 4.5 |
| "roles · contrast-safe", "Shadow on cards & buttons", "Grain on surfaces" | 2.89 – 3.16 | 4.5 |
| every colour swatch's name — `primary`, `accent`, `base-100` … | **3.92:1** | 4.5 |

**44 text runs on that one panel were under WCAG AA.** Across all four builder modes,
in both themes: **70 places in the source**, plus three more that are worse (below).

These are not decorations. They are the words that say what part of the panel she is
in. The one she needed was the faintest thing on the screen.

## What should have happened

Root [CLAUDE.md](../../../CLAUDE.md) **RULE #3**, in its own words:

> never `soft`, `muted`, `/opacity`, or a `color-mix(… , transparent)` ink on anything
> a person is meant to READ … Hierarchy comes from **scale, weight, and color** — not
> from fading things out.

Every one of these already had scale and weight doing the work — `text-xs font-bold
uppercase tracking-wider`. The fade was adding nothing but the contrast failure.

## How to reproduce

1. Open `http://localhost:5178/`.
2. Click **Theme**.
3. Read the section headings down the middle panel.
4. Measure any of them off the computed style. Before the fix: `2.89:1`.
5. Every time, in both themes, at every width, in all four modes.

## Why it matters

Three reasons, and the third one ships:

1. **She is 58.** This persona exists because a 58-year-old who is not a developer is
   a real customer. A heading at 2.89:1 is a heading she does not see.
2. **It is our own rule, broken in our own product.** silicaui sells a contrast-safe
   token system. The builder that sells it was painting its own labels below the floor
   the system exists to guarantee.
3. **Three of them go into the customer's published site**, not just our chrome:

   | | what it paints |
   | --- | --- |
   | `src/site/engine.ts:160` | the paragraph on **every new page** — "Add sections from the Insert panel." at **3.65:1**. Marlene makes seven pages. |
   | `src/site/frame.ts:57` | the **fallback footer** — "© 2026 SilicaUI. All rights reserved." |
   | `src/site/palette.ts:100` | the **AppShell footer** template |

   Those reach her visitors, on a phone, in dark, with no builder running.

## Where it lives

70 occurrences across 15 files in
[packages/silicaui-builder/src](../../../packages/silicaui-builder/src), plus 3 in the
harness and the 3 content templates above. The levels used were
`/30 /35 /40 /45 /48 /50 /55 /60` — **every one of them below AA**.

The worst concentration was the Theme panel, in two shared constants:

```ts
const SUBHEAD = "… text-xs font-bold uppercase tracking-wider text-base-content/45";  // ThemeLibrary
const GROUP   = "… text-xs font-bold uppercase tracking-wider text-base-content/45";  // ThemeEditor
```

## Do the siblings have it too?

**Checked all four surfaces that paint silicaui text. The builder was the only one.**

| surface | faded inks below AA | covered by a probe before today |
| --- | --- | --- |
| `@wizeworks/silicaui` (the component CSS) | none | yes — `verify-readable-ink.mjs`, since [021](021-the-rule-bans-opacity-and-the-probe-never-looked.md) |
| `apps/site` (silicaui.com) | **zero occurrences of the pattern at all** | n/a |
| `silicaui-builder` › site builder | **50** | **no** |
| `silicaui-builder` › email builder | **20** | **no** |

That is the shape of it. Issue 021 found this exact defect in the library a day ago
and wrote the probe that keeps it out. **The probe was scoped to the library, and the
builder — which is built out of the same classes — was never in its sight.** Nothing
has ever measured the builder's own chrome.

## The fix

**The floor is derived, not chosen.** Tailwind's `text-<role>/NN` composites the ink
over what is behind it at NN% alpha, so the question "which NN is safe" has an exact
answer. Measured across every surface of every shipped theme in both modes, plus the
builder's own `studio` chrome theme:

```
  / 45   lowest 2.49   120 of 120 under AA
  / 55   lowest 3.22    60 of 120 under AA
  / 65   lowest 4.17     6 of 120 under AA
  / 70   lowest 4.77     0 of 120 under AA   ← the floor
  / 80   lowest 6.40     0 of 120 under AA
```

All 73 sub-AA occurrences raised to **`/70`**. The design intent survives — they are
still visibly secondary — and every one now reads.

**And a probe, so it cannot come back:**
[packages/silicaui-builder/scripts/verify-chrome-ink.mjs](../../../packages/silicaui-builder/scripts/verify-chrome-ink.mjs),
wired into `pnpm verify` as `verify:chrome-ink`. It does not hardcode 70. It finds
every alpha the source actually uses, computes that alpha's worst reading across all
123 (ink × surface) pairs, and fails the ones under 4.5. **Add a darker theme and the
floor moves by itself.**

It scans `.ts` as well as `.tsx`, which is how it caught the three content templates
that the on-screen sweep could not see — they only render once a page is created.

## Confirmed by

**The measuring instrument was wrong twice first, and both versions are pinned in the
probe's header**, because both produced numbers that looked fine:

1. A "grab the numbers" regex read Chromium's `oklab(0.21 -0.003 -0.011 / 0.45)` as
   0-255 RGB. That is near-black, so every faded run passed. **Version 1 of this probe
   reported "192 runs, 0 under AA" about the panel above.**
2. Letting the canvas resolve the colour instead — `fillStyle` silently refuses
   `oklab()`, so every real element came back null.
3. Keeping the probe as a string: a template literal and a heredoc each ate a level of
   backslash, and every regex in it stopped matching. Now it is passed to
   `page.evaluate` as a real function.

The working probe carries two hand-computed controls, `#777` on `#fff` (4.48, just
under AA) and `#000` on `#fff` (21.00). Every run below reported both exactly.

**On the screen it was found on** — the sweep, all four modes, both themes:

```
            before        after
Light Page     2           0
Light Layout   3           0
Light Theme   44           0
Light Comp     3           0
Dark  Page     2           0
Dark  Layout   3           0
Dark  Theme   42           0
Dark  Comp     3           0
CONTROL held: true
```

**Proved by breaking it.** Put `text-base-content/45` back onto the Theme panel's
section heads in the live page: the sweep goes red and names 12, starting with
`2.89 "Colors"`. Restored → green. A probe that cannot go red proves nothing.

**The three that ship to visitors**, confirmed as the customer: created a new page in
the builder called `Fees` and measured its own paragraph on the canvas —
`text-base-content/70`, **6.36:1 in light and 7.99:1 in dark**, up from 3.65. At 16px,
which is RULE #3's body floor.

`pnpm verify` in `silicaui-builder` is green end to end, including the new
`verify:chrome-ink`. Typecheck clean. The canvas safelist is unchanged and still
current at 310 classes.

**RULE #7, re-proved on an earlier persona.** The email builder carries 20 of the 70,
so P02's Casa Ferreiro surface was reopened and driven: `?editor=email`, every rail tab
opened, a block inserted from the palette and selected so the Inspector fills.

```
=== email builder, Light ===   42 text runs, 0 under AA
=== email builder, Dark  ===   42 text runs, 0 under AA
CONTROL grey777: 4.48  black: 21
10 runs painted with a faded ink, all at 6.36:1 — including
  "Empty — insert something from the palette"
  "No settings for this element."
  the palette's "Inserts into …" hint
```

An empty email shows only 21 runs, which is why the first pass at this was thrown away:
it measured a screen with nothing on it and would have reported success either way.
`verify:email`, `verify:email-frame`, `verify:email-lock` and `verify:email-batch` are
all still green.

## Rating effect

`Site builder › Theme panel — Design 6 → 8` and
`Site builder › Theme panel — Ease 6 → 8` in [rating.md](../rating.md).
