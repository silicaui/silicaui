import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `disclosure` — trigger/panel pairs, correlated by document order (architecture
 * §7: "parts correlate to their root by structural nesting, never by id"). With
 * `params.single`, opening one pair closes every other pair under the same root
 * (single-open accordion); otherwise each pair toggles independently.
 */
export const disclosure: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const single = params.single === true;
  const triggers = ownParts(root, "trigger");
  const panels = ownParts(root, "panel");
  const bag = new DisposeBag();

  const pairs = triggers
    .map((trigger, i) => ({ trigger, panel: panels[i] }))
    .filter((p): p is { trigger: Element; panel: Element } => p.panel != null);

  const sync = (trigger: Element, panel: Element) => {
    trigger.setAttribute("aria-expanded", String(!panel.hasAttribute("hidden")));
  };

  for (const { trigger, panel } of pairs) {
    // Preview reveals collapsed panels so the author can edit their content
    // without needing to click first (§9.8); the toggle still works normally.
    if (opts.preview) panel.removeAttribute("hidden");
    sync(trigger, panel);

    bag.listen(trigger, "click", () => {
      const opening = panel.hasAttribute("hidden");
      if (single && opening) {
        for (const other of pairs) {
          if (other.panel !== panel) {
            other.panel.setAttribute("hidden", "");
            sync(other.trigger, other.panel);
          }
        }
      }
      panel.toggleAttribute("hidden", !opening);
      sync(trigger, panel);
    });
  }

  return () => bag.dispose();
};
