import { contentVar } from "../lib/auto-content.js";

/**
 * The Checkbox component — a native `<input type="checkbox">` restyled.
 *
 * Selector-tier control: scales with `--size-selector` and rounds with
 * `--radius-selector` (capped so it stays a rounded square, never a full circle,
 * even under a large selector radius). A color class (`.checkbox-primary`) sets
 * `--checkbox-accent` (checked fill/border/focus) and `--checkbox-content` (the
 * checkmark color); unchecked is a neutral hairline box.
 *
 * The checkmark is composed from layered `linear-gradient`s rather than an SVG,
 * so its color can be a live CSS var — the accent's auto-derived `-content`,
 * which stays legible on ANY accent (dark mark on a light color like `warning`,
 * light mark on a dark one). SVG `background-image` can't read a CSS var, and
 * `::before`/`::after` on form controls is inconsistent across browsers — this
 * avoids both.
 *
 * @param {string[]} colors - color names to generate `.checkbox-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function checkbox(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}checkbox${suffix}`;

  // `accent` = the box fill; `content` = the checkmark. Both fall back to
  // primary + primary's content when no color class is applied.
  const accent = "var(--checkbox-accent, var(--color-primary))";
  const content = `var(--checkbox-content, ${contentVar("primary")})`;

  const base = {
    [sel()]: {
      "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 6)",

      appearance: "none",
      flexShrink: "0",
      display: "inline-block",
      verticalAlign: "middle",
      width: "var(--checkbox-size)",
      height: "var(--checkbox-size)",
      // Follow the selector radius, but cap at 30% of the box so it never
      // collapses into a circle (which would read as a radio).
      borderRadius:
        "min(var(--radius-selector, 0.375rem), calc(var(--checkbox-size) * 0.3))",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor:
        "var(--checkbox-border, var(--checkbox-accent, var(--color-base-300)))",
      backgroundColor: "var(--color-base-100)",
      cursor: "pointer",
      transitionProperty: "background-color, border-color, box-shadow",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",

      "&:focus-visible": {
        outline:
          "var(--focus-width, 2px) solid var(--checkbox-accent, var(--color-primary))",
        outlineOffset: "var(--focus-offset, 2px)",
      },
      "&:checked": {
        backgroundColor: accent,
        borderColor: accent,
        // Checkmark drawn from gradients: the `accent` fills the field and the
        // `content` strokes carve the check. (The field must be `accent` and the
        // mark `content` — reversing them inverts the box on dark-content colors
        // like warning/duck, giving a dark box + coloured check.)
        backgroundImage: [
          `linear-gradient(-45deg, transparent 65%, ${accent} 65.99%)`,
          `linear-gradient(45deg, transparent 75%, ${accent} 75.99%)`,
          `linear-gradient(-45deg, ${accent} 40%, transparent 40.99%)`,
          `linear-gradient(45deg, ${accent} 30%, ${content} 30.99%, ${content} 40%, transparent 40.99%)`,
          `linear-gradient(-45deg, ${content} 50%, ${accent} 50.99%)`,
        ].join(", "),
      },
      "&:disabled": {
        cursor: "not-allowed",
        opacity: "var(--disabled-opacity, 0.5)",
      },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 4)" },
    [sel("-sm")]: { "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 5)" },
    [sel("-md")]: { "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 6)" },
    [sel("-lg")]: { "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 7)" },
    [sel("-xl")]: { "--checkbox-size": "calc(var(--size-selector, 0.25rem) * 8)" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // The border lever softens only the UNCHECKED box; `:checked` paints border
  // and fill from the accent directly, so a checked box stays fully solid.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--checkbox-accent": `var(--color-${name})`,
      "--checkbox-border": `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`,
      "--checkbox-content": contentVar(name),
    };
  }

  return base;
}
