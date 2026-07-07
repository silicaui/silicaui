/**
 * The Loading component — a spinner for in-progress states.
 *
 * Colorless: a ring with one transparent edge spun by the shared `silica-spin`
 * keyframes, drawn in `currentColor` so it takes on the surrounding text color
 * (or a `text-*` utility). Sizes xs–xl. It stays spinning under
 * `prefers-reduced-motion` on purpose — it's an essential activity signal, not
 * decoration.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function loading(prefix = "") {
  const sel = (suffix = "") => `.${prefix}loading${suffix}`;

  return {
    [sel()]: {
      display: "inline-block",
      verticalAlign: "middle",
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "9999px",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "currentColor",
      // The gap that makes the spin read as motion.
      borderBlockStartColor: "transparent",
      animation: "silica-spin 0.6s linear infinite",
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { width: "1rem", height: "1rem", borderWidth: "2px" },
    [sel("-sm")]: { width: "1.25rem", height: "1.25rem", borderWidth: "2px" },
    [sel("-md")]: { width: "1.5rem", height: "1.5rem", borderWidth: "2px" },
    [sel("-lg")]: { width: "2rem", height: "2rem", borderWidth: "3px" },
    [sel("-xl")]: { width: "2.5rem", height: "2.5rem", borderWidth: "3px" },
  };
}
