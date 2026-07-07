/**
 * The NumberField component — a stepper input (Base UI behavior).
 *
 * Colorless. A bordered group with a decrement button, a centered numeric
 * input, and an increment button. Base UI owns the value clamping, keyboard
 * stepping, and scrub interaction; we paint the group. The native spinner is
 * hidden (the buttons replace it).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function numberField(prefix = "") {
  const sel = (suffix = "") => `.${prefix}number-field${suffix}`;

  return {
    [sel()]: { display: "inline-flex" },

    [sel("-group")]: {
      display: "inline-flex",
      alignItems: "stretch",
      height: "calc(var(--size-field, 0.25rem) * 10)",
      borderRadius: "var(--radius-field, 0.25rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      overflow: "hidden",
      backgroundColor: "var(--color-base-100)",
    },

    [sel("-input")]: {
      width: "3.5rem",
      textAlign: "center",
      border: "0",
      background: "transparent",
      color: "var(--color-base-content)",
      font: "inherit",
      fontVariantNumeric: "tabular-nums",
      outline: "none",
      MozAppearance: "textfield",

      "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
        WebkitAppearance: "none",
        margin: "0",
      },
    },

    [sel("-button")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.25rem",
      flexShrink: "0",
      border: "0",
      background: "var(--color-base-200)",
      color: "var(--color-base-content)",
      cursor: "pointer",
      userSelect: "none",
      transition: "background-color 0.15s",

      "&:hover": { backgroundColor: "var(--color-base-300)" },
      "&:disabled": {
        opacity: "var(--disabled-opacity, 0.5)",
        cursor: "default",
      },
      "& svg": { width: "1rem", height: "1rem", display: "block" },
    },

    // Divider lines between buttons and input.
    [sel("-decrement")]: {
      borderInlineEnd: "1px solid var(--color-base-300)",
    },
    [sel("-increment")]: {
      borderInlineStart: "1px solid var(--color-base-300)",
    },
  };
}
