/**
 * The Hero component — a full-width banner that centers its content.
 *
 * Colorless. A single-cell grid: `.hero-content` and an optional
 * `.hero-overlay` are stacked in the same cell (both pinned to row/column 1),
 * so an overlay can tint a background image set on `.hero` itself while the
 * content sits legibly on top. Uses `background-size: cover` so an inline
 * `background-image` fills the banner.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function hero(prefix = "") {
  const sel = (suffix = "") => `.${prefix}hero${suffix}`;

  return {
    [sel()]: {
      display: "grid",
      width: "100%",
      placeItems: "center",
      backgroundSize: "cover",
      backgroundPosition: "center",

      // Stack every direct child into the one grid cell so an overlay and the
      // content overlap rather than stacking vertically.
      "& > *": {
        gridColumnStart: "1",
        gridRowStart: "1",
      },
    },

    [sel("-content")]: {
      zIndex: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "1rem",
      maxWidth: "80rem",
      paddingBlock: "4rem",
      paddingInline: "1rem",
      color: "inherit",
    },

    // Dims the background so overlaid content stays legible over any image.
    [sel("-overlay")]: {
      height: "100%",
      width: "100%",
      backgroundColor: "color-mix(in oklab, black 50%, transparent)",
    },
  };
}
