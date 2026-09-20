import { inkOfRole } from "../lib/ink.js";
/**
 * Dropzone — a file drag-and-drop / click-to-browse target.
 *
 * A dashed, focusable area that lights up while a drag hovers it and opens the
 * native file picker on click/Enter. The React `<Dropzone>` owns the drag
 * counter, the hidden `<input type=file>`, and accept/size filtering; this styles
 * the idle / hover / dragging / disabled surface and the icon + text stack.
 *
 * Colorless: the active (dragging) state reads `--color-primary` for its border
 * and tint.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dropzone(prefix = "") {
  const sel = (suffix = "") => `.${prefix}dropzone${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: "0.6rem",
      width: "100%",
      minHeight: "9rem",
      padding: "1.75rem 1.25rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "2px dashed var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      cursor: "pointer",
      transition:
        "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
      "&:hover": {
        borderColor: muted(35),
        backgroundColor: "var(--color-base-200)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "2px",
      },
    },

    // While a drag is over the zone.
    [`${sel()}[data-dragging]`]: {
      borderColor: "var(--color-primary)",
      borderStyle: "solid",
      backgroundColor: "color-mix(in oklab, var(--color-primary) 10%, transparent)",
    },

    [`${sel()}[data-disabled]`]: {
      opacity: "0.6",
      cursor: "not-allowed",
      "&:hover": {
        borderColor: "var(--color-base-300)",
        backgroundColor: "var(--color-base-100)",
      },
    },

    // Icon chip.
    [sel("-icon")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2.75rem",
      height: "2.75rem",
      borderRadius: "9999px",
      backgroundColor: "var(--color-base-200)",
      color: muted(60),
      "& svg": { width: "1.4rem", height: "1.4rem", flexShrink: "0" },
    },
    [`${sel()}[data-dragging] ${sel("-icon")}`]: {
      backgroundColor: "color-mix(in oklab, var(--color-primary) 18%, transparent)",
      color: inkOfRole("primary"),
    },

    [sel("-title")]: {
      fontSize: "1rem",
      fontWeight: "600",
    },
    [sel("-hint")]: {
      fontSize: "1rem",
      color: muted(60),
    },

    // The real input — present for a11y + form submission, visually removed.
    [sel("-input")]: {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    // The zone rings (below), so the input must not ring too -- otherwise a
    // keyboard user gets two rings, one of them the browser's.
    [`${sel("-input")}:focus-visible`]: { outline: "none" },
    [`${sel()}:has(${sel("-input")}:focus-visible)`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "var(--focus-offset, 2px)",
    },
  };
}
