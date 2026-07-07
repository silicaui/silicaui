import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `sidebar` — a persistent nav panel that collapses IN PLACE to an icon rail
 * (unlike `disclosure`, the root is never hidden — only its `data-collapsed`
 * state changes, and CSS alone handles the width/label transition). Any number
 * of `trigger` parts nested inside the root toggle it; `params.defaultCollapsed`
 * seeds the initial state.
 */
export const sidebar: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const triggers = ownParts(root, "trigger");
  const bag = new DisposeBag();

  const isCollapsed = () => root.hasAttribute("data-collapsed");
  const sync = () => {
    for (const trigger of triggers) {
      trigger.setAttribute("aria-expanded", String(!isCollapsed()));
    }
  };

  // Preview always shows the expanded panel so the author can edit its
  // contents without needing to click first (§9.8).
  if (opts.preview) root.removeAttribute("data-collapsed");
  else if (params.defaultCollapsed === true) root.setAttribute("data-collapsed", "");
  sync();

  for (const trigger of triggers) {
    bag.listen(trigger, "click", () => {
      root.toggleAttribute("data-collapsed");
      sync();
    });
  }

  return () => bag.dispose();
};
