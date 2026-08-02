---
"@wizeworks/silicaui-builder": patch
---

Two email-Inspector fixes found while checking whether the site builder's
repaint/padding defects had twins here. (They don't — email nodes carry typed
fields, so an update is an assignment and can't layer, and every view reads
`extract()`, which clones per commit. Both are now covered by
`e2e/email-repaint.spec.ts` so they stay true.)

**Control rows were stealing a control's accessible name.** `Row` was a
`<label>` wrapping arbitrary children, and a `<label>` names the first labelable
element it wraps — `<button>` included. So every chip and swatch row handed its
entire text to whichever control came first: the Auto chip announced as
"Padding Y 0 2 4 6 8 44", every other chip announced with no context at all, and
in `NumberField` the number input left unnamed while the reset button took the
label. 40 rows across every node kind. Rows holding more than one control are
now `role="group"` + `aria-labelledby`, which names the SET without taking any
member's name; single-control rows stay real `<label>`s. Guarded generally
rather than row-by-row — `e2e/email-inspector-a11y.spec.ts` sweeps every kind
and fails on any `<label>` wrapping two controls.

**Size and radius chips can now reach a value they don't list.** The chip ladder
is a scale, and the free-entry field only appeared once the value was ALREADY
off it — so an author could edit a foreign value (from a template, or another
editor via `applyRemoteOps`) but never author one: 12px padding or a 12px corner
had no way in. A `Custom` chip opens the field on demand; an off-ladder value
still opens it unprompted. Radius gains the same trailing custom swatch the
colour picker already had.

Also: `Auto` no longer highlights when no chip matches. It is a reset ACTION —
an email field is never unset, unlike a site class token — and lighting it on a
deliberate 44px announced that value as the default. `Custom` owns "this isn't a
preset" now, matching the convention `SwatchGroup` already documented.
