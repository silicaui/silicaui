/**
 * The List component — a vertical list of rows.
 *
 * Colorless. A base-100 surface whose `.list-row`s are flex rows separated by
 * hairline rules. Put `.list-col-grow` on the cell that should take the free
 * space (title/body); leading/trailing cells (icon, avatar, actions) size to
 * content. `.list-title` is a small muted section heading.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function list(prefix = "") {
  const sel = (suffix = "") => `.${prefix}list${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
    },

    [sel("-row")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      paddingBlock: "0.75rem",
      paddingInline: "1rem",
      borderTop: "1px solid var(--color-base-200)",

      "&:first-child": { borderTop: "0" },
    },

    // The growable cell.
    [sel("-col-grow")]: {
      flex: "1 1 0%",
      minWidth: "0",
    },

    // Small muted section heading (not a row).
    [sel("-title")]: {
      paddingBlock: "0.625rem",
      paddingInline: "1rem",
      fontSize: "0.6875rem",
      fontWeight: "700",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      opacity: "0.6",
    },

    // Hover affordance for interactive rows.
    [sel("-hover")]: {
      [`& ${sel("-row")}`]: {
        transition: "background-color 0.15s",
        cursor: "pointer",
        "&:hover": { backgroundColor: "var(--color-base-200)" },
      },
    },
  };
}
