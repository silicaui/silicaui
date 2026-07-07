/**
 * Color UTILITIES as pure var-setters — `.text-<c>`, `.bg-<c>`, `.border-<c>`.
 *
 * silicaui already emits component VARIANTS (`.btn-<c>`) for the whole `colors:`
 * list via addBase, so they exist for any declared color with no scanning. Color
 * utilities, by contrast, historically came only from Tailwind's registered
 * `theme.colors` (the built-in set) and were tree-shaken against scanned source —
 * so a user's custom `brand` got `.btn-brand` but NOT `.text-brand`/`.bg-brand`,
 * and even built-ins only appeared if a literal class string was scanned.
 *
 * Emitting them here as var-setters (same mechanism as variants) closes that gap:
 * every color in the list gets the full trio, for ALL N named colors, with no
 * safelist. This is silicaui's core promise — "n named colors cascade through
 * everything" — made literally true. Tailwind's own utilities (opacity modifiers
 * like `bg-primary/50`) still layer on top for the registered colors; these are
 * additive and never fight them (utilities layer wins over base).
 *
 * @param {string[]} names - token names to emit utilities for (e.g. "primary",
 *   "primary-content", "base-100")
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function colorUtilityRules(names, prefix = "") {
  const rules = {};
  for (const name of names) {
    const v = `var(--color-${name})`;
    rules[`.${prefix}text-${name}`] = { color: v };
    rules[`.${prefix}bg-${name}`] = { backgroundColor: v };
    rules[`.${prefix}border-${name}`] = { borderColor: v };
  }
  return rules;
}

/** The neutral surface ramp + ink — always emitted (not part of `colors`). */
const SURFACES = ["base-100", "base-200", "base-300", "base-content"];

/**
 * The full build-time utility set: the surface ramp plus each semantic color and
 * its `-content` foreground. Wired into the plugin so every declared color is
 * paintable via `text-`/`bg-`/`border-` without scanning.
 *
 * @param {string[]} colors - the plugin's `colors:` list
 * @param {string} [prefix]
 */
export function colorUtilities(colors, prefix = "") {
  const names = [...SURFACES];
  for (const c of colors) names.push(c, `${c}-content`);
  return colorUtilityRules(names, prefix);
}
