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
  // Removing/hiding the widget while focus is inside it drops focus to
  // <body>; park it on the nearest focusable outside the root first.
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const parkFocus = () => {
    const active = document.activeElement;
    if (!active || !root.contains(active)) return;
    const rest = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !root.contains(el),
    );
    const after = rest.find(
      (el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    (after ?? rest[rest.length - 1])?.focus?.();
  };
  bag.listen(trigger, "click", () => {
    parkFocus();
    if (remove) root.remove();
    else root.setAttribute("hidden", "");
  });

  return () => bag.dispose();
};
