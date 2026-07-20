import { caretBackground, TEXT_CLEARANCE } from "../lib/field-affordance.js";

/**
 * The Select component — a native `<select>` restyled to the field tier.
 *
 * Shares Input's tier exactly (`--radius-field`, `--size-field`), so a Select
 * lines up pixel-for-pixel with same-size Inputs and Buttons. A color class
 * (`.select-primary`, …) sets `--select-accent`, coloring the border + focus
 * ring; the default shows a neutral border and a primary focus ring.
 *
 * The dropdown chevron comes from the shared field-affordance contract
 * (`lib/field-affordance.js`), so this caret is the same mark, ink, and trailing
 * inset as the listbox trigger's chevron and the Combobox open button. It's
 * drawn with `linear-gradient`s rather than an SVG because a native `<select>`
 * can carry neither a child nor a reliable pseudo-element, and an SVG data-URI
 * is a separate document that can't resolve a CSS var — gradients take a live
 * color, so the mark still follows the theme. `appearance: none` removes the
 * platform arrow.
 *
 * @param {string[]} colors - color names to generate `.select-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function select(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}select${suffix}`;

  const base = {
    [sel()]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 10)",

      display: "block",
      alignContent: "center",
      width: "100%",
      height: "var(--select-size)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 3)",
      // Room on the trailing edge so text never runs under the caret. Derived
      // from the affordance geometry, not guessed per size.
      paddingInlineEnd: TEXT_CLEARANCE,
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

      // The caret — shared geometry, so it lands where every other field's
      // chevron lands. Edge-anchored, so it holds across sizes.
      ...caretBackground(),

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

    // ---- Sizes (mirror Input) ----------------------------------------------
    // Only the leading pad scales. The caret is edge-anchored at a fixed size,
    // so the trailing clearance is the same at every size — set once on `.select`.
    [sel("-xs")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 6)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 2)",
      fontSize: "0.6875rem",
    },
    [sel("-sm")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 8)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 2.5)",
      fontSize: "0.75rem",
    },
    [sel("-md")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 10)",
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 12)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 4)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      "--select-size": "calc(var(--size-field, 0.25rem) * 14)",
      paddingInlineStart: "calc(var(--size-field, 0.25rem) * 4.5)",
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
