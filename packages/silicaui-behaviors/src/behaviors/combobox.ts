import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `combobox` — a text `input` + a `panel` of `item` options, filtered live.
 * `params.mode`: `"select"` (default — commits an item's value into the
 * input, like Combobox), `"freetext"` (Autocomplete — Enter with nothing
 * highlighted commits the raw typed text), `"multiple"` (MultiSelect —
 * commits remove the item from the remaining list; Backspace on an empty
 * input pops the last commit). One handler, mode branches, mirroring how
 * `selection-list` handles `params.multiple` in one file rather than three.
 */
export const combobox: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const mode = typeof params.mode === "string" ? params.mode : "select";
  const isFreeText = mode === "freetext";
  const isMultiple = mode === "multiple";

  const input = (ownParts(root, "input")[0] ?? root.querySelector("input")) as HTMLInputElement | null;
  const panel = ownParts(root, "panel")[0];
  const items = ownParts(root, "item");
  const bag = new DisposeBag();
  if (!input || !panel || !items.length) return () => bag.dispose();

  let active = -1;
  const isOpen = () => !panel.hasAttribute("hidden");
  const visible = () => items.filter((i) => !i.hasAttribute("hidden"));

  const open = () => {
    panel.removeAttribute("hidden");
    input.setAttribute("aria-expanded", "true");
  };
  const setActive = (idx: number) => {
    active = idx;
    items.forEach((item, i) => item.toggleAttribute("data-highlighted", i === active));
    const activeItem = items[active];
    if (activeItem?.id) input.setAttribute("aria-activedescendant", activeItem.id);
    else input.removeAttribute("aria-activedescendant");
  };
  const close = () => {
    panel.setAttribute("hidden", "");
    input.setAttribute("aria-expanded", "false");
    setActive(-1);
  };

  const dispatchSelect = (value: string) =>
    root.dispatchEvent(new CustomEvent("sui:select", { detail: { value }, bubbles: true }));

  const addChip = (value: string, label: string) => {
    const chips = root.querySelector(".multi-select-chips");
    if (!chips) return;
    const chip = document.createElement("span");
    chip.className = "multi-select-chip";
    chip.setAttribute("data-chip-value", value);
    chip.append(label);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "multi-select-chip-remove";
    remove.setAttribute("aria-label", `Remove ${label}`);
    remove.setAttribute("data-remove-value", value);
    remove.textContent = "×";
    chip.appendChild(remove);
    chips.appendChild(chip);
  };

  const commit = (item: Element) => {
    const value = item.getAttribute("data-value") ?? item.textContent ?? "";
    if (isMultiple) {
      item.setAttribute("aria-selected", "true");
      item.setAttribute("hidden", "");
      input.value = "";
      addChip(value, item.textContent ?? value);
      dispatchSelect(value);
    } else {
      input.value = value;
      for (const i of items) i.setAttribute("aria-selected", String(i === item));
      dispatchSelect(value);
    }
    close();
    filter();
  };

  const deselect = (item: Element) => {
    const value = item.getAttribute("data-value") ?? item.textContent ?? "";
    item.setAttribute("aria-selected", "false");
    item.removeAttribute("hidden");
    const chip = Array.from(root.querySelectorAll("[data-chip-value]")).find((el) => el.getAttribute("data-chip-value") === value);
    chip?.remove();
    root.dispatchEvent(new CustomEvent("sui:deselect", { detail: { value }, bubbles: true }));
  };

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    for (const item of items) {
      if (isMultiple && item.getAttribute("aria-selected") === "true") continue;
      const text = (item.textContent ?? "").toLowerCase();
      item.toggleAttribute("hidden", q.length > 0 && !text.includes(q));
    }
  };

  bag.listen(input, "focus", open);
  bag.listen(input, "input", () => {
    filter();
    open();
    setActive(-1);
  });
  bag.listen(input, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    const vis = visible();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen()) return open();
      const i = vis.indexOf(items[active]!);
      setActive(items.indexOf(vis[i === -1 ? 0 : (i + 1) % vis.length]!));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = vis.indexOf(items[active]!);
      setActive(items.indexOf(vis[i === -1 ? vis.length - 1 : (i - 1 + vis.length) % vis.length]!));
    } else if (e.key === "Enter") {
      if (active >= 0 && items[active]) {
        e.preventDefault();
        commit(items[active]!);
      } else if (isFreeText && input.value.trim()) {
        e.preventDefault();
        dispatchSelect(input.value.trim());
        close();
      }
    } else if (e.key === "Escape") {
      close();
    } else if (e.key === "Backspace" && isMultiple && input.value === "") {
      const picked = items.filter((i) => i.getAttribute("aria-selected") === "true");
      const last = picked[picked.length - 1];
      if (last) deselect(last);
    }
  });

  for (const item of items) bag.listen(item, "click", () => commit(item));
  if (isMultiple) {
    bag.listen(root, "click", (ev) => {
      const value = (ev.target as Element).closest("[data-remove-value]")?.getAttribute("data-remove-value");
      if (value == null) return;
      const item = items.find((i) => i.getAttribute("data-value") === value);
      if (item) deselect(item);
    });
  }
  bag.listen(
    document,
    "click",
    (ev) => {
      if (isOpen() && !root.contains(ev.target as Node)) close();
    },
    { capture: true },
  );

  if (opts.preview) open();
  filter();

  return () => bag.dispose();
};
