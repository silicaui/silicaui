/**
 * Vanilla mirror of `@wizeworks/silicaui-react`'s `useBreakpoint`/`useMediaQuery` — the
 * same Tailwind-v4-default `min-width` scale every `sm:`/`md:`/… utility in
 * Silica resolves against (kept in sync with `silicaui-react/src/lib/use-breakpoint.ts`
 * by hand — the marker contract stays dependency-free, so this can't import it).
 */
export const SILICA_BREAKPOINTS = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type SilicaBreakpoint = keyof typeof SILICA_BREAKPOINTS;

/** Whether the viewport currently matches (is at least as wide as) `breakpoint`. */
export function matchBreakpoint(breakpoint: SilicaBreakpoint): boolean {
  return window.matchMedia(`(min-width: ${SILICA_BREAKPOINTS[breakpoint]})`).matches;
}

/** Subscribe to a Silica breakpoint crossing. Returns an unsubscribe function. */
export function onBreakpointChange(
  breakpoint: SilicaBreakpoint,
  callback: (matches: boolean) => void,
): () => void {
  const mql = window.matchMedia(`(min-width: ${SILICA_BREAKPOINTS[breakpoint]})`);
  const handler = () => callback(mql.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
