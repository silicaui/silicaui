/**
 * Vanilla mirror of `@wizeworks/silicaui-react`'s `useTheme` — reads/writes the same
 * `[data-theme]` attribute every Silica component's dark-mode styling is
 * scoped to, for a host with no React.
 */

const DEFAULT_STORAGE_KEY = "silica-theme";

export function getTheme(target: HTMLElement = document.documentElement): string | undefined {
  return target.dataset.theme;
}

export interface SetThemeOptions {
  target?: HTMLElement;
  /** localStorage key for persistence; `null` disables it. Default `"silica-theme"`. */
  storageKey?: string | null;
}

export function setTheme(theme: string, options: SetThemeOptions = {}): void {
  const { target = document.documentElement, storageKey = DEFAULT_STORAGE_KEY } = options;
  target.dataset.theme = theme;
  if (storageKey && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Private browsing / storage disabled — theme still applied, just not persisted.
    }
  }
}

/** Subscribe to `[data-theme]` changes on `target`. Returns an unsubscribe function. */
export function onThemeChange(
  callback: (theme: string | undefined) => void,
  target: HTMLElement = document.documentElement,
): () => void {
  const observer = new MutationObserver(() => callback(target.dataset.theme));
  observer.observe(target, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
