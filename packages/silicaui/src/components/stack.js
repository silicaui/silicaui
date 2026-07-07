/**
 * The Stack component — layers its children into a peeking deck.
 *
 * Colorless. All children share one grid cell (`grid-area: 1/1`); the first
 * child sits flush on top, and the next two peek out behind it, each nudged and
 * scaled down a touch. `-bottom` makes the deck peek downward; `-start` /
 * `-end` fan it to the sides. Great for stacked cards, notification piles, or
 * image decks.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function stack(prefix = "") {
  const sel = (suffix = "") => `.${prefix}stack${suffix}`;

  return {
    [sel()]: {
      display: "inline-grid",
      placeItems: "center",

      "& > *": {
        gridColumnStart: "1",
        gridRowStart: "1",
        width: "100%",
        // Third card and beyond: smallest, furthest back.
        transform: "translateY(-1.5rem) scale(0.85)",
        zIndex: "1",
        // Animate re-stacking when the order changes (interactive cycling).
        transition: "transform 0.3s var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      },
      // Second card: mid.
      "& > *:nth-child(2)": {
        transform: "translateY(-0.75rem) scale(0.925)",
        zIndex: "2",
      },
      // Front card: flush and on top.
      "& > *:first-child": {
        transform: "translateY(0) scale(1)",
        zIndex: "3",
      },
    },

    // Peek downward instead of up.
    [sel("-bottom")]: {
      "& > *": { transform: "translateY(1.5rem) scale(0.85)" },
      "& > *:nth-child(2)": { transform: "translateY(0.75rem) scale(0.925)" },
      "& > *:first-child": { transform: "translateY(0) scale(1)" },
    },

    // Fan to the inline start / end.
    [sel("-start")]: {
      "& > *": { transform: "translateX(-1.5rem) scale(0.85)" },
      "& > *:nth-child(2)": { transform: "translateX(-0.75rem) scale(0.925)" },
      "& > *:first-child": { transform: "translateX(0) scale(1)" },
    },
    [sel("-end")]: {
      "& > *": { transform: "translateX(1.5rem) scale(0.85)" },
      "& > *:nth-child(2)": { transform: "translateX(0.75rem) scale(0.925)" },
      "& > *:first-child": { transform: "translateX(0) scale(1)" },
    },
  };
}
