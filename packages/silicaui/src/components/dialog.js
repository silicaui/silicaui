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
      zIndex: "50",
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
      zIndex: "51",
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
      color: "color-mix(in oklab, var(--color-base-content) 70%, transparent)",
    },
  };
}
