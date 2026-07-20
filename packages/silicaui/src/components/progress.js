/**
 * The Progress component — a horizontal bar showing completion of a task.
 *
 * Deliberately div-based (`.progress` track + `.progress-bar` fill), NOT a
 * styled native `<progress>`. The native element paints its fill through
 * engine-specific pseudo-elements (`::-webkit-progress-value` vs
 * `::-moz-progress-bar`) that render differently across browsers and fight you
 * on the indeterminate state. Two nested divs render pixel-identically in every
 * engine and give full control over the indeterminate animation and radius.
 *
 * Orthogonal color model, same as the rest of the system: a color class
 * (`.progress-success`) only sets `--progress-fill`; the track stays neutral so
 * the filled portion reads clearly against it. Height scales with the shared
 * `--size-field` density lever, so an `-sm` progress lines up with `-sm` fields.
 *
 * Determinate: set the bar's inline `width`. Indeterminate: add
 * `.progress-indeterminate` and let a sliding segment animate (a gentle opacity
 * pulse under `prefers-reduced-motion`). Keyframes live in theme.js.
 *
 * @param {string[]} colors - color names to generate `.progress-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function progress(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}progress${suffix}`;
  const barClass = `${prefix}progress-bar`;

  const base = {
    // The track: a full-width pill that clips the fill to its rounded corners.
    [sel()]: {
      display: "block",
      width: "100%",
      height: "calc(var(--size-field, 0.25rem) * 2)",
      overflow: "hidden",
      borderRadius: "9999px",
      backgroundColor: "var(--progress-track, var(--color-base-300))",
    },

    // The fill. Width is caller-driven (inline style / React `value`); it
    // inherits the track's pill radius and eases when the value changes. The
    // easing rides `--duration`, so reduced-motion (which zeroes it) snaps.
    [`.${barClass}`]: {
      display: "block",
      height: "100%",
      width: "0%",
      borderRadius: "inherit",
      backgroundColor: "var(--progress-fill, var(--color-base-content))",
      transitionProperty: "width",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },

    // ---- Indeterminate ------------------------------------------------------
    // No known value: a short segment slides across the track forever. Width is
    // fixed here (overriding any inline width) and the transition is dropped so
    // the keyframes own all motion.
    [sel("-indeterminate")]: {
      [`& > .${barClass}`]: {
        width: "40%",
        transition: "none",
        animation: "silica-progress-indeterminate 1.4s ease-in-out infinite",
      },
      // Motion-sensitive users get a full-width opacity pulse instead of a
      // travelling segment — still clearly "working", no positional motion.
      // (shared generic pulse keyframe, also used by Skeleton)
      "@media (prefers-reduced-motion: reduce)": {
        [`& > .${barClass}`]: {
          width: "100%",
          animation: "silica-pulse 1.6s ease-in-out infinite",
        },
      },
    },

    // ---- Sizes (height scales with the density lever) -----------------------
    [sel("-xs")]: { height: "calc(var(--size-field, 0.25rem) * 1)" },
    [sel("-sm")]: { height: "calc(var(--size-field, 0.25rem) * 1.5)" },
    [sel("-md")]: { height: "calc(var(--size-field, 0.25rem) * 2)" },
    [sel("-lg")]: { height: "calc(var(--size-field, 0.25rem) * 3)" },
    [sel("-xl")]: { height: "calc(var(--size-field, 0.25rem) * 4)" },

    // ---- Value label (`showValue`) — a row above the bar, not inside it (the
    // bar itself can be as thin as 2px, too short to hold legible text). -------
    [sel("-wrapper")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      width: "100%",
    },
    [sel("-label-row")]: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "0.5rem",
      fontSize: "0.8125rem",
    },
    [sel("-label")]: {
      color: "var(--color-base-content)",
    },
    [sel("-value")]: {
      fontWeight: "600",
      fontVariantNumeric: "tabular-nums",
      color: "var(--color-base-content)",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Only the fill takes the color; the track stays neutral for contrast.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--progress-fill": `var(--color-${name})`,
    };
  }

  return base;
}
