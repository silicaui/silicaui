/**
 * The Accordion component — collapsible sections (Base UI behavior).
 *
 * Colorless. Base UI drives open/close state and exposes the natural panel
 * height as `--accordion-panel-height`, which we animate; the panel starts and
 * ends at height 0 (`[data-starting-style]`/`[data-ending-style]`). The trigger
 * chevron rotates while its panel is open (`[data-panel-open]`). Padding lives
 * on an inner `.accordion-content` so the height animation stays smooth.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function accordion(prefix = "") {
  const sel = (suffix = "") => `.${prefix}accordion${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "1px solid var(--color-base-300)",
      overflow: "hidden",
      color: "var(--color-base-content)",
    },

    [sel("-item")]: {
      borderBottom: "1px solid var(--color-base-300)",
      "&:last-child": { borderBottom: "0" },
    },

    // Base UI wraps the trigger in a heading element — strip its default margin.
    [sel("-header")]: { margin: "0" },

    [sel("-trigger")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      width: "100%",
      paddingBlock: "0.875rem",
      paddingInline: "1.125rem",
      border: "0",
      background: "none",
      font: "inherit",
      fontWeight: "600",
      textAlign: "start",
      color: "inherit",
      cursor: "pointer",
      transition: "background-color 0.15s",

      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "-2px",
      },

      // Chevron.
      "& svg": {
        width: "1.1rem",
        height: "1.1rem",
        flexShrink: "0",
        transition: "transform 0.2s ease",
      },
      "&[data-panel-open] svg": { transform: "rotate(180deg)" },
    },

    // Animated height container.
    [sel("-panel")]: {
      overflow: "hidden",
      height: "var(--accordion-panel-height)",
      transition: "height 0.2s ease-out",

      "&[data-starting-style], &[data-ending-style]": { height: "0" },
    },

    // Padding wrapper (kept separate so the panel can animate to height 0).
    [sel("-content")]: {
      paddingInline: "1.125rem",
      paddingBottom: "1rem",
      fontSize: "0.9375rem",
      color: "color-mix(in oklab, var(--color-base-content) 80%, transparent)",
    },
  };
}
