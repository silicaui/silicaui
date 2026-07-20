/**
 * Warn when a theme color is declared but never registered with the plugin.
 *
 * THE PAPERCUT. Adding a color takes two steps that are easy to conflate:
 *
 *   @theme  { --color-brand: #7c3aed; }                 // makes bg-brand work
 *   @plugin "@wizeworks/silicaui" { colors: …, brand; } // makes btn-brand work
 *
 * Do only the first and you get the most disorienting possible result:
 * `bg-brand` and `text-brand` work fine (Tailwind emits those itself), while
 * `btn-brand`, `badge-brand`, `alert-brand` silently render as the default —
 * no error, no missing-class warning, just a button that's the wrong color.
 * Every instinct then says "the color is broken", when the color is fine and
 * only the registration is missing.
 *
 * We can't fix this by auto-registering everything: `theme("color")` includes
 * Tailwind's entire default palette (~250 entries), and emitting component
 * variants for `red-50` … `zinc-950` would be an enormous stylesheet. So we
 * detect the specific mistake instead and name the exact fix.
 *
 * THE HEURISTIC. Tailwind's built-in palette is uniformly `<name>-<number>`
 * (`red-500`). A theme color with no numeric step is therefore almost certainly
 * a user-declared semantic color — which is exactly the shape that belongs in
 * the plugin's `colors:` list.
 *
 * KNOWN LIMITATION — this is best-effort, not a guarantee. The plugin runs at
 * its own position in the stylesheet, so `theme("color")` only sees `@theme`
 * blocks declared BEFORE the `@plugin` line. Declare the color afterwards and
 * the warning won't fire (the papercut is unchanged, just undetected). Colors
 * registered through Silica's own `@plugin "@wizeworks/silicaui/theme"` block
 * don't appear here at all, which is correct — that path registers them
 * properly by construction.
 */

/** Palette-scale keys (`red-500`) — Tailwind's own, never semantic roles. */
const SCALE_KEY = /-\d+$/;

/** Tailwind's internal bookkeeping entries, e.g. `__CSS_VALUES__`. */
const INTERNAL_KEY = /^__.*__$/;

/** CSS-wide keywords and bare colors Tailwind ships that aren't roles. */
const NON_ROLE = new Set([
  "black",
  "white",
  "transparent",
  "current",
  "inherit",
  "initial",
  "unset",
  "revert",
]);

/**
 * @param {(path: string) => unknown} theme  the plugin API's `theme` accessor
 * @param {string[]} registered              the resolved `colors:` list
 * @param {(msg: string) => void} [warn]     injectable for testing
 */
export function warnUnregisteredColors(theme, registered, warn = console.warn) {
  let palette;
  try {
    palette = theme("color");
  } catch {
    return []; // Older//different Tailwind — detection is best-effort only.
  }
  if (!palette || typeof palette !== "object") return [];

  const known = new Set(registered);
  const missing = Object.keys(palette).filter((key) => {
    if (SCALE_KEY.test(key)) return false; // red-500 & friends
    if (INTERNAL_KEY.test(key)) return false; // Tailwind's own __CSS_VALUES__
    if (NON_ROLE.has(key)) return false;
    if (known.has(key)) return false; // already registered — nothing to say
    if (key.endsWith("-content")) return false; // paired foreground token
    if (key.startsWith("base-")) return false; // surface/ink scale, not a role
    return true;
  });

  if (missing.length) {
    const list = missing.join(", ");
    warn(
      `[silicaui] Theme color${missing.length > 1 ? "s" : ""} ${list} ${
        missing.length > 1 ? "are" : "is"
      } declared in @theme but not registered with the plugin.\n` +
        `  Utilities like \`bg-${missing[0]}\` work, but component variants ` +
        `(\`btn-${missing[0]}\`, \`badge-${missing[0]}\`, \`alert-${missing[0]}\`, …) ` +
        `will NOT be generated and those elements will silently render in the default color.\n` +
        `  Fix: @plugin "@wizeworks/silicaui" { colors: ${[...registered, ...missing].join(", ")}; }`,
    );
  }
  return missing;
}
