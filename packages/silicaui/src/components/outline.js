/**
 * Outline — a scroll-spy table of contents. A vertical rail (`.outline-list`'s
 * border) with one link per heading; the link nearest the active reading
 * position gets a solid accent rail segment + accent text (`[data-active]`,
 * set by the React layer's scroll tracking — this module is pure paint).
 *
 * Colorless: the active state reads `--color-primary`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function outline(prefix = "") {
  const sel = (suffix = "") => `.${prefix}outline${suffix}`;

  return {
    [sel()]: {
      position: "relative",
    },

    [sel("-list")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
      margin: "0",
      padding: "0",
      listStyle: "none",
      borderInlineStart: "1px solid var(--color-base-300)",
    },

    [sel("-link")]: {
      display: "block",
      paddingBlock: "0.3rem",
      paddingInlineStart: "0.85rem",
      marginInlineStart: "-1px",
      borderInlineStart: "1px solid transparent",
      fontSize: "0.8125rem",
      lineHeight: "1.4",
      color: "color-mix(in oklab, var(--color-base-content) 60%, transparent)",
      textDecoration: "none",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      transition: "color 0.15s ease, border-color 0.15s ease",
      "&:hover": { color: "var(--color-base-content)" },
      "&[data-active]": {
        color: "var(--color-primary)",
        borderInlineStartColor: "var(--color-primary)",
        fontWeight: "600",
      },
    },
  };
}
