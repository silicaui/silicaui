/**
 * Canvas vocabulary — the SINGLE source of truth for every literal utility class
 * a node can wear through the Inspector's controls.
 *
 * WHY THIS FILE EXISTS. The builder canvas renders schema (DB data) at runtime,
 * which Tailwind's scanner never sees — so every utility a node can wear has to
 * be a LITERAL string somewhere the scanner CAN see. Inside this repo that's the
 * builder's own `@source src/**` scan. A CONSUMER embedding `<Builder>` (e.g.
 * sparx) has the same problem for the pages the builder produces: their Tailwind
 * build must safelist the same set, and hand-copying it guarantees drift.
 *
 * So this module is the one place the vocab is declared, the Inspector imports
 * its controls FROM here (it can't drift from what it renders), and consumers
 * import `CANVAS_UTILITY_CLASSES` to generate their safelist from the same
 * source. It is deliberately NOT a generator — just the list, plus the container
 * breakpoint prefixes as a documented pattern for anyone who safelists responsive
 * variants of it (see `CONTAINER_BREAKPOINTS`).
 *
 * Framework-neutral (pure data, no React) so it ships as its own entry
 * (`@wizeworks/silicaui-builder/vocab`).
 */

/** One selectable value in a control group: the literal class + its UI label. */
export interface VocabItem {
  readonly cls: string;
  readonly label: string;
}

