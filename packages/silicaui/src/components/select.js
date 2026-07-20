/**
 * The Select component — a native `<select>` restyled to the field tier.
 *
 * Shares Input's tier exactly (`--radius-field`, `--size-field`), so a Select
 * lines up pixel-for-pixel with same-size Inputs and Buttons. A color class
 * (`.select-primary`, …) sets `--select-accent`, coloring the border + focus
 * ring; the default shows a neutral border and a primary focus ring.
 *
 * The dropdown chevron is drawn with two `linear-gradient`s (a "v" caret) in
 * `currentColor`, so it follows the text color and adapts to the theme — no SVG
 * data-URI (which can't read a CSS var) and no pseudo-element (unreliable on a
 * native `<select>`). `appearance: none` removes the platform arrow.
 *
 * @param {string[]} colors - color names to generate `.select-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function select(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}select${suffix}`;

  // Two triangles offset by one tile width meet to form a downward caret.
  const CARET = [
    "linear-gradient(45deg, transparent 50%, currentColor 50%)",
    "linear-gradient(135deg, currentColor 50%, transparent 50%)",
  ].join(", ");

  const base = {
    [sel()]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 10)",

      display: "block",
      alignContent: "center",
      width: "100%",
      height: "var(--select-size)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 3)",
      // Extra room on the trailing edge so text never runs under the caret.
      paddingInlineEnd: "calc(var(--size-field, 0.25rem) * 8)",
      fontSize: "0.875rem",
      lineHeight: "1",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor:
        "var(--select-border, var(--select-accent, var(--color-base-300)))",
      borderRadius: "var(--radius-field, 0.25rem)",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",

      // The caret. Positioned from the trailing edge, so it holds across sizes;
      // the two tiles sit one tile-width apart to close the "v".
      backgroundImage: CARET,
      backgroundSize: "0.36rem 0.36rem, 0.36rem 0.36rem",
      backgroundPosition:
        "calc(100% - 1.25rem) calc(50% + 1px), calc(100% - 0.89rem) calc(50% + 1px)",
      backgroundRepeat: "no-repeat, no-repeat",

      transitionProperty: "color, background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:focus, &:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--select-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
        borderColor: "var(--select-accent, var(--color-primary))",
      },
      "&:disabled, &[aria-disabled='true']": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // ---- Sizes (mirror Input, minus the caret which is edge-anchored) -------
    [sel("-xs")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 6)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 2)",
      paddingInlineEnd: "calc(var(--size-field, 0.25rem) * 7)",
      fontSize: "0.6875rem",
    },
    [sel("-sm")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 8)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 2.5)",
      paddingInlineEnd: "calc(var(--size-field, 0.25rem) * 7.5)",
      fontSize: "0.75rem",
    },
    [sel("-md")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 10)",
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 12)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 4)",
      paddingInlineEnd: "calc(var(--size-field, 0.25rem) * 9)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 14)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 4.5)",
      paddingInlineEnd: "calc(var(--size-field, 0.25rem) * 9.5)",
      fontSize: "1.125rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Each color sets the accent (focus ring + focused border) and a softened
  // resting border. Kept as separate levers so field.js's validation statuses,
  // which drive the accent alone, keep their solid border.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--select-accent": `var(--color-${name})`,
      "--select-border": `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`,
    };
  }

  return base;
}
