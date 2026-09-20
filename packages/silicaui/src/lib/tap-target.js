/**
 * Give a small control a full-size hit area without changing what it looks like.
 *
 * WCAG 2.2 SC 2.5.8 (Target Size, Minimum — level AA) asks for 24 × 24 CSS px.
 * Five Silica controls are drawn smaller than that on purpose, because making
 * the MARK bigger would be wrong: a 24px × on a 23px chip swallows the chip, and
 * a 24px carousel dot stops reading as a dot.
 *
 * Measured at 360px on a real build:
 *
 *   .tag-input-remove          16 × 16
 *   .multi-select-chip-remove  16 × 16
 *   .power-search-chip-remove  16 × 16
 *   .carousel-dot              24 × 8
 *   .tree-view-toggle          11 × 24
 *
 * The success criterion is about the TARGET, not the paint, so the repair is to
 * grow the target and leave the paint alone: an absolutely-positioned `::after`
 * centred on the control, sized to the minimum, inheriting nothing visible. The
 * pseudo-element is a child of the button, so a pointer landing on it hits the
 * button — no JavaScript, no layout shift, no visual change at all.
 *
 * `inset` is negative by exactly half the shortfall on each axis, so a 16px
 * control gets `-4px` and a 24 × 8 dot gets `0 -8px`. Where a control is already
 * large enough on one axis, that axis gets `0` rather than a negative value —
 * growing a 24px dimension to 24px would be a no-op that still widens the box
 * and could reach a neighbour.
 *
 * WHY NOT JUST PAD. Padding changes the border-box, which moves the chip, the
 * dot row and the tree row. This is deliberately the version with no layout
 * consequence, so it can be applied to five shipped components at once without
 * any of them redrawing.
 */

/** WCAG 2.2 SC 2.5.8, level AA. */
export const MIN_TARGET_PX = 24;

/**
 * The declarations that expand a control's hit area to `MIN_TARGET_PX`.
 *
 * @param {number} width   the control's drawn width in px
 * @param {number} height  the control's drawn height in px
 * @returns {object} declarations to spread into the rule
 */
export function hitArea(width, height) {
  const growX = Math.max(0, (MIN_TARGET_PX - width) / 2);
  const growY = Math.max(0, (MIN_TARGET_PX - height) / 2);
  if (growX === 0 && growY === 0) return {};
  return {
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      // `top/right/bottom/left` rather than the `inset` shorthand: the shorthand
      // is fine in a browser, but these declarations are also read back by the
      // node-tree projection's tests, which compare property names.
      top: `-${growY}px`,
      right: `-${growX}px`,
      bottom: `-${growY}px`,
      left: `-${growX}px`,
      borderRadius: "inherit",
    },
  };
}
