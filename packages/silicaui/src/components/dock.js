import { colorVariantRules } from "../color-variants.js";

/**
 * The Dock component — a bottom navigation bar of icon+label items.
 *
 * Colorless base with an orthogonal accent for the active item. A flex row of
 * equal-width `.dock-item` buttons, each an icon over a small label. Position it
 * yourself (`fixed bottom-0` for a real app dock). The active item lifts to full
 * opacity and the accent color.
 *
 * @param {string[]} colors - color names to generate `.dock-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dock(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}dock${suffix}`;

  const base = {
    [sel()]: {
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-around",
      width: "100%",
      minHeight: "4rem",
      backgroundColor: "var(--color-base-100)",
      borderTop: "1px solid var(--color-base-300)",
      color: "var(--color-base-content)",
    },

    [sel("-item")]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.15rem",
      flex: "1 1 0%",
      paddingBlock: "0.4rem",
      border: "0",
      background: "none",
      color: "inherit",
      cursor: "pointer",
      transition: "color 0.15s",

      "& svg": { width: "1.35rem", height: "1.35rem", display: "block" },
      "&:hover": { color: "var(--dock-accent, var(--color-primary))" },
    },

    // The active item is marked by a real accent color, so fading the others to
    // 55% added nothing a person could use and made an 11px label on a phone's
    // bottom bar hard to read (RULE #3, docs/personas/issues/021).
    [sel("-item-active")]: {
      color: "var(--dock-ink, var(--color-primary))",
    },

    [sel("-label")]: {
      fontSize: "1rem",
      fontWeight: "500",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-item")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "-2px",
    },
  };

  Object.assign(base, colorVariantRules("dock", colors, prefix));

  return base;
}
