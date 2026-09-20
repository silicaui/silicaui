import { inkOfRole } from "../lib/ink.js";
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
      fontSize: "1rem",
      lineHeight: "1.4",
      color: "var(--color-base-content)",
      textDecoration: "none",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      transition: "color 0.15s ease, border-color 0.15s ease",
      "&:hover": { color: "var(--color-base-content)" },
      "&[data-active]": {
        color: inkOfRole("primary"),
        borderInlineStartColor: "var(--color-primary)",
        fontWeight: "600",
      },
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-link")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };
}
