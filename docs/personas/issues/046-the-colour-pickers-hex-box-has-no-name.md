# 046 — The colour picker's hex box is the one control in it with no name

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · act 5, typing her purple in
**Surface:** `@wizeworks/silicaui-react` › `ColorPicker`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Typing `#7A3FA8` into the colour picker, the field she typed into reported this to the
accessibility tree:

```json
{ "value": "#00bcc8", "ariaLabel": null, "labelledBy": null, "hasVisibleLabel": false, "placeholder": "" }
```

An unnamed text box containing `#00bcc8`. A screen reader reaches it and says "edit
text, hash zero zero b c c eight" and nothing else.

There **is** a caption — the word **HEX** is drawn immediately to its left. It is a
plain `<span>`, so it names the field for a person looking at it and for nobody else.

## What should have happened

The three sliders in the same panel each carry a name:

```tsx
<ColorSlider label="Hue" valueText={`${Math.round(h)}°`} … />
```

L, C and H are named. The hex field is the fourth control in the same panel and the
only one that is not. The consumer could not fix it either: `rest` is spread on the
swatch trigger, so nothing a caller passes reaches this input.

## How to reproduce

1. Open `http://localhost:5178/` → **Theme** → click any colour tile.
2. Inspect the hex field. Before the fix: no `aria-label`, no `aria-labelledby`, no
   associated `<label>`, no placeholder.
3. Or tab to it with a screen reader running and listen.
4. Every time, every theme, both `panel` and `swatch` variants.

## Why it matters

Small, and real. P03 carries a **keyboard-only** standing check — create a page, name
it, add a heading, publish, with the focus ring visible the whole way — and this is a
field on that path in the act she came for. It is also WCAG 2.2 SC 4.1.2 (Name, Role,
Value) at level A, and it is in a shipped library component, so it is wrong in every
consumer's app too, not only in our builder.

It is filed `minor` rather than `major` because a sighted mouse user is unaffected and
the caption is right there on screen.

## Where it lives

[packages/silicaui-react/src/color-picker.tsx](../../../packages/silicaui-react/src/color-picker.tsx), the `showHex` block.

## Do the siblings have it too?

**Swept every `<input>` in `@wizeworks/silicaui-react` for one with no accessible name
and no route for a consumer to supply one.** Eleven came back; ten are correct and one
was real:

| | verdict |
| --- | --- |
| `checkbox`, `checkbox-group`, `radio-group`, `date-input`, `file-input`, `search-input`, `password-input`, `dropzone` (×2) | **fine** — these are primitives whose label is the consumer's job, supplied through `Field` or a passed `aria-label` |
| `tag-input` | **fine** — spreads `{...inputProps}` onto its inner field, so a caller can name it |
| `color-picker` | **the defect** — an internal sub-part, no spread, no prop |

The distinction that matters is not "does it have a label" but **"can anyone give it
one"**. Only `ColorPicker`'s hex field failed that.

## The fix

Associate the caption that is already on screen, rather than invent a second name:

```tsx
<span id={hexLabelId} className={cx(sc("color-picker-hex-label"))}>HEX</span>
<input type="text" aria-labelledby={hexLabelId} … />
```

`React.useId()` supplies the id, so several pickers on one page do not collide. Using
the visible word keeps the accessible name identical to the visible one, which is what
voice control matches against — a separate `aria-label="Hex colour value"` would have
passed the audit and broken "click HEX".

No visual change, no API change, no new prop.

## Confirmed by

Read off the live builder after rebuilding `@wizeworks/silicaui-react`:

```json
{ "value": "#00a0b9", "ariaLabelledBy": "_r_6l_", "resolvesTo": "HEX", "ariaLabel": null }
```

The field now resolves to the word **HEX**, which is the word printed beside it.

Re-ran act 5 through the repaired field as Marlene: clicked the `primary` tile, typed
`#7A3FA8`, pressed Enter — `--color-primary` became `oklch(0.491 0.165 307.2)`, with
`--color-primary-content` derived at `oklch(98% 0.01 307.2)`. Same in dark. No console
errors. Typecheck clean across `@wizeworks/silicaui-react`.

## Rating effect

Folded into `Site builder › Theme › Colors — Ease 4 → 8`, recorded with
[045](045-accent-means-the-opposite-of-what-she-came-to-change.md).
