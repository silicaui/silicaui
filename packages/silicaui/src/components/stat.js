/**
 * The Stat component — a metric block (title · value · description), optionally
 * with a trailing figure (icon), grouped in a `.stats` container.
 *
 * Colorless. Each `.stat` is a grid: the title/value/desc stack in column 1
 * while a `.stat-figure` sits in an implicit column 2 spanning all three rows,
 * vertically centered (the daisyUI layout). The `.stats` container paints the
 * surface and draws hairline separators between blocks — inline by default,
 * switched to stacked by `-vertical`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function stat(prefix = "") {
  const sel = (suffix = "") => `.${prefix}stat${suffix}`;

  return {
    // ---- Container ---------------------------------------------------------
    [sel("s")]: {
      display: "inline-flex",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      overflow: "hidden",
    },
    [sel("s-vertical")]: {
      flexDirection: "column",
    },
    // Separators between blocks: a vertical rule inline, a horizontal one stacked.
    [`${sel("s")} > ${sel()}:not(:first-child)`]: {
      borderInlineStart: "var(--border, 1px) solid var(--color-base-200)",
    },
    [`${sel("s-vertical")} > ${sel()}:not(:first-child)`]: {
      borderInlineStart: "0",
      borderTop: "var(--border, 1px) solid var(--color-base-200)",
    },

    // ---- Block -------------------------------------------------------------
    [sel()]: {
      display: "inline-grid",
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
      columnGap: "1rem",
      padding: "1.25rem 1.5rem",
    },
    [sel("-title")]: {
      gridColumnStart: "1",
      fontSize: "0.8125rem",
      color: "var(--color-base-content)",
    },
    [sel("-value")]: {
      gridColumnStart: "1",
      fontSize: "1.875rem",
      fontWeight: "700",
      lineHeight: "1.2",
      letterSpacing: "-0.01em",
    },
    [sel("-desc")]: {
      gridColumnStart: "1",
      fontSize: "0.75rem",
      color: "var(--color-base-content)",
    },
    // Figure sits in an implicit second column, spanning all three text rows.
    [sel("-figure")]: {
      gridColumnStart: "2",
      gridRow: "1 / span 3",
      placeSelf: "center",
      color: "var(--stat-figure, var(--color-primary))",

      // The figure is an icon slot, and it defines an implicit grid column —
      // an unsized <svg> lets that column's width vary by browser, which shifts
      // the whole stat's layout, not just the glyph.
      "& svg": { width: "1.75em", height: "1.75em", flexShrink: "0" },
    },
  };
}
