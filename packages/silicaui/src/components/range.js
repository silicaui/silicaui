import { contentVar } from "../lib/auto-content.js";

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
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--range-accent": `var(--color-${name})`,
      "--range-accent-content": contentVar(name),
    };
  }

  return base;
}
