/**
 * The foreground ("content") color to render on top of a named color.
 *
 * Prefers an explicit `--color-<name>-content` token. If the user defined a
 * color without a matching `-content` (e.g. just `--color-brand: #7c3aed`), we
 * auto-derive a legible black/white foreground.
 *
 * The auto-derivation uses CSS relative-color syntax: `oklch(from <color> …)`
 * normalizes whatever format the token was authored in (hex, oklch, rgb, hsl)
 * to OKLCH, reads its lightness `l`, and flips to white below a threshold or
 * black above it. Because `from` normalizes first, `#7c3aed` and its OKLCH
 * equivalent behave identically.
 *
 * @param {string} name - color token name, e.g. "primary" or "brand"
 * @returns {string} a CSS value usable as `color`
 */
export function autoContent(colorRef) {
  return `oklch(from ${colorRef} clamp(0, (var(--silica-content-threshold, 0.68) - l) * 1000, 1) 0 0)`;
}

export function contentVar(name) {
  return `var(--color-${name}-content, ${autoContent(`var(--color-${name})`)})`;
}
