/**
 * Assignable element animations — presets an end user (via a site builder)
 * can apply to ANY element, generated from one preset table so the three
 * trigger class families always stay in sync:
 *
 *   .sui-animate-{preset}  — ON LOAD: a `@keyframes` animation that plays
 *                            automatically on paint. No JS, no attribute.
 *   .sui-reveal-{preset}   — ON SCROLL: sits at its hidden state by default,
 *                            transitions to visible once `[data-sui-inview]`
 *                            lands on the element (set by the `reveal`
 *                            behavior in @wizeworks/silicaui-behaviors) — the
 *                            same idiom Dialog/Popover already use for
 *                            `[data-starting-style]`/`[data-ending-style]`,
 *                            just driven by our own attribute.
 *   .sui-hover-{preset}    — HOVER: a plain `:hover`/`:focus-visible`
 *                            transition. No JS.
 *
 * Naming is deliberately `sui-`, not `animate-`: Tailwind core already ships
 * `animate-spin`/`animate-pulse`/etc, and this package's own keyframes
 * (`silica-spin`, `silica-skeleton`, …) already sidestep that collision by
 * never exposing a bare `.animate-*` class. `sui-` also mirrors the existing
 * `data-sui-*` marker namespace used by behaviors.
 *
 * Speed/delay are separate modifier classes (`.sui-duration-*`,
 * `.sui-delay-*`) that set the `--sui-motion-duration`/`--sui-motion-delay`
 * custom properties a preset reads, each with a `var(--duration-fast, …)`
 * -style fallback — same non-namespace-token convention as `--duration`/
 * `--ease` (see theme.js): the DEFAULT lives in the fallback, so an app's own
 * `--duration-fast` override always wins regardless of layer ordering.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */

const ENTRANCE_PRESETS = {
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  "slide-up": {
    from: { opacity: "0", transform: "translateY(1.5rem)" },
    to: { opacity: "1", transform: "none" },
  },
  "slide-down": {
    from: { opacity: "0", transform: "translateY(-1.5rem)" },
    to: { opacity: "1", transform: "none" },
  },
  "slide-left": {
    from: { opacity: "0", transform: "translateX(1.5rem)" },
    to: { opacity: "1", transform: "none" },
  },
  "slide-right": {
    from: { opacity: "0", transform: "translateX(-1.5rem)" },
    to: { opacity: "1", transform: "none" },
  },
  "scale-in": {
    from: { opacity: "0", transform: "scale(0.92)" },
    to: { opacity: "1", transform: "none" },
  },
  "zoom-in": {
    from: { opacity: "0", transform: "scale(1.08)" },
    to: { opacity: "1", transform: "none" },
  },
};

const HOVER_PRESETS = {
  lift: { transform: "translateY(-0.25rem)" },
  scale: { transform: "scale(1.03)" },
  glow: {
    boxShadow: "0 0 0 6px color-mix(in oklab, var(--color-primary) 25%, transparent)",
  },
};

const MOTION_VARS = {
  duration: "var(--sui-motion-duration, var(--duration-normal, 400ms))",
  delay: "var(--sui-motion-delay, 0ms)",
  ease: "var(--sui-motion-ease, cubic-bezier(.4, 0, .2, 1))",
};

export function animations(prefix = "") {
  const rules = {};

  for (const [name, { from, to }] of Object.entries(ENTRANCE_PRESETS)) {
    rules[`@keyframes silica-${name}`] = { from, to };

    rules[`.${prefix}sui-animate-${name}`] = {
      animationName: `silica-${name}`,
      animationDuration: MOTION_VARS.duration,
      animationDelay: MOTION_VARS.delay,
      animationTimingFunction: MOTION_VARS.ease,
      animationFillMode: "both",
    };

    rules[`.${prefix}sui-reveal-${name}`] = {
      ...from,
      transitionProperty: "opacity, transform",
      transitionDuration: MOTION_VARS.duration,
      transitionDelay: MOTION_VARS.delay,
      transitionTimingFunction: MOTION_VARS.ease,
      "&[data-sui-inview]": to,
    };
  }

  for (const [name, hoverStyle] of Object.entries(HOVER_PRESETS)) {
    rules[`.${prefix}sui-hover-${name}`] = {
      transitionProperty: "transform, box-shadow",
      transitionDuration: MOTION_VARS.duration,
      transitionTimingFunction: MOTION_VARS.ease,
      "&:hover, &:focus-visible": hoverStyle,
    };
  }

  // Speed/delay modifiers — emitted AFTER the preset rules above on purpose:
  // equal-specificity single-class selectors resolve by source order, so a
  // modifier sitting later in the sheet wins over a preset's own default when
  // both classes land on the same element (e.g. `sui-animate-fade-in
  // sui-duration-fast`).
  rules[`.${prefix}sui-duration-fast`] = { "--sui-motion-duration": "var(--duration-fast, 200ms)" };
  rules[`.${prefix}sui-duration-normal`] = { "--sui-motion-duration": "var(--duration-normal, 400ms)" };
  rules[`.${prefix}sui-duration-slow`] = { "--sui-motion-duration": "var(--duration-slow, 700ms)" };
  rules[`.${prefix}sui-delay-1`] = { "--sui-motion-delay": "100ms" };
  rules[`.${prefix}sui-delay-2`] = { "--sui-motion-delay": "250ms" };
  rules[`.${prefix}sui-delay-3`] = { "--sui-motion-delay": "450ms" };

  // Reduced motion: collapse straight to the end state. Belt-and-suspenders on
  // top of the global `--duration: 0.01ms` flattening in theme.js — a
  // slide/scale preset would otherwise still read as a visible jump-cut at
  // 0.01ms, since transform isn't touched by that flattening.
  rules["@media (prefers-reduced-motion: reduce)"] = {
    [`[class*="${prefix}sui-animate-"], [class*="${prefix}sui-reveal-"], [class*="${prefix}sui-hover-"]`]: {
      transition: "none",
      animation: "none",
      opacity: "1",
      transform: "none",
      boxShadow: "none",
    },
  };

  return rules;
}
