/**
 * The Toggle component — a native `<input type="checkbox">` restyled as a switch.
 *
 * Selector-tier control: height scales with `--size-selector`; the track is a
 * pill 1.75× as wide as it is tall.
 *
 * Style: the track background stays TRANSPARENT in both states — only the border
 * and the knob carry color. Off = grey border + grey knob (at left); checked =
 * accent border + accent knob (slid right). A color class (`.toggle-primary`)
 * sets `--toggle-accent`.
 *
 * The knob is a `radial-gradient` circle sized to one square "tile", slid from
 * left to right via `background-position` (which animates, so it glides); its
 * color is `--toggle-knob`. No pseudo-element — reliable on a bare `<input>`.
 *
 * @param {string[]} colors - color names to generate `.toggle-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toggle(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}toggle${suffix}`;

  const accent = "var(--toggle-accent, var(--color-primary))";
  // Grey used for the border + knob when off (adapts to the theme surface).
  const off = "color-mix(in oklab, var(--color-base-content) 30%, var(--color-base-100))";
  const KNOB =
    "radial-gradient(circle at center, var(--toggle-knob) 0 34%, transparent 36%)";

  const base = {
    [sel()]: {
      "--toggle-size": "calc(var(--size-selector, 0.25rem) * 6)",
      "--toggle-knob": off,

      appearance: "none",
      flexShrink: "0",
      display: "inline-block",
      verticalAlign: "middle",
      height: "var(--toggle-size)",
      width: "calc(var(--toggle-size) * 1.75)",
      borderRadius: "9999px",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: off,
      backgroundColor: "transparent",
      backgroundImage: KNOB,
      backgroundSize: "var(--toggle-size) var(--toggle-size)",
      backgroundPosition: "left center",
      backgroundRepeat: "no-repeat",
      cursor: "pointer",
      transitionProperty: "background-position, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:focus-visible": {
        outline: `var(--focus-width, 2px) solid ${accent}`,
        outlineOffset: "var(--focus-offset, 2px)",
      },
      "&:checked": {
        "--toggle-knob": accent,
        borderColor: accent,
        backgroundPosition: "right center",
      },
      "&:disabled": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // ---- Sizes (drive the height; width follows at 1.75×) ------------------
    [sel("-xs")]: { "--toggle-size": "calc(var(--size-selector, 0.25rem) * 4)" },
    [sel("-sm")]: { "--toggle-size": "calc(var(--size-selector, 0.25rem) * 5)" },
    [sel("-md")]: { "--toggle-size": "calc(var(--size-selector, 0.25rem) * 6)" },
    [sel("-lg")]: { "--toggle-size": "calc(var(--size-selector, 0.25rem) * 7)" },
    [sel("-xl")]: { "--toggle-size": "calc(var(--size-selector, 0.25rem) * 8)" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = { "--toggle-accent": `var(--color-${name})` };
  }

  return base;
}
