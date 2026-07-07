/**
 * The Popover surface — the visual half of the Base-UI-backed Popover
 * (click-triggered floating panel). Base UI owns positioning/focus/dismissal;
 * this styles the `.popover` panel + optional arrow + title/description.
 *
 * Light base-100 surface (unlike the dark Tooltip). The arrow is OFF by default
 * (shadcn-style) — a bordered arrow on a light surface is fiddly to make
 * seamless, and most popovers read cleaner without one; opt in with `arrow`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function popover(prefix = "") {
  const sel = (suffix = "") => `.${prefix}popover${suffix}`;

  return {
    [sel()]: {
      zIndex: "50",
      minWidth: "12rem",
      maxWidth: "20rem",
      padding: "1rem",
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

    // A bordered diamond; its inner half tucks under the panel (which covers the
    // base), leaving a seamless bordered tip. Offset half-out per resolved side.
    [sel("-arrow")]: {
      width: "0.625rem",
      height: "0.625rem",
      "&::before": {
        content: '""',
        display: "block",
        width: "100%",
        height: "100%",
        backgroundColor: "var(--color-base-100)",
        borderWidth: "var(--border, 1px)",
        borderStyle: "solid",
        borderColor: "var(--color-base-300)",
        transform: "rotate(45deg)",
      },
    },
    [`${sel("-arrow")}[data-side="top"]`]: { bottom: "-0.3125rem" },
    [`${sel("-arrow")}[data-side="bottom"]`]: { top: "-0.3125rem" },
    [`${sel("-arrow")}[data-side="left"]`]: { right: "-0.3125rem" },
    [`${sel("-arrow")}[data-side="right"]`]: { left: "-0.3125rem" },

    [sel("-title")]: {
      margin: "0",
      fontSize: "0.9375rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },
    [sel("-description")]: {
      margin: "0.25rem 0 0",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      color: "color-mix(in oklab, var(--color-base-content) 70%, transparent)",
    },
  };
}
