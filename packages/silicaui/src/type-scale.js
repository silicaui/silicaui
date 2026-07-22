/**
 * The type scale — @wizeworks/silicaui's `text-*` size ladder, and the SINGLE
 * source of truth for it.
 *
 * The plugin registers this as `theme.extend.fontSize` (see index.js) so Tailwind
 * emits `text-xs` … `text-10xl`, and the MCP catalog generator imports the SAME
 * object so the documented scale can never drift from what the plugin actually
 * ships. Exposed as `@wizeworks/silicaui/type-scale` for anyone who wants to build
 * a size picker or safelist from the canonical scale rather than re-typing it.
 *
 * Anchored to a 16px root (index.js declares `100%`, honoring a user's own browser
 * setting): `text-md` (== `text-base`) is 1rem = 16px — the worldwide default body
 * size — so the scale reads as a self-documenting xs → sm → MD → lg… ladder rather
 * than leaving 16px an accidental Tailwind default. `md` is the named alias
 * @wizeworks/silicaui code should reach for; always prefer a scale step over a
 * `text-[13px]`-style magic number.
 *
 * xs–9xl match Tailwind's own defaults (nothing shifts) but are declared EXPLICITLY
 * rather than left to Tailwind — otherwise the ladder @wizeworks/silicaui "owns"
 * quietly stopped at 7xl while 8xl/9xl leaked in from the framework default, so the
 * top of the scale wasn't self-documenting. `10xl` (10rem) extends past Tailwind's
 * ceiling for oversized hero/display type.
 *
 * Shape matches Tailwind's `fontSize` theme: `[fontSize, { lineHeight }]`.
 */
export const TYPE_SCALE = {
  xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
  sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
  md: ["1rem", { lineHeight: "1.5rem" }], // 16px — base / world standard
  base: ["1rem", { lineHeight: "1.5rem" }], // 16px — alias of md
  lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
  xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
  "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
  "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
  "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
  "5xl": ["3rem", { lineHeight: "1" }], // 48px
  "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
  "7xl": ["4.5rem", { lineHeight: "1" }], // 72px
  "8xl": ["6rem", { lineHeight: "1" }], // 96px — matches Tailwind default
  "9xl": ["8rem", { lineHeight: "1" }], // 128px — matches Tailwind default
  "10xl": ["10rem", { lineHeight: "1" }], // 160px — beyond Tailwind's ceiling
};
