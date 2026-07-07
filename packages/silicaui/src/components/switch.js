/**
 * The Switch component — an accessible on/off toggle (Base UI behavior).
 *
 * Where `Toggle` is a restyled native `<input type="checkbox">`, `Switch` is the
 * Base UI switch: a `role="switch"` control (with a hidden real input beside it,
 * so it submits in a form and integrates with `Field`). Selector-tier: height
 * scales with `--size-selector`; the track is a pill 1.75× as wide as it is tall.
 *
 * Style: the track fills with the accent when checked (`[data-checked]`) and the
 * knob (`.switch-thumb`) glides from left to right via `translate`. A color class
 * (`.switch-primary`) sets `--switch-accent`. The knob position keys off the
 * ROOT's state (descendant selector), so it's robust regardless of which parts
 * Base UI stamps `[data-checked]` onto.
 *
 * @param {string[]} colors - color names to generate `.switch-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function switchControl(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}switch${suffix}`;
  const accent = "var(--switch-accent, var(--color-primary))";
  const off =
    "color-mix(in oklab, var(--color-base-content) 25%, var(--color-base-100))";

  const base = {
    [sel()]: {
      "--switch-size": "calc(var(--size-selector, 0.25rem) * 6)",

      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      flexShrink: "0",
      height: "var(--switch-size)",
      width: "calc(var(--switch-size) * 1.75)",
      padding: "2px",
      borderRadius: "9999px",
      backgroundColor: off,
      cursor: "pointer",
      transitionProperty: "background-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:focus-visible": {
        outline: `var(--focus-width, 2px) solid ${accent}`,
        outlineOffset: "var(--focus-offset, 2px)",
      },
      "&[data-checked]": { backgroundColor: accent },
      "&[data-disabled]": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // The knob — slides across on check.
    [sel("-thumb")]: {
      display: "block",
      width: "calc(var(--switch-size) - 4px)",
      height: "calc(var(--switch-size) - 4px)",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-100)",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
      transitionProperty: "translate",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },
    [`${sel()}[data-checked] ${sel("-thumb")}`]: {
      translate: "calc(var(--switch-size) * 0.75)",
    },

    // ---- Sizes (drive the height; width follows at 1.75×) ------------------
    [sel("-xs")]: { "--switch-size": "calc(var(--size-selector, 0.25rem) * 4)" },
    [sel("-sm")]: { "--switch-size": "calc(var(--size-selector, 0.25rem) * 5)" },
    [sel("-md")]: { "--switch-size": "calc(var(--size-selector, 0.25rem) * 6)" },
    [sel("-lg")]: { "--switch-size": "calc(var(--size-selector, 0.25rem) * 7)" },
    [sel("-xl")]: { "--switch-size": "calc(var(--size-selector, 0.25rem) * 8)" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = { "--switch-accent": `var(--color-${name})` };
  }

  return base;
}
