/**
 * The PreviewCard surface — a hover/focus-triggered rich preview (link
 * hovercard). Base UI's PreviewCard owns the open-on-hover behavior, focus, and
 * positioning; this styles the `.preview-card` panel and its optional arrow.
 *
 * Same light base-100 surface + scale-in animation as Popover, but roomier and
 * meant to hold freeform content (an avatar, heading, blurb, stats). Arrow is
 * OFF by default (cleaner without one on a light bordered surface); opt in with
 * the `arrow` prop.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function previewCard(prefix = "") {
  const sel = (suffix = "") => `.${prefix}preview-card${suffix}`;

  return {
    [sel()]: {
      zIndex: "50",
      width: "max-content",
      maxWidth: "min(20rem, calc(100vw - 2rem))",
      padding: "1rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.22)",
      outline: "none",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.96)",
      },
    },

    // Bordered diamond; the inner half tucks under the panel for a seamless tip.
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
  };
}
