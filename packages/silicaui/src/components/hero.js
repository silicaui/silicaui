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
      // Vertically centered, horizontally STRETCHED — deliberately not the
      // `place-items: center` this used to be. A grid item that isn't stretched
      // shrinks to fit-content, and a block-level child has no intrinsic width,
      // so a `<section>` dropped onto the banner collapsed to its own padding
      // and rendered as a zero-width sliver. Stretching costs the layout nothing
      // (`.hero-content` re-centers itself below) and makes the banner a real
      // container that anything can be placed into.
      alignItems: "center",
      justifyItems: "stretch",
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
      // Capped and self-centering. The cap used to be centered for it by the
      // parent's `place-items`, which no longer centers (see above) — so the
      // auto margin now does that job explicitly, and the content stays put.
      maxWidth: "80rem",
      marginInline: "auto",
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
