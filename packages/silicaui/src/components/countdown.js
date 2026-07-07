/**
 * The Countdown component — a segmented days/hours/minutes/seconds display.
 *
 * Colorless. A row of boxed units, each a big tabular number over a small label.
 * The React wrapper ticks the values; this just paints the boxes. `-plain` drops
 * the boxes for an inline number run.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function countdown(prefix = "") {
  const sel = (suffix = "") => `.${prefix}countdown${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      gap: "0.75rem",
    },

    [sel("-unit")]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.25rem",
      minWidth: "3.75rem",
      paddingBlock: "0.625rem",
      paddingInline: "0.5rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-200)",
      color: "var(--color-base-content)",
    },

    [sel("-value")]: {
      fontSize: "1.875rem",
      fontWeight: "700",
      lineHeight: "1",
      fontVariantNumeric: "tabular-nums",
    },

    [sel("-label")]: {
      fontSize: "0.6875rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      opacity: "0.6",
    },

    // Boxless inline variant.
    [sel("-plain")]: {
      gap: "0.25rem",
      alignItems: "baseline",

      [`& ${sel("-unit")}`]: {
        minWidth: "0",
        padding: "0",
        background: "none",
        flexDirection: "row",
        alignItems: "baseline",
        gap: "0.125rem",
      },
      [`& ${sel("-label")}`]: { fontSize: "0.875rem", opacity: "0.5" },
      [`& ${sel("-value")}`]: { fontSize: "1.5rem" },
    },
  };
}
