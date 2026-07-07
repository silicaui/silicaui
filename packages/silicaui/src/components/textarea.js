/**
 * The Textarea component — a multi-line text field, sibling to Input.
 *
 * Field-tier element: rounds with `--radius-field` and its horizontal rhythm
 * scales with `--size-field`, so it aligns with same-size Inputs. Unlike Input
 * it grows vertically (a `min-height` floor, then `resize: vertical`) and uses a
 * readable multi-line `line-height` rather than optical centering. A color class
 * (`.textarea-primary`, …) sets only `--textarea-accent` (border + focus ring).
 *
 * @param {string[]} colors - color names to generate `.textarea-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function textarea(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}textarea${suffix}`;

  const base = {
    [sel()]: {
      display: "block",
      width: "100%",
      // Roughly three rows tall by default; grows from there.
      minHeight: "calc(var(--size-field, 0.25rem) * 20)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 2)",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--textarea-accent, var(--color-base-300))",
      borderRadius: "var(--radius-field, 0.25rem)",
      appearance: "none",
      resize: "vertical",
      transitionProperty: "color, background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&::placeholder": {
        color: "var(--color-base-content)",
        opacity: "0.5",
      },
      "&:focus, &:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--textarea-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
        borderColor: "var(--textarea-accent, var(--color-primary))",
      },
      "&:disabled, &[aria-disabled='true']": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 16)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 2)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 1.5)",
      fontSize: "0.6875rem",
    },
    [sel("-sm")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 18)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 2.5)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 1.75)",
      fontSize: "0.75rem",
    },
    [sel("-md")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 20)",
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 24)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 2.5)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      minHeight: "calc(var(--size-field, 0.25rem) * 28)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4.5)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 3)",
      fontSize: "1.125rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--textarea-accent": `var(--color-${name})`,
    };
  }

  return base;
}
