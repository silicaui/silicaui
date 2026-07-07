/**
 * The Menu component — a styled vertical list of links/actions (sidebars, and
 * later the contents of a dropdown/popover).
 *
 * Colorless surface. Items are the `<a>`/`<button>` inside each `<li>`: padded,
 * field-rounded, hover-washed with base-200. The active item
 * (`.menu-active` or `[aria-current="page"]`) gets a soft primary tint. A
 * `.menu-title` is a muted section label. Behavior (open/close of an enclosing
 * popover) is NOT here — that arrives with the Base UI layer; this is the list.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function menu(prefix = "") {
  const sel = (suffix = "") => `.${prefix}menu${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.125rem",
      margin: "0",
      padding: "0.5rem",
      listStyle: "none",
      fontSize: "0.875rem",

      "& li": { display: "flex" },

      // The interactive row inside each item.
      "& li > a, & li > button": {
        flex: "1",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-field, 0.25rem)",
        font: "inherit",
        textAlign: "left",
        color: "inherit",
        textDecoration: "none",
        background: "transparent",
        border: "0",
        cursor: "pointer",
        transitionProperty: "background-color, color",
        transitionDuration: "var(--duration, 150ms)",
        transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
      "& li > a:hover, & li > button:hover": {
        backgroundColor: "var(--color-base-200)",
      },
      "& li > a:focus-visible, & li > button:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "-2px",
      },
      // Active item: soft primary tint (oklab, per the color-mix rule).
      "& .menu-active, & [aria-current='page']": {
        backgroundColor:
          "color-mix(in oklab, var(--color-primary) 15%, transparent)",
        color: "var(--color-primary)",
        fontWeight: "500",
      },
    },

    // Muted section label.
    [sel("-title")]: {
      padding: "0.5rem 0.75rem",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      opacity: "0.55",
    },
  };
}
