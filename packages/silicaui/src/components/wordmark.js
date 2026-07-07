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

      "& svg": { width: "1.15em", height: "1.15em", flexShrink: "0" },
    },

    // The accented portion of the mark (e.g. "UI" in "Silica UI").
    [sel("-accent")]: {
      color: "var(--wordmark-accent, var(--color-primary))",
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { fontSize: "0.875rem" },
    [sel("-sm")]: { fontSize: "1rem" },
    [sel("-md")]: { fontSize: "1.25rem" },
    [sel("-lg")]: { fontSize: "1.75rem" },
    [sel("-xl")]: { fontSize: "2.25rem" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Setting `--wordmark-color` overrides the whole mark's base color, so a
  // `.wordmark-primary` reads as one solid accent color while `.wordmark-accent`
  // (inside any wordmark) can still layer a second, independent accent.
  for (const name of colors) {
    base[sel(`-${name}`)] = { "--wordmark-color": `var(--color-${name})` };
  }

  return base;
}
