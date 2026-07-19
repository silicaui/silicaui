import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `rating` — a `role=radio` row of `item` stars. Not Base UI-backed in React
 * either (plain JSX-set `data-filled`), so this ports near 1:1: click sets
 * the value, hover previews it, and a hidden `<input>` (if present) carries
 * the value for form submission.
 */
export const rating: BehaviorHandler = (root, _opts) => {
  const items = ownParts(root, "item");
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  const bag = new DisposeBag();
  if (!items.length) return () => bag.dispose();

  const paint = (value: number) => {
    items.forEach((item, i) => item.setAttribute("data-filled", String(i < value)));
  };
  const current = () => items.filter((i) => i.getAttribute("data-filled") === "true").length;
  paint(current());

  const setValue = (value: number) => {
    paint(value);
    // `data-filled` is the (hover-previewable) visual; `aria-checked` is the
    // committed radio state and must track the real value, not the preview.
    items.forEach((item, i) => {
      if (item.getAttribute("role") === "radio") {
        item.setAttribute("aria-checked", String(i === value - 1));
      }
    });
    if (hidden) {
      hidden.value = String(value);
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  items.forEach((item, i) => {
    (item as HTMLElement).tabIndex = i === 0 ? 0 : -1;
    bag.listen(item, "click", () => setValue(i + 1));
    bag.listen(item, "mouseenter", () => paint(i + 1));
    bag.listen(item, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = items[Math.min(items.length - 1, i + 1)] as HTMLElement;
        next.tabIndex = 0;
        (item as HTMLElement).tabIndex = -1;
        next.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const prev = items[Math.max(0, i - 1)] as HTMLElement;
        prev.tabIndex = 0;
        (item as HTMLElement).tabIndex = -1;
        prev.focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setValue(i + 1);
      }
    });
  });
  bag.listen(root, "mouseleave", () => paint(current()));

  return () => bag.dispose();
};
