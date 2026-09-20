import { colorVariantRules } from "../color-variants.js";

/**
 * The Wordmark component — a stylized logotype for a brand/product name.
 *
 * Colorless base (reads `currentColor`-adjacent `--color-base-content`) with an
 * orthogonal accent for `.wordmark-accent` (a highlighted suffix/prefix, e.g. the
 * "UI" in "Silica UI"). Tight tracking + a heavier weight distinguish it from
 * ordinary body/heading text — this is a logotype, not a `<Heading>`.
 *
 * @param {string[]} colors - color names to generate `.wordmark-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function wordmark(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}wordmark${suffix}`;

  const base = {
    [sel()]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4em",
      fontFamily: "var(--font-head, var(--font-sans))",
      fontWeight: "800",
      fontSize: "1.25rem",
      lineHeight: "1",
      letterSpacing: "-0.02em",
      color: "var(--wordmark-color, var(--color-base-content))",
      whiteSpace: "nowrap",
      textDecoration: "none",

      // The brand MARK beside the name — an inline `<svg>`, an `<img>` logo, or
      // whatever the `src` prop lowered to. Height-locked to the type, width
      // AUTO: a logo is rarely square, and the old `width: 1.15em` squashed any
      // non-square mark to a square. Square marks are unaffected (an svg with a
      // 1:1 viewBox still computes to 1.15em wide), so this generalizes rather
      // than changes them.
      "& :is(svg, img)": { width: "auto", height: "1.15em", flexShrink: "0" },
    },

    // The accented portion of the mark (e.g. "UI" in "Silica UI").
    [sel("-accent")]: {
      color: "var(--wordmark-ink, var(--color-primary))",
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { fontSize: "0.875rem" },
    [sel("-sm")]: { fontSize: "1rem" },
    [sel("-md")]: { fontSize: "1.25rem" },
    [sel("-lg")]: { fontSize: "1.75rem" },
    [sel("-xl")]: { fontSize: "2.25rem" },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel()}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Setting `--wordmark-color` overrides the whole mark's base color, so a
  // `.wordmark-primary` reads as one solid accent color while `.wordmark-accent`
  // (inside any wordmark) can still layer a second, independent accent.
  Object.assign(base, colorVariantRules("wordmark", colors, prefix));

  return base;
}
