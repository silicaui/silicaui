/**
 * The Skeleton component — an animated placeholder standing in for content
 * that's still loading.
 *
 * Colorless (like Card): a neutral `base-300` fill with a translucent sheen
 * that sweeps across via an animated `background-position`. Under
 * `prefers-reduced-motion` the sweep is dropped for a gentle opacity pulse
 * (the shared `silica-pulse` keyframe). Dimensions come from the caller
 * (utilities / inline size) — Skeleton only owns the fill, radius, and shimmer.
 *
 * Shapes: base is a `--radius-field` block; `-circle` is an avatar-shaped
 * placeholder; `-text` is a pill-rounded line sized in `em` so you can stack a
 * few at different widths for a paragraph.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function skeleton(prefix = "") {
  const sel = (suffix = "") => `.${prefix}skeleton${suffix}`;

  return {
    [sel()]: {
      display: "block",
      // Neutral placeholder; a translucent white sheen rides over it. White
      // (not base-content) so it reads as a highlight sweep in BOTH themes.
      backgroundColor: "var(--skeleton-bg, var(--color-base-300))",
      backgroundImage:
        "linear-gradient(90deg, transparent 0%, color-mix(in oklab, #fff 40%, transparent) 50%, transparent 100%)",
      backgroundSize: "200% 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "150% 0",
      borderRadius: "var(--radius-field, 0.25rem)",
      animation: "silica-skeleton 1.6s ease-in-out infinite",

      // Motion-sensitive users: no travelling sheen, just a soft breathe.
      "@media (prefers-reduced-motion: reduce)": {
        backgroundImage: "none",
        animation: "silica-pulse 1.6s ease-in-out infinite",
      },
    },

    // Avatar / dot placeholder.
    [sel("-circle")]: {
      borderRadius: "9999px",
    },

    // One line of text; height tracks the font size, pill-rounded like a word.
    [sel("-text")]: {
      height: "0.75em",
      borderRadius: "9999px",
    },
  };
}
