import { contentVar } from "../lib/auto-content.js";

/**
 * The Filter component — a single-select row of pill "chips" with a reset, the
 * pattern behind faceted product/category filtering.
 *
 * Radio semantics (choose one); picking a chip fills it with the accent, and a
 * circular reset (`.filter-reset`) clears the choice. Colorless chips
 * (base-100 + border) read an orthogonal accent for the selected state via
 * `--filter-accent`; a color class (`.filter-primary`) on the row sets it. The
 * selected chip is marked `[data-selected]` by the React layer.
 *
 * @param {string[]} colors - color names to generate `.filter-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function filter(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}filter${suffix}`;
  const accent = "var(--filter-accent, var(--color-primary))";
  const CHIP = "calc(var(--size-field, 0.25rem) * 8)"; // ~32px tall

  const base = {
    [sel()]: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "0.5rem",
    },

    [sel("-item")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      height: CHIP,
      paddingInline: "0.875rem",
      borderRadius: "9999px",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      font: "inherit",
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1",
      whiteSpace: "nowrap",
      cursor: "pointer",
      userSelect: "none",
      transitionProperty: "background-color, border-color, color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "& svg": { width: "0.9rem", height: "0.9rem", flexShrink: "0" },
      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: `2px solid ${accent}`,
        outlineOffset: "2px",
      },
      "&[data-selected]": {
        backgroundColor: accent,
        borderColor: accent,
        color: "var(--filter-accent-content, var(--color-primary-content))",
      },
      "&[data-selected]:hover": {
        backgroundColor: `color-mix(in oklab, ${accent} 90%, black)`,
      },
      "&:disabled": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // The circular reset (×) — appears once a chip is chosen.
    [sel("-reset")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: CHIP,
      height: CHIP,
      padding: "0",
      borderRadius: "9999px",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      cursor: "pointer",
      transition: "background-color var(--duration, 150ms)",

      "& svg": { width: "0.9rem", height: "0.9rem" },
      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: `2px solid ${accent}`,
        outlineOffset: "2px",
      },
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--filter-accent": `var(--color-${name})`,
      "--filter-accent-content": contentVar(name),
    };
  }

  return base;
}
