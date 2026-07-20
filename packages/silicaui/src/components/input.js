/**
 * The Input component — a single-line text field.
 *
 * Field-tier element: rounds with `--radius-field` and scales with the
 * `--size-field` density lever, so it lines up pixel-for-pixel with same-size
 * Buttons. A color class (`.input-primary`, `.input-error`, …) sets
 * `--input-accent` (focus ring + focused border) and `--input-border` (a
 * softened tint of the same color for the resting border); the default
 * (no color) shows a neutral border and a primary focus ring.
 *
 * @param {string[]} colors - color names to generate `.input-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function input(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}input${suffix}`;

  const base = {
    [sel()]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 10)",

      display: "block",
      alignContent: "center",
      width: "100%",
      height: "var(--input-size)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      fontSize: "0.875rem",
      lineHeight: "1",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor:
        "var(--input-border, var(--input-accent, var(--color-base-300)))",
      borderRadius: "var(--radius-field, 0.25rem)",
      appearance: "none",
      transitionProperty: "color, background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&::placeholder": {
        color: "var(--color-base-content)",
        opacity: "0.5",
      },
      "&:focus, &:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--input-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
        borderColor: "var(--input-accent, var(--color-primary))",
      },
      "&:disabled, &[aria-disabled='true']": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
      // Suppress the platform's own `type="search"` decorations (WebKit draws
      // a magnifier + cancel button we'd otherwise double up with SearchInput's
      // own icon + clear button).
      "&::-webkit-search-decoration, &::-webkit-search-cancel-button": {
        display: "none",
        appearance: "none",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 6)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 2)",
      fontSize: "0.6875rem",
    },
    [sel("-sm")]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 8)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 2.5)",
      fontSize: "0.75rem",
    },
    [sel("-md")]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 10)",
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 12)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      "--input-size": "calc(var(--size-field, 0.25rem) * 14)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4.5)",
      fontSize: "1.125rem",
    },

    // ---- Affix reservations -------------------------------------------------
    // Applied alongside a size class when the Input sits in an `.input-group`
    // with a leading/trailing icon or button (see input-group.js). Each sets
    // only its own logical side, so it layers over — rather than fights —
    // whichever size class's `paddingInline` shorthand is also applied.
    [sel("-affix-start")]: {
      paddingInlineStart: "2.25rem",
    },
    [sel("-affix-end")]: {
      paddingInlineEnd: "2.25rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Each color sets the accent (focus ring + focused border) and a softened
  // resting border, so rest → focus is a real state change rather than a no-op.
  //
  // `--input-border` is deliberately a SEPARATE lever from `--input-accent`:
  // field.js drives validation status (error/warning/success) through the
  // accent alone, so those keep the solid border they need — the soft tint is
  // opt-in and only decorative color classes set it.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--input-accent": `var(--color-${name})`,
      "--input-border": `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`,
    };
  }

  return base;
}
