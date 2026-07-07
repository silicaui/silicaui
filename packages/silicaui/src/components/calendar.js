import { contentVar } from "../lib/auto-content.js";

/**
 * The Calendar / DatePicker component — a from-scratch month-grid date picker
 * (Base UI ships no calendar in rc.0, so the React layer owns all the behavior;
 * this owns the surface).
 *
 * A colorless grid with an orthogonal accent for the selection: a color class
 * (`.calendar-primary`) sets `--calendar-accent`. Day states are driven by data
 * attributes the React layer stamps: `[data-outside]` (adjacent month),
 * `[data-today]`, `[data-selected]` (single), `[data-range-start]` /
 * `[data-range-end]` / `[data-in-range]` (range), and `[data-disabled]`. In-range
 * cells fill edge-to-edge (no gap) so the run reads as one continuous bar with
 * accent endpoints. The `.calendar-popup` surface + `.date-field` control let the
 * DatePicker sit under an `.input`-styled trigger.
 *
 * @param {string[]} colors - color names to generate `.calendar-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function calendar(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}calendar${suffix}`;
  const ACCENT = "var(--calendar-accent, var(--color-primary))";
  const ACCENT_FG = "var(--calendar-accent-content, var(--color-primary-content))";
  const TINT = `color-mix(in oklab, ${ACCENT} 16%, transparent)`;

  const base = {
    [sel()]: {
      "--calendar-cell": "2.25rem",
      display: "inline-flex",
      flexDirection: "column",
      gap: "0.5rem",
      padding: "0.75rem",
      color: "var(--color-base-content)",
      userSelect: "none",
    },

    // Two side-by-side months (range picker).
    [sel("-months")]: {
      display: "flex",
      gap: "1.5rem",
      alignItems: "flex-start",
    },

    // Header row: prev / title / next.
    [sel("-header")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      minHeight: "2rem",
    },
    [sel("-title")]: {
      fontSize: "0.875rem",
      fontWeight: "600",
      textAlign: "center",
    },
    [sel("-nav")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2rem",
      height: "2rem",
      flexShrink: "0",
      padding: "0",
      border: "0",
      background: "none",
      borderRadius: "var(--radius-field, 0.25rem)",
      color: "inherit",
      cursor: "pointer",
      transition: "background-color 0.15s",
      "& svg": { width: "1.1rem", height: "1.1rem" },
      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: `2px solid ${ACCENT}`,
        outlineOffset: "1px",
      },
      "&:disabled": {
        opacity: "0.4",
        cursor: "not-allowed",
        backgroundColor: "transparent",
      },
    },

    // A single month block (grid).
    [sel("-month")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },

    // Weekday labels + day rows share one 7-column track.
    [sel("-weekdays")]: {
      display: "grid",
      gridTemplateColumns: "repeat(7, var(--calendar-cell))",
    },
    [sel("-weekday")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "1.75rem",
      fontSize: "0.72rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      color: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
    },
    [sel("-grid")]: {
      display: "grid",
      gridTemplateColumns: "repeat(7, var(--calendar-cell))",
      gridAutoRows: "var(--calendar-cell)",
    },

    // One day cell (a button). Fills its cell so in-range tints touch.
    [sel("-day")]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      padding: "0",
      border: "0",
      background: "none",
      font: "inherit",
      fontSize: "0.8125rem",
      color: "inherit",
      borderRadius: "var(--radius-field, 0.25rem)",
      cursor: "pointer",
      transition: "background-color 0.12s, color 0.12s",

      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: `2px solid ${ACCENT}`,
        outlineOffset: "-2px",
      },

      // Adjacent-month spillover days.
      "&[data-outside]": {
        color: "color-mix(in oklab, var(--color-base-content) 40%, transparent)",
      },

      // Today — a subtle ring until it's also selected.
      "&[data-today]": { fontWeight: "700" },
      "&[data-today]::after": {
        content: '""',
        position: "absolute",
        insetInline: "38%",
        bottom: "0.28rem",
        height: "0.15rem",
        borderRadius: "9999px",
        backgroundColor: ACCENT,
      },

      // Range middle — square tint bar.
      "&[data-in-range]": {
        backgroundColor: TINT,
        borderRadius: "0",
      },

      // Selected / range endpoints — solid accent.
      "&[data-selected], &[data-range-start], &[data-range-end]": {
        backgroundColor: ACCENT,
        color: ACCENT_FG,
        fontWeight: "600",
      },
      "&[data-range-start]": {
        borderStartEndRadius: "0",
        borderEndEndRadius: "0",
      },
      "&[data-range-end]": {
        borderStartStartRadius: "0",
        borderEndStartRadius: "0",
      },
      // The accent endpoint hides today's underline dot for legibility.
      "&[data-selected][data-today]::after, &[data-range-start][data-today]::after, &[data-range-end][data-today]::after":
        { backgroundColor: ACCENT_FG },

      "&[data-disabled]": {
        color: "color-mix(in oklab, var(--color-base-content) 30%, transparent)",
        cursor: "not-allowed",
        backgroundColor: "transparent",
        textDecoration: "line-through",
      },
    },

    // Portalled popup surface for the DatePicker (mirrors the dropdown surface).
    [sel("-popup")]: {
      zIndex: "50",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.22)",
      outline: "none",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.96)",
      },
    },
  };

  // The DatePicker trigger reuses `.input`; this only adds the calendar glyph +
  // layout. Named `.date-field*` so it reads clearly at the call site.
  base[`.${prefix}date-field`] = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    textAlign: "start",
    cursor: "pointer",
  };
  base[`.${prefix}date-field-value`] = {
    minWidth: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  base[`.${prefix}date-field[data-placeholder] .${prefix}date-field-value`] = {
    color: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
  };
  base[`.${prefix}date-field-icon`] = {
    display: "inline-flex",
    flexShrink: "0",
    color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",
    "& svg": { width: "1.05rem", height: "1.05rem" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--calendar-accent": `var(--color-${name})`,
      "--calendar-accent-content": contentVar(name),
    };
  }

  return base;
}
