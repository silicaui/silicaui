/**
 * How to locate one Inspector row — in EITHER builder, whatever kind it is.
 *
 * A row wrapping a SINGLE control is a real `<label>`; a row holding a set of
 * them (chips, swatches, a reset button beside a field) is a `role="group"`
 * named by `aria-labelledby` — because a `<label>` names the first labelable
 * element it wraps, and `<button>` is labelable, so a chip row inside one hands
 * the row's whole text to whichever chip comes first. See `Row` in
 * `src/site/react/Inspector.tsx` and `src/email/react/Inspector.tsx`, and the
 * `inspector-a11y` specs for the guards that keep it that way.
 *
 * Specs shouldn't have to know which shape a given row is — nor break when one
 * gains a second control and flips from one to the other, which is what a
 * `div.mb-2` / `label` locator did. Match either:
 *
 *   page.locator(ROW, { hasText: "Padding Y" }).first()
 */
export const ROW = 'label, [role="group"]';
