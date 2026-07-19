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
      zIndex: "var(--z-drawer, 40)",
      backgroundColor: "color-mix(in oklab, black 45%, transparent)",
      transition: "opacity 0.3s ease",

      "&[data-starting-style], &[data-ending-style]": { opacity: "0" },
    },

    [sel("-popup")]: {
      position: "fixed",
      zIndex: "var(--z-drawer, 40)",
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

    // Header/Footer are placeable docking bars — put one anywhere inside
    // DrawerContent. The popup already spaces children with `gap`, so these
    // only need to bleed to the edges (and only when they land there).
    [sel("-header")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      marginInline: "-1.5rem",
      paddingInline: "1.5rem",
      paddingBlockEnd: "1rem",
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
      paddingInline: "1.5rem",
      paddingBlockStart: "1rem",
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
