/**
 * The trailing-affordance contract shared by every field that carries one: the
 * native `<select>` caret, the listbox trigger's chevron, and the Combobox /
 * MultiSelect clear + open buttons.
 *
 * These used to be three independent implementations that drifted — a solid
 * gradient caret at one inset, a stroked SVG chevron at another, a third inside
 * a round hit-button — so a Select and a Combobox stacked in the same form had
 * visibly different marks at visibly different positions. Everything below is
 * the single source of truth; components import it rather than re-deriving it.
 *
 * GEOMETRY. The glyph is centered in a `BOX`-sized square whose trailing edge
 * sits `INSET` from the field's trailing edge. The mark painted inside that
 * square matches the Lucide-style chevron path (`m6 9 6 6 6-6` in a 24 viewBox),
 * which fills only the middle half of its own box — see the mark constants
 * below. Anything drawn to these numbers lands in the same place regardless of
 * how it's drawn, which is the whole point.
 */

/** The glyph box — what an inline `<svg>` is sized to. */
export const BOX = "1rem";
/** Glyph box trailing edge → field trailing edge. Fixed across field sizes: the
 *  affordance is anchored to the edge, so it holds without a per-size override. */
export const INSET = "0.625rem";
/** Hit area for the INTERACTIVE affordances (clear, open). Larger than the
 *  glyph on purpose — the target should be comfortable, the mark shouldn't grow. */
export const HIT = "1.5rem";

// The mark, derived from the SVG chevron it has to match: path `m6 9 6 6 6-6`
// in a 24 viewBox, stroke-width 2, round caps. Scaled to BOX, each arm spans
// 6/24 = 0.25rem in x and the same in y (a true 45° arm, so its tile is square),
// and the round caps overshoot each endpoint by half a stroke — 1/24 = 0.0417rem
// — which is why the tile is a little larger than the bare arm. Without that
// overshoot the gradient version measures ~1.5px narrower than the SVG one.
const ARM = 0.25;
const HALF_STROKE_LEN = 1 / 24;
/** Overshoot resolved onto the x/y axes: half a stroke along a 45° diagonal. */
const CAP = HALF_STROKE_LEN * Math.SQRT1_2;
/** One arm's tile — square, so the 45° band exits at opposite corners. */
const HALF_MARK_W = `${(ARM + 2 * CAP).toFixed(4)}rem`;
const MARK_H = HALF_MARK_W;
/** The mark's trailing edge, measured in from the glyph box's trailing edge: the
 *  path stops at 18/24 of the box and the cap carries it a touch further. */
const MARK_END = `${(1 - 0.75 - CAP).toFixed(4)}rem`;
/** Half the stroke, measured across the gradient axis — the band's half-width.
 *  Same 1/24-of-BOX the cap overshoot is derived from; in px because a gradient
 *  colour stop is resolved along the axis, not against the tile's own size. */
const HALF_STROKE = `${(HALF_STROKE_LEN * 16).toFixed(3)}px`;

/** Resting ink for an affordance — de-emphasized against the field's own text,
 *  which is the one thing here meant to be read. */
export const INK = "color-mix(in oklab, var(--color-base-content) 60%, transparent)";
/** Hover/active ink for the interactive ones. */
export const INK_ACTIVE = "var(--color-base-content)";

/**
 * Trailing room a field must reserve so its text never runs under the
 * affordances. One glyph box plus a readable gap for a passive caret; for the
 * interactive ones the HIT boxes are wider than the glyph, so the reserve grows
 * by a full hit-width per extra slot.
 *
 * @param {number} [count] - how many affordances ride the trailing edge.
 */
export function textClearance(count = 1) {
  if (count <= 1) return `calc(${INSET} + ${BOX} + 0.5rem)`;
  // Slot n's leading edge = center of the glyph box + (n − ½) hit-widths.
  const center = `calc(${INSET} + ${BOX} / 2)`;
  return `calc(${center} + ${count - 0.5} * ${HIT} + 0.375rem)`;
}

