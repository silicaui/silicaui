import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `selection-list` — a listbox of `item` parts (single- or multi-select, via
 * `params.multiple`). Click (or Enter/Space on the focused item) toggles
 * selection; the vanilla counterpart to silicaui-react's `SelectionList`. Roving
 * tabindex + ↑/↓/Home/End mirror the React component's keyboard behavior.
 */
export const selectionList: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const multiple = params.multiple === true;
  const items = ownParts(root, "item").filter(
    (el) => el.getAttribute("aria-disabled") !== "true",
  );
  const bag = new DisposeBag();
  if (!items.length) return () => bag.dispose();

  const indicatorOf = (item: Element) =>
    item.querySelector('input[type="checkbox"], input[type="radio"]') as HTMLInputElement | null;

  const setSelected = (item: Element, selected: boolean) => {
    item.setAttribute("aria-selected", String(selected));
    const input = indicatorOf(item);
    if (input) input.checked = selected;
  };

  const select = (item: Element) => {
    if (multiple) {
      setSelected(item, item.getAttribute("aria-selected") !== "true");
    } else {
      for (const other of items) setSelected(other, other === item);
    }
  };

  const focusable = () => items.find((i) => (i as HTMLElement).tabIndex === 0) ?? items[0]!;
  const focusItem = (item: Element) => {
    for (const i of items) (i as HTMLElement).tabIndex = i === item ? 0 : -1;
    (item as HTMLElement).focus();
  };
  // Seed roving tabindex at the first selected item, else the first item.
  focusItem(items.find((i) => i.getAttribute("aria-selected") === "true") ?? items[0]!);

  for (const item of items) {
    bag.listen(item, "click", () => {
      select(item);
      focusItem(item);
    });
    bag.listen(item, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const idx = items.indexOf(item);
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = items[idx + 1];
          if (next) focusItem(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = items[idx - 1];
          if (prev) focusItem(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          focusItem(items[0]!);
          break;
        }
        case "End": {
          e.preventDefault();
          focusItem(items[items.length - 1]!);
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          select(item);
          break;
        }
      }
    });
  }

  return () => bag.dispose();
};
