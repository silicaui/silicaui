/**
 * The Breadcrumb component — a navigation trail.
 *
 * Colorless. Styles a `<nav class="breadcrumb">` wrapping an ordered list:
 * items lay out in a wrapping flex row and a CSS chevron is drawn via
 * `li:not(:first-child)::before` (top+right borders rotated 45°, in
 * `currentColor`, `em`-scaled) — no separator markup needed. Links read muted
 * and brighten on hover; the current page (`[aria-current="page"]`) sits at
 * full strength.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function breadcrumb(prefix = "") {
  const sel = (suffix = "") => `.${prefix}breadcrumb${suffix}`;

  return {
    [sel()]: {
      fontSize: "0.875rem",
      color: "var(--color-base-content)",

      "& ol, & ul": {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        margin: "0",
        padding: "0",
        listStyle: "none",
      },
      "& li": {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
      },
      // Chevron between items (not before the first).
      "& li:not(:first-child)::before": {
        content: '""',
        width: "0.4em",
        height: "0.4em",
        borderTop: "1.5px solid currentColor",
        borderRight: "1.5px solid currentColor",
        transform: "rotate(45deg)",
        opacity: "0.35",
      },
      "& a": {
        color: "inherit",
        textDecoration: "none",
        opacity: "0.7",
        transitionProperty: "opacity",
        transitionDuration: "var(--duration, 150ms)",
        transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
      "& a:hover": {
        opacity: "1",
        textDecoration: "underline",
      },
      "& [aria-current='page']": {
        opacity: "1",
        fontWeight: "500",
      },
    },
  };
}
