/**
 * The Menubar component — a horizontal bar of menus (File / Edit / View …), like
 * a desktop-app menu bar. Behavior is Base UI's Menubar + Menu (arrow between
 * menus, hover to switch once one is open, roving focus); Silica styles the bar
 * and its triggers. The menus themselves reuse the `.dropdown*` popup surface so
 * every menu in the system looks identical.
 *
 * Colorless.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function menubar(prefix = "") {
  const sel = (suffix = "") => `.${prefix}menubar${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.125rem",
      padding: "0.25rem",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      borderRadius: "var(--radius-field, 0.25rem)",

      '&[data-orientation="vertical"]': {
        flexDirection: "column",
        alignItems: "stretch",
      },
    },

    [sel("-trigger")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      paddingInline: "0.625rem",
      height: "calc(var(--size-field, 0.25rem) * 7)",
      fontSize: "0.8125rem",
      fontWeight: "500",
      color: "var(--color-base-content)",
      backgroundColor: "transparent",
      border: "0",
      borderRadius: "calc(var(--radius-field, 0.25rem) * 0.75)",
      cursor: "pointer",
      transitionProperty: "background-color, color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&[data-popup-open]": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "-2px",
      },
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
    },
  };
}
