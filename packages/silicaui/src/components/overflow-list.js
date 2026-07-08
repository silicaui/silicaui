/**
 * OverflowList — a single-row list that measures available width and folds
 * whatever doesn't fit into a trailing "+N" indicator. The React layer does
 * the measuring (a hidden off-screen row renders every item once to read its
 * real width, ResizeObserver drives recompute); this only paints the visible
 * row, the hidden measurer, and the default "+N" badge + its popup.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function overflowList(prefix = "") {
  const sel = (suffix = "") => `.${prefix}overflow-list${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
      overflow: "hidden",
      minWidth: "0",
      width: "100%",
    },

    // Off-screen measuring row: every item rendered once, never painted.
    [sel("-measure")]: {
      position: "absolute",
      top: "0",
      left: "0",
      visibility: "hidden",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
      whiteSpace: "nowrap",
    },

    [sel("-badge")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      height: "calc(var(--size-field, 0.25rem) * 6)",
      paddingInline: "0.6rem",
      borderRadius: "9999px",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-200)",
      color: "var(--color-base-content)",
      fontSize: "0.75rem",
      fontWeight: "600",
      cursor: "pointer",
      "&:hover": { backgroundColor: "var(--color-base-300)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "1px",
      },
    },

    [sel("-popup")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      minWidth: "8rem",
      maxHeight: "16rem",
      overflowY: "auto",
    },
  };
}
