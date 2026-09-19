# 024 — The required-field asterisk was below the contrast floor, and the probe said the colour was fine

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 8
**Surface:** `@wizeworks/silicaui` › fifteen component rules that paint a role colour as text
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Scoring the new dialog in both themes, one item came back under AA and nothing else did:

```
*   14px   4.42:1   (light)
```

The red `*` on `<FieldLabel required>`, on three of the dialog's three fields.

`label.js` paints it with `color: var(--color-error)` — the **raw** role token. Issue 019
had just derived an ink form for every role and wired it into every coloured family
through `--<root>-ink`, but that only reaches components that go through
`COLOR_VARIANTS`. A rule that writes `var(--color-error)` into a `color:` declaration by
hand was never touched.

**Fifteen rules do exactly that**, across twelve modules: the required asterisk, the
validator message, two file-upload errors, a field error, and nine `primary` uses — an
active menu item, a tree-view row, a command-palette match, prose links, the rich-text
editor, power-search chips, the outline nav, dropzone, select-menu.

**And `verify-token-contrast.mjs` was reporting `error` at 9.56:1** at the same time,
because act 7 had just re-pointed it at the derived ink. One colour, two numbers, and the
reassuring one was the one on screen in the build output.

## What should have happened

Every role colour painted as text should go through the same derivation, whether it arrives
through a variant class or is written into a rule by hand. Otherwise "the ink form" is a
property of *which component you are in*, which is not a design system.

## How to reproduce

1. Light theme. Render `<Field><FieldLabel required>Reference</FieldLabel>…</Field>`.
2. Measure the computed `color` of `.label-required` against the surface: **4.42:1**.
3. `node scripts/verify-token-contrast.mjs` at the same moment: `✓ error — 9.56:1`.

Every time.

## Why it matters

The asterisk is the only thing on the label that says the field is compulsory. At 4.42 it
is under the floor in the default theme — not dramatically, but it is a required-field
marker, which is precisely the kind of small red glyph a person needs to *notice* rather
than read.

The wider harm is the disagreement. A probe that measures a derivation the code does not
use is worse than no probe: it reports a number nobody is looking at while the screen shows
another. That is the same shape as act 6's `verify-token-contrast` (testing one half of its
contract) and act 7's `verify-readable-ink` (matching one of the rule's four spellings),
and it is the third time in this run that a green check covered a real failure.

`primary` passes raw at 7.97, so nine of the fifteen were not failing anything. They were
still wrong: after issue 019, `btn-primary btn-ghost` painted **12.20** and
`.menu-item-active` painted **7.97** — the same role, as text, in one library.

## Where it lives

Fifteen `color:` declarations across `label.js`, `validator.js`, `field.js`,
`file-upload.js` (×2), `menu.js`, `tree-view.js`, `command-palette.js`, `prose.js`,
`rich-text-editor.js` (×2), `power-search.js` (×2), `outline.js`, `dropzone.js`,
`select-menu.js`.

## Do the siblings have it too?

**This issue is the sibling sweep** — the asterisk was one of fifteen. Every component
module was scanned for a `color:` naming a bare role token; all fifteen are fixed, and the
probe below now makes the whole class checkable rather than remembered.

## The fix

The derivation moved out of `color-variants.js` into **`src/lib/ink.js`**, because two
callers now need the identical formula and two copies of it would stop agreeing:

```js
export const ink = (colorRef) =>
  `oklch(from color-mix(in oklab, ${colorRef} 50%, var(--color-base-content)) l calc(c * 2) h)`;
export const inkOfRole = (name) => ink(`var(--color-${name})`);
```

`color-variants.js` imports it for `--<root>-ink`; the fifteen rules call `inkOfRole(…)`.
Output verified byte-identical for the variant path after the move.

**`verify-ink-derivation.mjs`** is new and wired into `pnpm verify`: no `color:` in a
component may name a bare role token.

**Its first draft was wrong, and running it is what said so.** It flagged
`--color-primary-content` in carousel.js and `--color-neutral-content` in mockup.js —
telling two correct rules to derive an ink from an ink. A `-content` token **is** the ink
designed to sit on that role's fill, and `--color-base-content` is the surface's own. Both
are now excluded by a lookbehind, with the reason written into the file.

## Confirmed by

Console rebuilt cold after `node sync-silica.mjs`, dialog opened, `.label-required` read
off the computed style with ancestor alpha composited. Converter checked at `#fff` on
`#000` = 21.00.

| | before | after |
| --- | --- | --- |
| light | **4.42** | **9.57** |
| dark | 5.72 | 8.45 |

The computed colour is now `oklch(0.395 0.163 22)` in light — still unmistakably red,
darker than the fill form, which is the whole point of having two.

**The probe was proved before it was trusted.** Putting `color: "var(--color-error)"` back
into label.js: the probe names `label.js:57` and **exits 1**. Restored: exits 0.

`pnpm verify` across the workspace: **exit 0**.

## Rating effect

None recorded — the console's screens are not in `rating.md`, and no silicaui.com screen
was scored in this act.
