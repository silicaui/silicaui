import * as React from "react";

/**
 * Reactively tracks a `matchMedia` query. SSR-safe (`false` until mount).
 *
 *   const isWide = useMediaQuery("(min-width: 64rem)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