// ── type ─────────────────────────────────────────────────────────────────────
export const FONT_SIZE: readonly VocabItem[] = [
  { cls: "text-xs", label: "XS" },
  { cls: "text-sm", label: "SM" },
  { cls: "text-md", label: "MD" },
  { cls: "text-lg", label: "LG" },
  { cls: "text-xl", label: "XL" },
  { cls: "text-2xl", label: "2XL" },
  { cls: "text-3xl", label: "3XL" },
  { cls: "text-4xl", label: "4XL" },
  { cls: "text-5xl", label: "5XL" },
];
export const WEIGHT: readonly VocabItem[] = [
  { cls: "font-normal", label: "Normal" },
  { cls: "font-medium", label: "Medium" },
  { cls: "font-semibold", label: "Semibold" },
  { cls: "font-bold", label: "Bold" },
];
export const ALIGN: readonly VocabItem[] = [
  { cls: "text-left", label: "Left" },
  { cls: "text-center", label: "Center" },
  { cls: "text-right", label: "Right" },
];
// Padding: a uniform shorthand plus a per-axis pair. The three arrays MUST stay
// index-aligned on the same scale — `setPadAxis` expands `p-4` into the opposite
// axis by INDEX (`PADDING[i]` → `PAD_Y[i]`), which is what keeps every class a
// literal string (the safelist can't see a composed `py-${n}`).
export const PADDING: readonly VocabItem[] = [
  { cls: "p-0", label: "0" },
  { cls: "p-2", label: "2" },
  { cls: "p-3", label: "3" },
  { cls: "p-4", label: "4" },
  { cls: "p-6", label: "6" },
  { cls: "p-8", label: "8" },
  { cls: "p-10", label: "10" },
  { cls: "p-12", label: "12" },
  { cls: "p-16", label: "16" },
];
export const PAD_X: readonly VocabItem[] = [
  { cls: "px-0", label: "0" },
  { cls: "px-2", label: "2" },
  { cls: "px-3", label: "3" },
  { cls: "px-4", label: "4" },
  { cls: "px-6", label: "6" },
  { cls: "px-8", label: "8" },
  { cls: "px-10", label: "10" },
  { cls: "px-12", label: "12" },
  { cls: "px-16", label: "16" },
];
export const PAD_Y: readonly VocabItem[] = [
  { cls: "py-0", label: "0" },
  { cls: "py-2", label: "2" },
  { cls: "py-3", label: "3" },
  { cls: "py-4", label: "4" },
  { cls: "py-6", label: "6" },
  { cls: "py-8", label: "8" },
  { cls: "py-10", label: "10" },
  { cls: "py-12", label: "12" },
  { cls: "py-16", label: "16" },
];
export const RADIUS: readonly VocabItem[] = [
  { cls: "rounded-none", label: "None" },
  { cls: "rounded-field", label: "Field" },
  { cls: "rounded-box", label: "Box" },
  { cls: "rounded-full", label: "Full" },
];
// ── sizing ─────────────────────────────────────────────────────────────────
export const WIDTH: readonly VocabItem[] = [
  { cls: "w-full", label: "Full" },
  { cls: "w-1/2", label: "1/2" },
  { cls: "w-1/3", label: "1/3" },
  { cls: "w-2/3", label: "2/3" },
  { cls: "w-fit", label: "Fit" },
];
export const MAX_WIDTH: readonly VocabItem[] = [
  { cls: "max-w-none", label: "None" },
  { cls: "max-w-xs", label: "XS" },
  { cls: "max-w-sm", label: "SM" },
  { cls: "max-w-md", label: "MD" },
  { cls: "max-w-lg", label: "LG" },
  { cls: "max-w-xl", label: "XL" },
  { cls: "max-w-2xl", label: "2XL" },
  { cls: "max-w-3xl", label: "3XL" },
  { cls: "max-w-4xl", label: "4XL" },
  { cls: "max-w-5xl", label: "5XL" },
  { cls: "max-w-full", label: "Full" },
];
// Horizontal position via auto side margins — how a width/max-width-constrained
// block sits in its parent (e.g. `max-w-4xl` + `mx-auto` to center a section).
export const POSITION: readonly VocabItem[] = [
  { cls: "mr-auto", label: "Left" },
  { cls: "mx-auto", label: "Center" },
  { cls: "ml-auto", label: "Right" },
];
// Self-alignment on the cross axis — only meaningful when the node's parent is
// a flex or grid container, but offered unconditionally like the rest of this vocab.
export const SELF_ALIGN: readonly VocabItem[] = [
  { cls: "self-start", label: "Start" },
  { cls: "self-center", label: "Center" },
  { cls: "self-end", label: "End" },
  { cls: "self-stretch", label: "Stretch" },
];
// Main-axis sizing for a flex CHILD — the counterpart to SELF_ALIGN's cross axis,
// and (like it) offered unconditionally since the governing parent isn't visible
// from here. `flex-auto` is omitted: its natural label would be "Auto", which
// already means "clear this group" on every ChipGroup.
export const FLEX_CHILD: readonly VocabItem[] = [
  { cls: "flex-1", label: "Fill" },
  { cls: "grow", label: "Grow" },
  { cls: "flex-none", label: "Fixed" },
];
// ── container layout (the PARENT side of flex/grid) ──────────────────────────
export const DISPLAY: readonly VocabItem[] = [
  { cls: "block", label: "Block" },
  { cls: "flex", label: "Flex" },
  { cls: "grid", label: "Grid" },
];
export const DIRECTION: readonly VocabItem[] = [
  { cls: "flex-row", label: "Row" },
  { cls: "flex-col", label: "Column" },
];
// Main-axis distribution. `justify-stretch` is deliberately absent: it's a
// grid-track rule and a no-op on flex items with an intrinsic size, so offering
// it would be a chip that does nothing.
export const JUSTIFY: readonly VocabItem[] = [
  { cls: "justify-start", label: "Start" },
  { cls: "justify-center", label: "Center" },
  { cls: "justify-end", label: "End" },
  { cls: "justify-between", label: "Between" },
  { cls: "justify-around", label: "Around" },
  { cls: "justify-evenly", label: "Evenly" },
];
export const ITEMS: readonly VocabItem[] = [
  { cls: "items-start", label: "Start" },
  { cls: "items-center", label: "Center" },
  { cls: "items-end", label: "End" },
  { cls: "items-stretch", label: "Stretch" },
  { cls: "items-baseline", label: "Baseline" },
];
export const GAP: readonly VocabItem[] = [
  { cls: "gap-0", label: "0" },
  { cls: "gap-1", label: "1" },
  { cls: "gap-2", label: "2" },
  { cls: "gap-3", label: "3" },
  { cls: "gap-4", label: "4" },
  { cls: "gap-6", label: "6" },
  { cls: "gap-8", label: "8" },
];
export const WRAP: readonly VocabItem[] = [
  { cls: "flex-wrap", label: "Wrap" },
  { cls: "flex-nowrap", label: "No wrap" },
];
export const GRID_COLS: readonly VocabItem[] = [
  { cls: "grid-cols-1", label: "1" },
  { cls: "grid-cols-2", label: "2" },
  { cls: "grid-cols-3", label: "3" },
  { cls: "grid-cols-4", label: "4" },
];
// ── Button family (silicaui component classes) ───────────────────────────────
export const BTN_VARIANT: readonly VocabItem[] = [
  { cls: "btn-outline", label: "Outline" },
  { cls: "btn-ghost", label: "Ghost" },
  { cls: "btn-soft", label: "Soft" },
  { cls: "btn-link", label: "Link" },
];
export const BTN_SIZE: readonly VocabItem[] = [
  { cls: "btn-xs", label: "XS" },
  { cls: "btn-sm", label: "SM" },
  { cls: "btn-md", label: "MD" },
  { cls: "btn-lg", label: "LG" },
];
// ── animation presets (silicaui `sui-animate-*`/`sui-reveal-*`/`sui-hover-*`) ─
// Load/Scroll share the same preset NAMES under a different class prefix; Hover
// has its own small set (interactive feedback, not an entrance shape).
export const ANIMATE_LOAD_PRESET: readonly VocabItem[] = [
  { cls: "sui-animate-fade-in", label: "Fade in" },
  { cls: "sui-animate-slide-up", label: "Slide up" },
  { cls: "sui-animate-slide-down", label: "Slide down" },
  { cls: "sui-animate-slide-left", label: "Slide left" },
  { cls: "sui-animate-slide-right", label: "Slide right" },
  { cls: "sui-animate-scale-in", label: "Scale in" },
  { cls: "sui-animate-zoom-in", label: "Zoom in" },
];
export const ANIMATE_SCROLL_PRESET: readonly VocabItem[] = [
  { cls: "sui-reveal-fade-in", label: "Fade in" },
  { cls: "sui-reveal-slide-up", label: "Slide up" },
  { cls: "sui-reveal-slide-down", label: "Slide down" },
  { cls: "sui-reveal-slide-left", label: "Slide left" },
  { cls: "sui-reveal-slide-right", label: "Slide right" },
  { cls: "sui-reveal-scale-in", label: "Scale in" },
  { cls: "sui-reveal-zoom-in", label: "Zoom in" },
];
export const ANIMATE_HOVER_PRESET: readonly VocabItem[] = [
  { cls: "sui-hover-lift", label: "Lift" },
  { cls: "sui-hover-scale", label: "Scale" },
  { cls: "sui-hover-glow", label: "Glow" },
];
export const ANIMATE_DURATION: readonly VocabItem[] = [
  { cls: "sui-duration-fast", label: "Fast" },
  { cls: "sui-duration-normal", label: "Normal" },
  { cls: "sui-duration-slow", label: "Slow" },
];
export const ANIMATE_DELAY: readonly VocabItem[] = [
  { cls: "sui-delay-1", label: "1" },
  { cls: "sui-delay-2", label: "2" },
  { cls: "sui-delay-3", label: "3" },
];
/** Animation trigger — a behavior identifier, NOT a CSS class (excluded from the safelist). */
export const ANIMATE_TRIGGER: readonly { readonly cls: "load" | "scroll" | "hover"; readonly label: string }[] = [
  { cls: "load", label: "Load" },
  { cls: "scroll", label: "Scroll" },
  { cls: "hover", label: "Hover" },
];
export const ALL_ANIMATE_PRESET_CLASSES: readonly string[] = [
  ...ANIMATE_LOAD_PRESET,
  ...ANIMATE_SCROLL_PRESET,
  ...ANIMATE_HOVER_PRESET,
].map((o) => o.cls);

