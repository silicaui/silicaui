/**
 * The Swap component — toggles between two overlaid children.
 *
 * A `<label>` with a hidden checkbox and `.swap-on` / `.swap-off` children
 * stacked in the same grid cell; checking the box cross-fades between them.
 * `-rotate` spins the icons as they swap; `-flip` does a 3D flip. Perfect for a
 * hamburger↔close, play↔pause, sun↔moon, etc.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function swap(prefix = "") {
  const sel = (suffix = "") => `.${prefix}swap${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "inline-grid",
      placeItems: "center",
      cursor: "pointer",
      userSelect: "none",
      lineHeight: "0",

      "& > input": {
        position: "absolute",
        width: "0",
        height: "0",
        opacity: "0",
        margin: "0",
      },
    },

    [`${sel("-on")}, ${sel("-off")}`]: {
      gridArea: "1 / 1",
      transition: "transform 0.25s ease, opacity 0.25s ease",
      transformOrigin: "center",
    },
    [sel("-on")]: { opacity: "0" },
    [sel("-off")]: { opacity: "1" },

    // Checked → show `-on`, hide `-off`.
    [`${sel()} > input:checked ~ ${sel("-on")}`]: { opacity: "1" },
    [`${sel()} > input:checked ~ ${sel("-off")}`]: { opacity: "0" },

    // Rotate variant.
    [`${sel("-rotate")} ${sel("-off")}`]: { transform: "rotate(0deg)" },
    [`${sel("-rotate")} ${sel("-on")}`]: { transform: "rotate(-45deg)" },
    [`${sel("-rotate")} > input:checked ~ ${sel("-off")}`]: {
      transform: "rotate(45deg)",
      opacity: "0",
    },
    [`${sel("-rotate")} > input:checked ~ ${sel("-on")}`]: {
      transform: "rotate(0deg)",
      opacity: "1",
    },

    // Flip variant.
    [sel("-flip")]: { perspective: "10rem" },
    [`${sel("-flip")} ${sel("-off")}`]: {
      transform: "rotateY(0deg)",
      backfaceVisibility: "hidden",
    },
    [`${sel("-flip")} ${sel("-on")}`]: {
      transform: "rotateY(180deg)",
      backfaceVisibility: "hidden",
    },
    [`${sel("-flip")} > input:checked ~ ${sel("-off")}`]: {
      transform: "rotateY(-180deg)",
    },
    [`${sel("-flip")} > input:checked ~ ${sel("-on")}`]: {
      transform: "rotateY(0deg)",
    },
  };
}
