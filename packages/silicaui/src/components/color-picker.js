/**
 * ColorPicker — an OKLCH-native color editor.
 *
 * SilicaUI's tokens are all OKLCH, so the picker edits L / C / H directly with
 * three sliders instead of translating through HSV. Each slider's track is
 * painted with a live `linear-gradient(... in oklch, …)` (set inline from the
 * React component), so what you drag across is the real color ramp. A big swatch
 * previews the result and a hex field reads/writes the same color.
 *
 * Colorless: the surface uses base tokens; the focus ring is `--color-primary`.
 * The thumb/track gradients are all data-driven (inline styles), so there's no
 * per-color variant to generate here.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function colorPicker(prefix = "") {
  const sel = (suffix = "") => `.${prefix}color-picker${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.85rem",
      width: "100%",
      maxWidth: "20rem",
      padding: "0.85rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
    },

    // Preview row: a large swatch beside the OKLCH / hex readout.
    [sel("-preview")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    [sel("-swatch")]: {
      flexShrink: "0",
      width: "3.25rem",
      height: "3.25rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      // A subtle inset ring so pale colors still read as a chip on light bg.
      boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--color-base-content) 15%, transparent)",
    },
    [sel("-values")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
      minWidth: "0",
      fontVariantNumeric: "tabular-nums",
    },
    [sel("-value-oklch")]: {
      fontSize: "0.8125rem",
      fontWeight: "600",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    [sel("-value-hex")]: {
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      color: "var(--color-base-content)",
    },

    // The stack of L / C / H sliders.
    [sel("-sliders")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
    },
    [sel("-slider")]: {
      display: "grid",
      gridTemplateColumns: "1.25rem 1fr 2.75rem",
      alignItems: "center",
      gap: "0.5rem",
    },
    [sel("-slider-label")]: {
      fontSize: "0.75rem",
      fontWeight: "700",
      color: "var(--color-base-content)",
    },
    [sel("-slider-value")]: {
      fontSize: "0.72rem",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      color: "var(--color-base-content)",
    },

    // The gradient track (background set inline per channel) + draggable thumb.
    [sel("-track")]: {
      position: "relative",
      height: "0.9rem",
      borderRadius: "9999px",
      cursor: "pointer",
      touchAction: "none",
      boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--color-base-content) 12%, transparent)",
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
    },
    [sel("-thumb")]: {
      position: "absolute",
      top: "50%",
      width: "1.05rem",
      height: "1.05rem",
      borderRadius: "9999px",
      transform: "translate(-50%, -50%)",
      backgroundColor: "var(--color-base-100)",
      boxShadow:
        "0 0 0 2px var(--color-base-100), 0 0 0 3px color-mix(in oklab, var(--color-base-content) 35%, transparent), 0 1px 3px rgba(0,0,0,0.3)",
      pointerEvents: "none",
    },

    // The hex text field.
    [sel("-hex")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    [sel("-hex-label")]: {
      fontSize: "0.75rem",
      fontWeight: "700",
      color: "var(--color-base-content)",
    },
    [sel("-hex-input")]: {
      flex: "1 1 auto",
      minWidth: "0",
      height: "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "0.6rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "inherit",
      font: "inherit",
      fontSize: "0.8125rem",
      textTransform: "uppercase",
      "&:focus": {
        outline: "0",
        borderColor: "var(--color-primary)",
        boxShadow: "0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent)",
      },
    },

    [`${sel()}[data-disabled]`]: {
      opacity: "0.6",
      pointerEvents: "none",
    },

    // Compact mode: a chip + hex label that opens the full panel in a popover
    // (the panel above supplies its own card chrome, so the popover wrapper is
    // stripped down to zero padding — see `-popover` below).
    [sel("-swatch-trigger")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.25rem",
      border: "var(--border, 1px) solid var(--color-base-300)",
      borderRadius: "var(--radius-field, 0.25rem)",
      backgroundColor: "var(--color-base-100)",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
      "&[data-disabled]": { opacity: "0.6", pointerEvents: "none", cursor: "default" },
    },
    [sel("-swatch-trigger-chip")]: {
      flexShrink: "0",
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--color-base-content) 15%, transparent)",
    },
    [sel("-swatch-trigger-label")]: {
      fontSize: "0.75rem",
      fontVariantNumeric: "tabular-nums",
      textTransform: "uppercase",
      color: "var(--color-base-content)",
    },
    [sel("-popover")]: {
      padding: "0",
      border: "none",
      backgroundColor: "transparent",
      boxShadow: "none",
    },
  };
}
