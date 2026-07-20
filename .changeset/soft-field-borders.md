---
"@wizeworks/silicaui": minor
---

Soften the resting border on colored field controls

A color class on a field-tier control (`.input-*`, `.select-*`, `.textarea-*`,
`.pin-input-cell-*`, `.checkbox-*`, `.radio-*`, `.multi-select-*`,
`.tag-input-*`, `.segment-field-*`) now paints a softened tint of that color at
rest and the solid color on focus. Previously a colored control's border was
identical at rest and on focus, so the border carried no state information —
only the focus ring changed. This restores rest → focus as a visible
transition, matching what the neutral (uncolored) default already did.

`.multi-select`, `.tag-input` and `.segment-field` previously hardcoded a
neutral resting border, so a color class on them showed no color at all until
focus; they now follow the same two-lever model as the rest of the tier.

Each color class now sets two levers rather than one: `--input-accent` (focus
ring + focused border, unchanged) and the new `--input-border` (resting
border), and likewise for the other controls — note the property stem doesn't
always track the class name (`.tag-input` drives `--tag-*`). The resting tint is
`color-mix(in oklab, <color> var(--field-border-tint, 45%), var(--color-base-100))`.

Set `--field-border-tint` to tune how strong the resting tint is — lower is
quieter. Because it mixes toward the surface color, the same ratio gives the
same perceptual separation in both light and dark themes.

Validation status is deliberately unaffected: `.field` and `.validator` drive
status through the accent alone and reset the border lever, so `[data-invalid]`,
`[data-status="error"|"warning"|"success"]`, and `:user-invalid`/`:user-valid`
keep the solid border that makes them legible as a status — including on a
control that also carries a decorative color class.
