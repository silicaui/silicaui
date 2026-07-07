import { contentVar } from "../lib/auto-content.js";

/**
 * The Sidebar component — a persistent layout nav panel, distinct from `Drawer`
 * (which overlays content and is meant to be dismissed). A Sidebar never
 * overlays: it collapses IN PLACE to a narrow icon rail via `[data-collapsed]`,
 * driven by `--sidebar-w`/`--sidebar-w-collapsed`.
 *
 * Same orthogonal-accent design as `dock.js`: a color class only sets
 * `--sidebar-accent` (the active-item tint); everything else reads it with a
 * fallback to `--color-primary`.
 *
 * `.sidebar-header-brand` is an optional wrapper for a logo/`Wordmark` inside
 * `.sidebar-header` — it auto-hides when collapsed so only the trigger remains.
 *
 * @param {string[]} colors - color names to generate `.sidebar-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function sidebar(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}sidebar${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  const base = {
    [sel()]: {
      "--sidebar-w": "16rem",
      "--sidebar-w-collapsed": "4.5rem",

      display: "flex",
      flexDirection: "column",
      flexShrink: "0",
      width: "var(--sidebar-w)",
      height: "100%",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderInlineEnd: "1px solid var(--color-base-200)",
      overflow: "hidden",
      transitionProperty: "width",
      transitionDuration: "var(--duration, 200ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },
    [`${sel()}[data-side="right"]`]: {
      borderInlineEnd: "0",
      borderInlineStart: "1px solid var(--color-base-200)",
    },
    [`${sel()}[data-collapsed]`]: {
      width: "var(--sidebar-w-collapsed)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      [sel()]: { transitionDuration: "0ms" },
    },

    // ---- Structural regions --------------------------------------------------
    [sel("-header")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      flexShrink: "0",
      minHeight: "3.5rem",
      paddingInline: "0.75rem",
      borderBottom: "1px solid var(--color-base-200)",
    },
    [`${sel()}[data-collapsed] ${sel("-header")}`]: { justifyContent: "center" },

    [sel("-header-brand")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      flex: "1 1 auto",
      minWidth: "0",
      overflow: "hidden",
    },
    [`${sel()}[data-collapsed] ${sel("-header-brand")}`]: { display: "none" },

    [sel("-content")]: {
      flex: "1 1 auto",
      overflowY: "auto",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      padding: "0.75rem",
    },
    [sel("-footer")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
      flexShrink: "0",
      padding: "0.75rem",
      borderTop: "1px solid var(--color-base-200)",
    },

    // ---- Groups ---------------------------------------------------------------
    [sel("-group")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.125rem",
    },
    [sel("-group-label")]: {
      paddingInline: "0.625rem",
      paddingBlockEnd: "0.375rem",
      fontSize: "0.6875rem",
      fontWeight: "700",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: muted(55),
      whiteSpace: "nowrap",
    },
    [`${sel()}[data-collapsed] ${sel("-group-label")}`]: { display: "none" },

    // ---- Nav items --------------------------------------------------------
    [sel("-item")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      width: "100%",
      paddingBlock: "0.5rem",
      paddingInline: "0.625rem",
      border: "0",
      borderRadius: "var(--radius-field, 0.25rem)",
      background: "none",
      textAlign: "left",
      textDecoration: "none",
      whiteSpace: "nowrap",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "inherit",
      cursor: "pointer",
      transition: "background-color 0.15s, color 0.15s",
      "&:hover": { backgroundColor: muted(6) },
    },
    [`${sel("-item")}[data-active="true"]`]: {
      backgroundColor:
        "color-mix(in oklab, var(--sidebar-accent, var(--color-primary)) 14%, transparent)",
      color: "var(--sidebar-accent, var(--color-primary))",
    },
    [`${sel("-item")}[data-disabled="true"]`]: {
      opacity: "0.45",
      cursor: "not-allowed",
      pointerEvents: "none",
    },
    [`${sel("-item")}:focus-visible`]: {
      outline: "2px solid var(--color-primary)",
      outlineOffset: "-2px",
    },
    [`${sel()}[data-collapsed] ${sel("-item")}`]: { justifyContent: "center" },

    [sel("-item-icon")]: {
      display: "inline-flex",
      flexShrink: "0",
      "& svg": { width: "1.15rem", height: "1.15rem", flexShrink: "0" },
    },
    [sel("-item-label")]: {
      flex: "1 1 auto",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    [`${sel()}[data-collapsed] ${sel("-item-label")}`]: { display: "none" },
    [sel("-item-trailing")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
    },
    [`${sel()}[data-collapsed] ${sel("-item-trailing")}`]: { display: "none" },

    // ---- Collapse trigger ---------------------------------------------------
    [sel("-trigger")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: "2rem",
      height: "2rem",
      border: "0",
      borderRadius: "var(--radius-field, 0.25rem)",
      background: "none",
      color: muted(65),
      cursor: "pointer",
      transition: "background-color 0.15s, color 0.15s",
      "&:hover": { backgroundColor: muted(8), color: "var(--color-base-content)" },
      "& svg": { width: "1.1rem", height: "1.1rem", flexShrink: "0" },
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--sidebar-accent": `var(--color-${name})`,
      "--sidebar-accent-content": contentVar(name),
    };
  }

  return base;
}
