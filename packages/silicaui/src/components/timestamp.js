/**
 * The Timestamp component — a muted, tabular-numeral time label.
 *
 * Colorless. Inherits font-size from context (used inline in chat metadata,
 * table cells, list rows — sizes vary by callsite); only sets a quiet default
 * color and `font-variant-numeric: tabular-nums` so shifting digits (a live
 * "2 minutes ago" ticking up) don't jitter the surrounding layout.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function timestamp(prefix = "") {
  const sel = (suffix = "") => `.${prefix}timestamp${suffix}`;
  return {
    [sel()]: {
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
      fontVariantNumeric: "tabular-nums",
    },
  };
}
