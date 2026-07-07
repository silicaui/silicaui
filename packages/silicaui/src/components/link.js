import { contentVar } from "../lib/auto-content.js";

/**
 * The Link component — a styled inline anchor.
 *
 * Orthogonal color model, like Badge: a color class (`.link-primary`) only sets
 * `--link-accent`; the base `.link` reads it for its color. By default a link is
 * underlined and inherits the surrounding text color; `-hover` defers the
 * underline until hover. A visible focus ring is always drawn for keyboard use.
 *
 * @param {string[]} colors - color names to generate `.link-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function link(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}link${suffix}`;

  const base = {
    [sel()]: {
      color: "var(--link-accent, currentColor)",
      cursor: "pointer",
      textDecorationLine: "underline",
      textUnderlineOffset: "0.2em",
      textDecorationThickness: "from-font",
      transitionProperty: "color, text-decoration-color",
      transitionDuration: "0.15s",

      "&:focus-visible": {
        outline: "2px solid var(--link-accent, currentColor)",
        outlineOffset: "2px",
        borderRadius: "var(--radius-selector, 0.25rem)",
      },
    },

    // Underline only on hover / focus.
    [sel("-hover")]: {
      textDecorationLine: "none",
      "&:hover, &:focus-visible": { textDecorationLine: "underline" },
    },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--link-accent": `var(--color-${name})`,
      "--link-accent-content": contentVar(name),
    };
  }

  return base;
}
