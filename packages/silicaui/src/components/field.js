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
  const status = (suffix = "") => `.${prefix}field-status${suffix}`;

  const base = {
    [sel()]: {
      "--field-gap": "0.375rem",
      display: "flex",
      flexDirection: "column",
      gap: "var(--field-gap)",
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

    // ---- FieldStatus (error/warning/success/loading, attached or detached) --
    // `data-status` lands on the control itself (FieldControl stamps it, mirroring
    // the `[data-invalid]` lever above) so a color class isn't needed per field.
    [`.${prefix}input[data-status="error"], .${prefix}select[data-status="error"], .${prefix}textarea[data-status="error"]`]:
      { "--input-accent": "var(--color-error)", "--select-accent": "var(--color-error)", "--textarea-accent": "var(--color-error)" },
    [`.${prefix}input[data-status="warning"], .${prefix}select[data-status="warning"], .${prefix}textarea[data-status="warning"]`]:
      { "--input-accent": "var(--color-warning)", "--select-accent": "var(--color-warning)", "--textarea-accent": "var(--color-warning)" },
    [`.${prefix}input[data-status="success"], .${prefix}select[data-status="success"], .${prefix}textarea[data-status="success"]`]:
      { "--input-accent": "var(--color-success)", "--select-accent": "var(--color-success)", "--textarea-accent": "var(--color-success)" },

    // A status panel that follows flattens the control's bottom corners so the
    // two read as one continuous shape (attached mode only).
    [`${sel()}:has(${status("-attached")}) .${prefix}input, ${sel()}:has(${status("-attached")}) .${prefix}select, ${sel()}:has(${status("-attached")}) .${prefix}textarea`]:
      { borderEndStartRadius: "0", borderEndEndRadius: "0" },

    [status()]: {
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      fontSize: "0.75rem",
      lineHeight: "1.4",
      color: "var(--field-status-color, var(--color-base-content))",
      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
    },

    [status("-attached")]: {
      marginBlockStart: "calc(var(--field-gap, 0.375rem) * -1)",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      paddingBlock: "0.5rem",
      borderBottomLeftRadius: "var(--radius-field, 0.25rem)",
      borderBottomRightRadius: "var(--radius-field, 0.25rem)",
      backgroundColor:
        "color-mix(in oklab, var(--field-status-color, var(--color-base-content)) 12%, var(--color-base-100))",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--field-status-color, var(--color-base-300))",
      borderTopWidth: "0",
    },
  };

  for (const [name, color] of [
    ["error", "var(--color-error)"],
    ["warning", "var(--color-warning)"],
    ["success", "var(--color-success)"],
  ]) {
    base[status(`-${name}`)] = { "--field-status-color": color };
  }

  return base;
}