/** Clearance for the common single-affordance case (the native select caret). */
export const TEXT_CLEARANCE = textClearance(1);

/**
 * The chevron, drawn with background-gradients for hosts that can carry no
 * child and no pseudo-element — i.e. a native `<select>`.
 *
 * Two square tiles sit side by side; each carries one hard-stopped diagonal
 * BAND (not a filled half), so the pair reads as a STROKED "v" matching the SVG
 * chevron rather than the solid wedge this used to draw. A 45deg gradient axis
 * puts its bands on the "\" diagonal and 135deg on the "/", and a band through a
 * square's center exits at opposite corners — so the left tile's stroke lands at
 * the bottom of the shared edge and the right tile's meets it there.
 *
 * Gradients (unlike an SVG data-URI, which is a separate document and cannot
 * resolve `currentColor` or a CSS var) take a live color value, so the mark
 * follows the theme — that constraint is why this isn't just an inline SVG.
 */
export function caretBackground(color = INK) {
  const band = (angle) =>
    `linear-gradient(${angle}, transparent calc(50% - ${HALF_STROKE}), ` +
    `${color} calc(50% - ${HALF_STROKE}), ${color} calc(50% + ${HALF_STROKE}), ` +
    `transparent calc(50% + ${HALF_STROKE}))`;

  const tile = `${HALF_MARK_W} ${MARK_H}`;
  // `100%` aligns a tile's RIGHT edge to the box's right edge, so each offset is
  // measured trailing-edge-inward: glyph box starts at INSET, and the mark stops
  // MARK_END short of that box's own trailing edge.
  const rightTileEnd = `calc(100% - ${INSET} - ${MARK_END})`;
  const leftTileEnd = `calc(100% - ${INSET} - ${MARK_END} - ${HALF_MARK_W})`;

  return {
    backgroundImage: `${band("45deg")}, ${band("135deg")}`,
    backgroundSize: `${tile}, ${tile}`,
    backgroundPosition: `${leftTileEnd} center, ${rightTileEnd} center`,
    backgroundRepeat: "no-repeat, no-repeat",
  };
}

/**
 * A round, absolutely-positioned icon button riding the field's trailing edge
 * (Combobox / MultiSelect clear + open). The HIT area is centered on the same
 * glyph box every other affordance uses, so the mark inside it aligns with a
 * Select's caret even though the button around it is bigger.
 *
 * @param {number} [slot] - 0 = trailing-most, 1 = the next one inward.
 * @param {object} [opts]
 * @param {boolean} [opts.unborderedWrapper] - set when the positioning ancestor
 *   is a bare wrapper and the BORDER lives on an inner field (Combobox's
 *   `.combobox-control` around `.input`). Absolute offsets then resolve against
 *   the wrapper's border box rather than the field's padding box, which lands
 *   the glyph one border-width shy of where every other affordance sits — so
 *   step in by that width and keep the inset honest.
 */
export function affordanceButton(slot = 0, { unborderedWrapper = false } = {}) {
  // Center the HIT box on the glyph box, then step inward one hit-width per slot.
  const border = unborderedWrapper ? " + var(--border, 1px)" : "";
  const center = `calc(${INSET} + ${BOX} / 2${border})`;
  return {
    position: "absolute",
    top: "0",
    bottom: "0",
    marginBlock: "auto",
    insetInlineEnd: `calc(${center} - ${HIT} / 2 + ${slot} * ${HIT})`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: HIT,
    height: HIT,
    padding: "0",
    border: "0",
    background: "none",
    borderRadius: "9999px",
    color: INK,
    cursor: "pointer",
    "& svg": { width: BOX, height: BOX },
    "&:hover": { color: INK_ACTIVE },
    "&:focus-visible": {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "1px",
    },
  };
}

/** The inline (flex-item) chevron — for triggers that CAN carry a child. */
export function affordanceIcon() {
  return {
    display: "inline-flex",
    flexShrink: "0",
    color: INK,
    "& svg": {
      width: BOX,
      height: BOX,
      transition: "transform var(--duration, 150ms) var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },
  };
}
