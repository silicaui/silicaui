import * as React from "react";

export interface UseThemeOptions {
  /** Element carrying `data-theme`. Default `document.documentElement`. */
  target?: HTMLElement | null | (() => HTMLElement | null);
  /** localStorage key for persistence; `null` disables it. Default `"silica-theme"`. */
  storageKey?: string | null;
}

/**
 * Reads and writes the active `[data-theme]` — the same attribute
 * `ThemeController` drives, and the model every Silica component's dark-mode
 * styling is scoped to. Reactive: updates if the theme changes elsewhere
 * (another `ThemeController` instance, a host toggling it directly).
 *
 *   const [theme, setTheme] = useTheme();
 *   setTheme(theme === "dark" ? "light" : "dark");
 */
export function useTheme(
  options: UseThemeOptions = {},
): [string | undefined, (theme: string) => void] {
  const { target, storageKey = "silica-theme" } = options;

  const getTarget = React.useCallback((): HTMLElement | null => {
    if (typeof target === "function") return target();
    if (target) return target;
    return typeof document !== "undefined" ? document.documentElement : null;
  }, [target]);

  // Always start `undefined` (never read `getTarget()` here) so the first
  // client render matches SSR output — the effect below re-syncs to the real
  // value immediately after mount, same as useMediaQuery's SSR-safe pattern.
  // Reading the DOM in the initializer would make the client's pre-hydration
  // render disagree with the server's (which has no `document`), causing a
  // hydration mismatch the moment this hook renders under SSR/static export.
  const [theme, setThemeState] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const el = getTarget();
    if (!el || typeof MutationObserver === "undefined") return;
    setThemeState(el.dataset.theme);
    const observer = new MutationObserver(() => setThemeState(el.dataset.theme));
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [getTarget]);

  const setTheme = React.useCallback(
    (next: string) => {
      const el = getTarget();
      if (el) el.dataset.theme = next;
      if (storageKey && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [getTarget, storageKey],
  );

  return [theme, setTheme];
}
