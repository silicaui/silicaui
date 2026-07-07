/**
 * CommandPalette — the ⌘K launcher surface.
 *
 * Built on the same Base UI Dialog machinery as `.dialog` (portal, focus trap,
 * scroll lock, Escape-to-dismiss), but positioned near the top of the viewport
 * and shaped as a search box over a scrolling result list. The React
 * `<CommandPalette>` owns the filtering + arrow-key navigation; this styles the
 * backdrop, the panel, the search row, groups, items, and the active/empty
 * states.
 *
 * Colorless: the active item reads `--color-primary` for its tint/marker, same
 * orthogonal-accent approach as the rest of Silica.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function commandPalette(prefix = "") {
  const sel = (suffix = "") => `.${prefix}command-palette${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel("-backdrop")]: {
      position: "fixed",
      inset: "0",
      zIndex: "50",
      backgroundColor: "rgb(0 0 0 / 0.4)",
      backdropFilter: "blur(2px)",
      transitionProperty: "opacity",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": { opacity: "0" },
    },

    // Top-anchored panel (Dialog has no positioner — placed in CSS).
    [sel("-popup")]: {
      position: "fixed",
      top: "12vh",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "51",
      display: "flex",
      flexDirection: "column",
      width: "calc(100% - 2rem)",
      maxWidth: "40rem",
      maxHeight: "min(60vh, 32rem)",
      overflow: "hidden",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "0 24px 60px -12px rgb(0 0 0 / 0.4)",
      outline: "none",
      transitionProperty: "opacity, transform",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "translateX(-50%) translateY(-0.5rem) scale(0.98)",
      },
    },

    // Search row.
    [sel("-search")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      paddingInline: "1rem",
      flexShrink: "0",
      borderBottom: "var(--border, 1px) solid var(--color-base-200)",
    },
    [sel("-search-icon")]: {
      display: "inline-flex",
      color: muted(50),
      "& svg": { width: "1.15rem", height: "1.15rem", flexShrink: "0" },
    },
    [sel("-input")]: {
      flex: "1 1 auto",
      minWidth: "0",
      height: "3.25rem",
      border: "0",
      outline: "0",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      fontSize: "1rem",
      "&::placeholder": { color: muted(45) },
    },

    // Scrolling results.
    [sel("-list")]: {
      flex: "1 1 auto",
      overflowY: "auto",
      padding: "0.4rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.1rem",
    },
    [sel("-group")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.1rem",
    },
    [sel("-group-label")]: {
      padding: "0.5rem 0.6rem 0.25rem",
      fontSize: "0.7rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: muted(50),
    },

    // An item row.
    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      padding: "0.55rem 0.6rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      cursor: "pointer",
      userSelect: "none",
      color: "inherit",
      scrollMargin: "0.4rem",
      "&[data-active]": {
        backgroundColor: "color-mix(in oklab, var(--color-primary) 14%, transparent)",
        color: "var(--color-primary)",
      },
      "&[data-disabled]": {
        opacity: "0.45",
        cursor: "not-allowed",
      },
    },
    [sel("-item-icon")]: {
      display: "inline-flex",
      flexShrink: "0",
      color: "currentColor",
      "& svg": { width: "1.1rem", height: "1.1rem", flexShrink: "0" },
    },
    [sel("-item-body")]: {
      display: "flex",
      flexDirection: "column",
      minWidth: "0",
      flex: "1 1 auto",
    },
    [sel("-item-label")]: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.9rem",
    },
    [sel("-item-desc")]: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.78rem",
      color: muted(60),
    },
    [`${sel("-item")}[data-active] ${sel("-item-desc")}`]: {
      color: "color-mix(in oklab, var(--color-primary) 70%, transparent)",
    },
    [sel("-item-shortcut")]: {
      flexShrink: "0",
      display: "inline-flex",
      gap: "0.2rem",
      fontSize: "0.72rem",
      color: muted(55),
    },

    // No matches.
    [sel("-empty")]: {
      padding: "2.5rem 1rem",
      textAlign: "center",
      fontSize: "0.9rem",
      color: muted(55),
    },
  };
}
