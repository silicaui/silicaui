import { contentVar } from "../lib/auto-content.js";

/**
 * The Pagination component — a row of page controls.
 *
 * Colorless base with an orthogonal accent for the active page. The React
 * wrapper computes the page range (with ellipses) and renders `.pagination-item`
 * buttons plus prev/next; the active page gets `.pagination-item-active`.
 *
 * @param {string[]} colors - color names to generate `.pagination-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function pagination(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}pagination${suffix}`;

  const cell = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "var(--pagination-size, 2.25rem)",
    height: "var(--pagination-size, 2.25rem)",
    paddingInline: "0.5rem",
    fontSize: "0.875rem",
  };

  const base = {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
    },

    [sel("-item")]: {
      ...cell,
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      cursor: "pointer",
      transition: "background-color 0.15s, color 0.15s, border-color 0.15s",

      "& svg": { width: "1.1rem", height: "1.1rem", display: "block" },
      "&:hover:not(:disabled)": { backgroundColor: "var(--color-base-200)" },
      "&:disabled": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "default",
      },
      "&:focus-visible": {
        outline: "2px solid var(--pagination-accent, var(--color-primary))",
        outlineOffset: "2px",
      },
    },

    [sel("-item-active")]: {
      backgroundColor: "var(--pagination-accent, var(--color-primary))",
      color: "var(--pagination-accent-content, var(--color-primary-content))",
      borderColor: "transparent",
      "&:hover:not(:disabled)": {
        backgroundColor: "var(--pagination-accent, var(--color-primary))",
      },
    },

    // Ellipsis gap marker.
    [sel("-ellipsis")]: {
      ...cell,
      color: "var(--color-base-content)",
      opacity: "0.6",
      userSelect: "none",
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { "--pagination-size": "1.5rem", fontSize: "0.75rem" },
    [sel("-sm")]: { "--pagination-size": "1.875rem" },
    [sel("-md")]: { "--pagination-size": "2.25rem" },
    [sel("-lg")]: { "--pagination-size": "2.75rem" },
    [sel("-xl")]: { "--pagination-size": "3.25rem", fontSize: "1.125rem" },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--pagination-accent": `var(--color-${name})`,
      "--pagination-accent-content": contentVar(name),
    };
  }

  return base;
}
