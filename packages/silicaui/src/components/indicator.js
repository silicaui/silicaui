/**
 * The Indicator component — pins a small overlay (a Badge, a status dot) to a
 * corner of another element: a notification count on a button, an unread dot on
 * an avatar.
 *
 * Colorless / structural. `.indicator` is the positioning context; the
 * `.indicator-item` sits at the top-end corner by default, nudged half over the
 * edge. `-start` / `-bottom` move it to the other corners (combine them).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function indicator(prefix = "") {
  const sel = (suffix = "") => `.${prefix}indicator${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "inline-flex",
      width: "max-content",
    },

    // Default: top-end, straddling the corner.
    [sel("-item")]: {
      position: "absolute",
      zIndex: "1",
      top: "0",
      insetInlineEnd: "0",
      transform: "translate(50%, -50%)",
      whiteSpace: "nowrap",
    },
    // Horizontal → start (left).
    [`${sel("-item")}${sel("-start")}`]: {
      insetInlineEnd: "auto",
      insetInlineStart: "0",
      transform: "translate(-50%, -50%)",
    },
    // Vertical → bottom.
    [`${sel("-item")}${sel("-bottom")}`]: {
      top: "auto",
      bottom: "0",
      transform: "translate(50%, 50%)",
    },
    // Bottom + start corner.
    [`${sel("-item")}${sel("-bottom")}${sel("-start")}`]: {
      transform: "translate(-50%, 50%)",
    },
  };
}
