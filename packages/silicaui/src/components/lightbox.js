/**
 * Lightbox — a full-viewport image viewer (Base UI Dialog: focus trap, scroll
 * lock, Escape-to-close). Chrome is deliberately theme-invariant (always a
 * near-black scrim + white controls, like a photo viewer or video player) so
 * it reads consistently regardless of the page's light/dark theme; only the
 * focus ring uses `--color-primary`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function lightbox(prefix = "") {
  const sel = (suffix = "") => `.${prefix}lightbox${suffix}`;

  const iconBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0",
    borderRadius: "9999px",
    backgroundColor: "rgb(255 255 255 / 0.08)",
    color: "rgb(255 255 255 / 0.85)",
    cursor: "pointer",
    transition: "background-color 0.15s ease, color 0.15s ease",
    "&:hover": {
      backgroundColor: "rgb(255 255 255 / 0.16)",
      color: "#fff",
    },
    "&:focus-visible": {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "2px",
    },
    "&:disabled": {
      opacity: "0.3",
      cursor: "default",
      "&:hover": { backgroundColor: "rgb(255 255 255 / 0.08)" },
    },
  };

  return {
    [sel("-backdrop")]: {
      position: "fixed",
      inset: "0",
      zIndex: "var(--z-lightbox, 60)",
      backgroundColor: "rgb(0 0 0 / 0.92)",
      transitionProperty: "opacity",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": { opacity: "0" },
    },

    [sel("-popup")]: {
      position: "fixed",
      inset: "0",
      zIndex: "calc(var(--z-lightbox, 60) + 1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      outline: "none",
    },

    [sel("-image")]: {
      maxWidth: "100%",
      maxHeight: "calc(100dvh - 8rem)",
      objectFit: "contain",
      borderRadius: "var(--radius-box, 0.5rem)",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "scale(0.97)",
      },
    },

    [sel("-caption")]: {
      marginTop: "1rem",
      maxWidth: "40rem",
      textAlign: "center",
      fontSize: "0.875rem",
      color: "rgb(255 255 255 / 0.85)",
    },

    [sel("-counter")]: {
      position: "absolute",
      top: "1.1rem",
      insetInlineStart: "1.25rem",
      fontSize: "0.8125rem",
      fontVariantNumeric: "tabular-nums",
      color: "rgb(255 255 255 / 0.7)",
    },

    [sel("-close")]: {
      ...iconBtn,
      position: "absolute",
      top: "0.75rem",
      insetInlineEnd: "0.75rem",
      width: "2.5rem",
      height: "2.5rem",
      "& svg": { width: "1.15rem", height: "1.15rem" },
    },

    [sel("-nav")]: {
      ...iconBtn,
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: "3rem",
      height: "3rem",
      "& svg": { width: "1.5rem", height: "1.5rem" },
    },
    [sel("-nav-prev")]: { insetInlineStart: "1rem" },
    [sel("-nav-next")]: { insetInlineEnd: "1rem" },
  };
}
