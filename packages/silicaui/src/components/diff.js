/**
 * The Diff component — a before/after comparison with a draggable split.
 *
 * Colorless. Two layers occupy the same grid cell: `.diff-item-2` is the full
 * "after" underneath, `.diff-item-1` is the "before" on top, clipped to the
 * split position with `clip-path: inset(...)`. The split is a single CSS
 * variable, `--diff-pos` (a 0–100% length), so the React wrapper can drive it
 * from pointer drag or the keyboard while the CSS stays declarative.
 * `clip-path: inset()` and CSS custom properties are universally supported, so
 * this renders identically everywhere (no container-query-unit dependence).
 *
 * `.diff-resizer` is the vertical handle drawn at `--diff-pos`; its `.diff-grip`
 * knob holds the drag affordance.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function diff(prefix = "") {
  const sel = (suffix = "") => `.${prefix}diff${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "grid",
      overflow: "hidden",
      width: "100%",
      isolation: "isolate",
      userSelect: "none",
      touchAction: "none", // let the handle drag on touch without scrolling
      borderRadius: "var(--radius-box, 0.5rem)",
    },

    // Both halves share one grid cell so they overlap pixel-for-pixel.
    [`${sel("-item-1")}, ${sel("-item-2")}`]: {
      gridArea: "1 / 1",
      minWidth: "0",
      overflow: "hidden",
    },
    // Content (usually an <img>) fills each half at identical size so the split
    // lines up across the two layers.
    [`${sel("-item-1")} > *, ${sel("-item-2")} > *`]: {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    // Top layer: clipped from the trailing edge to reveal only up to the split.
    [sel("-item-1")]: {
      zIndex: "1",
      width: "100%",
      clipPath: "inset(0 calc(100% - var(--diff-pos, 50%)) 0 0)",
    },

    // The split handle: a hairline at the split with a centered grip knob.
    [sel("-resizer")]: {
      position: "absolute",
      insetBlock: "0",
      insetInlineStart: "var(--diff-pos, 50%)",
      translate: "-50% 0",
      zIndex: "2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2px",
      backgroundColor:
        "color-mix(in oklab, var(--color-base-100) 85%, transparent)",
      cursor: "ew-resize",
      touchAction: "none",
    },
    [sel("-grip")]: {
      display: "grid",
      placeItems: "center",
      width: "1.75rem",
      height: "1.75rem",
      borderRadius: "9999px",
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      boxShadow: "0 1px 4px color-mix(in oklab, black 25%, transparent)",

      "& svg": { width: "1rem", height: "1rem", flexShrink: "0" },
    },
  };
}