/**
 * Every group of literal utility classes a node can wear through the Inspector —
 * the raw material for `CANVAS_UTILITY_CLASSES`. `ANIMATE_TRIGGER` is excluded on
 * purpose (its values are behavior identifiers, not classes).
 */
export const CANVAS_VOCAB_GROUPS: readonly (readonly VocabItem[])[] = [
  FONT_SIZE,
  WEIGHT,
  ALIGN,
  PADDING,
  PAD_X,
  PAD_Y,
  RADIUS,
  WIDTH,
  MAX_WIDTH,
  POSITION,
  SELF_ALIGN,
  FLEX_CHILD,
  DISPLAY,
  DIRECTION,
  JUSTIFY,
  ITEMS,
  GAP,
  WRAP,
  GRID_COLS,
  BTN_VARIANT,
  BTN_SIZE,
  ANIMATE_LOAD_PRESET,
  ANIMATE_SCROLL_PRESET,
  ANIMATE_HOVER_PRESET,
  ANIMATE_DURATION,
  ANIMATE_DELAY,
];

/**
 * The flat, de-duplicated safelist — every literal utility class a canvas node
 * can wear through the Inspector. Feed this straight into a consumer's Tailwind
 * safelist so their build generates exactly what the canvas can emit, from this
 * source of truth (no hand-copying, no drift).
 *
 * Some entries (`btn-*`, `sui-animate-*`) are silicaui component/animation
 * classes the plugin already ships via `addBase`; keeping them here is harmless
 * (safelisting a non-utility is a Tailwind no-op) and makes the list a complete
 * "what can appear in the schema" answer rather than a partial one.
 */
export const CANVAS_UTILITY_CLASSES: readonly string[] = [
  ...new Set(CANVAS_VOCAB_GROUPS.flatMap((g) => g.map((o) => o.cls))),
];

/**
 * The container-query breakpoint prefixes the canvas responds to (Tailwind v4
 * container variants). The canvas is container-query-first — `setDevice()` resizes
 * the canvas element and blocks reflow via `@container`; viewport breakpoints
 * (`sm:`/`lg:`) are deliberately NOT used here.
 *
 * Provided as a PATTERN, not pre-expanded: if a consumer safelists responsive
 * variants of the vocab, they compose `` `${bp}${cls}` `` (e.g. `@2xl:grid-cols-4`)
 * themselves — silicaui does not ship a generator for that matrix.
 */
export const CONTAINER_BREAKPOINTS: readonly string[] = [
  "@xs:",
  "@sm:",
  "@md:",
  "@lg:",
  "@xl:",
  "@2xl:",
  "@3xl:",
  "@4xl:",
  "@5xl:",
];
