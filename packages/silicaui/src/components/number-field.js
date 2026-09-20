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

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-button")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "-2px",
    },
    [`${sel()}:has(${sel("-input")}:focus-visible)`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };
}
