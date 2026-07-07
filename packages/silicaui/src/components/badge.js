import { contentVar } from "../lib/auto-content.js";

/**
 * The Badge component — a small pill for labels, counts, and statuses.
 *
 * Same orthogonal design as Button: a color class (`.badge-primary`) only sets
 * `--badge-*` variables; `.badge` and the style classes read them. Badge is a
 * selector-tier element, so it rounds with `--radius-selector` and scales with
 * the `--size-selector` density lever.
 *
 * @param {string[]} colors - color names to generate `.badge-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function badge(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}badge${suffix}`;

  const base = {
    [sel()]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 6)",

      display: "inline-block",
      alignContent: "center",
      textAlign: "center",
      height: "var(--badge-size)",
      width: "fit-content",
      paddingInline: "calc(var(--size-selector, 0.25rem) * 2.5)",
      fontSize: "0.75rem",
      fontWeight: "600",
      lineHeight: "1",
      // Vertical centering via block-level align-content; text-box-trim refines
      // to the x-height band where supported (see button.js for the rationale).
      textBoxTrim: "trim-both",
      textBoxEdge: "ex alphabetic",
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-selector, 1rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--badge-bg, var(--color-base-300))",
      backgroundColor: "var(--badge-bg, var(--color-base-200))",
      color: "var(--badge-fg, var(--color-base-content))",

      "& svg": {
        width: "1em",
        height: "1em",
        flexShrink: "0",
      },
    },

    // Badges with an icon: flex the icon + label row together (see button.js).
    [`${sel()}:has(svg)`]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.25rem",
      textBoxTrim: "normal",
    },

    // ---- Style variants ----------------------------------------------------
    [sel("-outline")]: {
      backgroundColor: "transparent",
      color: "var(--badge-accent, var(--color-base-content))",
      borderColor: "var(--badge-accent, var(--color-base-content))",
    },
    [sel("-dash")]: {
      backgroundColor: "transparent",
      color: "var(--badge-accent, var(--color-base-content))",
      borderColor: "var(--badge-accent, var(--color-base-content))",
      borderStyle: "dashed",
    },
    [sel("-soft")]: {
      backgroundColor:
        "color-mix(in oklab, var(--badge-accent, var(--color-base-content)) 15%, var(--color-base-100))",
      color: "var(--badge-accent, var(--color-base-content))",
      borderColor: "transparent",
    },
    [sel("-ghost")]: {
      backgroundColor: "transparent",
      color: "var(--badge-accent, var(--color-base-content))",
      borderColor: "transparent",
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 4)",
      paddingInline: "calc(var(--size-selector, 0.25rem) * 1.5)",
      fontSize: "0.625rem",
    },
    [sel("-sm")]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 5)",
      paddingInline: "calc(var(--size-selector, 0.25rem) * 2)",
      fontSize: "0.6875rem",
    },
    [sel("-md")]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 6)",
      fontSize: "0.75rem",
    },
    [sel("-lg")]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 7)",
      paddingInline: "calc(var(--size-selector, 0.25rem) * 3)",
      fontSize: "0.875rem",
    },
    [sel("-xl")]: {
      "--badge-size": "calc(var(--size-selector, 0.25rem) * 8)",
      paddingInline: "calc(var(--size-selector, 0.25rem) * 3.5)",
      fontSize: "1rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    const color = `var(--color-${name})`;
    const content = contentVar(name);
    base[sel(`-${name}`)] = {
      "--badge-bg": color,
      "--badge-fg": content,
      "--badge-accent": color,
      "--badge-accent-content": content,
    };
  }

  return base;
}
