import { contentVar } from "../lib/auto-content.js";

/**
 * The Alert component — a feedback surface for a contextual message.
 *
 * Same orthogonal design as Button/Badge: a color class (`.alert-success`) only
 * sets `--alert-*` variables; `.alert` and the style classes read them. Alert is
 * a box-tier surface, so it rounds with `--radius-box` (like Card). It lays its
 * children out as a flex row — an optional leading icon, a growing content
 * column, and any trailing actions — so the icon and text share one baseline.
 *
 * Variants mirror the rest of the system: solid (default, painted by `.alert`),
 * plus `-soft` (tint), `-outline`, and `-dash`. Silica ships no icons; pass your
 * own into the leading slot.
 *
 * @param {string[]} colors - color names to generate `.alert-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function alert(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}alert${suffix}`;

  const base = {
    [sel()]: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      width: "100%",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 3)",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      borderRadius: "var(--radius-box, 0.5rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--alert-bg, var(--color-base-300))",
      backgroundColor: "var(--alert-bg, var(--color-base-200))",
      color: "var(--alert-fg, var(--color-base-content))",

      // A leading (or trailing) icon: fixed square, never shrinks. Inherits the
      // alert's text color via `currentColor`, so it matches solid/soft/outline.
      // `align-items: center` aligns the icon's box-center to the text's line-box
      // center — but a font's x-height sits BELOW that center, so lowercase text
      // reads ~0.156em low against a centered icon (capitals only ~0.063em, since
      // caps reach higher). Measured across system-ui; there is no line-height
      // that fixes it. So nudge the icon down by the midpoint (~0.11em): lowercase
      // and capital-led text each end up within ~0.05em of centered, instead of
      // optimizing one at the other's expense. A plain transform (not
      // `text-box-trim`, which Firefox lacks) so it behaves the same everywhere.
      "& > svg": {
        width: "1.25em",
        height: "1.25em",
        flexShrink: "0",
        transform: "translateY(0.11em)",
      },
    },

    // The message column grows to fill, pushing any trailing actions to the end.
    // `min-width: 0` lets long words wrap instead of forcing overflow.
    [sel("-content")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.125rem",
      flex: "1 1 auto",
      minWidth: "0",
    },
    [sel("-title")]: {
      fontWeight: "600",
      lineHeight: "1.3",
    },
    // Secondary line under the title. Full-contrast `-content` softened just
    // enough for hierarchy against the bold title, not enough to hurt legibility.
    [sel("-description")]: {
      opacity: "0.9",
      lineHeight: "1.4",
    },
    // Trailing action group. Sits at the row's end (the content column's
    // `flex: 1` pushes it right) and never shrinks; vertically centered by the
    // alert's own `align-items: center`, so it lines up beside multi-line text.
    [sel("-actions")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      flexShrink: "0",
    },

    // ---- Style variants ----------------------------------------------------
    // (default is solid, painted by `.alert` reading --alert-bg/-fg)
    [sel("-outline")]: {
      backgroundColor: "transparent",
      color: "var(--alert-accent, var(--color-base-content))",
      borderColor: "var(--alert-accent, var(--color-base-300))",
    },
    [sel("-dash")]: {
      backgroundColor: "transparent",
      color: "var(--alert-accent, var(--color-base-content))",
      borderColor: "var(--alert-accent, var(--color-base-300))",
      borderStyle: "dashed",
    },
    [sel("-soft")]: {
      backgroundColor:
        "color-mix(in oklab, var(--alert-accent, var(--color-base-content)) 12%, var(--color-base-100))",
      color: "var(--alert-accent, var(--color-base-content))",
      borderColor: "transparent",
    },

    // ---- Sizes (content-driven height; scale padding + type + gap) ----------
    [sel("-xs")]: {
      gap: "0.5rem",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 2)",
      fontSize: "0.75rem",
    },
    [sel("-sm")]: {
      gap: "0.625rem",
      paddingInline: "calc(var(--size-field, 0.25rem) * 3.5)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 2.5)",
      fontSize: "0.8125rem",
    },
    [sel("-md")]: {
      fontSize: "0.875rem",
    },
    [sel("-lg")]: {
      gap: "0.875rem",
      paddingInline: "calc(var(--size-field, 0.25rem) * 5)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 4)",
      fontSize: "1rem",
    },
    [sel("-xl")]: {
      gap: "1rem",
      paddingInline: "calc(var(--size-field, 0.25rem) * 6)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 5)",
      fontSize: "1.125rem",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Each color only assigns source vars. `--alert-bg`/`--alert-fg` drive the
  // solid look; `--alert-accent`/`--alert-accent-content` drive soft/outline/dash.
  for (const name of colors) {
    const color = `var(--color-${name})`;
    const content = contentVar(name);
    base[sel(`-${name}`)] = {
      "--alert-bg": color,
      "--alert-fg": content,
      "--alert-accent": color,
      "--alert-accent-content": content,
    };
  }

  return base;
}
