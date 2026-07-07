/**
 * The Footer component — a responsive multi-column site footer.
 *
 * Colorless. A grid that stacks its columns vertically on small screens and
 * flows them into a row of `max-content` columns from `md` up. Each direct
 * child is itself a grid, so a `<nav>` of links becomes a tidy vertical stack
 * under its `.footer-title`. `-center` centers every column and its contents
 * (for a single-row, centered footer).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function footer(prefix = "") {
  const sel = (suffix = "") => `.${prefix}footer${suffix}`;

  return {
    [sel()]: {
      display: "grid",
      width: "100%",
      gridAutoFlow: "row",
      placeItems: "start",
      rowGap: "2.5rem",
      columnGap: "1rem",
      fontSize: "0.875rem",
      lineHeight: "1.375",
      color: "var(--color-base-content)",

      // Each column (typically a <nav>) becomes its own vertical stack.
      "& > *": {
        display: "grid",
        placeItems: "start",
        gap: "0.5rem",
      },
    },

    // Flow columns into a row once there's room, spread to fill the width.
    "@media (min-width: 48rem)": {
      [sel()]: {
        gridAutoFlow: "column",
        gridAutoColumns: "max-content",
        justifyContent: "space-between",
      },
    },

    // Small, muted, upper-cased column heading.
    [sel("-title")]: {
      marginBottom: "0.25rem",
      fontSize: "0.75rem",
      fontWeight: "700",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      opacity: "0.6",
    },

    // Centered variant — everything on one centered row.
    [sel("-center")]: {
      placeItems: "center",
      textAlign: "center",
      "& > *": { placeItems: "center" },
    },
  };
}
