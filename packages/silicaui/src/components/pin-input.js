/**
 * The PinInput component — a row of single-character field-tier cells for
 * OTP / verification-code entry. Each cell shares Input's field tier
 * (`--radius-field`, `--size-field`) so it lines up with same-size Inputs; a
 * color class (`.pin-input-cell-primary`, …) sets only `--pin-input-accent`,
 * matching Input/Select's orthogonal-color convention.
 *
 * @param {string[]} colors - color names to generate `.pin-input-cell-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function pinInput(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}pin-input${suffix}`;
  const cell = (suffix = "") => `.${prefix}pin-input-cell${suffix}`;

  const base = {
    [sel()]: {
      display: "inline-flex",
      gap: "0.5rem",
    },

    [cell()]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 10)",

      display: "block",
      width: "calc(var(--pin-input-size) * 0.8)",
      height: "var(--pin-input-size)",
      padding: "0",
      textAlign: "center",
      fontSize: "1.125rem",
      fontVariantNumeric: "tabular-nums",
      lineHeight: "1",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--pin-input-accent, var(--color-base-300))",
      borderRadius: "var(--radius-field, 0.25rem)",
      appearance: "none",
      transitionProperty: "color, background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&::placeholder": {
        color: "var(--color-base-content)",
        opacity: "0.35",
      },
      "&:focus, &:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--pin-input-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
        borderColor: "var(--pin-input-accent, var(--color-primary))",
      },
      "&:disabled, &[aria-disabled='true']": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
      "&[data-filled='true']": {
        borderColor: "var(--pin-input-accent, var(--color-base-content))",
      },
    },

    // ---- Sizes (mirror Input) ----------------------------------------------
    [cell("-xs")]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 6)",
      fontSize: "0.8125rem",
    },
    [cell("-sm")]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 8)",
      fontSize: "0.9375rem",
    },
    [cell("-md")]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 10)",
      fontSize: "1.125rem",
    },
    [cell("-lg")]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 12)",
      fontSize: "1.25rem",
    },
    [cell("-xl")]: {
      "--pin-input-size": "calc(var(--size-field, 0.25rem) * 14)",
      fontSize: "1.5rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[cell(`-${name}`)] = {
      "--pin-input-accent": `var(--color-${name})`,
    };
  }

  return base;
}
