import { contentVar } from "../lib/auto-content.js";

/**
 * The Rating component — a row of star buttons.
 *
 * Colorless base with an orthogonal accent (`.rating-warning` sets the fill).
 * Filled/empty state is driven by a `data-filled` attribute the React wrapper
 * sets per star (so hover-preview and value both work). Icons are hard-sized so
 * an unsized `<svg>` can't collapse or balloon across browsers.
 *
 * @param {string[]} colors - color names to generate `.rating-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function rating(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}rating${suffix}`;

  const base = {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.125rem",
      "--rating-size": "1.5rem",
    },

    [sel("-item")]: {
      display: "inline-flex",
      padding: "0",
      border: "0",
      background: "none",
      lineHeight: "0",
      cursor: "pointer",
      color: "var(--rating-accent, var(--color-warning))",
      transition: "color 0.15s, transform 0.1s",

      "& svg": {
        width: "var(--rating-size)",
        height: "var(--rating-size)",
        display: "block",
      },
      "&:active": { transform: "scale(0.9)" },
      // Empty star.
      '&[data-filled="false"]': {
        color: "var(--color-base-300)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--rating-accent, var(--color-warning))",
        outlineOffset: "2px",
        borderRadius: "var(--radius-field, 0.25rem)",
      },
    },

    // Read-only: no pointer affordance.
    [`${sel("-readonly")} ${sel("-item")}`]: {
      cursor: "default",
      "&:active": { transform: "none" },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { "--rating-size": "0.875rem" },
    [sel("-sm")]: { "--rating-size": "1.125rem" },
    [sel("-md")]: { "--rating-size": "1.5rem" },
    [sel("-lg")]: { "--rating-size": "1.875rem" },
    [sel("-xl")]: { "--rating-size": "2.25rem" },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--rating-accent": `var(--color-${name})`,
      "--rating-accent-content": contentVar(name),
    };
  }

  return base;
}
