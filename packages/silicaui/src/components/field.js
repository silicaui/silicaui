/**
 * The Field component — an accessible form field that wires a label, control,
 * description, and error together (ids + aria + validity). Behavior is Base UI's
 * Field (it tracks dirty/touched/valid/invalid and associates the parts);
 * Silica styles them. Use it around any Silica control.
 *
 * Colorless (semantic error). `.field-error` only renders when the field is
 * invalid (Base UI controls that). When the control is marked `[data-invalid]`
 * its accent flips to error, so the border + focus ring turn red to match.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function field(prefix = "") {
  const sel = (suffix = "") => `.${prefix}field${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
    },

    [sel("-label")]: {
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.25",
      color: "var(--color-base-content)",
    },

    [sel("-description")]: {
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
    },

    [sel("-error")]: {
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "var(--color-error)",
    },

    // When Base UI flags the control invalid, drive the shared input accent to
    // error so border + focus ring recolor (same lever the inputs already read).
    [`.${prefix}input[data-invalid], .${prefix}select[data-invalid], .${prefix}textarea[data-invalid]`]:
      {
        "--input-accent": "var(--color-error)",
        "--select-accent": "var(--color-error)",
        "--textarea-accent": "var(--color-error)",
      },
  };
}
