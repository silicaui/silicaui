import { DisposeBag, parseParams } from "../dom";
import { getTheme, setTheme } from "../theme";
import type { BehaviorHandler } from "../types";

/**
 * `theme-toggle` — the root itself is the trigger (a button): each click
 * cycles through `params.themes` (default `["light", "dark"]`), wrapping
 * around. Thin wiring over the existing `setTheme`/`getTheme` primitives —
 * there was no new state-machine to build here, just a registration.
 */
export const themeToggle: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const themes = Array.isArray(params.themes) && params.themes.length ? params.themes.map(String) : ["light", "dark"];
  const bag = new DisposeBag();

  bag.listen(root, "click", () => {
    const current = getTheme() ?? themes[0]!;
    const idx = themes.indexOf(current);
    const next = themes[(idx + 1 + themes.length) % themes.length]!;
    setTheme(next);
    root.setAttribute("data-theme-value", next);
  });

  root.setAttribute("data-theme-value", getTheme() ?? themes[0]!);

  return () => bag.dispose();
};
