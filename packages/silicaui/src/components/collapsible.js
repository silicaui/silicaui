/**
 * The Collapsible component — a single show/hide disclosure (Base UI behavior).
 *
 * The low-level primitive behind `Accordion` (which groups several): one trigger
 * reveals one animated panel. Colorless and chrome-light so it drops into any
 * layout. Base UI exposes the natural panel height as `--collapsible-panel-height`,
 * which we animate; the panel starts/ends at height 0
 * (`[data-starting-style]`/`[data-ending-style]`). The trigger's chevron rotates
 * while the panel is open (`[data-panel-open]`). Padding lives on an inner
 * `.collapsible-content` so the height animation stays smooth.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function collapsible(prefix = "") {
  const sel = (suffix = "") => `.${prefix}collapsible${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      color: "var(--color-base-content)",
    },

    [sel("-trigger")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      width: "100%",
      padding: "0.5rem 0",
      border: "0",
      background: "none",
      font: "inherit",
      fontWeight: "600",
      textAlign: "start",
      color: "inherit",
      cursor: "pointer",

      "& svg": {
        width: "1.1rem",
        height: "1.1rem",
        flexShrink: "0",
        transition: "transform 0.2s ease",
      },
      "&[data-panel-open] svg": { transform: "rotate(180deg)" },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
        borderRadius: "var(--radius-field, 0.25rem)",
      },
      "&[data-disabled]": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // Compact icon-only trigger — a second, small disclosure control that
    // shares the Root's context with a `-trigger` elsewhere (e.g. a label
    // living in one flex slot, this chevron pinned in another — see Alert's
    // "collapsible detail" demo). Sized/painted like `.alert-close`/`.toast-close`
    // so it drops into the same trailing-icon-button slot.
    [sel("-trigger-icon")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: "1.5rem",
      height: "1.5rem",
      border: "0",
      borderRadius: "9999px",
      background: "transparent",
      color: "inherit",
      opacity: "0.7",
      cursor: "pointer",

      "& svg": {
        width: "1.1rem",
        height: "1.1rem",
        transition: "transform 0.2s ease",
      },
      "&[data-panel-open] svg": { transform: "rotate(180deg)" },
      "&:hover": {
        opacity: "1",
        backgroundColor: "color-mix(in oklab, currentColor 15%, transparent)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "1px",
      },
      "&[data-disabled]": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // Animated height container.
    [sel("-panel")]: {
      overflow: "hidden",
      height: "var(--collapsible-panel-height)",
      transition: "height 0.2s ease-out",

      "&[data-starting-style], &[data-ending-style]": { height: "0" },
    },

    // Padding wrapper (kept separate so the panel can animate to height 0).
    [sel("-content")]: {
      paddingTop: "0.5rem",
      fontSize: "0.9375rem",
      color: "var(--color-base-content)",
    },
  };
}
