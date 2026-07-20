import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `toggle-group` — a toolbar of toggle buttons (`item` parts), not a listbox
 * (distinct ARIA pattern from `selection-list`: `aria-pressed`/`data-pressed`
 * on real buttons, not `aria-selected` on listbox options). `params.multiple`
 * allows several pressed at once (default: single, pressing one un-presses
 * the rest); `params.orientation` (`"horizontal"` default | `"vertical"`)
 * picks which arrow keys rove focus, matching `tabs`' convention.
 *
 * An OPTIONAL `close` part un-presses everything. That's what makes `Filter`
 * (a single-select chip row with a reset) this behavior rather than a new one:
 * the only delta was one extra control, which is the "one type, optional parts"
 * pattern, not a fork. The reset hides itself while nothing is pressed, so a
 * static page renders the same resting state React does.
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

  // Optional reset control (see the doc comment). Absent on a plain toggle
  // group, in which case every line below is a no-op.
  const reset = ownParts(root, "close")[0];
  const syncReset = () => {
    if (reset) (reset as HTMLElement).hidden = !items.some(isPressed);
  };

  const press = (item: Element) => {
    if (multiple) {
      setPressed(item, !isPressed(item));
    } else {
      for (const other of items) setPressed(other, other === item);
    }
    syncReset();
  };

  // Seed the roving tabindex WITHOUT focusing — hydrate must never move the
  // user's focus; `.focus()` only ever happens in response to their own keys.
  const seedTabindex = (item: Element) => {
    for (const i of items) (i as HTMLElement).tabIndex = i === item ? 0 : -1;
  };
  const focusItem = (item: Element) => {
    seedTabindex(item);
    (item as HTMLElement).focus();
  };
  seedTabindex(items.find(isPressed) ?? items[0]!);

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

  if (reset) {
    bag.listen(reset, "click", () => {
      for (const item of items) setPressed(item, false);
      syncReset();
      seedTabindex(items[0]!);
    });
  }
  syncReset();

  return () => bag.dispose();
};
