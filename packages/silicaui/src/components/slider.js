import { contentVar } from "../lib/auto-content.js";

/**
 * The Slider component — a rich range input (Base UI behavior).
 *
 * Where the native-input-backed `Range` is one thumb on a rail, `Slider` is the
 * full Base UI slider: single OR multi-thumb (a two-thumb range selection),
 * horizontal or vertical, with an optional value readout. Colorless track
 * (base-300) + an orthogonal accent for the filled indicator and thumbs; a color
 * class (`.slider-primary`) sets `--slider-accent`. Base UI positions the
 * indicator and thumbs via inline styles; we only paint them.
 *
 * @param {string[]} colors - color names to generate `.slider-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function slider(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}slider${suffix}`;
  const ACCENT = "var(--slider-accent, var(--color-primary))";

  const base = {
    [sel()]: {
      "--slider-rail": "0.375rem",
      "--slider-thumb": "1.1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      width: "100%",
      touchAction: "none",
      userSelect: "none",
      color: "var(--color-base-content)",
    },
    // Vertical: stack the (optional) value above a tall, narrow control.
    [`${sel()}[data-orientation="vertical"]`]: {
      display: "inline-flex",
      flexDirection: "column",
      width: "auto",
      height: "12rem",
    },

    // Numeric readout (Base UI formats it; renders the range as "a – b").
    [sel("-value")]: {
      flexShrink: "0",
      minWidth: "2.5ch",
      fontSize: "0.875rem",
      fontVariantNumeric: "tabular-nums",
      color: "var(--color-base-content)",
    },

    // Interactive hit area.
    [sel("-control")]: {
      display: "flex",
      alignItems: "center",
      flex: "1",
      width: "100%",
      minHeight: "1.25rem",
    },
    [`${sel("-control")}[data-orientation="vertical"]`]: {
      flexDirection: "column",
      width: "1.25rem",
      height: "100%",
    },

    // The rail.
    [sel("-track")]: {
      position: "relative",
      width: "100%",
      height: "var(--slider-rail)",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-300)",
    },
    [`${sel("-track")}[data-orientation="vertical"]`]: {
      width: "var(--slider-rail)",
      height: "100%",
    },

    // Filled portion (Base UI sizes/positions it via inset).
    [sel("-indicator")]: {
      borderRadius: "9999px",
      backgroundColor: ACCENT,
    },

    // Draggable handle(s) (Base UI positions each one).
    [sel("-thumb")]: {
      width: "var(--slider-thumb)",
      height: "var(--slider-thumb)",
      borderRadius: "9999px",
      backgroundColor: ACCENT,
      border: "2px solid var(--color-base-100)",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
      outline: "none",
      transition: "box-shadow 0.15s",

      "&[data-dragging], &:focus-visible": {
        boxShadow: `0 0 0 4px color-mix(in oklab, ${ACCENT} 30%, transparent)`,
      },
    },

    // Disabled (Base UI marks the root).
    [`${sel()}[data-disabled]`]: {
      opacity: "var(--disabled-opacity, 0.5)",
      cursor: "not-allowed",
    },

    // ---- Sizes (drive rail thickness + thumb diameter) ---------------------
    [sel("-xs")]: { "--slider-rail": "0.1875rem", "--slider-thumb": "0.7rem" },
    [sel("-sm")]: { "--slider-rail": "0.25rem", "--slider-thumb": "0.9rem" },
    [sel("-md")]: { "--slider-rail": "0.375rem", "--slider-thumb": "1.1rem" },
    [sel("-lg")]: { "--slider-rail": "0.5rem", "--slider-thumb": "1.35rem" },
    [sel("-xl")]: { "--slider-rail": "0.625rem", "--slider-thumb": "1.6rem" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--slider-accent": `var(--color-${name})`,
      "--slider-accent-content": contentVar(name),
    };
  }

  return base;
}
