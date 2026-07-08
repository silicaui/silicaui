import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `toggle-group` — a toolbar of toggle buttons (`item` parts), not a listbox
 * (distinct ARIA pattern from `selection-list`: `aria-pressed`/`data-pressed`
 * on real buttons, not `aria-selected` on listbox options). `params.multiple`
 * allows several pressed at once (default: single, pressing one un-presses
 * the rest); `params.orientation` (`"horizontal"` default | `"vertical"`)
 * picks which arrow keys rove focus, matching `tabs`' convention.
 */
export const toggleGroup: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const multiple = params.multiple === true;
  const vertical = params.orientation === "vertical";
  const items = ownParts(root, "item");
  const bag = new DisposeBag();
  if (!items.length) return () => bag.dispose();

  const isPressed = (item: Element) => item.getAttribute("aria-pressed") === "true";
  const setPressed = (item: Element, pressed: boolean) => {
    item.setAttribute("aria-pressed", String(pressed));
    item.toggleAttribute("data-pressed", pressed);
  };

  const press = (item: Element) => {
    if (multiple) {
      setPressed(item, !isPressed(item));
    } else {
      for (const other of items) setPressed(other, other === item);
    }
  };

  const focusable = () => items.find((i) => (i as HTMLElement).tabIndex === 0) ?? items[0]!;
  const focusItem = (item: Element) => {
    for (const i of items) (i as HTMLElement).tabIndex = i === item ? 0 : -1;
    (item as HTMLElement).focus();
  };
  focusItem(items.find(isPressed) ?? items[0]!);

  const nextKey = vertical ? "ArrowDown" : "ArrowRight";
  const prevKey = vertical ? "ArrowUp" : "ArrowLeft";

  for (const [i, item] of items.entries()) {
    bag.listen(item, "click", () => press(item));
    bag.listen(item, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      switch (e.key) {
        case nextKey:
          e.preventDefault();
          focusItem(items[(i + 1) % items.length]!);
          break;
        case prevKey:
          e.preventDefault();
          focusItem(items[(i - 1 + items.length) % items.length]!);
          break;
        case "Home":
          e.preventDefault();
          focusItem(items[0]!);
          break;
        case "End":
          e.preventDefault();
          focusItem(items[items.length - 1]!);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          press(item);
          break;
      }
    });
  }
  void focusable;

  return () => bag.dispose();
};
