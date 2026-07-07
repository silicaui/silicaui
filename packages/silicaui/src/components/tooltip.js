/**
 * The Tooltip surface — the visual half of the Base-UI-backed Tooltip.
 *
 * Silica's split: Base UI owns the behavior (hover/focus intent, delay,
 * positioning, portal, dismissal) in the React layer; this file owns only how
 * the popup LOOKS. It's the first component to pair a CSS surface with a Base UI
 * primitive, so it sets the pattern: style `.tooltip` (the popup) + `.tooltip-arrow`,
 * and let the React wrapper attach these classes to `Tooltip.Popup`/`Tooltip.Arrow`.
 *
 * A classic dark chip (neutral surface). Enter/exit is driven by Base UI's
 * `[data-starting-style]`/`[data-ending-style]` attributes + the `--transform-origin`
 * it sets on the popup, so the scale animation grows from the anchored edge.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function tooltip(prefix = "") {
  const sel = (suffix = "") => `.${prefix}tooltip${suffix}`;

  return {
    // The popup surface.
    [sel()]: {
      zIndex: "50",
      maxWidth: "18rem",
      paddingInline: "0.625rem",
      paddingBlock: "0.375rem",
      fontSize: "0.8125rem",
      lineHeight: "1.4",
      borderRadius: "var(--radius-field, 0.25rem)",
      backgroundColor: "var(--color-neutral, #1f2937)",
      color: "var(--color-neutral-content, #ffffff)",
      boxShadow:
        "0 4px 12px -2px rgb(0 0 0 / 0.18), 0 2px 6px -2px rgb(0 0 0 / 0.12)",
      transformOrigin: "var(--transform-origin)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      // Enter-from / exit-to state (Base UI toggles these attributes).
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.95)",
      },
      // When Base UI groups tooltips it asks for an instant swap — honor it.
      "&[data-instant]": {
        transitionDuration: "0ms",
      },
    },

    // The arrow: a rotated square whose outer half pokes past the popup edge.
    // Base UI positions the element and tags it with the resolved `[data-side]`.
    [sel("-arrow")]: {
      width: "0.5rem",
      height: "0.5rem",
      "&::before": {
        content: '""',
        display: "block",
        width: "100%",
        height: "100%",
        backgroundColor: "var(--color-neutral, #1f2937)",
        transform: "rotate(45deg)",
        borderRadius: "1px",
      },
    },
    [`${sel("-arrow")}[data-side="top"]`]: { bottom: "-0.25rem" },
    [`${sel("-arrow")}[data-side="bottom"]`]: { top: "-0.25rem" },
    [`${sel("-arrow")}[data-side="left"]`]: { right: "-0.25rem" },
    [`${sel("-arrow")}[data-side="right"]`]: { left: "-0.25rem" },
  };
}
