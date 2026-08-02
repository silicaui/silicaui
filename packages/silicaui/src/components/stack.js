/**
 * The Stack component — layers its children into a peeking deck.
 *
 * Colorless. All children share one grid cell (`grid-area: 1/1`); the first
 * child sits flush on top, and the next two peek out behind it, each nudged and
 * scaled down a touch. `-bottom` makes the deck peek downward; `-start` /
 * `-end` fan it to the sides. Great for stacked cards, notification piles, or
 * image decks.
 *
 * The nudge is PROPORTIONAL, not a fixed distance. Each card behind the front
 * one is scaled down, and `place-items: center` makes that scale pull its edges
 * inward by `size × (1 − scale) / 2` — 3.75% for the 2nd card, 7.5% for the
 * 3rd. A fixed-rem nudge has to out-run that shrink, so it loses at large
 * sizes: a `1.5rem` translate against a 7.5% shrink stopped peeking entirely
 * above 320px and the deck silently collapsed into a single card.
 *
 * So each transform pays back its own shrink first (the `3.75%` / `7.5%` terms
 * cancel it exactly) and only then translates by `--stack-peek`, which is
 * therefore the REAL, visible peek at any card size. Percentages in a translate
 * resolve against the element's own border box — `translateY` against height,
 * `translateX` against width — so one declaration fans identically whether the
 * card is 128px or 1280px.
 *
 * `--stack-peek` is per-STEP: the 2nd card peeks by one and the 3rd by two, so
 * the deck fans evenly. Override it with `stack-xs`…`stack-xl`, or set the
 * property directly for a bespoke deck — it accepts any length, so
 * `--stack-peek: 12px` works as well as a percentage.
 *
 * SIZING: children stretch to the deck's WIDTH (`width: 100%`) but keep their
 * own height, so a height class belongs on the CARD and a width class on the
 * deck. `place-items: center` is deliberate — a deck of `<img>` would be
 * squashed by a block-axis stretch. A height on the deck itself is therefore
 * an empty box around content-height cards, and since the peek is a share of
 * the card, it will also read as a much smaller fan than asked for.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function stack(prefix = "") {
  const sel = (suffix = "") => `.${prefix}stack${suffix}`;

  // Half the amount each card's own scale pulls its edges in: the 2nd card is
  // at 0.925 → (1 − 0.925) / 2 = 3.75%, the 3rd at 0.85 → 7.5%. Cancelling
  // these is what makes `--stack-peek` mean what it says.
  const SHRINK = { second: "3.75", third: "7.5" };

  /**
   * The transform for one card in one direction. `back` is how many steps
   * behind the front this card sits, which is also its `--stack-peek`
   * multiplier. `sign` is "" for a top/start fan and "-" to flip it — the
   * sign lands on the whole calc rather than each term so neither ever
   * carries a leading `+`.
   */
  const shift = (axis, sign, shrink, back, scale) => ({
    transform:
      `translate${axis}(calc(${sign}${shrink}% ${sign ? "-" : "+"} var(--stack-peek) * ${back}))` +
      ` scale(${scale})`,
  });

  /** All three cards' transforms for one direction. */
  const fan = (axis, sign) => ({
    // Third card and beyond: smallest, furthest back.
    "& > *": shift(axis, sign, SHRINK.third, 2, "0.85"),
    // Second card: mid.
    "& > *:nth-child(2)": shift(axis, sign, SHRINK.second, 1, "0.925"),
    // Front card: flush and on top.
    "& > *:first-child": { transform: `translate${axis}(0) scale(1)` },
  });

  const up = fan("Y", "-");

  return {
    [sel()]: {
      display: "inline-grid",
      placeItems: "center",
      // The visible peek per step, as a share of the card's own size.
      "--stack-peek": "5%",

      "& > *": {
        gridColumnStart: "1",
        gridRowStart: "1",
        width: "100%",
        zIndex: "1",
        // Animate re-stacking when the order changes (interactive cycling).
        transition: "transform 0.3s var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
        ...up["& > *"],
      },
      "& > *:nth-child(2)": { zIndex: "2", ...up["& > *:nth-child(2)"] },
      "& > *:first-child": { zIndex: "3", ...up["& > *:first-child"] },
    },

    // Peek downward instead of up.
    [sel("-bottom")]: fan("Y", ""),

    // Fan to the inline start / end. Same figures — the scale is uniform, and a
    // translateX percentage resolves against width the way translateY does
    // against height.
    [sel("-start")]: fan("X", "-"),
    [sel("-end")]: fan("X", ""),

    // How far the deck fans. Sizes the peek only, so it is orthogonal to
    // direction: `stack stack-end stack-lg` is a wide sideways fan.
    [sel("-xs")]: { "--stack-peek": "2%" },
    [sel("-sm")]: { "--stack-peek": "3.5%" },
    [sel("-md")]: { "--stack-peek": "5%" },
    [sel("-lg")]: { "--stack-peek": "7%" },
    [sel("-xl")]: { "--stack-peek": "9%" },
  };
}
