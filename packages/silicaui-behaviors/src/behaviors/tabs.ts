import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `tabs` — a `tab`/`panel` list, exclusive selection, with roving arrow-key
 * navigation (Left/Right, Up/Down, Home/End) per the standard tabs pattern.
 * Pairing is positional (Nth `tab` ↔ Nth `panel`), same nesting-scoped lookup
 * as `disclosure`.
 */
export const tabs: BehaviorHandler = (root, _opts) => {
  const tabEls = ownParts(root, "tab");
  const panels = ownParts(root, "panel");
  const bag = new DisposeBag();

  const pairs = tabEls
    .map((tab, i) => ({ tab, panel: panels[i] }))
    .filter((p): p is { tab: Element; panel: Element } => p.panel != null);

  if (pairs.length === 0) return () => bag.dispose();

  let active = pairs.findIndex((p) => !p.panel.hasAttribute("hidden"));
  if (active === -1) active = 0;

  const select = (index: number, focus: boolean) => {
    active = index;
    pairs.forEach(({ tab, panel }, i) => {
      const isActive = i === index;
      panel.toggleAttribute("hidden", !isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
      if (isActive && focus) (tab as HTMLElement).focus?.();
    });
  };
  select(active, false);

  const last = pairs.length - 1;
  pairs.forEach(({ tab }, i) => {
    bag.listen(tab, "click", () => select(i, false));
    bag.listen(tab, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          select(i === last ? 0 : i + 1, true);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          select(i === 0 ? last : i - 1, true);
          break;
        case "Home":
          e.preventDefault();
          select(0, true);
          break;
        case "End":
          e.preventDefault();
          select(last, true);
          break;
      }
    });
  });

  return () => bag.dispose();
};
