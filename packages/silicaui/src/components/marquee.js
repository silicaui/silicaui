/**
 * The Marquee component — an infinitely-looping ticker strip.
 *
 * Colorless; it moves things, it doesn't paint them. The root (`.marquee`) is
 * the clipping viewport, `.marquee-track` is the thing that actually travels,
 * and `.marquee-group` is ONE copy of the content. A marquee renders its
 * content TWICE (two identical groups) and the track slides by exactly one
 * copy, so the moment the loop restarts the second copy is sitting where the
 * first one began and the seam is invisible.
 *
 * The `-50%` you'll see in every marquee snippet on the web is subtly WRONG
 * the instant there's a gap between items. With gap G and R copies, the track
 * measures `R·group + (R−1)·G`, so `-100%/R` lands `G/R` short of a whole
 * cycle and the strip visibly hitches once per loop. The exact cycle is
 * `group + G` — i.e. `calc((-100% - G) / R)`, which is why the copy count
 * rides along as `--marquee-copies` instead of the usual hard-coded `-50%`.
 * That also means R is a knob: content too narrow to overflow the viewport
 * just gets more copies, no JS measurement anywhere.
 *
 * Speed is a custom property (`--marquee-duration`) rather than a hard-coded
 * animation shorthand, so `.marquee-slow`/`-fast` are pure var-setters and a
 * caller can name any duration inline without fighting specificity — same
 * model as `--sui-motion-duration` in animations.js.
 *
 * Motion is CSS-only. `@wizeworks/silicaui-behaviors`' `marquee` handler adds
 * pause-on-hover and the reduced-motion/editor-preview freeze for non-React
 * output; `.marquee-pause-on-hover` gives path-1 (plain HTML, no JS) the same
 * hover pause without any runtime at all.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function marquee(prefix = "") {
  const sel = (suffix = "") => `.${prefix}marquee${suffix}`;

  // The alpha stencil for the edge fade. `black`/`transparent` here are mask
  // ALPHA stops, not paint — nothing on screen takes this color, so there's no
  // token to read and no light/dark variance to respond to.
  const fade = (dir) =>
    `linear-gradient(to ${dir}, transparent, black var(--marquee-fade), ` +
    `black calc(100% - var(--marquee-fade)), transparent)`;

  return {
    "@keyframes silica-marquee": {
      to: { transform: "translateX(calc((-100% - var(--marquee-gap)) / var(--marquee-copies)))" },
    },
    "@keyframes silica-marquee-vertical": {
      to: { transform: "translateY(calc((-100% - var(--marquee-gap)) / var(--marquee-copies)))" },
    },

    [sel()]: {
      "--marquee-gap": "2rem",
      "--marquee-duration": "40s",
      "--marquee-fade": "4rem",
      "--marquee-copies": "2",
      display: "flex",
      // `hidden` over `clip`: it clips the same, but keeps the root a scroll
      // container, so a focused item deep in the strip can still be scrolled
      // into view — and so the reduced-motion rule below has something to
      // switch to.
      overflow: "hidden",
      maxWidth: "100%",
    },

    [sel("-track")]: {
      display: "flex",
      flexWrap: "nowrap",
      alignItems: "center",
      gap: "var(--marquee-gap)",
      // `max-content`, never `min-width: 100%` — the `-100%` in the keyframe is
      // a percentage of the TRACK's own width, so stretching the track to the
      // viewport when the content is narrower would silently make the loop
      // distance wrong. Content too short to overflow raises `--marquee-copies`
      // instead.
      width: "max-content",
      animationName: "silica-marquee",
      animationDuration: "var(--marquee-duration)",
      animationTimingFunction: "linear",
      animationIterationCount: "infinite",
      willChange: "transform",
    },

    // One copy of the content. `inherit` picks up row/column from the track, so
    // the vertical variant needs no second group rule.
    [sel("-group")]: {
      display: "flex",
      flexDirection: "inherit",
      flexWrap: "nowrap",
      alignItems: "center",
      gap: "var(--marquee-gap)",
      flexShrink: "0",
    },

    // ---- Direction ---------------------------------------------------------

    // Vertical ticker. Needs a height from its parent, same as `.divider-vertical`.
    [sel("-vertical")]: { flexDirection: "column" },
    [`${sel("-vertical")} ${sel("-track")}`]: {
      flexDirection: "column",
      width: "auto",
      height: "max-content",
      animationName: "silica-marquee-vertical",
    },

    // Right-to-left / bottom-to-top.
    [`${sel("-reverse")} ${sel("-track")}`]: { animationDirection: "reverse" },

    // ---- Speed -------------------------------------------------------------

    [sel("-slow")]: { "--marquee-duration": "80s" },
    [sel("-normal")]: { "--marquee-duration": "40s" },
    [sel("-fast")]: { "--marquee-duration": "20s" },

    // ---- Copy count --------------------------------------------------------

    // The keyframe divides by this, so it MUST match the number of
    // `.marquee-group`s actually rendered. It's a class rather than an inline
    // `style` because `toHtml` refuses `style` on principle, and a var-setter
    // class is the one spelling every layer can emit identically.
    [sel("-copies-2")]: { "--marquee-copies": "2" },
    [sel("-copies-3")]: { "--marquee-copies": "3" },
    [sel("-copies-4")]: { "--marquee-copies": "4" },
    [sel("-copies-5")]: { "--marquee-copies": "5" },
    [sel("-copies-6")]: { "--marquee-copies": "6" },

    // ---- Edge fade ---------------------------------------------------------

    // Only the standard property is declared: Lightning CSS generates the
    // `-webkit-` prefix from browserslist, and hand-writing both makes it
    // collapse the pair down to the prefixed one — silently dropping the
    // standard property (the exact bug `.glass` hit with backdrop-filter).
    [sel("-fade")]: { maskImage: fade("right") },
    [`${sel("-vertical")}${sel("-fade")}`]: { maskImage: fade("bottom") },

    // ---- Pause on hover (no JS) --------------------------------------------

    [`${sel("-pause-on-hover")}:hover ${sel("-track")}`]: { animationPlayState: "paused" },
    [`${sel("-pause-on-hover")}:focus-within ${sel("-track")}`]: { animationPlayState: "paused" },

    // The one hook a runtime uses to stop the strip (the behaviors package's
    // editor-preview freeze). An ATTRIBUTE rather than an inline style so
    // play-state has exactly one owner — this stylesheet — and a runtime never
    // has to know which descendant is actually the animated one.
    [`${sel()}[data-sui-paused] ${sel("-track")}`]: { animationPlayState: "paused" },

    // ---- Reduced motion ----------------------------------------------------

    // Stopping the animation dead would strand everything past the first
    // viewport behind `overflow: hidden`, so hand the strip back as a normal
    // scroller — the content stays reachable, it just doesn't move itself.
    "@media (prefers-reduced-motion: reduce)": {
      [sel()]: { overflowX: "auto" },
      [sel("-vertical")]: { overflowX: "hidden", overflowY: "auto" },
      // Two selectors, not one: every rule that ASSIGNS an animation above is
      // two classes deep (`.marquee-vertical .marquee-track`), and a media
      // query adds no specificity — so a bare `.marquee-track` here loses and
      // the vertical variant keeps animating. Match the weight explicitly
      // rather than trusting source order to save it.
      [`${sel("-track")}, ${sel()} ${sel("-track")}`]: { animation: "none" },
    },
  };
}
