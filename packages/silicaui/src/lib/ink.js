/**
 * The INK form of a role colour — the value to paint as TEXT on the page, as
 * opposed to the FILL form a palette actually tunes.
 *
 * A palette tunes each role as a fill: light mode's `warning` is
 * `oklch(80% 0.11 85)`, a soft amber that carries near-black `warning-content`
 * at 8.8:1 and is right behind a label. The same value used AS the label, on a
 * 98% surface, is 1.77:1 (docs/personas/issues/019).
 *
 * Mixing halfway toward `--color-base-content` moves the colour toward whatever
 * the current surface uses as ink — darker on a light page, lighter on a dark
 * one — so the direction is right in EVERY theme, including one a host invents
 * at runtime. A lightness clamp would have needed to know which way to clamp,
 * which means a per-theme flag a hand-rolled theme would omit and silently
 * invert. The mix costs about half the chroma, so the second step multiplies it
 * back; 89–134% of the original survives.
 *
 * Both `color-mix` and relative-colour syntax resolve in the browser at use
 * time, so a colour invented live gets its ink the same way a declared one does.
 *
 * TWO CALLERS, ONE FORMULA. `color-variants.js` uses it to emit `--<root>-ink`
 * for every coloured family. Components that paint a role colour as text
 * DIRECTLY — a required asterisk, a validator message, an active menu item —
 * call it here instead of writing `var(--color-error)`, which is the raw fill
 * and measured 4.42:1 as an asterisk in light. `verify-ink-derivation.mjs` fails
 * the build on a bare role token in a `color:` declaration.
 */
export const ink = (colorRef) =>
  `oklch(from color-mix(in oklab, ${colorRef} 50%, var(--color-base-content)) l calc(c * 2) h)`;

/** Shorthand for a named role: `inkOfRole("error")`. */
export const inkOfRole = (name) => ink(`var(--color-${name})`);
