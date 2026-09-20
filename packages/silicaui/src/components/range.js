import { colorVariantRules } from "../color-variants.js";

/**
 * The Range component — a slider (Base UI behavior).
 *
 * Colorless track (base-300) with an orthogonal accent for the filled indicator
 * and thumb. Base UI positions the indicator and thumb; we paint them. The thumb
 * grows a soft focus/drag ring (`[data-dragging]` / `:focus-visible`).
 *
 * @param {string[]} colors - color names to generate `.range-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function range(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}range${suffix}`;
  const ACCENT = "var(--range-accent, var(--color-primary))";

  const base = {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      width: "100%",
      touchAction: "none",
    },

    // The interactive control (hit area).
    [sel("-control")]: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "1.25rem",
    },

    // The rail.
    [sel("-track")]: {
      position: "relative",
      width: "100%",
      height: "0.375rem",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-300)",
    },

    // Filled portion (Base UI sizes/positions it).
    [sel("-indicator")]: {
      borderRadius: "9999px",
      backgroundColor: ACCENT,
    },

    // Draggable handle (Base UI positions it).
    [sel("-thumb")]: {
      width: "1.1rem",
      height: "1.1rem",
      borderRadius: "9999px",
      backgroundColor: ACCENT,
      border: "2px solid var(--color-base-100)",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
      outline: "none",
      transition: "box-shadow 0.15s",

      "&[data-dragging], &:focus-visible": {
        boxShadow: `0 0 0 4px color-mix(in oklab, ${ACCENT} 30%, transparent)`,
      },
    },

    // Disabled.
    [`${sel()}[data-disabled] ${sel("-thumb")}`]: {
      opacity: "var(--disabled-opacity, 0.5)",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel()}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };

  Object.assign(base, colorVariantRules("range", colors, prefix));

  return base;
}
