/**
 * The Timeline component — a sequence of events with connecting lines.
 *
 * Colorless. Each `<li>` is a 3-track grid: an opposite-side label
 * (`.timeline-start`), a centered marker (`.timeline-middle`), and a content
 * box (`.timeline-end`). The connecting lines are drawn as the marker's
 * `::before`/`::after`, each flex-filling half the row so consecutive markers
 * join into one continuous rail — no `<hr>` markup, and the first/last caps are
 * hidden automatically. `-horizontal` rotates the whole thing into a row.
 *
 * (For a simple numbered process use Steps instead; Timeline is for dated
 * events with content — changelogs, roadmaps, "our story".)
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function timeline(prefix = "") {
  const sel = (suffix = "") => `.${prefix}timeline${suffix}`;

  const RAIL = "var(--color-base-300)";

  return {
    // ---- Vertical (default) ------------------------------------------------
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      margin: "0",
      padding: "0",
      listStyle: "none",

      "& > li": {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "stretch",
        columnGap: "1rem",
      },
    },

    // Opposite-side label (right-aligned, in the first column).
    [sel("-start")]: {
      gridColumn: "1",
      alignSelf: "center",
      justifySelf: "end",
      textAlign: "end",
      paddingBlock: "0.5rem",
      fontSize: "0.875rem",
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
    },

    // The marker column: a flex stack of [rail] [dot] [rail].
    [sel("-middle")]: {
      gridColumn: "2",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "2.5rem",

      "&::before, &::after": {
        content: '""',
        flex: "1 1 0",
        width: "2px",
        backgroundColor: RAIL,
      },
      // Keep any custom marker icon a consistent size (an unsized <svg>
      // otherwise collapses or balloons, and does so differently per browser).
      "& svg": {
        width: "1.1rem",
        height: "1.1rem",
        flexShrink: "0",
      },
    },
    // Cap the rail at the two ends of the timeline.
    [`${sel()} > li:first-child ${sel("-middle")}::before`]: {
      visibility: "hidden",
    },
    [`${sel()} > li:last-child ${sel("-middle")}::after`]: {
      visibility: "hidden",
    },

    // Default dot (used when the middle has no custom icon).
    [sel("-dot")]: {
      width: "0.75rem",
      height: "0.75rem",
      flexShrink: "0",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-content)",
    },

    // Content, in the third column.
    [sel("-end")]: {
      gridColumn: "3",
      alignSelf: "center",
      justifySelf: "start",
      paddingBlock: "0.5rem",
    },

    // Optional bordered card around the content.
    [sel("-box")]: {
      paddingBlock: "0.5rem",
      paddingInline: "0.875rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
    },

    // ---- Horizontal --------------------------------------------------------
    // Items share the width equally (`flex: 1`), so dots land at even intervals
    // and each item's rail halves meet the neighbours' — no gaps. The dot sits
    // at the centre of its cell and the label/content centre over it.
    [sel("-horizontal")]: {
      flexDirection: "row",
      width: "100%",

      "& > li": {
        flex: "1 1 0",
        minWidth: "0",
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "1fr auto 1fr",
        alignItems: "center",
        columnGap: "0",
        rowGap: "0.75rem",
      },
    },

    [`${sel("-horizontal")} ${sel("-start")}`]: {
      gridColumn: "1",
      gridRow: "1",
      alignSelf: "end",
      justifySelf: "center",
      textAlign: "center",
      paddingBlock: "0",
      paddingInline: "0.5rem",
    },
    [`${sel("-horizontal")} ${sel("-middle")}`]: {
      gridColumn: "1",
      gridRow: "2",
      justifySelf: "stretch",
      flexDirection: "row",
      minHeight: "auto",
      minWidth: "auto",

      "&::before, &::after": {
        flex: "1 1 0",
        width: "auto",
        height: "2px",
      },
    },
    [`${sel("-horizontal")} ${sel("-end")}`]: {
      gridColumn: "1",
      gridRow: "3",
      alignSelf: "start",
      justifySelf: "center",
      textAlign: "center",
      paddingBlock: "0",
      paddingInline: "0.5rem",
    },

    // First/last caps for the horizontal rail (row direction).
    [`${sel("-horizontal")} > li:first-child ${sel("-middle")}::before`]: {
      visibility: "hidden",
    },
    [`${sel("-horizontal")} > li:last-child ${sel("-middle")}::after`]: {
      visibility: "hidden",
    },
  };
}
