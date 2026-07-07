/**
 * The RadioGroup layout — a stack of radio options managed as one control.
 *
 * Colorless. Just the layout + option row; the radios themselves are Silica
 * `.radio` inputs (native, so the browser gives arrow-key navigation within the
 * shared `name` for free). `.radio-option` is the clickable `<label>` pairing a
 * radio with its caption. `[data-orientation="horizontal"]` lays them in a row.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function radioGroup(prefix = "") {
  const sel = (suffix = "") => `.${prefix}radio-group${suffix}`;
  const option = `.${prefix}radio-option`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",

      '&[data-orientation="horizontal"]': {
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: "1.25rem",
      },
    },

    [option]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.875rem",
      lineHeight: "1.25",
      cursor: "pointer",

      "&:has(input:disabled)": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },
  };
}
