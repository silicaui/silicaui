import { DisposeBag } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `switch` — the root itself is a `role=switch` element (no parts). Silica's
 * `.switch` CSS keys off `[data-checked]` (Base UI's synthetic attribute in
 * React, ported verbatim here) rather than `:checked`, since the visual pill
 * needs a real element to key selectors off, unlike `.toggle` which stays a
 * plain native checkbox. A hidden `<input type="checkbox">` inside carries
 * the value for form submission, matching Base UI's own hidden-input pattern.
 */
export const switchBehavior: BehaviorHandler = (root, _opts) => {
  const input = root.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
  const bag = new DisposeBag();

  const isChecked = () => root.getAttribute("data-checked") != null;
  const sync = () => {
    root.setAttribute("aria-checked", String(isChecked()));
    if (input) input.checked = isChecked();
  };
  sync();

  const toggle = () => {
    if (root.getAttribute("aria-disabled") === "true") return;
    root.toggleAttribute("data-checked", !isChecked());
    sync();
    input?.dispatchEvent(new Event("change", { bubbles: true }));
  };

  bag.listen(root, "click", toggle);
  bag.listen(root, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  return () => bag.dispose();
};
