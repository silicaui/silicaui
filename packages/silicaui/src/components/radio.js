/**
 * The Radio component — a native `<input type="radio">` restyled.
 *
 * Selector-tier control: scales with `--size-selector`, always a circle. A color
 * class (`.radio-primary`) sets only `--radio-accent` (checked fill + border +
 * focus ring). The checked "dot" is drawn with an inset box-shadow ring of the
 * surface color — reliable across browsers and needs no pseudo-element.
 *
 * @param {string[]} colors - color names to generate `.radio-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function radio(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}radio${suffix}`;

  const base = {
    [sel()]: {
      "--radio-size": "calc(var(--size-selector, 0.25rem) * 6)",

      appearance: "none",
      flexShrink: "0",
      display: "inline-block",
      verticalAlign: "middle",
      width: "var(--radio-size)",
      height: "var(--radio-size)",
      borderRadius: "9999px",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--radio-accent, var(--color-base-300))",
      backgroundColor: "var(--color-base-100)",
      cursor: "pointer",
      transitionProperty: "background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--radio-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
      },
      "&:checked": {
        borderColor: "var(--radio-accent, var(--color-primary))",
        backgroundColor: "var(--radio-accent, var(--color-primary))",
        // Inset ring of the surface color carves a centered dot out of the fill.
        boxShadow:
          "0 0 0 calc(var(--radio-size) * 0.28) var(--color-base-100) inset",
      },
      "&:disabled": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { "--radio-size": "calc(var(--size-selector, 0.25rem) * 4)" },
    [sel("-sm")]: { "--radio-size": "calc(var(--size-selector, 0.25rem) * 5)" },
    [sel("-md")]: { "--radio-size": "calc(var(--size-selector, 0.25rem) * 6)" },
    [sel("-lg")]: { "--radio-size": "calc(var(--size-selector, 0.25rem) * 7)" },
    [sel("-xl")]: { "--radio-size": "calc(var(--size-selector, 0.25rem) * 8)" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = { "--radio-accent": `var(--color-${name})` };
  }

  return base;
}
