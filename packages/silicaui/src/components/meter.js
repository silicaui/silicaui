import { contentVar } from "../lib/auto-content.js";

/**
 * The Meter component — a static measurement within a known range.
 *
 * Distinct from Progress: a meter shows a fixed reading (disk usage, score,
 * capacity), not the advancement of a task. Same div-based track/indicator as
 * Progress (Base UI's Meter sizes the indicator's width from the value; we just
 * paint it), and the same orthogonal color model — a color class only sets
 * `--meter-fill`, the neutral track stays put so the reading reads clearly.
 *
 * A `.meter-header` row pairs an optional `.meter-label` with a `.meter-value`.
 *
 * @param {string[]} colors - color names to generate `.meter-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function meter(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}meter${suffix}`;

  const base = {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
      width: "100%",
    },

    // Optional label + value row above the track.
    [sel("-header")]: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "0.5rem",
    },
    [sel("-label")]: {
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.25",
      color: "var(--color-base-content)",
    },
    [sel("-value")]: {
      fontSize: "0.875rem",
      fontVariantNumeric: "tabular-nums",
      lineHeight: "1.25",
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
    },

    // The rail: a full-width pill clipping the fill to its rounded corners.
    [sel("-track")]: {
      position: "relative",
      display: "block",
      width: "100%",
      height: "calc(var(--size-field, 0.25rem) * 2)",
      overflow: "hidden",
      borderRadius: "9999px",
      backgroundColor: "var(--meter-track, var(--color-base-300))",
    },
    // The fill. Base UI drives its width from the value; we ease width changes.
    [sel("-indicator")]: {
      display: "block",
      height: "100%",
      borderRadius: "inherit",
      backgroundColor: "var(--meter-fill, var(--color-base-content))",
      transitionProperty: "width",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },

    // ---- Sizes (track height scales with the density lever) -----------------
    [`${sel("-xs")} ${sel("-track")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 1)",
    },
    [`${sel("-sm")} ${sel("-track")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 1.5)",
    },
    [`${sel("-md")} ${sel("-track")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 2)",
    },
    [`${sel("-lg")} ${sel("-track")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 3)",
    },
    [`${sel("-xl")} ${sel("-track")}`]: {
      height: "calc(var(--size-field, 0.25rem) * 4)",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--meter-fill": `var(--color-${name})`,
      "--meter-fill-content": contentVar(name),
    };
  }

  return base;
}
