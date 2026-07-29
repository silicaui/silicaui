/**
 * `@wizeworks/silicaui-builder/vocab` — the canvas's utility-class vocabulary as
 * consumable data (framework-neutral, no React).
 *
 * Import `CANVAS_UTILITY_CLASSES` to generate a Tailwind safelist that matches
 * exactly what the builder canvas can emit, from silicaui's own source of truth
 * (so it can't drift from what the Inspector renders). See `./site/canvas-vocab`
 * for the full rationale and `CONTAINER_BREAKPOINTS` for the responsive pattern.
 *
 * SAFELIST THE RESPONSIVE SET TOO. The Inspector now authors per breakpoint, so
 * a class it writes may carry a container-variant prefix (`@3xl:grid-cols-2`).
 * A safelist built from `CANVAS_UTILITY_CLASSES` alone covers the base classes
 * and misses every prefixed one — which publishes a document whose responsive
 * rules have no CSS behind them, and looks perfectly correct inside the builder
 * (whose own harness safelists them) right up until it ships.
 *
 * So a host safelist wants BOTH:
 *
 *   import { CANVAS_UTILITY_CLASSES, CANVAS_RESPONSIVE_SAFELIST }
 *     from "@wizeworks/silicaui-builder/vocab";
 *
 *   const safelist = [...CANVAS_UTILITY_CLASSES, ...CANVAS_RESPONSIVE_SAFELIST];
 *
 * `CANVAS_RESPONSIVE_SAFELIST` is generated from the vocab × the breakpoints the
 * Inspector actually offers, so it tracks both automatically. Breakpoints
 * authored by hand beyond that ladder (the raw Classes field reaches the whole
 * container scale) are the host's to compose, from `CONTAINER_BREAKPOINTS`.
 */
export * from "./site/canvas-vocab";
export { CANVAS_RESPONSIVE_SAFELIST } from "./site/canvas-safelist";
export { BREAKPOINT_CHOICES } from "./site/class-tokens";
