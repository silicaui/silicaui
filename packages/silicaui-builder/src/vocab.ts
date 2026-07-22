/**
 * `@wizeworks/silicaui-builder/vocab` — the canvas's utility-class vocabulary as
 * consumable data (framework-neutral, no React).
 *
 * Import `CANVAS_UTILITY_CLASSES` to generate a Tailwind safelist that matches
 * exactly what the builder canvas can emit, from silicaui's own source of truth
 * (so it can't drift from what the Inspector renders). See `./site/canvas-vocab`
 * for the full rationale and `CONTAINER_BREAKPOINTS` for the responsive pattern.
 */
export * from "./site/canvas-vocab";
