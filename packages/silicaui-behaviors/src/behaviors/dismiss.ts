import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `dismiss` — a self-dismissing widget (alert, toast): clicking its `trigger`
 * hides or removes the root. `params.remove` (default `true`) removes the
 * element outright; `false` just sets `hidden` (e.g. to keep layout stable).
 */
export const dismiss: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const trigger = ownParts(root, "trigger")[0] ?? root.querySelector("button");
  const bag = new DisposeBag();
  if (!trigger) return () => bag.dispose();

  const remove = params.remove !== false;
  bag.listen(trigger, "click", () => {
    if (remove) root.remove();
    else root.setAttribute("hidden", "");
  });

  return () => bag.dispose();
};
