/**
 * The ToggleGroup component — a segmented control (single- or multi-select set
 * of toggle buttons). Behavior is Base UI's ToggleGroup + Toggle (roving focus,
 * pressed state, single/multiple selection); Silica styles the track and the
 * items. The active item reads as a raised base-100 pill on the base-200 track.
 *
 * Colorless. NOTE: this is the button-based segmented control — distinct from
 * `.toggle` (the on/off switch). `[data-pressed]` marks the selected item(s);
 * `[data-orientation="vertical"]` stacks it.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toggleGroup(prefix = "") {
  const sel = (suffix = "") => `.${prefix}toggle-group${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      alignItems: "stretch",
      gap: "0.125rem",
      padding: "0.1875rem",
      backgroundColor: "var(--color-base-200)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      borderRadius: "var(--radius-field, 0.25rem)",

      '&[data-orientation="vertical"]': { flexDirection: "column" },
    },

    [sel("-item")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.375rem",
      height: "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "0.75rem",
      fontSize: "0.8125rem",
      fontWeight: "500",
      color: "var(--color-base-content)",
      backgroundColor: "transparent",
      border: "0",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.7)",
      cursor: "pointer",
      transitionProperty: "background-color, color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "& svg": { width: "1.05rem", height: "1.05rem", flexShrink: "0" },

      "&:hover:not([data-pressed])": {
        backgroundColor:
          "color-mix(in oklab, var(--color-base-content) 7%, transparent)",
      },
      // Selected: a raised pill lifts off the track.
      "&[data-pressed]": {
        backgroundColor: "var(--color-base-100)",
        boxShadow: "0 1px 2px color-mix(in oklab, black 12%, transparent)",
      },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "-1px",
      },
      "&[data-disabled]": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "not-allowed",
      },
    },

    // ---- Sizes (re-scale the track padding + items) ------------------------
    // Mirrors the button/kbd size vocabulary (xs · sm · [md] · lg). The size
    // class sits on the track and cascades to its items.
    [sel("-xs")]: { padding: "0.125rem" },
    [`${sel("-xs")} ${sel("-item")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 6)",
      paddingInline: "0.5rem",
      fontSize: "0.6875rem",
      "& svg": { width: "0.85rem", height: "0.85rem" },
    },
    [sel("-sm")]: { padding: "0.125rem" },
    [`${sel("-sm")} ${sel("-item")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 7)",
      paddingInline: "0.625rem",
      fontSize: "0.75rem",
      "& svg": { width: "0.9rem", height: "0.9rem" },
    },
    [`${sel("-lg")} ${sel("-item")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 10)",
      paddingInline: "1rem",
      fontSize: "0.9375rem",
      "& svg": { width: "1.2rem", height: "1.2rem" },
    },
  };
}
