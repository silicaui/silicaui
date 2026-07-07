/**
 * The CheckboxGroup layout — a stack of checkbox options managed as one array
 * value (with optional parent "select all" that goes indeterminate).
 *
 * Colorless. Layout + option row only; the checkboxes are Silica `.checkbox`
 * inputs. `.checkbox-option` is the clickable `<label>` pairing a checkbox with
 * its caption. `[data-orientation="horizontal"]` lays them in a row.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function checkboxGroup(prefix = "") {
  const sel = (suffix = "") => `.${prefix}checkbox-group${suffix}`;
  const option = `.${prefix}checkbox-option`;

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
