/**
 * The Dropdown Menu surface — the visual half of the Base-UI-backed Menu
 * (click-triggered command menu). Named `.dropdown*` to avoid colliding with the
 * static `.menu` nav-list component. Base UI owns positioning + roving focus +
 * dismissal; this styles the popup, items, separators, and labels.
 *
 * Items highlight via Base UI's `[data-highlighted]` (keyboard OR pointer, so it
 * unifies focus + hover) and dim via `[data-disabled]`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dropdown(prefix = "") {
  const sel = (suffix = "") => `.${prefix}dropdown${suffix}`;

  return {
    [sel()]: {
      zIndex: "var(--z-popover, 70)",
      minWidth: "12rem",
      padding: "0.375rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.22)",
      outline: "none",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.96)",
      },
    },

    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.4rem 0.6rem",
      fontSize: "0.875rem",
      lineHeight: "1.4",
      borderRadius: "var(--radius-field, 0.25rem)",
      color: "inherit",
      cursor: "default",
      userSelect: "none",
      outline: "none",
      // Leading/trailing icon slots (also used by menubar + context menus).
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
      // Base UI marks the active item (keyboard or pointer) with data-highlighted.
      "&[data-highlighted]": {
        backgroundColor: "var(--color-base-200)",
      },
      // A submenu trigger stays seated while its submenu is open.
      "&[data-popup-open]": {
        backgroundColor: "var(--color-base-200)",
      },
      "&[data-disabled]": {
        opacity: "0.5",
        pointerEvents: "none",
      },
    },

    // Pushes a submenu chevron (or shortcut hint) to the trailing edge.
    [sel("-item-arrow")]: {
      marginInlineStart: "auto",
      paddingInlineStart: "1rem",
    },

    [sel("-separator")]: {
      height: "var(--border, 1px)",
      margin: "0.375rem -0.375rem",
      backgroundColor: "var(--color-base-200)",
    },

    [sel("-label")]: {
      padding: "0.375rem 0.6rem",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      opacity: "0.55",
    },
  };
}
