/**
 * The Fieldset component — a labeled group of form controls.
 *
 * Colorless. A vertical stack that resets the browser's native `<fieldset>`
 * chrome (border/margin/padding/min-inline-size) so it lays out predictably,
 * then adds a `.fieldset-legend` heading and `.fieldset-label` helper text that
 * pair with Silica inputs. Drop it inside a `.card` or on its own; the gap keeps
 * legend, controls, and helper text evenly spaced.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function fieldset(prefix = "") {
  const sel = (suffix = "") => `.${prefix}fieldset${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      // Neutralize native <fieldset> defaults so it stacks like any other block.
      margin: "0",
      padding: "0",
      border: "0",
      minInlineSize: "0",
    },

    // The group heading. Renders on a native <legend> or any element.
    [sel("-legend")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0",
      fontSize: "0.875rem",
      fontWeight: "600",
      lineHeight: "1.25",
      color: "var(--color-base-content)",

      "& svg": { width: "1em", height: "1em", flexShrink: "0" },
    },

    // Helper / hint text under a control.
    [sel("-label")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      fontSize: "0.75rem",
      lineHeight: "1.25",
      color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",

      "& svg": { width: "1em", height: "1em", flexShrink: "0" },
    },
  };
}
