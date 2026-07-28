/**
 * The foreground ("content") color to render on top of a named color — the LAST
 * RESORT, for a color nothing had a chance to measure.
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
 * WHY A THRESHOLD AT ALL, AND WHY 0.57.
 * A threshold on lightness is a stand-in for the comparison we actually want —
 * which ink has more CONTRAST — and CSS cannot compute a contrast ratio. The two
 * part company: the crossover where black overtakes white ranges from `l ≈ 0.54`
 * to `l ≈ 0.59` across the chroma/hue space, so no constant is right everywhere.
 *
 * The default was 0.68, which is above that entire range: every color in the
 * mid band got white when black was the legible choice. Measured over the four
 * shipped `THEME_PRESETS`, that was seven role colors failing WCAG AA on their
 * own buttons and badges while the rejected ink would have passed. 0.57 sits
 * inside the crossover range instead of above it, and clears AA for every
 * shipped preset token.
 *
 * It is still an approximation. Anything @wizeworks/silicaui can see at build
 * time — a preset, a theme in the builder, a declared plugin color — should get
 * a MEASURED foreground from `resolveThemeTokens` / `deriveContent` in
 * @wizeworks/silicaui-html instead, and never reach this fallback. This covers
 * only colors injected into a live document that no build step ever saw.
 *
 * Override with `--silica-content-threshold` if a specific palette needs it.
 *
 * @param {string} name - color token name, e.g. "primary" or "brand"
 * @returns {string} a CSS value usable as `color`
 */
export function autoContent(colorRef) {
  return `oklch(from ${colorRef} clamp(0, (var(--silica-content-threshold, 0.57) - l) * 1000, 1) 0 0)`;
}

export function contentVar(name) {
  return `var(--color-${name}-content, ${autoContent(`var(--color-${name})`)})`;
}
