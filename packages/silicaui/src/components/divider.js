/**
 * The Divider component — a labeled or plain separator.
 *
 * Colorless. A flex line whose `::before`/`::after` draw the rules on either
 * side of an optional centered label; with no label (`:empty`) the gap
 * collapses so the two segments meet as one continuous line. `-vertical`
 * rotates it for row layouts (needs a height from its parent).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function divider(prefix = "") {
  const sel = (suffix = "") => `.${prefix}divider${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBlock: "1rem",
      fontSize: "0.875rem",
      whiteSpace: "nowrap",
      color: "var(--color-base-content)",

      "&::before, &::after": {
        content: '""',
        flex: "1 1 0%",
        height: "var(--border, 1px)",
        backgroundColor: "var(--color-base-300)",
      },
      // No label → drop the gap so the two rules meet as one line.
      "&:empty": { gap: "0" },
    },

    // Vertical rule for horizontal (row) layouts.
    [sel("-vertical")]: {
      flexDirection: "column",
      alignSelf: "stretch",
      marginBlock: "0",
      marginInline: "1rem",

      "&::before, &::after": {
        width: "var(--border, 1px)",
        height: "auto",
      },
    },
  };
}
