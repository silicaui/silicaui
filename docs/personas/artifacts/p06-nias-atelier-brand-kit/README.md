# Nia's Atelier — a live brand kit

The artifact from **[P06](../../06-nias-atelier-brand-kit.md)** — Nia Adeyemi, a
brand designer who learned to code so she would stop having her work approximated.

This is what she hands a client instead of a PDF: the palette, the type, the
components, all running, in three palettes **none of which is one of silicaui's
twenty shipped themes**.

## What it proves

Four colour roles that did not exist until she typed them — `terracotta`, `bone`,
`ironwood`, `verdigris` — reaching **38 component families**, identically to
`primary`. Measured three ways in the run, not asserted.

## Running it

```bash
npm install
npm run dev        # http://localhost:4106
npm run build && npm run preview
```

Three pages:

| | what it is |
| --- | --- |
| `/` | the kit: palette, typography, 34 components in an invented colour beside the same 34 in a shipped one, a nested island, and the notes page |
| `/collision.html` | the client's legacy `.btn` / `.card` / `.badge` on the page with **no** class prefix — what breaks |
| `/prefixed.html` | the same page with `prefix: na-`, both stylesheets surviving |

## Things worth knowing before you change anything

**Every contrast number on the palette page is read out of the page as it renders.**
`src/measure.js` does the measuring; nothing is written by hand. Three bugs are
pinned in its comments because all three produced numbers that looked plausible and
were not: dividing straight `getImageData` RGBA by alpha, an uncleared canvas making
`rgba(0,0,0,0)` read as opaque, and measuring an element under an `opacity: 0`
ancestor.

**`atelier-signal` is a diagnostic, not a palette.** Its brand colour sits at
lightness 0.58 on a 0.60 surface on purpose. It is here to show what the system does
when asked for the impossible — which, since
[issue 037](../../issues/037-the-plugin-holds-the-colour-and-guesses-its-ink-anyway.md),
is to name all 8 roles at build time with their measured numbers. Do not ship it.

**The build talks, and it is right.** `npm run build` prints one line about
`atelier-clay`:

```
[silicaui] bone (oklch(0.94 0.012 85)) cannot be read as TEXT on this theme's
surface in theme "atelier-clay": 3.7:1, under WCAG AA (4.5).
```

`bone` is a surface, not an ink. That line is why the kit's notes page says so.

**The prefix has to be given twice** — to the plugin in `prefixed.css` and to
`<SilicaProvider prefix="na-">` in `prefixed-main.jsx`. Giving only one of the two is
silent.

## Pinned to the local package

`package.json` points `@wizeworks/silicaui` at
`file:../../../../packages/silicaui`, because the fixes this run produced are not
published yet. **Once the changeset ships, re-pin to `^0.57.0`** and re-check:

- the build still prints the `bone` line for `atelier-clay` and eight lines for
  `atelier-signal`
- `.tag-input-remove` still measures a 24 x 24 hit area and 6.23:1 in light
- the carousel dot still measures 7.69:1 in dark

`@wizeworks/silicaui-react` is already on the published `^0.56.0`; the React changes
from this run are comments only.
