/**
 * The Kbd component — an inline keyboard-key cap (`<kbd>`).
 *
 * Colorless. Sits on the base-100 surface with a thicker bottom border for a
 * subtle "keycap" depth. Everything is sized in `em` so it tracks the
 * surrounding text; the size modifiers just re-scale that `em` base.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function kbd(prefix = "") {
  const sel = (suffix = "") => `.${prefix}kbd${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "2em",
      height: "1.9em",
      paddingInline: "0.5em",
      fontSize: "0.875em",
      fontFamily: "inherit",
      fontWeight: "500",
      lineHeight: "1",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      // The keycap "depth": a heavier bottom edge.
      borderBottomWidth: "3px",
      borderRadius: "var(--radius-field, 0.25rem)",
    },

    // ---- Sizes (re-scale the em base) --------------------------------------
    [sel("-xs")]: { fontSize: "0.7em" },
    [sel("-sm")]: { fontSize: "0.8em" },
    [sel("-md")]: { fontSize: "0.875em" },
    [sel("-lg")]: { fontSize: "1em" },
    [sel("-xl")]: { fontSize: "1.15em" },
  };
}
