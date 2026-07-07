/**
 * The Drawer component — a panel that slides in from an edge (Base UI Dialog).
 *
 * Colorless. Reuses Base UI's Dialog behavior (focus trap, scroll lock, escape)
 * but pins the popup to an edge and slides it in with a transform. `data-side`
 * chooses the edge; the enter/exit transforms are driven by
 * `[data-starting-style]` / `[data-ending-style]`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function drawer(prefix = "") {
  const sel = (suffix = "") => `.${prefix}drawer${suffix}`;

  return {
    [sel("-backdrop")]: {
      position: "fixed",
      inset: "0",
      zIndex: "50",
      backgroundColor: "color-mix(in oklab, black 45%, transparent)",
      transition: "opacity 0.3s ease",

      "&[data-starting-style], &[data-ending-style]": { opacity: "0" },
    },

    [sel("-popup")]: {
      position: "fixed",
      zIndex: "50",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "0 0 40px -8px rgba(0, 0, 0, 0.4)",
      padding: "1.5rem",
      overflowY: "auto",
      transition: "transform 0.3s ease",

      // Left (default) & right occupy full height; top & bottom full width.
      '&[data-side="left"], &[data-side="right"]': {
        insetBlock: "0",
        width: "20rem",
        maxWidth: "85vw",
      },
      '&[data-side="left"]': { insetInlineStart: "0" },
      '&[data-side="right"]': { insetInlineEnd: "0" },
      '&[data-side="top"], &[data-side="bottom"]': {
        insetInline: "0",
        height: "16rem",
        maxHeight: "85vh",
      },
      '&[data-side="top"]': { insetBlockStart: "0" },
      '&[data-side="bottom"]': { insetBlockEnd: "0" },

      // Slide-in transforms per side.
      '&[data-side="left"][data-starting-style], &[data-side="left"][data-ending-style]':
        { transform: "translateX(-100%)" },
      '&[data-side="right"][data-starting-style], &[data-side="right"][data-ending-style]':
        { transform: "translateX(100%)" },
      '&[data-side="top"][data-starting-style], &[data-side="top"][data-ending-style]':
        { transform: "translateY(-100%)" },
      '&[data-side="bottom"][data-starting-style], &[data-side="bottom"][data-ending-style]':
        { transform: "translateY(100%)" },
    },

    [sel("-title")]: {
      fontSize: "1.125rem",
      fontWeight: "600",
    },
    [sel("-description")]: {
      fontSize: "0.9375rem",
      color: "color-mix(in oklab, var(--color-base-content) 75%, transparent)",
    },
  };
}
