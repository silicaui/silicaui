/**
 * The ScrollStrip component — a horizontal strip that SAYS SO when part of it
 * is off-screen.
 *
 * Colorless. `overflow-x: auto` on its own is a trap on anything that can be
 * dragged narrow: the content is reachable, but the only thing announcing it
 * exists is a scrollbar the platform may not draw at all (overlay scrollbars
 * on macOS/iOS/Android draw nothing until you already scroll). A tab strip
 * that ends at "Activity" with two more tabs past the edge simply does not
 * have those tabs, as far as the person looking at it is concerned.
 *
 * Structure: `.scroll-strip` (row) › `.scroll-strip-control` +
 * `.scroll-strip-track` (the real scroller) + `.scroll-strip-control`.
 *
 * ── The controls are IN FLOW, never overlaid ─────────────────────────────
 *
 * `.carousel-control` is absolutely positioned over the slide, which is right
 * for a photo deck — there's nothing at the edge worth reading. A strip's
 * edges are exactly where the content you're hunting for lives, so an overlay
 * chevron covers the tab you were trying to read. These take their own space
 * and push the scroller in instead.
 *
 * ── Why a disabled control keeps its space ───────────────────────────────
 *
 * At an end the control is `:disabled`, not removed: unmounting it would
 * widen the scroller, which can erase the very overflow that justified it,
 * which re-mounts it — an oscillation with no fixed point. So the presence of
 * the PAIR is driven by overflow and each one's `:disabled` by position. A
 * runtime that hides them must hide BOTH (see the `scroll-strip` behavior).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function scrollStrip(prefix = "") {
  const sel = (suffix = "") => `.${prefix}scroll-strip${suffix}`;

  // A control's box and the glyph inside it, per size. Same `--size-field`
  // density ladder every other control in the system is cut from.
  const sizes = {
    xs: ["calc(var(--size-field, 0.25rem) * 6)", "0.75rem"],
    sm: ["calc(var(--size-field, 0.25rem) * 7)", "0.875rem"],
    md: ["calc(var(--size-field, 0.25rem) * 8)", "1rem"],
    lg: ["calc(var(--size-field, 0.25rem) * 10)", "1.25rem"],
    xl: ["calc(var(--size-field, 0.25rem) * 12)", "1.5rem"],
  };

  const rules = {
    [sel()]: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      // Without this a flex/grid parent sizes the strip to its CONTENT, so it
      // never overflows and the whole component is a no-op. This is the single
      // most common way the pattern is gotten wrong by hand.
      minWidth: "0",
      maxWidth: "100%",
    },

    [sel("-track")]: {
      minWidth: "0",
      flex: "1 1 auto",
      display: "flex",
      alignItems: "center",
      overflowX: "auto",
      overflowY: "hidden",
      // The nudge buttons call `scrollBy` with no `behavior`, which per spec
      // resolves to this property — so the reduced-motion rule at the bottom
      // governs the buttons too, with no matching branch in any runtime.
      scrollBehavior: "smooth",
      // Keep a trackpad flick inside the strip instead of triggering the
      // browser's back-navigation gesture once it reaches an end.
      overscrollBehaviorX: "contain",
      // The scrollbar is suppressed ONLY because the controls now carry the
      // same message; a strip one row tall looks broken with a bar across it.
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      // A strip's children must keep their natural width — the default
      // `flex-shrink: 1` squeezes them to fit instead, so nothing ever
      // overflows and nothing ever scrolls.
      "& > *": { flexShrink: "0" },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-primary)",
        outlineOffset: "-2px",
      },
    },

    [sel("-control")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "var(--scroll-strip-control-size, calc(var(--size-field, 0.25rem) * 8))",
      height: "var(--scroll-strip-control-size, calc(var(--size-field, 0.25rem) * 8))",
      padding: "0",
      border: "0",
      borderRadius: "9999px",
      backgroundColor: "transparent",
      color: "var(--color-base-content)",
      cursor: "pointer",
      transition:
        "background-color var(--duration, 150ms), opacity var(--duration, 150ms)",

      "& svg": {
        width: "var(--scroll-strip-icon-size, 1rem)",
        height: "var(--scroll-strip-icon-size, 1rem)",
        flexShrink: "0",
      },
      // Tailwind's preflight already forces this, but the `-html` projection
      // is consumed by hosts that ship the plugin without preflight, and a
      // runtime hiding the pair via `hidden` must not be silently overridden
      // by the `display` this very rule sets.
      "&[hidden]": { display: "none" },
      "&:hover": { backgroundColor: "var(--color-base-200)" },
      "&:active": { backgroundColor: "var(--color-base-300)" },
      // At an end it dims and stops responding, but keeps its footprint — the
      // strip must not jump sideways just because you scrolled to the edge.
      "&:disabled": {
        opacity: "var(--disabled-opacity, 0.4)",
        cursor: "default",
        backgroundColor: "transparent",
      },
      "&:focus-visible": {
        outline: "var(--focus-width, 2px) solid var(--color-base-content)",
        outlineOffset: "var(--focus-offset, 2px)",
      },
    },

    // In a RTL document the flex row already reverses, so the first control
    // sits on the right — which is correct, it still means "toward the start".
    // Only the glyph needs turning around.
    [`[dir="rtl"] ${sel("-control")} svg`]: { transform: "scaleX(-1)" },
  };

  for (const [name, [box, icon]] of Object.entries(sizes)) {
    rules[sel(`-${name}`)] = {
      "--scroll-strip-control-size": box,
      "--scroll-strip-icon-size": icon,
    };
  }

  // ---- Edge fade (opt-in) --------------------------------------------------
  //
  // A second, quieter signal than the controls: the controls say "this can
  // scroll", the fade says "the content continues right here". It is opt-in
  // rather than default because fading is a deliberate signal — the honest
  // in-flow buttons are the baseline, and a strip whose content is fully
  // visible must never look dimmed at the edges.
  //
  // The clipped side is the only side that fades: a runtime stamps
  // `data-at-start` / `data-at-end` on the root and those collapse the
  // corresponding stop to zero, so the fade appears and disappears with the
  // clipping it describes rather than sitting there permanently.
  const FADE = "var(--scroll-strip-fade, 1.5rem)";
  Object.assign(rules, {
    [`${sel("-faded")} > ${sel("-track")}`]: {
      "--scroll-strip-fade-start": FADE,
      "--scroll-strip-fade-end": FADE,
      // Physical mapping, because `linear-gradient` has no logical directions
      // (`to inline-end` is not a thing). The two values swap under RTL below;
      // every other layer stays purely logical.
      "--scroll-strip-fade-left": "var(--scroll-strip-fade-start)",
      "--scroll-strip-fade-right": "var(--scroll-strip-fade-end)",
      // Only the standard property — Lightning CSS derives `-webkit-mask-image`
      // from browserslist, and hand-writing both makes it collapse the pair to
      // the prefixed one, silently dropping the standard one (the bug `.glass`
      // hit with backdrop-filter).
      maskImage:
        "linear-gradient(to right," +
        " transparent 0," +
        " #000 var(--scroll-strip-fade-left)," +
        " #000 calc(100% - var(--scroll-strip-fade-right))," +
        " transparent 100%)",
    },
    [`${sel("-faded")}[data-at-start] > ${sel("-track")}`]: {
      "--scroll-strip-fade-start": "0px",
    },
    [`${sel("-faded")}[data-at-end] > ${sel("-track")}`]: {
      "--scroll-strip-fade-end": "0px",
    },
    [`[dir="rtl"] ${sel("-faded")} > ${sel("-track")}`]: {
      "--scroll-strip-fade-left": "var(--scroll-strip-fade-end)",
      "--scroll-strip-fade-right": "var(--scroll-strip-fade-start)",
    },
  });

  // Smooth scrolling is the animation here; honoring the preference in CSS
  // means the JS `scrollBy` inherits it (see `scroll-behavior` above).
  rules["@media (prefers-reduced-motion: reduce)"] = {
    [sel("-track")]: { scrollBehavior: "auto" },
  };

  return rules;
}
