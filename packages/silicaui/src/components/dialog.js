/**
 * The Dialog surface — the visual half of the Base-UI-backed Dialog (and
 * AlertDialog). Base UI owns the modal machinery (portal, focus trap, scroll
 * lock, dismissal); this styles the backdrop + centered popup + title/description.
 *
 * The popup is fixed-centered in CSS (Dialog has no positioner). Enter/exit
 * rides Base UI's `[data-starting-style]`/`[data-ending-style]` — note the
 * transform keeps the `translate(-50%, -50%)` centering AND adds the scale, so
 * both must be restated in the animated state.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dialog(prefix = "") {
  const sel = (suffix = "") => `.${prefix}dialog${suffix}`;

  return {
    [sel("-backdrop")]: {
      position: "fixed",
      inset: "0",
      zIndex: "var(--z-dialog, 50)",
      backgroundColor: "rgb(0 0 0 / 0.4)",
      transitionProperty: "opacity",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": { opacity: "0" },
    },

    [sel("-popup")]: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "calc(var(--z-dialog, 50) + 1)",
      width: "calc(100% - 2rem)",
      maxWidth: "28rem",
      maxHeight: "calc(100dvh - 2rem)",
      overflowY: "auto",
      padding: "1.5rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "0 20px 50px -12px rgb(0 0 0 / 0.35)",
      outline: "none",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "translate(-50%, -50%) scale(0.96)",
      },
    },

    [sel("-title")]: {
      margin: "0",
      fontSize: "1.125rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },
    [sel("-description")]: {
      margin: "0.375rem 0 0",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      color: "var(--color-base-content)",
    },

    // Header/Footer are placeable docking bars, not position-locked — put one
    // anywhere inside DialogContent. They bleed to the popup's edges via a
    // negative margin that only applies when they land at that edge
    // (`:first-child`/`:last-child`); the popup's own `overflow` clips the
    // bleed to its rounded corners, so no explicit radius match is needed.
    [sel("-header")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      marginInline: "-1.5rem",
      marginBlockEnd: "1rem",
      padding: "0 1.5rem 1rem",
      borderBottom:
        "1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent)",
      "&:first-child": { marginBlockStart: "-1.5rem", paddingBlockStart: "1.5rem" },
    },
    [sel("-header-sticky")]: {
      position: "sticky",
      top: "0",
      zIndex: "1",
      backgroundColor: "var(--color-base-100)",
    },

    [sel("-footer")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "0.5rem",
      marginInline: "-1.5rem",
      marginBlockStart: "1rem",
      padding: "1rem 1.5rem 0",
      borderTop:
        "1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent)",
      "&:last-child": { marginBlockEnd: "-1.5rem", paddingBlockEnd: "1.5rem" },
      "@media (max-width: 26rem)": {
        flexDirection: "column-reverse",
        alignItems: "stretch",
      },
    },
    [sel("-footer-sticky")]: {
      position: "sticky",
      bottom: "0",
      zIndex: "1",
      backgroundColor: "var(--color-base-100)",
    },
  };
}
