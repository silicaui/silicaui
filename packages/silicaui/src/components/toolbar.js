/**
 * The Toolbar component — a container grouping related controls with roving
 * focus. Behavior (arrow-key navigation, roving tabindex) is Base UI's Toolbar;
 * Silica styles the bar, its buttons, groups, links, and separators.
 *
 * Colorless. A compact base-200 bar with ghost-style buttons that highlight on
 * hover. `data-orientation="vertical"` stacks it. Separators read their own
 * `data-orientation` (a vertical rule inside a horizontal bar, and vice-versa).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toolbar(prefix = "") {
  const sel = (suffix = "") => `.${prefix}toolbar${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      width: "fit-content",
      maxWidth: "100%",
      padding: "0.25rem",
      backgroundColor: "var(--color-base-200)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      borderRadius: "var(--radius-field, 0.25rem)",

      '&[data-orientation="vertical"]': {
        flexDirection: "column",
        alignItems: "stretch",
        width: "fit-content",
      },
    },

    // A subgroup of tightly-packed controls.
    [sel("-group")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.125rem",
    },

    // Ghost control: transparent until hovered/focused.
    [sel("-button")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.375rem",
      height: "calc(var(--size-field, 0.25rem) * 8)",
      minWidth: "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "0.5rem",
      fontSize: "0.8125rem",
      fontWeight: "500",
      color: "var(--color-base-content)",
      backgroundColor: "transparent",
      borderWidth: "0",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.75)",
      cursor: "pointer",
      transitionProperty: "background-color, color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "& svg": { width: "1.15rem", height: "1.15rem", flexShrink: "0" },

      "&:hover": { backgroundColor: "var(--color-base-300)" },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "1px",
      },
      "&[data-disabled], &:disabled": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "not-allowed",
        backgroundColor: "transparent",
      },
    },

    // Link styled to sit in the bar.
    [sel("-link")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      height: "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "0.5rem",
      fontSize: "0.8125rem",
      fontWeight: "500",
      color: "var(--color-base-content)",
      textDecoration: "none",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.75)",
      "&:hover": {
        backgroundColor: "var(--color-base-300)",
        textDecoration: "underline",
      },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "1px",
      },
    },

    // Divider between sections; reads its resolved orientation from Base UI.
    [sel("-separator")]: {
      alignSelf: "stretch",
      backgroundColor: "var(--color-base-300)",
      flexShrink: "0",
      '&[data-orientation="vertical"]': {
        width: "var(--border, 1px)",
        minHeight: "1.25rem",
        marginInline: "0.125rem",
      },
      '&[data-orientation="horizontal"]': {
        height: "var(--border, 1px)",
        marginBlock: "0.125rem",
      },
    },
  };
}
