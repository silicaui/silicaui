/**
 * The FileInput component — a styled `<input type="file">`.
 *
 * Colorless. Styles the native control and its `::file-selector-button` so the
 * "Choose file" button reads as a Silica button while the filename sits beside
 * it. Fully native — no JS needed.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function fileInput(prefix = "") {
  const sel = (suffix = "") => `.${prefix}file-input${suffix}`;

  return {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      height: "calc(var(--size-field, 0.25rem) * 10)",
      maxWidth: "100%",
      paddingInlineEnd: "0.75rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      fontSize: "0.875rem",
      cursor: "pointer",
      overflow: "hidden",

      "&::file-selector-button": {
        height: "100%",
        marginInlineEnd: "0.75rem",
        paddingInline: "1rem",
        border: "0",
        borderInlineEnd: "1px solid var(--color-base-300)",
        backgroundColor: "var(--color-base-200)",
        color: "var(--color-base-content)",
        fontWeight: "600",
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "background-color 0.15s",
      },
      "&::file-selector-button:hover": {
        backgroundColor: "var(--color-base-300)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
      "&:disabled": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "default",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { height: "calc(var(--size-field, 0.25rem) * 6)", fontSize: "0.6875rem" },
    [sel("-sm")]: { height: "calc(var(--size-field, 0.25rem) * 8)", fontSize: "0.8125rem" },
    [sel("-md")]: { height: "calc(var(--size-field, 0.25rem) * 10)", fontSize: "0.875rem" },
    [sel("-lg")]: { height: "calc(var(--size-field, 0.25rem) * 12)", fontSize: "1rem" },
    [sel("-xl")]: { height: "calc(var(--size-field, 0.25rem) * 14)", fontSize: "1.125rem" },
  };
}
