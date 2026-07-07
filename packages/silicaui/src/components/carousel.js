/**
 * The Carousel component — a scroll-snapping strip WITH navigation.
 *
 * Colorless. The scroll surface (`.carousel`) uses CSS scroll-snap; the React
 * wrapper adds prev/next controls (`.carousel-control`) and clickable dot
 * indicators (`.carousel-dot`) that drive it, so it behaves like a real
 * carousel rather than a bare scrollable list. The scrollbar is hidden because
 * the controls provide navigation; touch/trackpad swipe still works.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function carousel(prefix = "") {
  const sel = (suffix = "") => `.${prefix}carousel${suffix}`;

  return {
    // Positioning context for the overlaid controls.
    [sel("-root")]: {
      position: "relative",
      width: "100%",
    },

    [sel()]: {
      display: "flex",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      scrollBehavior: "smooth",
      maxWidth: "100%",
      // Controls provide navigation, so hide the scrollbar chrome.
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
    },

    [sel("-item")]: {
      flexShrink: "0",
      scrollSnapAlign: "start",
    },

    // Snap alignment.
    [`${sel("-center")} ${sel("-item")}`]: { scrollSnapAlign: "center" },
    [`${sel("-end")} ${sel("-item")}`]: { scrollSnapAlign: "end" },

    // Vertical scroller.
    [sel("-vertical")]: {
      flexDirection: "column",
      overflowX: "hidden",
      overflowY: "auto",
      scrollSnapType: "y mandatory",
    },

    // ---- Controls (prev / next) -------------------------------------------
    [sel("-control")]: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: "2",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.25rem",
      height: "2.25rem",
      padding: "0",
      borderRadius: "9999px",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.25)",
      cursor: "pointer",
      transition: "background-color 0.15s, opacity 0.15s",

      "& svg": { width: "1.25rem", height: "1.25rem" },
      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:disabled": {
        opacity: "var(--disabled-opacity, 0.4)",
        cursor: "default",
        boxShadow: "none",
      },
    },
    [sel("-prev")]: { insetInlineStart: "0.5rem" },
    [sel("-next")]: { insetInlineEnd: "0.5rem" },

    // ---- Indicators (dots) ------------------------------------------------
    [sel("-indicators")]: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.4rem",
      marginTop: "0.75rem",
    },
    [sel("-dot")]: {
      width: "0.5rem",
      height: "0.5rem",
      padding: "0",
      border: "0",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-300)",
      cursor: "pointer",
      transition: "width 0.2s, background-color 0.2s",
    },
    [sel("-dot-active")]: {
      width: "1.5rem",
      backgroundColor: "var(--color-primary)",
    },

    // Numbered (paged) indicators.
    [sel("-number")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "1.75rem",
      height: "1.75rem",
      paddingInline: "0.4rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      fontSize: "0.8125rem",
      fontWeight: "600",
      lineHeight: "1",
      cursor: "pointer",
      transition: "background-color 0.15s, color 0.15s, border-color 0.15s",

      "&:hover": { backgroundColor: "var(--color-base-200)" },
    },
    [sel("-number-active")]: {
      backgroundColor: "var(--color-primary)",
      color: "var(--color-primary-content)",
      borderColor: "transparent",
    },
  };
}
