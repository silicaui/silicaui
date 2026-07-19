/**
 * The NavigationMenu component — a site-navigation bar whose items can open rich
 * dropdown panels (a "mega menu"). Behavior is Base UI's NavigationMenu (hover/
 * click to open, a single shared animated viewport that resizes between panels,
 * keyboard nav); Silica styles the bar, triggers, links, the floating popup, and
 * the clipping viewport.
 *
 * Colorless. Base UI moves the active item's `.navigation-menu-content` into the
 * shared `.navigation-menu-viewport` and exposes the target size as
 * `--popup-width` / `--popup-height`, which the popup animates toward — so
 * switching panels slides + resizes smoothly.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function navigationMenu(prefix = "") {
  const sel = (suffix = "") => `.${prefix}navigation-menu${suffix}`;

  // Shared look for the top-level bar controls (trigger button + plain link).
  const barItem = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    height: "calc(var(--size-field, 0.25rem) * 9)",
    paddingInline: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "var(--color-base-content)",
    backgroundColor: "transparent",
    border: "0",
    borderRadius: "var(--radius-field, 0.25rem)",
    textDecoration: "none",
    cursor: "pointer",
    transitionProperty: "background-color, color",
    transitionDuration: "var(--duration, 150ms)",
    transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    "&:hover": { backgroundColor: "var(--color-base-200)" },
    "&:focus-visible": {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "-2px",
    },
  };

  return {
    [sel()]: {
      position: "relative",
    },

    // The visible bar row.
    [sel("-list")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      margin: "0",
      padding: "0",
      listStyle: "none",
    },

    [sel("-trigger")]: {
      ...barItem,
      // Open state: seat the trigger and spin its chevron.
      "&[data-popup-open]": { backgroundColor: "var(--color-base-200)" },
      "& svg": {
        width: "1rem",
        height: "1rem",
        transitionProperty: "transform",
        transitionDuration: "var(--duration, 150ms)",
        transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
      "&[data-popup-open] svg": { transform: "rotate(180deg)" },
    },
    [sel("-link")]: barItem,
    // The chevron slot.
    [sel("-icon")]: {
      display: "inline-flex",
    },

    // ---- Floating popup -----------------------------------------------------
    [sel("-positioner")]: {
      zIndex: "var(--z-popover, 70)",
      // Base UI drives the box size from the active content; we animate it.
      boxSizing: "border-box",
    },
    [sel("-popup")]: {
      position: "relative",
      width: "var(--popup-width)",
      height: "var(--popup-height)",
      overflow: "hidden",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.22)",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform, width, height",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.96)",
      },
    },
    // Clips the current panel while the popup resizes around it.
    [sel("-viewport")]: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    },

    // A single item's panel (teleported into the viewport when active).
    [sel("-content")]: {
      width: "max-content",
      maxWidth: "min(38rem, calc(100vw - 2rem))",
      padding: "1rem",
    },
  };
}
