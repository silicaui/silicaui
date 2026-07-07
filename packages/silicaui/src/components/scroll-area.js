/**
 * The ScrollArea component — a panel with custom, overlay scrollbars.
 *
 * Colorless. Behavior is Base UI's ScrollArea (native scrolling on the Viewport,
 * synced decorative Scrollbar/Thumb overlays); Silica paints the surface. Base
 * UI sizes the thumb inline from the scroll ratio, so we only style appearance
 * and the cross-axis fill. The scrollbars overlay the content (they don't take
 * layout width) and darken on hover.
 *
 * Structure: `.scroll-area` (root) › `.scroll-area-viewport` › `.scroll-area-content`,
 * plus a `.scroll-area-scrollbar` (per orientation) wrapping a `.scroll-area-thumb`,
 * and a `.scroll-area-corner`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function scrollArea(prefix = "") {
  const sel = (suffix = "") => `.${prefix}scroll-area${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-box, 0.5rem)",
    },

    // The real scroller. Base UI owns its overflow; we just fill the root and
    // hide the native scrollbar (the overlay Scrollbar replaces it).
    [sel("-viewport")]: {
      height: "100%",
      width: "100%",
      overscrollBehavior: "contain",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "-2px",
      },
    },
    [sel("-content")]: {
      // A plain wrapper; keep its own width so horizontal overflow is detectable.
      minWidth: "fit-content",
    },

    // The overlay track. Fades in on hover of the area or while scrolling.
    [sel("-scrollbar")]: {
      display: "flex",
      touchAction: "none",
      userSelect: "none",
      padding: "2px",
      boxSizing: "border-box",
      opacity: "0",
      transitionProperty: "opacity",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      '&[data-orientation="vertical"]': { width: "0.625rem" },
      '&[data-orientation="horizontal"]': {
        height: "0.625rem",
        flexDirection: "column",
      },
      "&[data-hovering], &[data-scrolling]": { opacity: "1" },
    },
    // Reveal on hover of the whole area too (belt-and-suspenders vs. data attrs).
    [`${sel()}:hover ${sel("-scrollbar")}`]: { opacity: "1" },

    // The draggable handle. Base UI sets its length inline; we paint it and fill
    // the cross axis.
    [sel("-thumb")]: {
      borderRadius: "9999px",
      backgroundColor:
        "color-mix(in oklab, var(--color-base-content) 25%, transparent)",
      transitionProperty: "background-color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--color-base-content) 40%, transparent)",
      },
    },
    [`${sel("-scrollbar")}[data-orientation="vertical"] ${sel("-thumb")}`]: {
      width: "100%",
    },
    [`${sel("-scrollbar")}[data-orientation="horizontal"] ${sel("-thumb")}`]: {
      height: "100%",
    },

    [sel("-corner")]: {
      backgroundColor: "transparent",
    },
  };
}
