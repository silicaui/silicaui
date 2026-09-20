import { hitArea } from "../lib/tap-target.js";
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
      // 1rem, not 0.4rem, and the reason is arithmetic rather than taste. The
      // dots are 8px and carry a 24px hit area (lib/tap-target.js), which grows
      // 8px on each side. At a 6.4px gap two neighbouring hit areas overlapped
      // by 9.6px and a tap near the edge activated the wrong slide. At 16px they
      // exactly meet and never cross.
      gap: "1rem",
      marginTop: "0.75rem",
    },
    [sel("-dot")]: {
      width: "0.5rem",
      height: "0.5rem",
      padding: "0",
      border: "0",
      borderRadius: "9999px",
      // An INK at reduced strength, not a surface token. `--color-base-300` is
      // the darkest surface in BOTH modes, so in dark an inactive dot was darker
      // than the page it sits on and measured 1.96:1 — invisible, on the control
      // that navigates the carousel. Mixing toward `--color-base-content`
      // reverses direction with the theme, the same reasoning `lib/ink.js` uses.
      //
      // 55% and not 45%, and the number is measured rather than chosen. This dot
      // is a CONTROL, so the bar is WCAG 1.4.11 Non-text Contrast — 3:1 against
      // what it sits on, not the 4.5:1 that applies to words. At 45% it was under
      // 3:1 in 57 of the 120 theme/mode/surface combinations the system ships,
      // worst 2.49:1. 53% is the lowest alpha that clears all 120; 55% is that
      // floor with a little margin, and measures 3.22:1 at its worst.
      // Nothing about the active/inactive distinction changes: the active dot is
      // `--color-primary` and three times as wide, so it carries hue AND size.
      // (docs/personas/issues/108)
      backgroundColor: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
      cursor: "pointer",
      transition: "width 0.2s, background-color 0.2s",
      ...hitArea(8, 8),
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
      fontSize: "1rem",
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

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and it is a shape the browser picks, not this system. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-control")}:focus-visible, ${sel("-dot")}:focus-visible, ${sel("-number")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };
}
