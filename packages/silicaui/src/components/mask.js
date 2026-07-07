/**
 * The Mask component — clips an element (or its content) to a shape.
 *
 * Colorless. Polygonal shapes use `clip-path: polygon()` with percentage points
 * (so they scale with the element and never depend on an SVG being decoded);
 * the circle uses `clip-path: circle()`. Only the two curved shapes that a
 * polygon can't express — `squircle` and `heart` — fall back to a `mask-image`
 * data-URI sized with `mask-size: contain`. All of these are broadly supported.
 *
 * Apply `.mask` + a shape class directly to an `<img>`, or to a sized container
 * whose content should be clipped.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function mask(prefix = "") {
  const sel = (suffix = "") => `.${prefix}mask${suffix}`;

  // Curved shapes: an SVG silhouette used as an alpha mask, scaled to fit.
  const squircle =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M100 0C22 0 0 22 0 100s22 100 100 100 100-22 100-100S178 0 100 0Z' fill='%23000'/%3E%3C/svg%3E\")";
  const heart =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='%23000'/%3E%3C/svg%3E\")";

  const maskImage = (value) => ({
    maskImage: value,
    WebkitMaskImage: value,
  });
  const clip = (value) => ({ clipPath: value });

  return {
    [sel()]: {
      display: "inline-block",
      verticalAlign: "middle",
      // Defaults for the mask-image shapes; harmless for clip-path shapes.
      maskRepeat: "no-repeat",
      maskPosition: "center",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      WebkitMaskSize: "contain",
    },

    // ---- Curved (mask-image) ----------------------------------------------
    [sel("-squircle")]: maskImage(squircle),
    [sel("-heart")]: maskImage(heart),

    // ---- Round (clip-path circle) -----------------------------------------
    [sel("-circle")]: clip("circle(50%)"),

    // ---- Polygons (clip-path) ---------------------------------------------
    [sel("-hexagon")]: clip(
      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    ),
    [sel("-hexagon-2")]: clip(
      "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    ),
    [sel("-triangle")]: clip("polygon(50% 0%, 0% 100%, 100% 100%)"),
    [sel("-triangle-2")]: clip("polygon(0% 0%, 100% 0%, 50% 100%)"),
    [sel("-triangle-3")]: clip("polygon(0% 50%, 100% 0%, 100% 100%)"),
    [sel("-triangle-4")]: clip("polygon(0% 0%, 0% 100%, 100% 50%)"),
    [sel("-diamond")]: clip("polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"),
    [sel("-pentagon")]: clip(
      "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
    ),
    [sel("-star")]: clip(
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    ),
    [sel("-star-2")]: clip(
      "polygon(50% 0%, 63% 38%, 100% 38%, 69% 59%, 82% 100%, 50% 75%, 18% 100%, 31% 59%, 0% 38%, 37% 38%)",
    ),
    [sel("-decagon")]: clip(
      "polygon(50% 0%, 79% 9.5%, 97.5% 34.5%, 97.5% 65.5%, 79% 90.5%, 50% 100%, 21% 90.5%, 2.5% 65.5%, 2.5% 34.5%, 21% 9.5%)",
    ),
    [sel("-parallelogram")]: clip(
      "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)",
    ),
  };
}
