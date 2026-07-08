import { useMediaQuery } from "./use-media-query";

/**
 * Silica's breakpoint scale — Tailwind v4's default `min-width`s, the same
 * ones every `sm:`/`md:`/… utility in the codebase already resolves against
 * (Silica doesn't redefine breakpoints; it rides Tailwind's).
 */
export const SILICA_BREAKPOINTS = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type SilicaBreakpoint = keyof typeof SILICA_BREAKPOINTS;

/**
 * Whether the viewport is at least as wide as the given Silica breakpoint —
 * `useMediaQuery` pre-wired to the token scale instead of a raw query string.
 *
 *   const isDesktop = useBreakpoint("lg"); // true once >= 64rem / 1024px
 */
export function useBreakpoint(breakpoint: SilicaBreakpoint): boolean {
  return useMediaQuery(`(min-width: ${SILICA_BREAKPOINTS[breakpoint]})`);
}
